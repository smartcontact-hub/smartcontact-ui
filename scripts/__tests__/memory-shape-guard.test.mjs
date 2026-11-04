import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fichaEscrita, problemasDeLaEscritura } from '../hooks/memory-shape-guard.mjs';
import { MAX_FICHAS, MAX_PALABRAS_FICHA } from '../memory-shape.mjs';

// El hook se prueba de punta a punta, por stdin y con su código de salida, sobre una memoria fabricada
// en una carpeta temporal (`SC_MEMORY_DIR`). El caso rojo es el de 2026-11-04: una ficha por encima de
// las 250 palabras, que el CHECK N le cantó después a OTRA sesión en su preflight.

const HOOK = join(dirname(fileURLToPath(import.meta.url)), '../hooks/memory-shape-guard.mjs');

const ficha = (nombre, palabras = 40) =>
  `---\nname: ${nombre}\ndescription: una ficha\nmetadata:\n  type: project\n---\n\n${'palabra '.repeat(palabras)}\n`;

/** Una memoria correcta con las fichas dadas, enlazadas en el índice. */
function memoria(nombres) {
  const dir = mkdtempSync(join(tmpdir(), 'sc-mem-guard-'));
  for (const n of nombres) writeFileSync(join(dir, `${n}.md`), ficha(n));
  writeFileSync(join(dir, 'MEMORY.md'), `# Memory index\n\n${nombres.map((n) => `- [${n}](${n}.md) — gancho`).join('\n')}\n`);
  return dir;
}

function correr(dir, file_path, tool_name = 'Write') {
  const r = spawnSync('node', [HOOK], {
    input: JSON.stringify({ tool_name, tool_input: { file_path } }),
    encoding: 'utf8',
    env: { ...process.env, SC_MEMORY_DIR: dir },
  });
  return { codigo: r.status, stderr: r.stderr };
}

test('ROJO: escribir una ficha de 260 palabras sale con 2 y dice cuánto mide, el tope y qué hacer', () => {
  const dir = memoria(['a', 'larga']);
  writeFileSync(join(dir, 'larga.md'), ficha('larga', 260));
  for (const herramienta of ['Write', 'Edit']) {
    const r = correr(dir, join(dir, 'larga.md'), herramienta);
    assert.equal(r.codigo, 2);
    assert.match(r.stderr, new RegExp(`larga\\.md mide 260 palabras; el tope es ${MAX_PALABRAS_FICHA}`));
    assert.match(r.stderr, /recorta sin quitar hechos o funde con otra ficha/i);
  }
});

test('VERDE: una escritura fuera de la memoria calla, aunque la memoria esté rota', () => {
  const dir = memoria(['a']);
  writeFileSync(join(dir, 'a.md'), ficha('a', 900));
  const fuera = mkdtempSync(join(tmpdir(), 'sc-otro-'));
  for (const ruta of [join(fuera, 'a.md'), join(fuera, 'notas.txt'), join(dir, 'sub', 'a.md'), join(dir, 'a.json')]) {
    assert.deepEqual(correr(dir, ruta), { codigo: 0, stderr: '' }, ruta);
  }
});

test('VERDE: una ficha dentro del tope calla, también recién creada y aún sin su línea en el índice', () => {
  const dir = memoria(['a']);
  writeFileSync(join(dir, 'justa.md'), ficha('justa', MAX_PALABRAS_FICHA));
  assert.deepEqual(correr(dir, join(dir, 'justa.md')), { codigo: 0, stderr: '' });
  assert.deepEqual(correr(dir, join(dir, 'a.md')), { codigo: 0, stderr: '' });
});

test('la ficha de otro no se le atribuye a quien escribe una ficha sana', () => {
  const dir = memoria(['a', 'b']);
  writeFileSync(join(dir, 'b.md'), ficha('b', 900));
  assert.deepEqual(correr(dir, join(dir, 'a.md')), { codigo: 0, stderr: '' });
  assert.equal(correr(dir, join(dir, 'b.md')).codigo, 2);
});

test('pasar el tope de fichas enrojece al escribir una ficha, no al tocar el índice', () => {
  const dir = memoria(Array.from({ length: MAX_FICHAS + 1 }, (_, i) => `f${i}`));
  const r = correr(dir, join(dir, 'f0.md'));
  assert.equal(r.codigo, 2);
  assert.match(r.stderr, new RegExp(`hay ${MAX_FICHAS + 1} fichas`));
  assert.equal(correr(dir, join(dir, 'MEMORY.md')).codigo, 0);
});

test('qué problemas causa cada escritura', () => {
  const problemas = [
    'hay 41 fichas; el tope es 40: …',
    'MEMORY.md mide 1200 palabras; el tope es 1000. …',
    'MEMORY.md enlaza zz.md, que no existe. …',
    'a.md mide 300 palabras; el tope es 250. …',
    'a.md: sin `name:` en el frontmatter.',
    'a.md no está enlazada en MEMORY.md: …',
    'ba.md mide 300 palabras; el tope es 250. …',
  ];
  assert.deepEqual(problemasDeLaEscritura(problemas, 'a.md'), [problemas[0], problemas[3], problemas[4]]);
  assert.deepEqual(problemasDeLaEscritura(problemas, 'MEMORY.md'), [problemas[1]]);
  assert.deepEqual(problemasDeLaEscritura(problemas, 'c.md'), [problemas[0]]);
});

test('fichaEscrita: solo `.md` directamente dentro de la carpeta; acepta rutas relativas al cwd', () => {
  const dir = '/x/memory';
  assert.equal(fichaEscrita({ tool_input: { file_path: '/x/memory/a.md' } }, dir), 'a.md');
  assert.equal(fichaEscrita({ cwd: '/x', tool_input: { file_path: 'memory/a.md' } }, dir), 'a.md');
  assert.equal(fichaEscrita({ tool_input: { file_path: '/x/memory/sub/a.md' } }, dir), null);
  assert.equal(fichaEscrita({ tool_input: { file_path: '/x/memoryx/a.md' } }, dir), null);
  assert.equal(fichaEscrita({ tool_input: { file_path: '/x/memory/a.txt' } }, dir), null);
  assert.equal(fichaEscrita({ tool_input: { file_path: '/x/memory/a.md' } }, null), null);
  assert.equal(fichaEscrita({}, dir), null);
});

test('falla abierto: una entrada que no es JSON sale con 0', () => {
  const r = spawnSync('node', [HOOK], { input: 'no es json', encoding: 'utf8' });
  assert.equal(r.status, 0);
});

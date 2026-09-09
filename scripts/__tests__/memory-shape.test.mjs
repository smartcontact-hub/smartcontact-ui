import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { revisarMemoria, leerMemoria, dirProyectoClaude, MAX_FICHAS, MAX_PALABRAS_FICHA, MAX_PALABRAS_INDICE } from '../memory-shape.mjs';

// El gate de forma de la memoria se prueba EN VERDE con una memoria fabricada correcta y EN ROJO con
// cada modo de inflado que la memoria real tenía el 2026-09-09 (63 fichas, fichas de 2.000 palabras,
// índice de 1.850). Un gate que solo se ha visto pasar no prueba que sepa fallar (LEARNINGS 2).

const ficha = (nombre, { tipo = 'project', palabras = 40 } = {}) => ({
  nombre: `${nombre}.md`,
  texto: `---\nname: ${nombre}\ndescription: una ficha\nmetadata:\n  type: ${tipo}\n---\n\n${'palabra '.repeat(palabras)}\n`,
});
const indice = (...nombres) => `# Memory index\n\n${nombres.map((n) => `- [${n}](${n}.md) — gancho`).join('\n')}\n`;
const memoria = (...nombres) => ({ indice: indice(...nombres), fichas: nombres.map((n) => ficha(n)) });

test('verde: una memoria correcta no da problemas', () => {
  assert.deepEqual(revisarMemoria(memoria('a', 'b', 'c')), []);
});

test('rojo: más fichas que el tope', () => {
  const ns = Array.from({ length: MAX_FICHAS + 1 }, (_, i) => `f${i}`);
  assert.ok(revisarMemoria(memoria(...ns)).some((p) => /hay \d+ fichas; el tope/.test(p)));
});

test('rojo: una ficha más larga que el tope (cuerpo, sin contar el frontmatter)', () => {
  const m = memoria('a');
  m.fichas[0] = ficha('a', { palabras: MAX_PALABRAS_FICHA + 1 });
  assert.ok(revisarMemoria(m).some((p) => /a\.md mide \d+ palabras/.test(p)));
  const justo = memoria('a');
  justo.fichas[0] = ficha('a', { palabras: MAX_PALABRAS_FICHA });
  assert.deepEqual(revisarMemoria(justo), []);
});

test('rojo: el índice pesa más que el tope', () => {
  const m = memoria('a');
  m.indice += 'relleno '.repeat(MAX_PALABRAS_INDICE);
  assert.ok(revisarMemoria(m).some((p) => /MEMORY\.md mide/.test(p)));
});

test('rojo: índice y fichas no cuadran (huérfana y enlace muerto)', () => {
  const huerfana = { indice: indice('a'), fichas: [ficha('a'), ficha('b')] };
  assert.ok(revisarMemoria(huerfana).some((p) => /b\.md no está enlazada/.test(p)));
  const muerto = { indice: indice('a', 'zz'), fichas: [ficha('a')] };
  assert.ok(revisarMemoria(muerto).some((p) => /enlaza zz\.md, que no existe/.test(p)));
});

test('rojo: frontmatter ausente o con type inválido', () => {
  const sin = { indice: indice('a'), fichas: [{ nombre: 'a.md', texto: 'sin cabecera\n' }] };
  assert.ok(revisarMemoria(sin).some((p) => /sin frontmatter/.test(p)));
  const malo = { indice: indice('a'), fichas: [ficha('a', { tipo: 'nota' })] };
  assert.ok(revisarMemoria(malo).some((p) => /type «nota»/.test(p)));
});

test('leerMemoria lee un directorio real y dirProyectoClaude respeta el override', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-mem-'));
  writeFileSync(join(dir, 'MEMORY.md'), indice('a'));
  writeFileSync(join(dir, 'a.md'), ficha('a').texto);
  const m = leerMemoria(dir);
  assert.equal(m.fichas.length, 1);
  assert.deepEqual(revisarMemoria(m), []);
  process.env.SC_CLAUDE_PROJECT_DIR = dir;
  try {
    assert.equal(dirProyectoClaude(), dir);
  } finally {
    delete process.env.SC_CLAUDE_PROJECT_DIR;
  }
});

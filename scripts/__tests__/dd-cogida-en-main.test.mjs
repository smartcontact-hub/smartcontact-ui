import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { cabecerasDeDds, ddsQueChocanConMain, puertaBarata } from '../preflight-puerta-barata.mjs';

// LEARNINGS #21: el 2026-10-29 el #555 tomó DD-239, que ya era del #549, y después DD-240, que el #554 fundió antes. Las
// dos veces lo vio tarde `docs:coherence`. La puerta del preflight compara ahora las cabeceras que añade la rama con las
// de `origin/main` y se pone roja si el número ya está cogido con otro título.

const MAIN = '# Decisiones\n\n## DD-240 · 2026-10-29 — El «+» se dibuja con las puntas redondeadas\ntexto\n## DD-239 · 2026-10-28 — Agendas\n## DD-23·b · 2026-06-22 — Apéndice\n';

test('cabecerasDeDds: número y título, sin apéndices; con prefijo, solo las líneas del parche que lo llevan', () => {
  assert.deepEqual([...cabecerasDeDds(MAIN)], [
    [240, 'El «+» se dibuja con las puntas redondeadas'],
    [239, 'Agendas'],
  ]);
  assert.deepEqual([...cabecerasDeDds('+## DD-241 · f — Nueva\n ## DD-240 · f — Vieja\n-## DD-9 · f — Quitada', '+')], [[241, 'Nueva']]);
});

test('ddsQueChocanConMain: rojo si la rama añade DD-240 «A» y main tiene DD-240 «B»; propone el mayor de main más uno', () => {
  const parche = '@@ -1,2 +1,4 @@\n # Decisiones\n+\n+## DD-240 · 2026-10-29 — Modales como los de ui.smart-contact.com\n+texto';
  assert.deepEqual(ddsQueChocanConMain({ parche, main: MAIN }), [
    { dd: 240, titulo: 'Modales como los de ui.smart-contact.com', enMain: 'El «+» se dibuja con las puntas redondeadas', libre: 241 },
  ]);
});

test('ddsQueChocanConMain: verde si la DD-240 es la misma en los dos lados', () => {
  const parche = '+## DD-240 · 2026-10-29 — El «+» se dibuja con las puntas redondeadas';
  assert.deepEqual(ddsQueChocanConMain({ parche, main: MAIN }), []);
});

test('ddsQueChocanConMain: verde si la DD de la rama es nueva y libre, o si solo cambia el título de una que ya existe', () => {
  assert.deepEqual(ddsQueChocanConMain({ parche: '+## DD-241 · 2026-10-29 — Nueva', main: MAIN }), []);
  const retitulada = '-## DD-239 · 2026-10-28 — Agendas\n+## DD-239 · 2026-10-28 — Agendas, Plantillas y Equipos';
  assert.deepEqual(ddsQueChocanConMain({ parche: retitulada, main: MAIN }), []);
});

test('ddsQueChocanConMain: con dos choques y una DD propia libre, cada choque recibe un número distinto por encima de todas', () => {
  const parche = '+## DD-242 · f — Mía libre\n+## DD-240 · f — A\n+## DD-239 · f — B';
  assert.deepEqual(
    ddsQueChocanConMain({ parche, main: MAIN }).map((c) => [c.dd, c.libre]),
    [[240, 243], [239, 244]],
  );
});

/** Un repo de juguete con `origin/main` y una rama que parte de antes de que main fundiera su DD-240. */
function repoConRama(tituloDeLaRama) {
  const raiz = mkdtempSync(join(tmpdir(), 'sc-dd-main-'));
  const git = (...args) => execFileSync('git', args, { cwd: raiz, stdio: 'ignore' });
  const escribir = (texto) => writeFileSync(join(raiz, 'docs', 'DECISIONS.md'), texto);
  mkdirSync(join(raiz, 'docs'));
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'prueba@example.com');
  git('config', 'user.name', 'prueba');
  escribir('# Decisiones\n\n## DD-239 · 2026-10-28 — Agendas\n');
  git('add', '.');
  git('commit', '-qm', 'base');
  git('checkout', '-qb', 'rama');
  escribir(`# Decisiones\n\n## DD-240 · 2026-10-29 — ${tituloDeLaRama}\n\n## DD-239 · 2026-10-28 — Agendas\n`);
  git('commit', '-qam', 'rama');
  git('checkout', '-q', 'main');
  escribir('# Decisiones\n\n## DD-240 · 2026-10-29 — El «+» redondeado\n\n## DD-239 · 2026-10-28 — Agendas\n');
  git('commit', '-qam', 'main funde su DD-240');
  git('update-ref', 'refs/remotes/origin/main', 'main');
  git('checkout', '-q', 'rama');
  return raiz;
}

/** La puerta sobre `cwd`, con una memoria que no existe para que solo hable de lo que aquí se prueba. */
function puertaSinMemoria(cwd) {
  const previo = process.env.SC_MEMORY_DIR;
  process.env.SC_MEMORY_DIR = join(cwd, 'sin-memoria');
  try {
    return puertaBarata(cwd);
  } finally {
    if (previo === undefined) delete process.env.SC_MEMORY_DIR;
    else process.env.SC_MEMORY_DIR = previo;
  }
}

test('puertaBarata: la cadena no arranca si la rama trae un DD-N que main ya fundió con otro título', () => {
  const raiz = repoConRama('Modales');
  try {
    const problemas = puertaSinMemoria(raiz);
    assert.equal(problemas.length, 1);
    assert.match(problemas[0], /DD-240 ya está en origin\/main con otro título \(«El «\+» redondeado»\)/);
    assert.match(problemas[0], /renumera a DD-241 con todas sus citas: solo las líneas que no están en main/);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('puertaBarata: la misma DD a los dos lados, o sin git, deja la puerta abierta', () => {
  const raiz = repoConRama('El «+» redondeado');
  const sinGit = mkdtempSync(join(tmpdir(), 'sc-dd-sin-git-'));
  try {
    assert.deepEqual(puertaSinMemoria(raiz), []);
    assert.deepEqual(puertaSinMemoria(sinGit), []);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
    rmSync(sinGit, { recursive: true, force: true });
  }
});

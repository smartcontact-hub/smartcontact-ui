import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { estadoRebase, estadoTrasLaCadena, hayConflicto, medirRebase } from '../preflight-rebase.mjs';

// Un preflight sobre una rama que no lleva `origin/main` mide un árbol que nunca se va a
// pushear tal cual: el 2026-09-11 se tiraron DOS cadenas de 8 min porque main avanzó entre el
// preflight y el push y `ci:verdict` contestó «en conflicto». Se prueba con un remoto bare de
// verdad, en los tres estados: rebasada, main por delante, y sin remoto.

function sinGit() {
  // Las `GIT_*` heredadas se tiran: dentro de un hook de git apuntan al repositorio real.
  return Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
}

function git(cwd, ...args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...sinGit(), GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' },
  }).trim();
}

/** Remoto bare + dos clones: `mio` (la rama de trabajo) y `otro` (quien hace avanzar main). */
function escenario() {
  const raiz = mkdtempSync(join(tmpdir(), 'sc-rebase-'));
  const remoto = join(raiz, 'remoto.git');
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', remoto], { env: sinGit() });
  const mio = join(raiz, 'mio');
  execFileSync('git', ['clone', '-q', remoto, mio], { env: sinGit() });
  git(mio, 'checkout', '-q', '-b', 'main');
  writeFileSync(join(mio, 'a.txt'), 'uno\n');
  git(mio, 'add', '-A');
  git(mio, 'commit', '-q', '-m', 'inicial');
  git(mio, 'push', '-q', '-u', 'origin', 'main');
  git(mio, 'checkout', '-q', '-b', 'rama');
  writeFileSync(join(mio, 'b.txt'), 'dos\n');
  git(mio, 'add', '-A');
  git(mio, 'commit', '-q', '-m', 'mi trabajo');
  const otro = join(raiz, 'otro');
  execFileSync('git', ['clone', '-q', remoto, otro], { env: sinGit() });
  return { raiz, mio, otro };
}

test('estadoRebase (puro): main por delante → no ok, y el motivo dice qué hacer', () => {
  const st = estadoRebase({ hayRemoto: true, fetchOk: true, esAncestro: false });
  assert.equal(st.ok, false);
  assert.match(st.motivo, /origin\/main/);
  assert.match(st.motivo, /git rebase origin\/main/);
});

test('estadoRebase (puro): rebasada → ok; sin remoto → ok con aviso; fetch caído → ok con aviso', () => {
  assert.equal(estadoRebase({ hayRemoto: true, fetchOk: true, esAncestro: true }).ok, true);
  const sinRemoto = estadoRebase({ hayRemoto: false, fetchOk: false, esAncestro: false });
  assert.equal(sinRemoto.ok, true);
  assert.match(sinRemoto.aviso, /sin remoto/);
  const sinRed = estadoRebase({ hayRemoto: true, fetchOk: false, esAncestro: true });
  assert.equal(sinRed.ok, true);
  assert.match(sinRed.aviso, /fetch/);
});

test('ROJO: main avanza en el remoto después de crear la rama → medirRebase lo ve tras el fetch', () => {
  const { raiz, mio, otro } = escenario();
  try {
    assert.equal(medirRebase(mio).ok, true, 'antes de que main avance, la rama está al día');
    writeFileSync(join(otro, 'c.txt'), 'tres\n');
    git(otro, 'add', '-A');
    git(otro, 'commit', '-q', '-m', 'otro avanza main');
    git(otro, 'push', '-q', 'origin', 'main');
    const st = medirRebase(mio);
    assert.equal(st.ok, false, 'la rama ya no lleva origin/main');
    assert.match(st.motivo, /git rebase origin\/main/);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('VERDE: tras rebasar sobre origin/main vuelve a estar ok', () => {
  const { raiz, mio, otro } = escenario();
  try {
    writeFileSync(join(otro, 'c.txt'), 'tres\n');
    git(otro, 'add', '-A');
    git(otro, 'commit', '-q', '-m', 'otro avanza main');
    git(otro, 'push', '-q', 'origin', 'main');
    assert.equal(medirRebase(mio).ok, false);
    git(mio, 'rebase', '-q', 'origin/main');
    assert.equal(medirRebase(mio).ok, true);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('sin remoto (repo suelto) → ok con aviso, no bloquea', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-rebase-solo-'));
  try {
    git(dir, 'init', '-q');
    writeFileSync(join(dir, 'a.txt'), 'uno\n');
    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', 'inicial');
    const st = medirRebase(dir);
    assert.equal(st.ok, true);
    assert.match(st.aviso, /sin remoto/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── DESPUÉS de la cadena: main avanzó durante los 8 minutos ──────────────────────────────────
//
// Aquí la regla NO puede ser la misma que antes de empezar. El 2026-09-11 había tres sesiones
// fundiendo en este repo, y negarse cada vez que otra funde algo obliga a repetir la cadena
// entera en bucle. Solo se niega cuando el merge daría CONFLICTO, que es el caso que de verdad
// invalida lo medido; si funde limpio, avisa y sigue.

test('tras la cadena: main avanzó pero funde LIMPIO → ok con aviso', () => {
  const { raiz, mio, otro } = escenario();
  try {
    writeFileSync(join(otro, 'otro-fichero.txt'), 'no toca lo mío\n');
    git(otro, 'add', '-A');
    git(otro, 'commit', '-q', '-m', 'otro avanza main sin tocar b.txt');
    git(otro, 'push', '-q', 'origin', 'main');
    git(mio, 'fetch', '-q', 'origin', 'main');
    assert.equal(medirRebase(mio).ok, false, 'va rezagada, eso no cambia');
    assert.equal(hayConflicto(mio), false, 'pero funde limpio');
    const st = estadoTrasLaCadena(mio);
    assert.equal(st.ok, true, st.motivo);
    assert.match(st.aviso, /funde limpio/);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('ROJO tras la cadena: main tocó el MISMO fichero → conflicto, y hay que repetirla', () => {
  const { raiz, mio, otro } = escenario();
  try {
    // Los dos escriben `b.txt` con contenido distinto: merge con conflicto de verdad.
    writeFileSync(join(otro, 'b.txt'), 'la versión de main\n');
    git(otro, 'add', '-A');
    git(otro, 'commit', '-q', '-m', 'main toca b.txt');
    git(otro, 'push', '-q', 'origin', 'main');
    git(mio, 'fetch', '-q', 'origin', 'main');
    assert.equal(hayConflicto(mio), true, 'el mismo fichero por los dos lados conflicta');
    const st = estadoTrasLaCadena(mio);
    assert.equal(st.ok, false);
    assert.match(st.motivo, /CONFLICTO/);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

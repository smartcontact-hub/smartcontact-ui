import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { escribirMarca, estadoPreflight, treeIdWorkingTree, MARCA } from '../preflight-mark.mjs';

// La marca solo vale sobre el árbol EXACTO que pasó preflight, y ese árbol tiene que ser HEAD.
// Se prueba en un repo temporal, en los tres estados que LEARNINGS #7 distingue.

function repoTemporal() {
  const dir = mkdtempSync(join(tmpdir(), 'sc-mark-'));
  // Las `GIT_*` heredadas se TIRAN antes de añadir las del autor: dentro de un hook de git apuntan
  // al repositorio de verdad, y estos `git init`/`git commit` acabarían en él. Lo vigila
  // `pre-push-hook.test.mjs`.
  const sinGit = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
  const g = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', env: { ...sinGit, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } }).trim();
  g('init', '-q');
  writeFileSync(join(dir, MARCA.replace('.preflight-ok', '.gitignore')), `${MARCA}\n`);
  writeFileSync(join(dir, 'a.txt'), 'uno\n');
  g('add', '-A');
  g('commit', '-q', '-m', 'inicial');
  return { dir, g };
}

test('sin marca → no ok', () => {
  const { dir } = repoTemporal();
  try {
    assert.equal(estadoPreflight(dir).ok, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('marca sobre árbol commiteado y limpio → ok', () => {
  const { dir } = repoTemporal();
  try {
    escribirMarca(dir, 'test');
    const st = estadoPreflight(dir);
    assert.equal(st.ok, true, st.motivo);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('editar un fichero después de la marca → no ok (el árbol cambió)', () => {
  const { dir } = repoTemporal();
  try {
    escribirMarca(dir, 'test');
    writeFileSync(join(dir, 'a.txt'), 'dos\n');
    const st = estadoPreflight(dir);
    assert.equal(st.ok, false);
    assert.match(st.motivo, /cambió/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('marca sobre árbol sucio → no ok hasta commitear ESE contenido; commiteado → ok', () => {
  const { dir, g } = repoTemporal();
  try {
    writeFileSync(join(dir, 'a.txt'), 'tres\n');
    escribirMarca(dir, 'test'); // preflight corrió con cambios sin commitear
    let st = estadoPreflight(dir);
    assert.equal(st.ok, false);
    assert.match(st.motivo, /SIN COMMITEAR/);
    g('add', '-A');
    g('commit', '-q', '-m', 'tres');
    st = estadoPreflight(dir);
    assert.equal(st.ok, true, st.motivo); // mismo contenido, ahora en HEAD: la marca sigue valiendo
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('treeIdWorkingTree coincide con HEAD^{tree} cuando el árbol está limpio', () => {
  const { dir, g } = repoTemporal();
  try {
    assert.equal(treeIdWorkingTree(dir), g('rev-parse', 'HEAD^{tree}'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Y el tercer estado que LEARNINGS #7 no distinguía hasta el 2026-09-11: la marca es del árbol
// final, pero `main` avanzó después. Se prueba con un remoto bare de verdad.
function escenarioConRemoto() {
  const raiz = mkdtempSync(join(tmpdir(), 'sc-mark-remoto-'));
  const sinGit = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
  const env = { ...sinGit, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
  const remoto = join(raiz, 'remoto.git');
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', remoto], { env });
  const clon = (nombre) => {
    const d = join(raiz, nombre);
    execFileSync('git', ['clone', '-q', remoto, d], { env });
    return { dir: d, g: (...args) => execFileSync('git', args, { cwd: d, encoding: 'utf8', env }).trim() };
  };
  const mio = clon('mio');
  mio.g('checkout', '-q', '-b', 'main');
  writeFileSync(join(mio.dir, '.gitignore'), `${MARCA}\n`);
  writeFileSync(join(mio.dir, 'a.txt'), 'uno\n');
  mio.g('add', '-A');
  mio.g('commit', '-q', '-m', 'inicial');
  mio.g('push', '-q', '-u', 'origin', 'main');
  mio.g('checkout', '-q', '-b', 'rama');
  writeFileSync(join(mio.dir, 'b.txt'), 'dos\n');
  mio.g('add', '-A');
  mio.g('commit', '-q', '-m', 'mi trabajo');
  const otro = clon('otro');
  return { raiz, mio, otro };
}

test('main avanza después de la marca → no ok («main avanzó»); tras rebasar hace falta marca nueva', () => {
  const { raiz, mio, otro } = escenarioConRemoto();
  try {
    escribirMarca(mio.dir, 'test');
    assert.equal(estadoPreflight(mio.dir).ok, true);
    writeFileSync(join(otro.dir, 'c.txt'), 'tres\n');
    otro.g('add', '-A');
    otro.g('commit', '-q', '-m', 'otro avanza main');
    otro.g('push', '-q', 'origin', 'main');
    const st = estadoPreflight(mio.dir);
    assert.equal(st.ok, false);
    assert.match(st.motivo, /main avanzó/);
    // Y escribir una marca nueva SIN rebasar tampoco vale.
    assert.throws(() => escribirMarca(mio.dir, 'test'), /no lleva `origin\/main`/);
    mio.g('rebase', '-q', 'origin/main');
    escribirMarca(mio.dir, 'test');
    assert.equal(estadoPreflight(mio.dir).ok, true);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

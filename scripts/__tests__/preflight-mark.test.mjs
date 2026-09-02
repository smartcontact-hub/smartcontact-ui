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
  const g = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } }).trim();
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

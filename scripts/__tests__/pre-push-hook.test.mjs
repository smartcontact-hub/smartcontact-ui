import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

/*
 * El `pre-push` de `.githooks/` con las refs que git le pasa por stdin.
 *
 * El caso ROJO que lo motiva: borrar la rama de un PR ya fundido (lo que AGENTS manda hacer «sin
 * preguntar») disparaba la cadena entera, ~8 minutos por no subir NADA. El sha local de un borrado
 * es todo ceros: no hay árbol que verificar.
 *
 * Cómo se mide sin correr 8 minutos: el hook se ejecuta con `cwd` en un repo temporal VACÍO. Si no
 * sale por un fastpath, cae al gate, no encuentra ni `scripts/` ni `package.json` y muere en
 * segundos. O sea: exit 0 = salió por el fastpath; exit ≠ 0 = fue a por el gate.
 */
const HOOK = resolve(import.meta.dirname, '../../.githooks/pre-push');
const CEROS = '0'.repeat(40);
const SHA = 'c85e295a6d5cc99edd8af40d7c12fc3dcf2477c3';

function correr(refs) {
  const dir = mkdtempSync(join(tmpdir(), 'sc-prepush-'));
  spawnSync('git', ['init', '-b', 'main'], { cwd: dir });
  return spawnSync('bash', [HOOK, 'origin', 'https://example.invalid/x.git'], {
    cwd: dir,
    input: refs,
    encoding: 'utf8',
    env: { ...process.env, SKIP_PREFLIGHT: '0', NVM_DIR: '/dev/null' },
    timeout: 60_000,
  });
}

test('pre-push: borrar una rama remota no pasa por el gate', () => {
  const r = correr(`(delete) ${CEROS} refs/heads/arebury/rama-fundida ${SHA}\n`);
  assert.equal(r.status, 0, `VERDE: un borrado sube cero código y no espera 8 minutos:\n${r.stdout}${r.stderr}`);
  assert.match(r.stdout, /borrado de rama/);
});

test('pre-push: un push con código SÍ pasa por el gate, aunque venga con un borrado al lado', () => {
  const conCodigo = correr(`refs/heads/x ${SHA} refs/heads/x ${CEROS}\n`);
  assert.notEqual(conCodigo.status, 0, 'ROJO: el fastpath no puede tragarse un push normal');
  assert.doesNotMatch(conCodigo.stdout, /borrado de rama/);

  const mezcla = correr(`(delete) ${CEROS} refs/heads/vieja ${SHA}\nrefs/heads/x ${SHA} refs/heads/x ${CEROS}\n`);
  assert.notEqual(mezcla.status, 0, 'ROJO: basta una ref con código para que el gate mande');
});

/*
 * El fastpath de `proto/*` (versiones congeladas, DD-56) leía las MISMAS refs por stdin. Un bucle
 * nuevo delante se las comía enteras y lo dejaba ciego: seguía verde en apariencia, porque acababa
 * en el gate, que también sube. Este caso monta un remoto de verdad para que el proto SÍ sea
 * antepasado de `origin/main`, que es la única forma de ver que su fastpath sigue disparando.
 */
test('pre-push: el fastpath de proto/* sigue vivo (el bucle nuevo no se come el stdin)', () => {
  const bare = mkdtempSync(join(tmpdir(), 'sc-remoto-'));
  const dir = mkdtempSync(join(tmpdir(), 'sc-proto-'));
  const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
  git(bare, 'init', '--bare', '-b', 'main');
  for (const args of [['init', '-b', 'main'], ['config', 'user.email', 'x@y.z'], ['config', 'user.name', 'x'], ['commit', '--allow-empty', '-m', 'base']])
    git(dir, ...args);
  git(dir, 'remote', 'add', 'origin', bare);
  git(dir, 'push', '-q', '--no-verify', 'origin', 'main');
  const sha = git(dir, 'rev-parse', 'HEAD').stdout.trim();

  const r = spawnSync('bash', [HOOK, 'origin', bare], {
    cwd: dir,
    input: `refs/heads/proto/sismac-2858 ${sha} refs/heads/proto/sismac-2858 ${CEROS}\n`,
    encoding: 'utf8',
    env: { ...process.env, SKIP_PREFLIGHT: '0', NVM_DIR: '/dev/null' },
    timeout: 60_000,
  });
  assert.equal(r.status, 0, `el proto ya está en main: sube sin repetir la cadena:\n${r.stdout}${r.stderr}`);
  assert.match(r.stdout, /versión congelada/);
  assert.doesNotMatch(r.stdout, /borrado de rama/, 'y no se cuela por el fastpath equivocado');
});

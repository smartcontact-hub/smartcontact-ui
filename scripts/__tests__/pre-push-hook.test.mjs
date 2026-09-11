import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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
 *
 * ⚠️ Y todo `git` de aquí va con el entorno LIMPIO de variables `GIT_*`. Dentro de un hook de git
 * están exportadas y apuntan al repositorio de verdad, así que un `git init --bare` sobre un repo
 * temporal aterriza en el de Rafa y lo deja sin árbol de trabajo. Pasó: es lo que motiva el
 * `unset` del hook, y este fichero no puede ser el que lo repita.
 */
const SIN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
const HOOK = resolve(import.meta.dirname, '../../.githooks/pre-push');
const CEROS = '0'.repeat(40);
const SHA = 'c85e295a6d5cc99edd8af40d7c12fc3dcf2477c3';

function correr(refs) {
  const dir = mkdtempSync(join(tmpdir(), 'sc-prepush-'));
  spawnSync('git', ['init', '-b', 'main'], { cwd: dir, env: SIN_GIT });
  return spawnSync('bash', [HOOK, 'origin', 'https://example.invalid/x.git'], {
    cwd: dir,
    input: refs,
    encoding: 'utf8',
    env: { ...SIN_GIT, SKIP_PREFLIGHT: '0', NVM_DIR: '/dev/null' },
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
  const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8', env: SIN_GIT });
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
    env: { ...SIN_GIT, SKIP_PREFLIGHT: '0', NVM_DIR: '/dev/null' },
    timeout: 60_000,
  });
  assert.equal(r.status, 0, `el proto ya está en main: sube sin repetir la cadena:\n${r.stdout}${r.stderr}`);
  assert.match(r.stdout, /versión congelada/);
  assert.doesNotMatch(r.stdout, /borrado de rama/, 'y no se cuela por el fastpath equivocado');
});

/*
 * El caso que costó el repositorio entero, dos veces. Se mide de verdad: en el repo temporal se
 * deja un `package.json` cuyo `preflight:scope` solo comprueba una cosa, que `GIT_DIR` llegue
 * vacío. Si el hook lo propaga, el gate sale 1 y el push se para.
 */
test('pre-push: el gate no hereda el repositorio de git (GIT_DIR limpio)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sc-gitdir-'));
  spawnSync('git', ['init', '-b', 'main'], { cwd: dir, env: SIN_GIT });
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'sonda', scripts: { 'preflight:scope': 'sh -c \'[ -z "$GIT_DIR" ]\'' } }),
  );
  const r = spawnSync('bash', [HOOK, 'origin', 'https://example.invalid/x.git'], {
    cwd: dir,
    input: `refs/heads/x ${SHA} refs/heads/x ${CEROS}\n`,
    encoding: 'utf8',
    env: { ...SIN_GIT, SKIP_PREFLIGHT: '0', NVM_DIR: '/dev/null', GIT_DIR: '/tmp/el-repo-de-verdad/.git' },
    timeout: 120_000,
  });
  assert.equal(r.status, 0, `el gate recibió GIT_DIR y cualquier git suyo caería sobre el repo real:\n${r.stdout}${r.stderr}`);
});

/*
 * Y que no vuelva por otra puerta: cualquier test que lance `git` sobre un repo temporal tiene que
 * tirar las `GIT_*` heredadas. El `unset` del hook tapa el camino del push, pero los tests también
 * corren en el CI y podrían correr bajo otro hook de git; el aislamiento es de cada test.
 */
test('ningún test lanza git heredando el entorno de git', () => {
  const dirTests = resolve(import.meta.dirname);
  const culpables = readdirSync(dirTests)
    .filter((f) => f.endsWith('.test.mjs'))
    .filter((f) => {
      const src = readFileSync(join(dirTests, f), 'utf8');
      const lanzaGit = /(spawnSync|execFileSync|execSync)\(\s*'git'/.test(src);
      return lanzaGit && !src.includes("startsWith('GIT_')");
    });
  assert.deepEqual(
    culpables,
    [],
    'lanzan git sin aislar el entorno: dentro de un hook de git, GIT_DIR apunta al repositorio de verdad y el test escribe EN ÉL. ' +
      "Filtra el entorno: Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')))",
  );
});

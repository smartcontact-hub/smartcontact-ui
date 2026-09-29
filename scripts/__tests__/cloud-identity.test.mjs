import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { debeFirmar, esEsteRepo, IDENTIDAD, main } from '../hooks/cloud-identity.mjs';

// El caso de la nube reproducido: una config GLOBAL con la identidad de la herramienta (como el
// `/root/.gitconfig` del contenedor, medido el 2026-09-28), un clon de este repo y el gate de
// atribución detrás. Sin el hook, el commit sale rojo; con él, verde. El hook decide por esa
// condición, no por `CLAUDE_CODE_REMOTE`, así que los casos no la ponen.

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const GATE = join(raiz, 'scripts', 'audit-commit-attribution.mjs');
const SIN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_') && k !== 'CLAUDE_CODE_REMOTE'));
const HERRAMIENTA = '[user]\n\tname = Claude\n\temail = noreply@anthropic.com\n';
const ESTE_REPO = 'https://github.com/smartcontact-hub/smartcontact-ui';

test('esEsteRepo: GitHub directo, por SSH y por el proxy de la nube; un fork u otro repo no', () => {
  for (const url of [ESTE_REPO, `${ESTE_REPO}.git`, 'git@github.com:smartcontact-hub/smartcontact-ui.git', 'http://local_proxy@127.0.0.1:43129/git/smartcontact-hub/smartcontact-ui'])
    assert.ok(esEsteRepo(url), url);
  for (const url of ['https://github.com/otra-cuenta/smartcontact-ui', `${ESTE_REPO}-fork`, 'https://github.com/smartcontact-hub/otro', ''])
    assert.ok(!esEsteRepo(url), url);
});

test('debeFirmar: solo si firmaría como la herramienta, y solo en este repo', () => {
  assert.equal(debeFirmar({ urlOrigen: ESTE_REPO, correoActual: 'noreply@anthropic.com' }), true);
  assert.equal(debeFirmar({ urlOrigen: ESTE_REPO, correoActual: ' NoReply@Anthropic.com ' }), true);
  assert.equal(debeFirmar({ urlOrigen: ESTE_REPO, correoActual: IDENTIDAD.email }), false);
  assert.equal(debeFirmar({ urlOrigen: ESTE_REPO, correoActual: 'x@y.z' }), false);
  assert.equal(debeFirmar({ urlOrigen: ESTE_REPO, correoActual: '' }), false);
  assert.equal(debeFirmar({ urlOrigen: 'https://github.com/otra-cuenta/smartcontact-ui', correoActual: 'noreply@anthropic.com' }), false);
});

/** Un clon con `origin` en `url`, una base en `origin/main`, y la config global que se le pase. */
function clon({ url = ESTE_REPO, global = HERRAMIENTA } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'identidad-'));
  const rutaGlobal = join(dir, 'gitconfig');
  writeFileSync(rutaGlobal, global);
  const env = { ...SIN_GIT, GIT_CONFIG_GLOBAL: rutaGlobal, GIT_CONFIG_NOSYSTEM: '1' };
  const repo = join(dir, 'repo');
  const git = (...args) => execFileSync('git', args, { cwd: repo, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  execFileSync('git', ['init', '-q', '-b', 'main', repo], { env });
  git('remote', 'add', 'origin', url);
  git('commit', '-q', '--allow-empty', '-m', 'base');
  git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  git('checkout', '-q', '-b', 'rama-de-la-sesion');
  return { repo, env, git };
}

const gate = (repo, env) => spawnSync(process.execPath, [GATE], { cwd: repo, env, encoding: 'utf8' });
const correr = (repo, env) => {
  const salida = [];
  main({ env, cwd: repo, escribir: (s) => salida.push(s) });
  return salida.join('');
};

test('sin el hook, el commit del contenedor lleva la firma de la herramienta y el gate lo para', () => {
  const { repo, env, git } = clon();
  git('commit', '-q', '--allow-empty', '-m', 'Trabajo de la sesión');
  assert.equal(git('log', '-1', '--format=%ae'), 'noreply@anthropic.com');
  assert.equal(gate(repo, env).status, 1);
});

test('con el hook: la config del clon gana a la global y el gate sale verde', () => {
  const { repo, env, git } = clon();
  const salida = correr(repo, env);
  assert.ok(salida.includes(`firman como ${IDENTIDAD.nombre} <${IDENTIDAD.email}> (DD-134)`), salida);
  git('commit', '-q', '--allow-empty', '-m', 'Trabajo de la sesión');
  const firma = `${IDENTIDAD.nombre} <${IDENTIDAD.email}>`;
  assert.equal(git('log', '-1', '--format=%an <%ae> | %cn <%ce>'), `${firma} | ${firma}`);
  const r = gate(repo, env);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(
    readFileSync(join(repo, '.git', 'config'), 'utf8').includes(`[user]\n\tname = ${IDENTIDAD.nombre}\n\temail = ${IDENTIDAD.email}`),
    'la identidad vive en la config del CLON, no en la global',
  );
  assert.equal(readFileSync(env.GIT_CONFIG_GLOBAL, 'utf8'), HERRAMIENTA, 'la global no se toca');
});

test('con otra identidad (la de una máquina local) calla y no toca nada', () => {
  const { repo, env, git } = clon({ global: '[user]\n\tname = x\n\temail = x@y.z\n' });
  assert.equal(correr(repo, env), '');
  assert.equal(git('config', 'user.email'), 'x@y.z');
});

test('con otro origin (un fork): no firma con la cuenta del mantenedor', () => {
  const { repo, env, git } = clon({ url: 'https://github.com/otra-cuenta/smartcontact-ui' });
  assert.equal(correr(repo, env), '');
  assert.equal(git('config', 'user.email'), 'noreply@anthropic.com');
});

test('si no puede escribir la config, lo dice y no revienta la sesión', () => {
  const { repo, env } = clon();
  const dotGit = join(repo, '.git');
  chmodSync(dotGit, 0o555);
  try {
    let salida = '';
    assert.doesNotThrow(() => (salida = correr(repo, env)));
    assert.match(salida, /no pude fijar la identidad de git/);
  } finally {
    chmodSync(dotGit, 0o755);
  }
});

test('el hook está registrado en SessionStart al arrancar y al retomar', () => {
  const settings = JSON.parse(readFileSync(join(raiz, '.claude', 'settings.json'), 'utf8'));
  const grupos = settings.hooks.SessionStart.filter((g) => g.hooks.some((h) => h.command.includes('scripts/hooks/cloud-identity.mjs')));
  assert.equal(grupos.length, 1);
  assert.match(grupos[0].matcher, /startup/);
  assert.match(grupos[0].matcher, /resume/);
});

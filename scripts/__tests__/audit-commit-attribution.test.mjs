import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORREO_HERRAMIENTA, FORMATO, motivos, parsearLog, revisar } from '../audit-commit-attribution.mjs';

// Dos mitades. Las funciones PURAS con fixtures: los dos lados de cada patrón, porque un gate de
// todas las ramas que casa la prosa que HABLA de la regla daría rojos falsos en cada PR como este.
// Y el gate de punta a punta sobre un repo de verdad con el caso FABRICADO: un commit firmado por
// la herramienta, que es exactamente lo que dejaban las sesiones cloud (LEARNINGS #2: un gate que no
// se ha visto enrojecer no es un gate).

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const GATE = join(raiz, 'scripts', 'audit-commit-attribution.mjs');
const HERRAMIENTA = { nombre: 'Claude', email: CORREO_HERRAMIENTA };
const PERSONA = { nombre: 'Mantenedor', email: 'mantenedor@example.com' };
const commit = (o = {}) => ({ sha: 'a'.repeat(40), autor: PERSONA, committer: PERSONA, mensaje: 'Un cambio\n\nPor qué: x.', ...o });

test('rojo: autor o committer con el correo de la herramienta', () => {
  assert.equal(motivos(commit({ autor: HERRAMIENTA, committer: HERRAMIENTA })).length, 2);
  assert.match(motivos(commit({ autor: HERRAMIENTA }))[0], /^autor Claude <noreply@anthropic\.com>/);
  assert.match(motivos(commit({ committer: { nombre: 'Claude', email: 'NoReply@Anthropic.com' } }))[0], /^committer/);
});

test('rojo: las líneas de atribución, en la forma en que las escribe la herramienta', () => {
  for (const linea of [
    'Co-authored-by: Claude <noreply@anthropic.com>',
    'Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>',
    'co-authored-by: claude',
    '  Co-authored-by: Otro nombre <noreply@anthropic.com>',
    '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
    'Generated with Claude Code',
    'https://claude.ai/code/session_01Mt9NQoD65Km9Aw79Ed9fZw',
  ]) {
    const m = motivos(commit({ mensaje: `Un cambio\n\nPor qué: x.\n\n${linea}\n` }));
    assert.equal(m.length, 1, linea);
    assert.match(m[0], /línea 5/, linea);
  }
});

test('verde: otras identidades, otros coautores y la prosa que habla de la regla', () => {
  for (const c of [
    commit(),
    commit({ autor: { nombre: 'github-actions[bot]', email: 'github-actions[bot]@users.noreply.github.com' } }),
    commit({ autor: { nombre: 'x', email: 'x@y.z' } }),
    commit({ mensaje: 'Un cambio\n\nCo-authored-by: Otra Persona <otra@example.com>' }),
    commit({ mensaje: 'Portadas limpias\n\nNi `Co-authored-by: Claude` ni «Generated with Claude Code» en un commit.' }),
    commit({ mensaje: 'Portadas limpias\n\nNi el enlace `claude.ai/code/session_…` de la sesión.' }),
    commit({ mensaje: 'Portadas limpias\n\n- el trailer `Co-authored-by: Claude <noreply@anthropic.com>` que GitHub añade.' }),
  ])
    assert.deepEqual(motivos(c), [], c.mensaje);
});

test('revisar: solo los firmados, con su asunto', () => {
  const r = revisar([commit(), commit({ sha: 'b'.repeat(40), autor: HERRAMIENTA, mensaje: 'Asunto\n\ncuerpo' })]);
  assert.equal(r.length, 1);
  assert.equal(r[0].sha, 'b'.repeat(40));
  assert.equal(r[0].asunto, 'Asunto');
});

test('parsearLog: campos y mensajes de varias líneas, sin mezclar commits', () => {
  const S = FORMATO.includes('\x1f') ? '\x1f' : null;
  assert.ok(S, 'el formato separa campos con un carácter que no sale en un mensaje');
  const salida =
    ['1'.repeat(40), 'A', 'a@x', 'C', 'c@x', 'Uno\n\ncuerpo\ncon líneas\n'].join(S) + '\x1e\n' +
    ['2'.repeat(40), 'B', 'b@x', 'D', 'd@x', 'Dos\n'].join(S) + '\x1e\n';
  const cs = parsearLog(salida);
  assert.equal(cs.length, 2);
  assert.deepEqual(cs[0].autor, { nombre: 'A', email: 'a@x' });
  assert.deepEqual(cs[1].committer, { nombre: 'D', email: 'd@x' });
  assert.equal(cs[0].mensaje, 'Uno\n\ncuerpo\ncon líneas\n');
});

/* ── De punta a punta, sobre un repo de verdad ────────────────────────────── */

// Sin las `GIT_*` heredadas: dentro de un hook de git (el pre-push corre `verify`) GIT_DIR apunta al
// repositorio de verdad y estos git escribirían EN ÉL (lo vigila `pre-push-hook.test.mjs`).
const SIN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
const git = (cwd, args, env = {}) =>
  execFileSync('git', args, { cwd, env: { ...SIN_GIT, ...env }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const como = ({ nombre, email }) => ({
  GIT_AUTHOR_NAME: nombre,
  GIT_AUTHOR_EMAIL: email,
  GIT_COMMITTER_NAME: nombre,
  GIT_COMMITTER_EMAIL: email,
});

/** Un `origin` con un `main` cuyo último commit YA lleva el trailer (como los de verdad), y un clon en una rama. */
function escenario() {
  const dir = mkdtempSync(join(tmpdir(), 'atribucion-'));
  const origen = join(dir, 'origen.git');
  const yo = join(dir, 'yo');
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origen], { env: SIN_GIT });
  execFileSync('git', ['clone', '-q', origen, yo], { env: SIN_GIT, stdio: 'ignore' });
  git(yo, ['commit', '-q', '--allow-empty', '-m', 'base'], como(PERSONA));
  git(yo, ['commit', '-q', '--allow-empty', '-m', 'Ya en main (#1)\n\nCo-authored-by: Claude <noreply@anthropic.com>'], como(PERSONA));
  git(yo, ['push', '-q', 'origin', 'HEAD:main']);
  git(yo, ['fetch', '-q', 'origin']);
  git(yo, ['checkout', '-q', '-b', 'mi-rama']);
  return { dir, origen, yo };
}

const correr = (cwd) => spawnSync(process.execPath, [GATE], { cwd, env: SIN_GIT, encoding: 'utf8' });

test('de punta a punta · rojo con el caso fabricado: un commit de la rama firmado por la herramienta', () => {
  const { yo } = escenario();
  git(yo, ['commit', '-q', '--allow-empty', '-m', 'Trabajo de una sesión cloud'], como(HERRAMIENTA));
  const sha = git(yo, ['rev-parse', 'HEAD']);
  const r = correr(yo);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, new RegExp(sha.slice(0, 8)));
  assert.match(r.stdout, /1 de 1 commit/);
  assert.match(r.stdout, /git rebase -r origin\/main/);
});

test('de punta a punta · rojo con el trailer escrito en el mensaje, aunque el autor sea el bueno', () => {
  const { yo } = escenario();
  git(yo, ['commit', '-q', '--allow-empty', '-m', 'Cambio\n\nCo-Authored-By: Claude <noreply@anthropic.com>'], como(PERSONA));
  const r = correr(yo);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /el coautor de la herramienta/);
});

test('de punta a punta · verde: la rama limpia, aunque main ya lleve commits con el trailer', () => {
  const { yo } = escenario();
  git(yo, ['commit', '-q', '--allow-empty', '-m', 'Cambio limpio\n\nPor qué: x.'], como(PERSONA));
  const r = correr(yo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /1 commit\(s\) por encima de origin\/main, ninguno/);
});

test('de punta a punta · un merge de main en la rama no mete sus commits en el rango', () => {
  const { origen, yo, dir } = escenario();
  git(yo, ['commit', '-q', '--allow-empty', '-m', 'Mío'], como(PERSONA));
  const otra = join(dir, 'otra');
  execFileSync('git', ['clone', '-q', origen, otra], { env: SIN_GIT, stdio: 'ignore' });
  git(otra, ['commit', '-q', '--allow-empty', '-m', 'Fundido después (#2)\n\nCo-authored-by: Claude <noreply@anthropic.com>'], como(PERSONA));
  git(otra, ['push', '-q', 'origin', 'HEAD:main']);
  git(yo, ['fetch', '-q', 'origin']);
  git(yo, ['merge', '-q', '--no-edit', 'origin/main'], como(PERSONA));
  const r = correr(yo);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('de punta a punta · rojo si no puede responder por el rango: sin origin/main, o un clon superficial', () => {
  const { dir, origen, yo } = escenario();
  git(yo, ['update-ref', '-d', 'refs/remotes/origin/main']);
  const sinBase = correr(yo);
  assert.equal(sinBase.status, 1);
  assert.match(sinBase.stdout, /no existe `origin\/main`/);

  const superficial = join(dir, 'superficial');
  execFileSync('git', ['clone', '-q', '--depth', '1', `file://${origen}`, superficial], { env: SIN_GIT, stdio: 'ignore' });
  const r = correr(superficial);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /clon es superficial/);
});

test('el job `verify` del CI hace el checkout con la historia entera: sin ella el gate no ve el rango', () => {
  const ci = readFileSync(join(raiz, '.github', 'workflows', 'ci.yml'), 'utf8');
  const job = /\n {2}verify:\n([\s\S]*?)(?=\n {2}[\w-]+:\n)/.exec(ci)?.[1] ?? '';
  assert.ok(job, 'ci.yml tiene un job `verify`');
  assert.match(job, /- uses: actions\/checkout@v\d+\n\s+with:\n\s+fetch-depth: 0/);
  assert.match(job, /npm run verify/);
});

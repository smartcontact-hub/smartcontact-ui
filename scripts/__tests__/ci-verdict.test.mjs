import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { motivo, ramaPorDefecto, shaDeLsRemote, veredicto } from '../ci-verdict.mjs';

// Los dos casos malos son REALES, de la s43, y el comando los pasó por alto los dos:
//   1. corrí `ci:verdict` en un worktree cuya rama local lleva sufijo `-2` y me dijo «¿aún no has
//      pusheado?» sobre una rama pusheada y verde;
//   2. me dijo «✓ ci VERDE» sobre una rama cuyo PR el auto-merge había fundido, y con ese verde le
//      pregunté al usuario si lo fundía.
// Y el tercero es de la s44, con este mismo comando ya escrito: me dijo «✓ ci VERDE» sobre el #95,
// que estaba `CONFLICTING` con el #94. El verde lo cantó la máquina; el conflicto lo vi yo a mano.
// El cuarto, minutos después: `ci:verdict -- main` —lo que el aviso del exit 4 te manda correr—
// comparaba el run de main contra MI HEAD, o sea un `△ describe OTRO commit` garantizado.
// (LEARNINGS #2: cada aserción con el fallo delante.)

const RUN = {
  headSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  status: 'completed',
  conclusion: 'success',
  url: 'https://github.com/o/r/actions/runs/1',
};
const HEAD = RUN.headSha;

test('rama: con upstream manda el nombre de ORIGIN, no el local con sufijo', () => {
  assert.equal(ramaPorDefecto('origin/arebury/unify-cf-sites-list', 'arebury/unify-cf-sites-list-2'), 'arebury/unify-cf-sites-list');
  assert.equal(ramaPorDefecto('upstream/feature/a/b', 'local'), 'feature/a/b');
});

test('rama: sin upstream se queda con el nombre local', () => {
  for (const u of ['', '   ', null, undefined]) assert.equal(ramaPorDefecto(u, 'arebury/suelta'), 'arebury/suelta');
});

test('rojo: PR ya fundido gana al verde del CI y sale con 4', () => {
  const v = veredicto({
    rama: 'arebury/unify-cf-sites-list',
    head: HEAD,
    runs: [RUN],
    pr: { number: 91, state: 'MERGED', mergeCommit: { oid: '81654950d9ba1f08d56cc9f59b5f3e0668f3ae22' } },
  });
  assert.equal(v.exit, 4);
  assert.match(v.linea, /#91/);
  assert.match(v.linea, /MERGED/);
  assert.match(v.linea, /8165495/);
  assert.doesNotMatch(v.linea, /VERDE/, 'un PR fundido no puede anunciarse como verde de la rama');
});

test('PR fundido sin mergeCommit: avisa igual, sin inventarse el sha', () => {
  const v = veredicto({ rama: 'r', head: HEAD, runs: [RUN], pr: { number: 7, state: 'MERGED' } });
  assert.equal(v.exit, 4);
  assert.doesNotMatch(v.linea, /undefined/);
});

test('verde: un PR ABIERTO no tapa el veredicto del CI', () => {
  const v = veredicto({ rama: 'r', head: HEAD, runs: [RUN], pr: { number: 91, state: 'OPEN', mergeable: 'MERGEABLE' } });
  assert.equal(v.exit, 0);
  assert.match(v.linea, /VERDE/);
});

test('rojo: PR en CONFLICTO gana al verde del CI y sale con 5', () => {
  const v = veredicto({
    rama: 'arebury/verdict-avisa-pr-fundido',
    head: HEAD,
    runs: [RUN],
    pr: { number: 95, state: 'OPEN', mergeable: 'CONFLICTING' },
  });
  assert.equal(v.exit, 5);
  assert.match(v.linea, /#95/);
  assert.match(v.linea, /CONFLICTO/);
  assert.match(v.linea, /rebase origin\/main/, 'el aviso tiene que traer el siguiente paso, no solo el diagnóstico');
  assert.doesNotMatch(v.linea, /VERDE/, 'un PR en conflicto no puede anunciarse como verde fundible');
});

test('el conflicto manda aunque el CI esté rojo o en curso: rebasar reescribe el commit', () => {
  const pr = { number: 95, state: 'OPEN', mergeable: 'CONFLICTING' };
  assert.equal(veredicto({ rama: 'r', head: HEAD, runs: [{ ...RUN, conclusion: 'failure' }], pr }).exit, 5);
  assert.equal(veredicto({ rama: 'r', head: HEAD, runs: [], pr }).exit, 5);
});

test('`mergeable: UNKNOWN` (GitHub aún calculando) NO se lee como conflicto', () => {
  // Medido tras el push del #95: durante unos segundos `gh pr list` devuelve UNKNOWN. Tratarlo
  // como conflicto mandaría a rebasar una rama que funde (LEARNINGS #17: solo lo medido).
  for (const m of ['UNKNOWN', undefined, null]) {
    const v = veredicto({ rama: 'r', head: HEAD, runs: [RUN], pr: { number: 95, state: 'OPEN', mergeable: m } });
    assert.equal(v.exit, 0, `UNKNOWN no es conflicto: ${m}`);
  }
});

test('un PR CERRADO sin fundir no secuestra el veredicto por su mergeable', () => {
  const v = veredicto({ rama: 'r', head: HEAD, runs: [RUN], pr: { number: 95, state: 'CLOSED', mergeable: 'CONFLICTING' } });
  assert.equal(v.exit, 0);
});

test('verde: sin PR (main) el veredicto es el de siempre', () => {
  assert.equal(veredicto({ rama: 'main', head: HEAD, runs: [RUN], pr: null }).exit, 0);
});

test('los otros cuatro veredictos no cambian', () => {
  assert.equal(veredicto({ rama: 'r', head: HEAD, runs: [], pr: null }).exit, 2);
  assert.equal(veredicto({ rama: 'r', head: 'b'.repeat(40), runs: [RUN], pr: null }).exit, 3);
  assert.equal(veredicto({ rama: 'r', head: HEAD, runs: [{ ...RUN, status: 'in_progress', conclusion: null }], pr: null }).exit, 2);
  const rojo = veredicto({ rama: 'r', head: HEAD, runs: [{ ...RUN, conclusion: 'failure' }], pr: null });
  assert.equal(rojo.exit, 1);
  assert.match(rojo.linea, /FAILURE/);
});


test('etiqueta: por defecto habla de tu HEAD', () => {
  const v = veredicto({ rama: 'r', head: HEAD, runs: [RUN], pr: null });
  assert.match(v.linea, /tu HEAD/);
});

test('rama pedida a mano: el mensaje dice contra QUÉ compara, no «tu HEAD»', () => {
  const v = veredicto({ rama: 'main', head: HEAD, runs: [RUN], pr: null, etiqueta: 'el tip de origin/main' });
  assert.equal(v.exit, 0);
  assert.match(v.linea, /el tip de origin\/main/);
  assert.doesNotMatch(v.linea, /tu HEAD/, 'preguntas por otra rama: tu HEAD no pinta nada');
});

test('el aviso de OTRO commit tampoco puede llamarlo «tuyo» cuando preguntas por otra rama', () => {
  const v = veredicto({
    rama: 'main',
    head: 'c20939ce759f28dddb087065be5c243ae9e9d6d3',
    runs: [{ ...RUN, headSha: 'b'.repeat(40) }],
    pr: null,
    etiqueta: 'el tip de origin/main',
  });
  assert.equal(v.exit, 3);
  assert.match(v.linea, /el tip de origin\/main es c20939c/);
  assert.doesNotMatch(v.linea, /no el tuyo/, 'el run de main no es «tuyo» ni deja de serlo');
});

// `ls-remote` NO falla cuando la rama no existe: devuelve salida vacía. Medido contra origin con
// `refs/heads/no-existe-xyz` (exit 0, cero líneas). Tratarlo como error se come el único aviso útil.
test('shaDeLsRemote: saca el sha de la línea, y vacío si la rama no está en origin', () => {
  assert.equal(shaDeLsRemote('c20939ce759f28dddb087065be5c243ae9e9d6d3\trefs/heads/main'), 'c20939ce759f28dddb087065be5c243ae9e9d6d3');
  for (const v of ['', '   ', '\n', null, undefined]) assert.equal(shaDeLsRemote(v), '', `debía ser vacío: ${JSON.stringify(v)}`);
});

test('shaDeLsRemote: lo que no es un sha de 40 no pasa por sha', () => {
  for (const v of ['ref: refs/heads/main\tHEAD', 'c20939c\trefs/heads/main', 'fatal: no such remote'])
    assert.equal(shaDeLsRemote(v), '', `no es un sha completo: ${v}`);
});

// Silenciar el stderr heredado (el `fatal: no upstream configured` que se colaba por encima del
// veredicto) deja el motivo del fallo SOLO en `e.stderr`: `e.message` a secas es «Command failed».
test('motivo: el stderr manda; el message es el respaldo', () => {
  assert.equal(motivo({ stderr: 'gh: not authenticated\nrun gh auth login', message: 'Command failed: gh run list' }), 'gh: not authenticated');
  assert.equal(motivo({ stderr: '  \n', message: 'Command failed: gh run list\nmás' }), 'Command failed: gh run list');
  assert.equal(motivo({}), 'sin detalle');
  assert.equal(motivo(undefined), 'sin detalle');
});

/* ── En la nube: un `gh` que solo entiende `api` ─────────────────────────── */

// El caso es del 2026-10-04: en una sesión en la nube el `gh` es un cliente que solo tiene `api`, y `ci:verdict` salía
// con «✗ no pude leer el CI» (código 2) en cada push, así que el CI se leía a mano. Estas pruebas ponen delante un `gh`
// falso que se porta como aquel: `run` y `pr` no existen, y `api` contesta con el REST.

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'ci-verdict.mjs');
const SIN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
const GH_DE_LA_NUBE = `#!/usr/bin/env node
const [orden, ruta] = process.argv.slice(2);
if (orden !== 'api') {
  process.stderr.write('unknown command "' + orden + '" for "gh"\\n');
  process.exit(1);
}
for (const [trozo, respuesta] of JSON.parse(process.env.GH_FALSO)) {
  if (ruta.includes(trozo)) {
    process.stdout.write(JSON.stringify(respuesta));
    process.exit(0);
  }
}
process.stderr.write('HTTP 404: ' + ruta + '\\n');
process.exit(1);
`;

/** Un repo con un commit, `origin` en GitHub y el `gh` de la nube primero en el PATH. `respuestas(head)` da el REST. */
function enLaNube(respuestas) {
  const dir = mkdtempSync(join(tmpdir(), 'ci-verdict-nube-'));
  const bin = join(dir, 'bin');
  const repo = join(dir, 'repo');
  mkdirSync(bin);
  writeFileSync(join(bin, 'gh'), GH_DE_LA_NUBE, { mode: 0o755 });
  const git = (args) => execFileSync('git', args, { cwd: repo, env: SIN_GIT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  execFileSync('git', ['init', '-q', '-b', 'mi-rama', repo], { env: SIN_GIT });
  git(['-c', 'user.name=Prueba', '-c', 'user.email=prueba@example.com', 'commit', '-q', '--allow-empty', '-m', 'uno']);
  git(['remote', 'add', 'origin', 'https://github.com/o/r.git']);
  const head = git(['rev-parse', 'HEAD']);
  const env = { ...SIN_GIT, PATH: `${bin}${delimiter}${process.env.PATH}`, GH_FALSO: JSON.stringify(respuestas(head)) };
  return spawnSync(process.execPath, [SCRIPT], { cwd: repo, env, encoding: 'utf8' });
}

const ejecucion = (head, extra) => ({
  workflow_runs: [{ id: 9, head_sha: head, status: 'completed', conclusion: 'success', html_url: 'https://github.com/o/r/actions/runs/9', created_at: '2026-10-04T18:49:07Z', ...extra }],
});

test('en la nube lee el CI igual: verde sobre tu HEAD, sin `gh run` ni `gh pr`', () => {
  const r = enLaNube((head) => [
    ['actions/workflows/ci.yml/runs', ejecucion(head)],
    ['pulls?head=o:mi-rama', []],
  ]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /✓ ci VERDE en mi-rama/);
});

test('en la nube ve el PR: fundido gana al verde (4) y en conflicto también (5)', () => {
  const fundido = enLaNube((head) => [
    ['actions/workflows/ci.yml/runs', ejecucion(head)],
    ['pulls?head=o:mi-rama', [{ number: 7, state: 'closed', merged_at: '2026-10-04T18:58:30Z', merge_commit_sha: 'c756d89540918b177fb72baab0e13acee0cb7c8e', head: { ref: 'mi-rama' } }]],
  ]);
  assert.equal(fundido.status, 4, fundido.stdout + fundido.stderr);
  assert.match(fundido.stdout, /#7 de mi-rama ya está MERGED en c756d89/);

  const choca = enLaNube((head) => [
    ['actions/workflows/ci.yml/runs', ejecucion(head)],
    ['pulls?head=o:mi-rama', [{ number: 8, state: 'open', merged_at: null, head: { ref: 'mi-rama' } }]],
    ['pulls/8', { number: 8, state: 'open', mergeable: false, mergeable_state: 'dirty' }],
  ]);
  assert.equal(choca.status, 5, choca.stdout + choca.stderr);
  assert.match(choca.stdout, /#8 de mi-rama está en CONFLICTO/);
});

// El commit del robot de `visual-baselines` sobre un PR abierto deja una ejecución «failure» sin un solo job (#325, run
// 37224296361): no hay log que leer, y mandar a leerlo es mandar a un callejón.
test('una ejecución en rojo sin jobs no manda a un log que no existe: dice cómo salir', () => {
  const r = enLaNube((head) => [
    ['actions/workflows/ci.yml/runs', ejecucion(head, { conclusion: 'failure' })],
    ['actions/runs/9/jobs', { total_count: 0, jobs: [] }],
    ['pulls?head=o:mi-rama', []],
  ]);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /ningún job/);
  assert.match(r.stdout, /siguiente commit/);
  assert.doesNotMatch(r.stdout, /log-failed/);
});

// En #325 cayó `e2e-smoke` por la captura de una página de sc-docs que había crecido: la salida es regenerarla.
test('si cae e2e-smoke, la pista dice cómo regenerar las capturas de esa rama', () => {
  const r = enLaNube((head) => [
    ['actions/workflows/ci.yml/runs', ejecucion(head, { conclusion: 'failure' })],
    ['actions/runs/9/jobs', { total_count: 2, jobs: [{ name: 'verify', conclusion: 'success' }, { name: 'e2e-smoke', conclusion: 'failure' }] }],
    ['pulls?head=o:mi-rama', []],
  ]);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /falla: e2e-smoke/);
  assert.match(r.stdout, /visual-baselines/);
  assert.match(r.stdout, /rama=mi-rama/);
  assert.match(r.stdout, /actions\/runs\/9\/jobs/);
});

// Medido el 2026-10-05 con el CI de un PR en curso sobre su HEAD (run 37270726449): la consulta por
// `branch` devolvió, de forma pasajera, el run de semanas antes (otro sha) justo cuando la de por
// `head_sha` ya tenía el run del HEAD. El comando dijo «describe OTRO commit» (exit 3) sobre algo
// que estaba corriendo; segundos después la propia consulta por rama se corrigió sola. `github.mjs`
// ya tenía `ejecucionesDeCommit` para esto (línea ~109); solo faltaba que `ci:verdict` la usara.
test('la consulta por rama trae un run viejo pero el de tu HEAD existe por head_sha: en curso, no OTRO commit', () => {
  const r = enLaNube((head) => [
    ['?branch=', ejecucion('c'.repeat(40))],
    ['head_sha=' + head, { workflow_runs: [{ id: 10, head_sha: head, status: 'in_progress', conclusion: null, html_url: 'https://github.com/o/r/actions/runs/10', created_at: '2026-10-05T10:00:00Z' }] }],
    ['pulls?head=o:mi-rama', []],
  ]);
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stdout, /in_progress/);
  assert.doesNotMatch(r.stdout, /OTRO commit/);
});

// Si tampoco hay run por `head_sha` para el HEAD, el aviso de siempre: el de la rama describe otro commit.
test('sin run por head_sha para tu HEAD, se mantiene el aviso de OTRO commit', () => {
  const r = enLaNube((head) => [
    ['?branch=', ejecucion('c'.repeat(40))],
    ['head_sha=' + head, { workflow_runs: [] }],
    ['pulls?head=o:mi-rama', []],
  ]);
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stdout, /describe OTRO commit/);
});

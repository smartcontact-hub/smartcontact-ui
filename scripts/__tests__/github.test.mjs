import { test } from 'node:test';
import assert from 'node:assert/strict';

import { cliente, mergeableDe, prDe, repoDeRemoto, rollupDe, runDe } from '../github.mjs';

// `github.mjs` traduce el REST a las formas de `gh … --json` que ya usaban `ci:verdict` y `sesiones`. Cada prueba fija
// una de las diferencias del REST, que son justo las que romperían esos scripts en silencio si se colaran sin traducir.

/** Un `gh` falso: apunta las rutas que le piden y contesta por el primer trozo de ruta que case. */
function ghFalso(respuestas) {
  const pedidas = [];
  const gh = (args) => {
    assert.equal(args[0], 'api', 'solo se usa `gh api`');
    assert.equal(args.length, 2, 'sin -f, --jq ni --paginate: la consulta va en la ruta');
    const ruta = args[1];
    pedidas.push(ruta);
    for (const [trozo, r] of respuestas) if (ruta.includes(trozo)) return JSON.stringify(r);
    throw Object.assign(new Error('HTTP 404'), { stderr: `HTTP 404: ${ruta}` });
  };
  return { gh, pedidas };
}
const git = () => 'https://github.com/o/r.git';

test('repoDeRemoto: las tres formas de origin de este repo, y nada si no se entiende', () => {
  assert.deepEqual(repoDeRemoto('https://github.com/smartcontact-hub/smartcontact-ui.git'), { owner: 'smartcontact-hub', repo: 'smartcontact-ui' });
  assert.deepEqual(repoDeRemoto('git@github.com:smartcontact-hub/smartcontact-ui.git'), { owner: 'smartcontact-hub', repo: 'smartcontact-ui' });
  assert.deepEqual(repoDeRemoto('http://local_proxy@127.0.0.1:43159/git/smartcontact-hub/smartcontact-ui'), {
    owner: 'smartcontact-hub',
    repo: 'smartcontact-ui',
  });
  assert.equal(repoDeRemoto(''), null);
  assert.equal(repoDeRemoto(undefined), null);
});

test('mergeableDe: el REST (true/false/null) en el vocabulario de gh', () => {
  assert.equal(mergeableDe({ mergeable: true, mergeable_state: 'clean' }), 'MERGEABLE');
  assert.equal(mergeableDe({ mergeable: false, mergeable_state: 'dirty' }), 'CONFLICTING');
  assert.equal(mergeableDe({ mergeable: null, mergeable_state: 'dirty' }), 'CONFLICTING');
  // GitHub tarda unos segundos en calcularlo tras un push: eso NO es conflicto.
  assert.equal(mergeableDe({ mergeable: null, mergeable_state: 'unknown' }), 'UNKNOWN');
});

test('prDe: el REST no tiene MERGED; lo es un PR cerrado con fecha de fusión', () => {
  const fundido = prDe({ number: 325, state: 'closed', merged_at: '2026-10-04T18:58:30Z', merge_commit_sha: 'c756d895', head: { ref: 'rama', sha: 'abc123' } });
  assert.equal(fundido.state, 'MERGED');
  assert.deepEqual(fundido.mergeCommit, { oid: 'c756d895' });
  assert.equal(fundido.headRefName, 'rama');
  assert.equal(fundido.headRefOid, 'abc123', 'el sha que ESE PR llegó a ver, para comparar contra tu HEAD (#333)');
  const cerrado = prDe({ number: 9, state: 'closed', merged_at: null, merge_commit_sha: 'abc', head: { ref: 'x' } });
  assert.equal(cerrado.state, 'CLOSED');
  assert.equal(cerrado.mergeCommit, null, 'un PR cerrado sin fundir no tiene commit de fusión');
  assert.equal(prDe({ number: 1, state: 'open', head: { ref: 'y' } }).state, 'OPEN');
  assert.equal(prDe({ number: 2, state: 'open', head: { ref: 'z' } }).headRefOid, null, 'sin head.sha, null y no undefined');
});

test('rollupDe: check-runs y estados de commit, en mayúsculas y null mientras corren', () => {
  const rollup = rollupDe(
    [
      { name: 'verify', conclusion: 'success' },
      { name: 'e2e-smoke', conclusion: 'failure' },
      { name: 'build', conclusion: null },
    ],
    [
      { context: 'Cloudflare Pages', state: 'success' },
      { context: 'otro', state: 'error' },
      { context: 'lento', state: 'pending' },
    ],
  );
  assert.deepEqual(rollup, [
    { name: 'verify', conclusion: 'SUCCESS' },
    { name: 'e2e-smoke', conclusion: 'FAILURE' },
    { name: 'build', conclusion: null },
    { context: 'Cloudflare Pages', conclusion: 'SUCCESS' },
    { context: 'otro', conclusion: 'FAILURE' },
    { context: 'lento', conclusion: null },
  ]);
});

test('runDe: la ejecución con los nombres de gh run list', () => {
  const r = runDe({ id: 9, head_sha: 'a'.repeat(40), status: 'completed', conclusion: 'success', html_url: 'u', created_at: 't', run_started_at: 's', event: 'push' });
  assert.deepEqual(r, { id: 9, headSha: 'a'.repeat(40), status: 'completed', conclusion: 'success', url: 'u', createdAt: 't', startedAt: 's', event: 'push', runAttempt: 1 });
});

test('ultimaCI: el workflow ci de la rama, con la rama escapada en la ruta', () => {
  const { gh, pedidas } = ghFalso([['actions/workflows/ci.yml/runs', { workflow_runs: [{ id: 1, head_sha: 'h', status: 'completed', conclusion: 'success', html_url: 'u' }] }]]);
  const runs = cliente({ gh, git }).ultimaCI('equipo/rama-de-prueba');
  assert.equal(runs.length, 1);
  assert.equal(runs[0].headSha, 'h');
  assert.deepEqual(pedidas, ['repos/o/r/actions/workflows/ci.yml/runs?branch=equipo%2Frama-de-prueba&per_page=1']);
});

test('prDeRama: abierto pide su mergeable aparte; fundido o sin PR, no', () => {
  const abierto = ghFalso([
    ['pulls?head=o:mi-rama', [{ number: 8, state: 'open', head: { ref: 'mi-rama' } }]],
    ['pulls/8', { mergeable: false, mergeable_state: 'dirty' }],
  ]);
  assert.equal(cliente({ gh: abierto.gh, git }).prDeRama('mi-rama').mergeable, 'CONFLICTING');
  assert.equal(abierto.pedidas.length, 2);

  const fundido = ghFalso([['pulls?head=o:mi-rama', [{ number: 7, state: 'closed', merged_at: 'm', merge_commit_sha: 's', head: { ref: 'mi-rama' } }]]]);
  assert.equal(cliente({ gh: fundido.gh, git }).prDeRama('mi-rama').state, 'MERGED');
  assert.equal(fundido.pedidas.length, 1);

  const nada = ghFalso([['pulls?head=o:mi-rama', []]]);
  assert.equal(cliente({ gh: nada.gh, git }).prDeRama('mi-rama'), null);
});

// #333: una sesión cloud reutiliza la rama tras fundir, y por unos commits conviven el fundido
// VIEJO y el abierto NUEVO con el mismo headRefName. El REST no promete devolverlos en un orden
// dado: el fundido va PRIMERO en esta lista a propósito, para que la prueba no se corrobore sola
// con el orden que ya tenía `lista[0]`.
test('prDeRama: con un fundido y un abierto en la misma rama, manda el abierto aunque venga segundo', () => {
  const { gh, pedidas } = ghFalso([
    [
      'pulls?head=o:mi-rama',
      [
        { number: 330, state: 'closed', merged_at: '2026-10-04T10:00:00Z', merge_commit_sha: 'e7e0e8f3', head: { ref: 'mi-rama', sha: 'vieja' } },
        { number: 333, state: 'open', head: { ref: 'mi-rama', sha: 'nueva' } },
      ],
    ],
    ['pulls/333', { mergeable: true, mergeable_state: 'clean' }],
  ]);
  const pr = cliente({ gh, git }).prDeRama('mi-rama');
  assert.equal(pr.number, 333);
  assert.equal(pr.state, 'OPEN');
  assert.equal(pr.headRefOid, 'nueva');
  assert.equal(pr.mergeable, 'MERGEABLE');
  assert.ok(pedidas.some((p) => p.includes('pulls/333')), 'solo pide el mergeable del que eligió');
});

test('prsAbiertos: los checks y el mergeable, solo de los PRs con caja local', () => {
  const { gh, pedidas } = ghFalso([
    ['pulls?state=open', [{ number: 1, state: 'open', head: { ref: 'mia', sha: 's1' } }, { number: 2, state: 'open', head: { ref: 'ajena', sha: 's2' } }]],
    ['pulls/1', { mergeable: true }],
    ['commits/s1/check-runs', { check_runs: [{ name: 'verify', conclusion: 'success' }] }],
    ['commits/s1/status', { statuses: [] }],
  ]);
  const [mia, ajena] = cliente({ gh, git }).prsAbiertos((rama) => rama === 'mia');
  assert.equal(mia.mergeable, 'MERGEABLE');
  assert.deepEqual(mia.statusCheckRollup, [{ name: 'verify', conclusion: 'SUCCESS' }]);
  assert.deepEqual(ajena.statusCheckRollup, []);
  assert.ok(!pedidas.some((p) => p.includes('s2')), 'no se gastan llamadas en los PRs sin caja');
});

test('prsFundidos: de los cerrados, solo los que tienen fecha de fusión', () => {
  const { gh } = ghFalso([
    ['pulls?state=closed', [
      { number: 3, state: 'closed', merged_at: 'm3', merge_commit_sha: 'x', head: { ref: 'a' } },
      { number: 2, state: 'closed', merged_at: null, head: { ref: 'b' } },
      { number: 1, state: 'closed', merged_at: 'm1', merge_commit_sha: 'y', head: { ref: 'c' } },
    ]],
  ]);
  const fundidos = cliente({ gh, git }).prsFundidos(40);
  assert.deepEqual(fundidos.map((p) => p.number), [3, 1]);
  assert.ok(fundidos.every((p) => p.state === 'MERGED'));
  assert.deepEqual(cliente({ gh, git }).prsFundidos(1).map((p) => p.number), [3]);
});

test('prFundidoDeRama: el fundido aunque no esté entre los últimos; null si la rama no tiene', () => {
  const { gh } = ghFalso([['pulls?head=o:vieja', [{ number: 5, state: 'closed', merged_at: null, head: { ref: 'vieja' } }, { number: 4, state: 'closed', merged_at: 'm', head: { ref: 'vieja' } }]]]);
  assert.equal(cliente({ gh, git }).prFundidoDeRama('vieja').number, 4);
  const nada = ghFalso([['pulls?head=o:nueva', []]]);
  assert.equal(cliente({ gh: nada.gh, git }).prFundidoDeRama('nueva'), null);
});

test('sin origin legible, la ruta lleva los comodines que rellena gh', () => {
  const { gh, pedidas } = ghFalso([['actions/workflows/ci.yml/runs', { workflow_runs: [] }]]);
  const sinOrigin = () => {
    throw new Error('fatal: No such remote');
  };
  cliente({ gh, git: sinOrigin }).ultimaCI('main');
  assert.match(pedidas[0], /^repos\/\{owner\}\/\{repo\}\//);
});

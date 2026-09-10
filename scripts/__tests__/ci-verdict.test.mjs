import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ramaPorDefecto, veredicto } from '../ci-verdict.mjs';

// Los dos casos malos son REALES, de la s43, y el comando los pasó por alto los dos:
//   1. corrí `ci:verdict` en un worktree cuya rama local lleva sufijo `-2` y me dijo «¿aún no has
//      pusheado?» sobre una rama pusheada y verde;
//   2. me dijo «✓ ci VERDE» sobre una rama cuyo PR el auto-merge había fundido, y con ese verde le
//      pregunté a Rafa si lo fundía.
// Y el tercero es de la s44, con este mismo comando ya escrito: me dijo «✓ ci VERDE» sobre el #95,
// que estaba `CONFLICTING` con el #94. El verde lo cantó la máquina; el conflicto lo vi yo a mano.
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

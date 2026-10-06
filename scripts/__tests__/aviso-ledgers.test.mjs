import { test } from 'node:test';
import assert from 'node:assert/strict';

import { cliente } from '../github.mjs';
import { avisarDds, avisarLedgers, avisoDeLedgers, choqueDeDds, cruceDeLedgers, ddsAnadidas, esLedger } from '../preflight-puerta-barata.mjs';

// LEARNINGS #21: un ledger compartido (DECISIONS, LEARNINGS, inventory, handoff y AGENTS) que tocan dos PRs abiertos a
// la vez se pisa en silencio al fundir el segundo. El preflight lo avisa al arrancar, sin bloquear, como la carga.

/** Un `gh` falso, como el de `github.test.mjs`: contesta por el primer trozo de ruta que case. */
function ghFalso(respuestas) {
  const pedidas = [];
  const gh = (args) => {
    const ruta = args[1];
    pedidas.push(ruta);
    for (const [trozo, r] of respuestas) if (ruta.includes(trozo)) return JSON.stringify(r);
    throw Object.assign(new Error('HTTP 404'), { stderr: `HTTP 404: ${ruta}` });
  };
  return { gh, pedidas };
}
const git = () => 'https://github.com/o/r.git';

test('ficherosDePr: los ficheros de un PR abierto, por su ruta', () => {
  const { gh, pedidas } = ghFalso([['pulls/7/files', [{ filename: 'docs/DECISIONS.md' }, { filename: 'projects/a.ts' }]]]);
  assert.deepEqual(cliente({ gh, git }).ficherosDePr(7), ['docs/DECISIONS.md', 'projects/a.ts']);
  assert.ok(pedidas[0].endsWith('pulls/7/files?per_page=100'), pedidas[0]);
});

test('esLedger: los cinco de LEARNINGS #21, y nada más', () => {
  for (const f of ['docs/DECISIONS.md', 'LEARNINGS.md', 'docs/inventory.md', 'docs/handoff/supervisor-fichas.md', 'AGENTS.md'])
    assert.ok(esLedger(f), f);
  for (const f of ['README.md', 'docs/handoff.md', 'projects/x/DECISIONS.md', 'docs/handoffs/x.md']) assert.ok(!esLedger(f), f);
});

test('cruceDeLedgers: solo los ledgers que tocan los dos, y nunca el PR de tu propia rama', () => {
  const mios = ['docs/DECISIONS.md', 'docs/handoff/design-system.md', 'projects/a.ts'];
  const prs = [
    { number: 1, headRefName: 'mi-rama', ficheros: ['docs/DECISIONS.md'] },
    { number: 2, headRefName: 'otra', ficheros: ['docs/DECISIONS.md', 'projects/a.ts', 'LEARNINGS.md'] },
    { number: 3, headRefName: 'tercera', ficheros: ['projects/a.ts'] },
  ];
  assert.deepEqual(cruceDeLedgers({ mios, prs, rama: 'mi-rama' }), [{ number: 2, rama: 'otra', ficheros: ['docs/DECISIONS.md'] }]);
});

test('avisoDeLedgers: nombra el PR, su rama y los ficheros, y dice que no bloquea; sin cruce, null', () => {
  assert.equal(avisoDeLedgers([]), null);
  const aviso = avisoDeLedgers([{ number: 2, rama: 'otra', ficheros: ['docs/DECISIONS.md'] }]);
  assert.match(aviso, /#2/);
  assert.match(aviso, /otra/);
  assert.match(aviso, /docs\/DECISIONS\.md/);
  assert.match(aviso, /LEARNINGS #21/);
  assert.match(aviso, /NO bloquea/);
});

test('avisarLedgers: sin red calla y no lanza; con un cruce escribe una vez', () => {
  const escritos = [];
  const escribir = (t) => escritos.push(t);
  const sinRed = {
    prsAbiertos() {
      throw new Error('sin red');
    },
    ficherosDePr() {
      throw new Error('sin red');
    },
  };
  assert.equal(avisarLedgers({ mios: ['docs/DECISIONS.md'], rama: 'mi', cliente: sinRed, escribir }), false);
  assert.equal(escritos.length, 0);

  const conCruce = {
    prsAbiertos: () => [{ number: 9, headRefName: 'otra' }],
    ficherosDePr: (n) => (n === 9 ? ['docs/handoff/cuscare.md'] : []),
  };
  assert.equal(avisarLedgers({ mios: ['docs/handoff/cuscare.md'], rama: 'mi', cliente: conCruce, escribir }), true);
  assert.equal(escritos.length, 1);
  assert.match(escritos[0], /#9/);
});

test('avisarLedgers: si tu rama no toca ningún ledger, no pregunta nada a la red', () => {
  let llamadas = 0;
  const cuenta = {
    prsAbiertos: () => {
      llamadas++;
      return [];
    },
    ficherosDePr: () => {
      llamadas++;
      return [];
    },
  };
  assert.equal(avisarLedgers({ mios: ['projects/a.ts'], rama: 'mi', cliente: cuenta, escribir: () => {} }), false);
  assert.equal(llamadas, 0);
});

// El 2026-10-05, tres PR abiertos usaron DD-172 a la vez (#340, #341 y #342): el número se elige mirando `main`, y los
// PR abiertos no se miraban. El preflight los mira ahora, avisa sin bloquear y propone el siguiente libre (DD-175).
const PARCHE = '@@ -1,3 +1,9 @@\n # Decisiones\n+\n+## DD-173 · 2026-10-05 — Sin saltos\n+texto\n+## DD-172 · 2026-10-05 — Tipificaciones\n ## DD-171 · vieja\n-## DD-9 · quitada';

test('ddsAnadidas: solo los `## DD-N` que el parche AÑADE', () => {
  assert.deepEqual(ddsAnadidas(PARCHE), [173, 172]);
  assert.deepEqual(ddsAnadidas(''), []);
});

test('ddsDePr: los DD que añade el docs/DECISIONS.md de un PR, por su parche', () => {
  const { gh } = ghFalso([['pulls/340/files', [{ filename: 'projects/a.ts', patch: '+## DD-999 · no cuenta' }, { filename: 'docs/DECISIONS.md', patch: PARCHE }]]]);
  assert.deepEqual(cliente({ gh, git }).ddsDePr(340), [173, 172]);
});

test('choqueDeDds: nombra el PR con el que chocas y propone el mayor de main y de los PR, más uno', () => {
  const prs = [
    { number: 340, headRefName: 'tipificaciones', dds: [172, 173, 174] },
    { number: 341, headRefName: 'fichas', dds: [172] },
    { number: 1, headRefName: 'mi-rama', dds: [172] },
  ];
  assert.deepEqual(choqueDeDds({ mias: [172], maxMain: 172, prs, rama: 'mi-rama' }), {
    choques: [{ dd: 172, prs: [340, 341] }],
    siguiente: 175,
  });
  assert.equal(choqueDeDds({ mias: [175], maxMain: 172, prs, rama: 'mi-rama' }), null);
  assert.equal(choqueDeDds({ mias: [], maxMain: 172, prs, rama: 'mi-rama' }), null);
});

test('avisarDds: con choque escribe una vez, sin bloquear; sin red calla', () => {
  const escritos = [];
  const escribir = (t) => escritos.push(t);
  const falso = {
    prsAbiertos: () => [{ number: 340, headRefName: 'tipificaciones' }],
    ddsDePr: () => [172, 173, 174],
  };
  assert.equal(avisarDds({ mias: [173], maxMain: 172, rama: 'mi', cliente: falso, escribir }), true);
  assert.equal(escritos.length, 1);
  assert.match(escritos[0], /DD-173/);
  assert.match(escritos[0], /#340/);
  assert.match(escritos[0], /DD-175/);
  assert.match(escritos[0], /NO bloquea/);

  const sinRed = { prsAbiertos() { throw new Error('sin red'); }, ddsDePr() { throw new Error('sin red'); } };
  assert.equal(avisarDds({ mias: [173], maxMain: 172, rama: 'mi', cliente: sinRed, escribir }), false);
  assert.equal(escritos.length, 1);

  // Sin DD propia no pregunta nada a la red.
  let llamadas = 0;
  const cuenta = { prsAbiertos: () => (llamadas++, []), ddsDePr: () => (llamadas++, []) };
  assert.equal(avisarDds({ mias: [], maxMain: 172, rama: 'mi', cliente: cuenta, escribir }), false);
  assert.equal(llamadas, 0);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUsageStatus, crossCheckAgainstAudit } from '../usage-status.mjs';

// buildUsageStatus / crossCheckAgainstAudit: PURAS → fixtures directos.

// 3 pantallas, set DS = {sc-a, sc-b, sc-cmd}. sc-cmd está en las 3 (→ global);
// sc-xx no es DS (debe filtrarse); sc-a en 2 pantallas, sc-b en 1.
const RAW = {
  capturedAt: '2026-06-18',
  viewport: '1440x900',
  theme: 'light',
  screens: [
    { id: 's1', route: 'r1', label: 'P1', shots: ['s1.png'], tags: ['sc-a', 'sc-cmd', 'sc-xx'] },
    { id: 's2', route: 'r2', label: 'P2', shots: ['s2.png'], tags: ['sc-a', 'sc-cmd'] },
    { id: 's3', route: 'r3', label: 'P3', shots: ['s3.png'], tags: ['sc-b', 'sc-cmd'] },
  ],
};
// La pokédex (audit.components): selector + usos en Supervisor.
const AUDIT = [
  { selector: 'sc-a', usedInSupervisor: 4 },
  { selector: 'sc-b', usedInSupervisor: 1 },
  { selector: 'sc-cmd', usedInSupervisor: 9 },
];

test('intersecta con los selectores DS (descarta app-locals como sc-xx)', () => {
  const status = buildUsageStatus(RAW, AUDIT);
  const s1 = status.screens.find((s) => s.id === 's1');
  assert.deepEqual(s1.ds, ['sc-a', 'sc-cmd']); // sc-xx fuera (no es DS)
  assert.equal(status.dsSelectors, 3);
});

test('detecta el global (presente en todas) y lo EXCLUYE del índice inverso', () => {
  const status = buildUsageStatus(RAW, AUDIT);
  assert.deepEqual(status.global, ['sc-cmd']);
  assert.equal(status.components['sc-cmd'], undefined); // global no se lista por pantalla
  assert.deepEqual(status.components['sc-a'], ['s1', 's2']);
  assert.deepEqual(status.components['sc-b'], ['s3']);
});

test('el índice inverso está ordenado y sin duplicados', () => {
  const dup = { ...RAW, screens: [{ id: 's1', route: 'r', label: 'P', shots: [], tags: ['sc-a', 'sc-a'] }, ...RAW.screens.slice(1)] };
  const status = buildUsageStatus(dup, AUDIT);
  assert.deepEqual(status.components['sc-a'], ['s1', 's2']); // s1 una vez
});

test('gated: usado en la pokédex pero en 0 pantallas → entra en status.gated', () => {
  const status = buildUsageStatus(RAW, [...AUDIT, { selector: 'sc-z', usedInSupervisor: 7 }]);
  assert.deepEqual(status.gated, [{ selector: 'sc-z', usedInSupervisor: 7 }]);
});

test('cross-check: usado en la pokédex pero en 0 pantallas → ⚠', () => {
  const status = buildUsageStatus(RAW, [...AUDIT, { selector: 'sc-z', usedInSupervisor: 7 }]);
  const warns = crossCheckAgainstAudit(status, [
    { selector: 'sc-a', usedInSupervisor: 4 }, // visto → sin warn
    { selector: 'sc-z', usedInSupervisor: 7 }, // usado pero nunca en pantalla → warn
  ]);
  assert.equal(warns.length, 1);
  assert.match(warns[0], /sc-z/);
});

test('cross-check inverso: visto en pantalla pero la pokédex cuenta 0 → ⚠', () => {
  const status = buildUsageStatus(RAW, AUDIT);
  const warns = crossCheckAgainstAudit(status, [{ selector: 'sc-b', usedInSupervisor: 0 }]);
  assert.equal(warns.length, 1);
  assert.match(warns[0], /sc-b/);
  assert.match(warns[0], /0 usos/);
});

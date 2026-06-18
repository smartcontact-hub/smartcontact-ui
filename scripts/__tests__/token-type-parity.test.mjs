import { test } from 'node:test';
import assert from 'node:assert/strict';
import { typographyDrift, codePx } from '../token-type-parity.mjs';

// Test de DOBLE CARA del gate de tipografía. Fixtures: [{ token, exp(px) }] + un resolvedor token→px.

test('CARA VERDE · font-size + line-height 1:1 → sin drift', () => {
  const list = [
    { token: 'sc-font-size-300', exp: 16 },
    { token: 'sc-line-height-100', exp: 18 },
  ];
  const px = (t) => ({ 'sc-font-size-300': 16, 'sc-line-height-100': 18 })[t];
  assert.deepEqual(typographyDrift(list, px), []);
});

test('CARA ROJA · line-height drifteado → lo caza (lo que ANTES se escapaba)', () => {
  const d = typographyDrift([{ token: 'sc-line-height-100', exp: 18 }], () => 20);
  assert.equal(d.length, 1);
  assert.deepEqual({ token: d[0].token, exp: d[0].exp, got: d[0].got }, { token: 'sc-line-height-100', exp: 18, got: 20 });
});

test('CARA ROJA · token de tipografía AUSENTE en código → drift', () => {
  const d = typographyDrift([{ token: 'sc-font-size-300', exp: 16 }], () => undefined);
  assert.equal(d.length, 1);
  assert.equal(d[0].got, 'AUSENTE');
});

test('codePx resuelve calc(N/16*1rem), rem y px', () => {
  assert.equal(codePx('--sc-a: calc(16 / 16 * 1rem);', 'sc-a'), 16);
  assert.equal(codePx('--sc-b: 1.125rem;', 'sc-b'), 18);
  assert.equal(codePx('--sc-c: 24px;', 'sc-c'), 24);
  assert.equal(codePx('--sc-d: 18;', 'sc-d'), 18); // line-height unitless
  assert.equal(codePx('whatever', 'sc-missing'), undefined);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonShadow, pickToken, shadowConHex } from '../effects-rewire.mjs';

// effects-rewire: la canonización compara el shadow del preset (design-rem) con el token (px).

test('canonShadow · design-rem del preset → px (×14) — iguala al token en px', () => {
  // 0.071429rem (design) × 14 = 1px · 0.142857rem × 14 = 2px → mismo canon que "0 1px 2px 0 #1212170d".
  assert.equal(canonShadow('0 0.071429rem 0.142857rem 0 #1212170d'), '0 1 2 0 #1212170d');
  assert.equal(canonShadow('0 1px 2px 0 #1212170d'), '0 1 2 0 #1212170d');
});

test('canonShadow · multicapa con spreads negativos → comparable', () => {
  assert.equal(
    canonShadow('0 0.142857rem 0.285714rem -0.142857rem #0000001a, 0 0.285714rem 0.428571rem -0.071429rem #0000001a'),
    '0 2 4 -2 #0000001a, 0 4 6 -1 #0000001a',
  );
});

test('canonShadow · none y color en mayúsculas', () => {
  assert.equal(canonShadow('none'), 'none');
  assert.equal(canonShadow('0 1px 2px 0 #1212170D'), '0 1 2 0 #1212170d');
});

test('pickToken · prioriza el token del propio componente sobre otro con el mismo valor', () => {
  const tokens = new Map([
    ['sc-cmp-inputtext-shadow', '0 1 2 0 #1212170d'],
    ['sc-cmp-checkbox-shadow', '0 1 2 0 #1212170d'],
  ]);
  assert.equal(pickToken('inputtext', '0 1 2 0 #1212170d', tokens), 'sc-cmp-inputtext-shadow');
  assert.equal(pickToken('checkbox', '0 1 2 0 #1212170d', tokens), 'sc-cmp-checkbox-shadow');
});

test('pickToken · sin token de su componente → cae al primero con ese valor (value-equal igual)', () => {
  const tokens = new Map([['sc-cmp-menu-shadow', '0 2 4 -2 #0000001a']]);
  assert.equal(pickToken('popover', '0 2 4 -2 #0000001a', tokens), 'sc-cmp-menu-shadow');
});

test('pickToken · valor fuera del Kit → null (no se repunta)', () => {
  assert.equal(pickToken('x', '0 9 9 9 #abcdef', new Map([['sc-cmp-a-shadow', '0 1 2 0 #fff']])), null);
});

test('shadowConHex · ve también las claves camelCase (raisedShadow, checkedShadow, insetShadow), no solo `shadow`', () => {
  assert.deepEqual(shadowConHex('        shadow: "0 1px 2px 0 #1212170d",'), { key: 'shadow', raw: '0 1px 2px 0 #1212170d' });
  assert.deepEqual(shadowConHex('        raisedShadow: "0 0.071429rem 0.357143rem 0 #0000001f",'), { key: 'raisedShadow', raw: '0 0.071429rem 0.357143rem 0 #0000001f' });
  assert.equal(shadowConHex('            insetShadow: "0 0.071429rem 0.071429rem 0 #0000001f, 0 0.071429rem 0 0 #0000000f",')?.key, 'insetShadow');
  assert.equal(shadowConHex('        checkedShadow: "0 0.071429rem 0.142857rem 0 #0000000a",')?.key, 'checkedShadow');
});

test('shadowConHex · ignora none y var(): ya leen un token', () => {
  assert.equal(shadowConHex('        shadow: "none",'), null);
  assert.equal(shadowConHex('        raisedShadow: "var(--sc-cmp-button-raised-shadow)",'), null);
});

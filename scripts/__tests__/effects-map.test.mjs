import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shadowToCss, splitAlpha, tokenName } from '../effects-map.mjs';

// effects-map: la conversión sombra(Kit) → box-shadow CSS. PURA → fixtures directos.

test('splitAlpha · #rrggbb (opaco) y #rrggbbaa (con alfa)', () => {
  assert.deepEqual(splitAlpha('#1212170d'), { base: '#121217', alpha: 13 });
  assert.deepEqual(splitAlpha('#0000001a'), { base: '#000000', alpha: 26 });
  assert.deepEqual(splitAlpha('#abcdef'), { base: '#abcdef', alpha: 255 });
});

test('shadowToCss · una capa con alfa → px literal + #rrggbbaa', () => {
  const css = shadowToCss({ x: '0', y: '1', blur: '2', spread: '0', color: '#1212170d' });
  assert.equal(css, '0 1px 2px 0 #1212170d');
});

test('shadowToCss · multicapa (array) → capas separadas por coma, spreads negativos', () => {
  const css = shadowToCss([
    { x: '0', y: '2', blur: '4', spread: '-2', color: '#0000001a' },
    { x: '0', y: '4', blur: '6', spread: '-1', color: '#0000001a' },
  ]);
  assert.equal(css, '0 2px 4px -2px #0000001a, 0 4px 6px -1px #0000001a');
});

test('shadowToCss · alfa 255 → #rrggbb (sin sufijo)', () => {
  assert.equal(shadowToCss({ x: '0', y: '0', blur: '10', spread: '50', color: '#ffffffff' }), '0 0 10px 50px #ffffff');
});

test('shadowToCss · sombra TODA transparente (#…00) → null (no se emite, foco por outline)', () => {
  assert.equal(shadowToCss({ x: '0', y: '0', blur: '0', spread: '0', color: '#00000000' }), null);
});

test('shadowToCss · capa transparente dentro de multicapa → se descarta esa capa', () => {
  const css = shadowToCss([
    { x: '0', y: '0', blur: '0', spread: '0', color: '#00000000' },
    { x: '0', y: '1', blur: '2', spread: '0', color: '#1212170d' },
  ]);
  assert.equal(css, '0 1px 2px 0 #1212170d');
});

test('tokenName · ruta de effects → sc-cmp-<kebab>', () => {
  assert.equal(tokenName('button.raised.shadow'), 'sc-cmp-button-raised-shadow');
  assert.equal(tokenName('toast.info.shadow'), 'sc-cmp-toast-info-shadow');
});

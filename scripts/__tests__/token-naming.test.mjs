/**
 * Unit tests de la "ley v/14" — las funciones puras que derivan nombre y rem de cada
 * token desde su valor px de diseño. Corre con el runner nativo: `node --test`.
 * Si alguno falla, el generador produciría nombres/valores distintos → drift de tokens.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scaleSuffix, toRem, dropAlpha } from '../token-naming.mjs';

test('scaleSuffix — nombre = |v|/14 con "." → "-"', () => {
  assert.equal(scaleSuffix(14), '1'); // la base
  assert.equal(scaleSuffix(5.25), '0-375'); // 5.25/14 = 0.375
  assert.equal(scaleSuffix(7), '0-5');
  assert.equal(scaleSuffix(0), '0');
  assert.equal(scaleSuffix(16), '1-143'); // 16/14 = 1.142857 → toFixed(3)
});

test('scaleSuffix — negativos llevan prefijo "neg-"', () => {
  assert.equal(scaleSuffix(-7), 'neg-0-5');
  assert.equal(scaleSuffix(-14), 'neg-1');
});

test('toRem — px de diseño → rem root-16 (división exacta de la escala 14-base)', () => {
  assert.equal(toRem(14), '0.875rem'); // 14/16
  assert.equal(toRem(16), '1rem');
  assert.equal(toRem(5.25), '0.328125rem'); // 5.25/16, exacto
  assert.equal(toRem(0), '0'); // reset, no lleva unidad
});

test('dropAlpha — #RRGGBBff (opaco) → #RRGGBB; el resto intacto', () => {
  assert.equal(dropAlpha('#18181bff'), '#18181b'); // zinc.900 opaco
  assert.equal(dropAlpha('#18181b'), '#18181b'); // ya de 6 dígitos
  assert.equal(dropAlpha('#34d3993d'), '#34d3993d'); // alfa real (3d) → no se toca
});

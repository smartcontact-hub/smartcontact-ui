/**
 * Unit tests de la "ley v/14" — las funciones puras que derivan nombre y rem de cada
 * token desde su valor px de diseño. Corre con el runner nativo: `node --test`.
 * Si alguno falla, el generador produciría nombres/valores distintos → drift de tokens.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scaleSuffix, scaleNameFromKey, toRem, dropAlpha } from '../token-naming.mjs';

test('scaleSuffix — nombre = |v|/14 con "." → "-"', () => {
  assert.equal(scaleSuffix(14), '1'); // la base
  assert.equal(scaleSuffix(5.25), '0-375'); // 5.25/14 = 0.375
  assert.equal(scaleSuffix(7), '0-5');
  assert.equal(scaleSuffix(0), '0');
  assert.equal(scaleSuffix(16), '1-143'); // 16/14 = 1.142857 → toFixed(3)
});

test('scaleNameFromKey — el nombre sale de la CLAVE del export, no del valor (DD-89)', () => {
  assert.equal(scaleNameFromKey('scale.0-375'), '0-375');
  assert.equal(scaleNameFromKey('scale.1'), '1');
  assert.equal(scaleNameFromKey('scale.1-143'), '1-143');
  assert.equal(scaleNameFromKey('scale.neg-0-5'), 'neg-0-5');
  // Una clave que no tiene forma de paso falla ruidoso en vez de inventar un nombre.
  assert.throws(() => scaleNameFromKey('scale.0.375'));
  assert.throws(() => scaleNameFromKey('radius.md'));
});

test('scaleNameFromKey y scaleSuffix coinciden mientras la escala valga rem×14', () => {
  // Si un paso deja de valer rem×14 (p. ej. 6px en scale.0-375), el nombre se mantiene por clave
  // y scaleSuffix solo sirve para avisar: daría otro nombre.
  assert.equal(scaleSuffix(5.25), scaleNameFromKey('scale.0-375'));
  assert.notEqual(scaleSuffix(6), scaleNameFromKey('scale.0-375'));
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

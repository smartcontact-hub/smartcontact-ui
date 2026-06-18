import { test } from 'node:test';
import assert from 'node:assert/strict';
import { primitiveDrift, isPrimitiveDiverge, PRIMITIVE_SOURCE } from '../palette-map.mjs';

// El chivato §7 = `primitiveDrift`. Test de DOBLE CARA: fixture que NO fluye → ROJO (drift),
// fixture que fluye o es divergencia consciente → VERDE (sin drift). Fixtures = { fam: { step: hex } }.

test('CARA VERDE · 1:1 perfecto → sin drift', () => {
  assert.deepEqual(primitiveDrift({ blue: { 500: '#344a70' } }, { blue: { 500: '#344a70' } }), []);
});

test('CARA ROJA · desfase MUDO no documentado → drift', () => {
  const d = primitiveDrift({ blue: { 500: '#000000' } }, { blue: { 500: '#344a70' } });
  assert.equal(d.length, 1);
  assert.deepEqual(
    { family: d[0].family, src: d[0].src, dsHex: d[0].dsHex, exHex: d[0].exHex },
    { family: 'blue', src: 'blue', dsHex: '#000000', exHex: '#344a70' },
  );
});

test('CARA VERDE · divergencia consciente green-950 (step exacto) NO es drift', () => {
  // 500 igual, 950 difiere a propósito (green-950 de marca) → excluido
  assert.deepEqual(
    primitiveDrift({ green: { 500: '#22c55e', 950: '#0a2916' } }, { green: { 500: '#22c55e', 950: '#052e16' } }),
    [],
  );
});

test('CARA VERDE · soft-blue.* (familia entera) cubierta → su drift no rompe (pendiente auditoría)', () => {
  assert.deepEqual(primitiveDrift({ 'soft-blue': { 50: '#effbfc' } }, { cyan: { 50: '#eefbfc' } }), []);
});

test('familia sin fuente (azure) → ignorada (no es drift; se informa aparte)', () => {
  assert.deepEqual(primitiveDrift({ azure: { 500: '#3b82f6' } }, {}), []);
});

test('isPrimitiveDiverge: step exacto (green.950) vs familia entera (soft-blue.)', () => {
  assert.ok(isPrimitiveDiverge('green', '950'));
  assert.ok(!isPrimitiveDiverge('green', '500'));
  assert.ok(isPrimitiveDiverge('soft-blue', '50'));
  assert.ok(isPrimitiveDiverge('soft-blue', '900'));
});

test('el mapa codifica los renombres clave (sky→electric-blue, cyan→soft-blue, slate→gray)', () => {
  assert.equal(PRIMITIVE_SOURCE['electric-blue'], 'sky');
  assert.equal(PRIMITIVE_SOURCE['soft-blue'], 'cyan');
  assert.equal(PRIMITIVE_SOURCE['gray'], 'slate');
  assert.equal(PRIMITIVE_SOURCE['blue'], 'blue');
});

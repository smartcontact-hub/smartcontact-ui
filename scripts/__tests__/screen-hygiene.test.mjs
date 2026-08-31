import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  contarEmojis,
  contarImgSinDims,
  chequearTrinquete,
} from '../audit-screen-hygiene.mjs';

// contarEmojis: cuenta SOLO emoji astral pictográfico (+FE0F) en texto renderizable.
// El valor del gate está en los ejes de EXCLUSIÓN: si marcara flechas, checks o
// comentarios daría cientos de falsos positivos y se volvería ruido (LEARNINGS #2).

test('emoji astral en plantilla → cuenta', () => {
  assert.equal(contarEmojis('<div>🎉 nuevo</div>', true), 1);
});

test('EXCLUYE flechas y signos BMP (→ ✓ ⚠ ★) — son tipografía, no emoji', () => {
  assert.equal(contarEmojis('<span>A → B ✓ ⚠ ★ ↑ ↓</span>', true), 0);
});

test('EXCLUYE emoji en comentario HTML', () => {
  assert.equal(contarEmojis('<!-- 🎉 nota --><div>ok</div>', true), 0);
});

test('EXCLUYE emoji en comentario TS (línea y bloque)', () => {
  assert.equal(contarEmojis('// 🎭 demo\n/* 🚀 */ const x = 1;', false), 0);
});

test('emoji en string de código TS (dato renderizado) → cuenta', () => {
  assert.equal(contarEmojis("const flag = '🇪🇸';", false), 2); // regional indicators = 2 codepoints
});

test('secuencia de presentación emoji (⏸️ = base + FE0F) → cuenta el FE0F', () => {
  assert.equal(contarEmojis('<span>⏸️</span>', true), 1);
});

// contarImgSinDims: reserva de hueco. OK si hay width+height, aspect-ratio, o bindings.

test('img sin dimensiones → 1', () => {
  assert.equal(contarImgSinDims('<img src="a.png">'), 1);
});

test('img con width+height → 0', () => {
  assert.equal(contarImgSinDims('<img src="a.png" width="10" height="10">'), 0);
});

test('img con aspect-ratio (en style) → 0', () => {
  assert.equal(contarImgSinDims('<img src="a.png" style="aspect-ratio: 1/1">'), 0);
});

test('img con bindings [style.width]+[style.height] → 0', () => {
  assert.equal(contarImgSinDims('<img [src]="s" [style.width]="w" [style.height]="h">'), 0);
});

test('iframe sin dimensiones → 1; con width+height → 0', () => {
  assert.equal(contarImgSinDims('<iframe src="x"></iframe>'), 1);
  assert.equal(contarImgSinDims('<iframe src="x" width="1" height="1"></iframe>'), 0);
});

test('img multilínea sin dims → 1 (el tag cruza saltos de línea)', () => {
  assert.equal(contarImgSinDims('<img\n  class="x"\n  src="a.png"\n/>'), 1);
});

// chequearTrinquete: ratchet bidireccional. Verde solo cuando cuadra EXACTO.

test('trinquete: actual == congelado → sin problemas', () => {
  assert.deepEqual(chequearTrinquete({ 'a.ts': 2 }, { 'a.ts': 2 }, 'x', 'fix'), []);
});

test('trinquete CARA ROJA: fichero nuevo (actual > congelado)', () => {
  const p = chequearTrinquete({ 'nuevo.ts': 1 }, {}, 'emoji', 'fix');
  assert.equal(p.length, 1);
  assert.match(p[0][0], /Nuevo\(s\) incumplimiento/);
});

test('trinquete: bajó (actual < congelado) → pide actualizar el número', () => {
  const p = chequearTrinquete({ 'a.ts': 1 }, { 'a.ts': 3 }, 'emoji', 'fix');
  assert.equal(p.length, 1);
  assert.match(p[0][1], /actualiza el número/);
});

test('trinquete: entrada muerta (congelado sin actual) → pide quitarla', () => {
  const p = chequearTrinquete({}, { 'viejo.ts': 2 }, 'emoji', 'fix');
  assert.equal(p.length, 1);
  assert.match(p[0][0], /ya no hay ninguno/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  contarEmojis,
  contarImgSinDims,
  chequearTrinquete,
  desplegablesSinNombre,
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

// desplegablesSinNombre (DD-133): cada `sc-select` y `sc-multiselect` lleva un nombre que llega a su combobox. Sin él,
// PrimeNG lo nombra con la opción elegida y el lector oye «Automático» donde dice «Descuelgue de llamadas».

test('desplegable sin nombre → su línea', () => {
  assert.deepEqual(desplegablesSinNombre('<div>\n  <sc-select [options]="o" />\n</div>', true), [2]);
  assert.deepEqual(desplegablesSinNombre('<sc-multiselect [options]="o" />', true), [1]);
});

test('label, ariaLabel o ariaLabelledBy, con o sin binding → nombrado', () => {
  for (const a of [
    'label="Cola"',
    "[label]=\"'k' | translate\"",
    'ariaLabel="Cola"',
    "[ariaLabel]=\"'k' | translate\"",
    'ariaLabelledBy="cola-label"',
    "[ariaLabelledBy]=\"'cola-label'\"",
  ]) {
    assert.deepEqual(desplegablesSinNombre(`<sc-select ${a} [options]="o" />`, true), [], a);
  }
});

test('NO nombran: optionLabel, iftaLabel sin label ni un aria-label en el host', () => {
  assert.deepEqual(desplegablesSinNombre('<sc-select optionLabel="label" iftaLabel aria-label="Cola" />', true), [1]);
});

test('un <label for> nombra un multiselect (su combobox es un input) y NO un select (es un span)', () => {
  const con = (etiqueta) => `<label for="cola">Cola</label>\n<${etiqueta} inputId="cola" />`;
  assert.deepEqual(desplegablesSinNombre(con('sc-multiselect'), true), []);
  assert.deepEqual(desplegablesSinNombre(con('sc-select'), true), [2]);
  // El id literal en un binding cuenta igual; un <label for> que apunta a otro id, no.
  assert.deepEqual(desplegablesSinNombre(`<label for="cola">Cola</label><sc-multiselect [inputId]="'cola'" />`, true), []);
  assert.deepEqual(desplegablesSinNombre('<label for="otra">Cola</label><sc-multiselect inputId="cola" />', true), [1]);
});

test('un > dentro de un atributo (flecha, comparación) no cierra la etiqueta', () => {
  const html = '<sc-select (valueChange)="ok = $event > 0" [options]="o.filter((a) => a)" ariaLabel="Cola" />';
  assert.deepEqual(desplegablesSinNombre(html, true), []);
});

test('EXCLUYE los desplegables de un comentario, en HTML y en TS, sin mover la línea de los demás', () => {
  assert.deepEqual(desplegablesSinNombre('<!-- <sc-select> -->\n<sc-select />', true), [2]);
  assert.deepEqual(desplegablesSinNombre('/**\n * Adapter para `<sc-select>`\n */\nconst t = `<sc-select />`;', false), [4]);
  assert.deepEqual(desplegablesSinNombre('// un <sc-multiselect> de ejemplo\nconst x = 1;', false), []);
});

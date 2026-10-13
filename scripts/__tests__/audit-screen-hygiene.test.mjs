import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  contarToasts,
  contarEmojis,
  contarImgSinDims,
  chequearTrinquete,
  desplegablesSinNombre,
  guionesSueltos,
  ayudasEncima,
  acusaDePrimeras,
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

// DD-191: un toast se cuenta por su llamada, no por un comentario que la nombre.
test('contarToasts cuenta las llamadas y no los comentarios', () => {
  const src = "// this.messages.add({ ... }) en un comentario\nthis.messages.add({ severity: 'success' });\n/* this.messages.add( */\nthis.messages.add({ severity: 'error' });";
  assert.equal(contarToasts(src), 2);
  assert.equal(contarToasts('this.resultado.visto(texto);'), 0);
});

// DD-197: una celda sin dato es `<sc-celda-vacia>`; un «—» de contenido escrito a mano, el lector lo lee «guion».
test('guionesSueltos caza el «—» de contenido y el de respaldo, y no el de un comentario ni el de un texto', () => {
  assert.deepEqual(guionesSueltos('<span class="cell">—</span>'), [1]);
  assert.deepEqual(guionesSueltos("<span>\n{{ user.identifier || '—' }}</span>"), [2]);
  assert.deepEqual(guionesSueltos("{{ entity.format ?? '—' }}\n{{ a ? b : '—' }}"), [1, 2]);
  assert.deepEqual(guionesSueltos('<!-- un guion «—» si no hay canal -->\n<sc-celda-vacia />'), []);
  assert.deepEqual(guionesSueltos('<span [attr.aria-label]="nombre + \' — \' + canal">x</span>'), []);
  assert.deepEqual(guionesSueltos('<p>De 9 — 14 h</p>'), []);
});

// DD-198: la ayuda de un campo va debajo de su control; escrita entre el rótulo y un control suelto, se marca.
test('ayudasEncima marca la ayuda justo antes de un control suelto, y no la de debajo ni la de una lista', () => {
  assert.deepEqual(ayudasEncima('<span class="field__label">X</span>\n<p class="field__help sc-text-caption-regular">Ayuda</p>\n<sc-selectbutton />'), [2]);
  assert.deepEqual(ayudasEncima('<sc-textarea />\n<p class="field__help">Ayuda</p>\n<sc-button />'), []);
  assert.deepEqual(ayudasEncima('<p class="field__help">Ayuda</p>\n<div class="periodic-list" role="group"></div>'), []);
  // No salta de una ayuda que no precede a nada a otra que sí: marca solo la segunda, en su línea.
  assert.deepEqual(ayudasEncima('<p class="field__help">A</p>\n<div></div>\n<p class="field__help">B</p>\n<sc-select />'), [3]);
  assert.deepEqual(ayudasEncima('<!-- <p class="field__help">A</p><sc-select /> -->'), []);
});

test('acusaDePrimeras marca el aviso que se enciende por el modo o lee las dejadas, y no canSave ni un comentario', () => {
  // Los dos de la ficha de grupo que acusaban al encender «Tipificar» o al quitar canales (DD-199).
  assert.deepEqual(acusaDePrimeras("() => this.typificationMissing() && (this.mode() === 'edit' || this.attemptedGeneral()),"), [1]);
  assert.deepEqual(acusaDePrimeras("x\nconst acusa = (id: string) => this.mode() !== 'create' || this.alta.dejadas().has(id);"), [2]);
  assert.deepEqual(acusaDePrimeras('if (this.alta.dejadas().has(GENERAL)) out.add(GENERAL);'), [1]);
  // Mirar el modo sin acusar: guardar en el alta sin cambios, el resumen.
  assert.deepEqual(acusaDePrimeras("canSave = computed(() => !this.blockedReason() && (this.mode() === 'create' || this.formDirty()));"), []);
  assert.deepEqual(acusaDePrimeras("if (this.mode() !== 'edit') return new Set();"), []);
  // La que pasa por `ocasionDeAvisar`.
  assert.deepEqual(acusaDePrimeras("this.form().channels.size === 0 && this.ocasion.acusa('group-section-general', 'channels')"), []);
  // Un comentario que lo cuenta no es código, y las líneas no se descuadran.
  assert.deepEqual(acusaDePrimeras("/* antes: mode() === 'edit' || attemptedGeneral()\n */\nconst a = this.alta.dejadas();"), [3]);
});

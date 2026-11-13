import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PLANTILLA_EN_LINEA, revisarTooltips, textoDelTooltip } from '../audit-tooltips.mjs';

// El valor del gate también está en lo que NO marca: la posición ligada, los puntos suspensivos, el texto que depende de
// una expresión y lo que no está en la barra (LEARNINGS #2).

const PANTALLA = 'projects/supervisor/src/app/features/x/x-page.component.html';
const reglas = (plantilla, ctx = {}) => revisarTooltips(plantilla, { ruta: PANTALLA, ...ctx }).map(([, regla]) => regla);

test('ROJO T1: un pTooltip sin tooltipPosition', () => {
  assert.deepEqual(reglas('<span pTooltip="Transcribe">x</span>'), ['T1']);
  assert.deepEqual(reglas('<sc-icon name="info" [pTooltip]="ayuda()" />'), ['T1']);
});

test('VERDE T1: con la posición declarada, fija o ligada', () => {
  assert.deepEqual(reglas('<span pTooltip="Transcribe" tooltipPosition="top">x</span>'), []);
  assert.deepEqual(reglas('<span [pTooltip]="t()" [tooltipPosition]="lado()">x</span>'), []);
});

test('ROJO T2: tooltipPosition="left"', () => {
  assert.deepEqual(reglas('<span pTooltip="Transcribe" tooltipPosition="left">x</span>'), ['T2']);
});

test('ROJO T3: en la barra, un tooltip que no va abajo; dentro de #topbarActions y en el componente de la barra', () => {
  const guardar = '<ng-template #topbarActions><sc-button label="Guardar" [disabled]="true" [pTooltip]="motivo()" tooltipPosition="top" /></ng-template>';
  assert.deepEqual(reglas(guardar), ['T3']);
  assert.deepEqual(reglas('<button pTooltip="Ir al dashboard" tooltipPosition="top">x</button>', { ruta: 'projects/supervisor/src/app/core/layout/top-bar/top-bar.component.html' }), ['T3']);
});

test('ROJO T3: un sc-button de solo icono en #topbarActions sin su pTooltip', () => {
  assert.deepEqual(reglas('<ng-template #topbarActions><sc-button icon="more_vert" ariaLabel="Más acciones" /></ng-template>'), ['T3']);
});

test('VERDE T3: abajo en la barra; arriba fuera de ella; un botón con texto en la barra', () => {
  assert.deepEqual(reglas('<ng-template #topbarActions><sc-button label="Guardar" [pTooltip]="motivo()" tooltipPosition="bottom" /></ng-template>'), []);
  assert.deepEqual(reglas('<ng-template #otra><sc-button label="Guardar" [pTooltip]="motivo()" tooltipPosition="top" /></ng-template>'), []);
  assert.deepEqual(reglas('<ng-template #topbarActions><sc-button label="Cancelar" variant="secondary" /></ng-template>'), []);
});

test('ROJO T4: un texto con punto final, literal o por su clave', () => {
  assert.deepEqual(reglas('<span pTooltip="Simula una pantalla estrecha." tooltipPosition="top">x</span>'), ['T4']);
  const tr = (c) => ({ 'x.ayuda': 'Debe atender un canal. Desmarca Asignado.' })[c] ?? c;
  assert.deepEqual(reglas(`<span [pTooltip]="'x.ayuda' | translate" tooltipPosition="top">x</span>`, { tr }), ['T4']);
});

test('VERDE T4: sin punto, con puntos suspensivos, o un texto que depende de una expresión', () => {
  assert.deepEqual(reglas('<span pTooltip="Transcribe" tooltipPosition="top">x</span>'), []);
  assert.deepEqual(reglas('<span pTooltip="Cargando..." tooltipPosition="top">x</span>'), []);
  assert.deepEqual(reglas('<span [pTooltip]="motivo()" tooltipPosition="top">x</span>'), []);
  assert.equal(textoDelTooltip({ '[pTooltip]': "'no.existe' | translate" }, (c) => c), null);
});

test('VERDE: los comentarios no cuentan', () => {
  assert.deepEqual(reglas('<!-- <span pTooltip="Viejo." tooltipPosition="left">x</span> -->'), []);
});

test('la plantilla en línea se lee entera aunque lleve comillas invertidas escapadas', () => {
  const ts = "@Component({\n  template: `\n    <!-- el orden lo pone \\`filas\\` -->\n    <span [pTooltip]=\"row.name\">x</span>\n  `,\n})";
  const [m] = [...ts.matchAll(PLANTILLA_EN_LINEA)];
  assert.ok(m[1].includes('pTooltip'), 'cortaba en la primera comilla escapada y no veía lo de después');
  assert.deepEqual(revisarTooltips(m[1], { ruta: 'projects/supervisor/src/app/x.ts' }).map(([, r]) => r), ['T1']);
});

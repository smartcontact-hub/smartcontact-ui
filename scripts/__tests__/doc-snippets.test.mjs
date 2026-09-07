import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ATRIBUTO_GENERICO,
  PENDIENTES,
  apiDeComponentes,
  revisarSnippet,
  snippetsDe,
  usosDe,
} from '../audit-doc-snippets.mjs';

/*
 * El riesgo de este gate no es dejar pasar algo: es CHILLAR de más. Se escribió después de medir
 * que exigir snippet == plantilla daría 40 falsos positivos de 71 pares, así que los ejes de
 * exclusión (atributos genéricos, el `xChange` de un `model`) se prueban antes que la detección,
 * y el caso verde se mide sobre el corpus REAL entero, no sobre un fixture amable.
 */

const COMPONENTES = execSync(
  "find projects/ui-smartcontact/src/lib/components -name '*.component.ts'",
  { encoding: 'utf8' },
)
  .split('\n')
  .filter(Boolean);
const API = apiDeComponentes(COMPONENTES);

/* ── apiDeComponentes ─────────────────────────────────────────────────────── */

test('lee inputs, models y outputs de un componente', () => {
  const api = apiDeComponentes(['x.ts'], () => `
    @Component({ selector: 'sc-cosa' })
    export class X {
      readonly label = input<string>('');
      readonly clicked = output<void>();
    }`);
  assert.deepEqual([...api['sc-cosa']].sort(), ['clicked', 'label']);
});

test('un model() publica ADEMÁS su xChange (sin esto, 3 falsos positivos reales)', () => {
  const api = apiDeComponentes(['x.ts'], () => `
    @Component({ selector: 'sc-cosa' })
    export class X { readonly selection = model<string>(); }`);
  assert.deepEqual([...api['sc-cosa']].sort(), ['selection', 'selectionChange']);
});

test('la API real trae los componentes del DS y sus props', () => {
  assert.ok(Object.keys(API).length >= 40, `solo leí ${Object.keys(API).length} componentes`);
  assert.ok(API['sc-button']?.has('label'), 'sc-button debería aceptar label');
  assert.ok(API['sc-datatable']?.has('selectionChange'), 'el model de datatable debería dar selectionChange');
});

/* ── usosDe y exclusiones ─────────────────────────────────────────────────── */

test('extrae tag y atributos, en sus tres sintaxis', () => {
  const u = usosDe('<sc-button label="Ok" [loading]="true" (clicked)="x()" />');
  assert.equal(u.length, 1);
  assert.equal(u[0].tag, 'sc-button');
  assert.deepEqual(u[0].atributos.sort(), ['clicked', 'label', 'loading']);
});

test('EXCLUYE atributos que no son API del componente', () => {
  for (const a of ['class', 'aria-label', 'data-testid', 'style', 'id', '*ngIf', '#ref']) {
    assert.ok(ATRIBUTO_GENERICO.test(a), `${a} debería estar excluido`);
  }
});

test('NO excluye un nombre de propiedad cualquiera', () => {
  for (const a of ['label', 'variant', 'selection']) {
    assert.equal(ATRIBUTO_GENERICO.test(a), false, `${a} no debería estar excluido`);
  }
});

test('EXCLUYE lo que no es un tag del DS', () => {
  assert.deepEqual(usosDe('<div foo="1"><p>hola</p></div>'), []);
});

/* ── verde sobre el corpus real ───────────────────────────────────────────── */

test('TODOS los snippets del repo usan componentes y props que existen', () => {
  const demos = execSync(
    "find projects/sc-docs/src/app/pages/components -name '*-demo.component.ts'",
    { encoding: 'utf8' },
  )
    .split('\n')
    .filter(Boolean);
  assert.ok(demos.length >= 40, `solo encontré ${demos.length} demos`);
  const problemas = [];
  let nSnippets = 0;
  for (const ruta of demos) {
    for (const { nombre, codigo } of snippetsDe(readFileSync(ruta, 'utf8'))) {
      nSnippets += 1;
      problemas.push(...revisarSnippet(ruta, nombre, codigo, API));
    }
  }
  assert.ok(nSnippets >= 60, `esperaba decenas de snippets, conté ${nSnippets}`);
  assert.deepEqual(problemas.map((p) => p[0]), []);
});

/* ── rojos: los dos defectos que ataja ────────────────────────────────────── */

test('ROJO: el snippet enseña un componente que no existe', () => {
  const p = revisarSnippet('x.ts', 'S', '<sc-inventado label="Ok" />', API);
  assert.equal(p.length, 1);
  assert.match(p[0][0], /no es ningún componente del DS/);
});

test('ROJO: el snippet enseña una prop que el componente ya no tiene', () => {
  const p = revisarSnippet('x.ts', 'S', '<sc-button propiedadMuerta="1" />', API);
  assert.equal(p.length, 1);
  assert.match(p[0][0], /que no lo tiene/);
});

test('VERDE: el mismo snippet con la prop real pasa', () => {
  assert.deepEqual(revisarSnippet('x.ts', 'S', '<sc-button label="Ok" />', API), []);
});

/* ── higiene de la lista ──────────────────────────────────────────────────── */

test('PENDIENTES: cada excepción trae su motivo escrito', () => {
  for (const [clave, motivo] of Object.entries(PENDIENTES)) {
    assert.ok(motivo && motivo.length > 20, `${clave} necesita un motivo, no una etiqueta`);
  }
});

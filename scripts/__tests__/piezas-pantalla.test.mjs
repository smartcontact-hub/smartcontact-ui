// El inventario de piezas de una pantalla (DD-252): cada pieza con su contexto, buscada en el resto del Supervisor.
// Lo que importa es que MUERDA en el caso que lo hizo nacer (el lápiz por fila de la primera versión de Horarios) y
// que no muerda lo que tiene precedente ni lo declarado. node:test, dentro de `test:unit`.
import assert from 'node:assert/strict';
import test from 'node:test';

import { indiceDePrecedentes, piezasDe, revisarPlantilla, selectoresDe } from '../piezas-pantalla.mjs';

const ds = new Set(['sc-button', 'sc-datatable', 'sc-tag', 'sc-section-card']);
const opciones = { ds, propios: new Set(['sc-horario-semana']) };

const LAPIZ = [
  '<ul class="horario__lista" role="list">',
  '  @for (fila of periodos(); track fila.id) {',
  '    <li><sc-tag [value]="fila.name" />',
  '      <sc-button icon="edit" iconOnly [ariaLabel]="x" (clicked)="abrir(fila)" />',
  '    </li>',
  '  }',
  '</ul>',
].join('\n');

const AGENDA = [
  '<sc-datatable variant="list" [value]="filas()">',
  '  @for (f of filas(); track f.id) { <sc-button icon="more_vert" [ariaLabel]="m" /> }',
  '</sc-datatable>',
  '<sc-tag value="x" />',
  '<sc-button icon="add" [label]="a" />',
].join('\n');

test('cada pieza lleva su contexto: en tabla, repetida o suelta; y el botón de solo icono, su icono', () => {
  const firmas = piezasDe(LAPIZ, opciones).map((p) => p.firma);
  assert.deepEqual(firmas, ['<ul> a mano · suelta', 'sc-tag · repetida', 'sc-button solo icono «edit» · repetida']);
  assert.deepEqual(
    piezasDe(AGENDA, opciones).map((p) => p.firma),
    ['sc-datatable · suelta', 'sc-button solo icono «more_vert» · en tabla', 'sc-tag · suelta', 'sc-button con texto · suelta'],
  );
});

test('los componentes propios de la app y los que no son del DS no son piezas; un icono enlazado cuenta como tal', () => {
  const html = '<sc-horario-semana /><sc-otra-cosa /><sc-button [icon]="deleteIcon" [ariaLabel]="q" />';
  assert.deepEqual(piezasDe(html, opciones).map((p) => p.firma), ['sc-button solo icono «enlazado» · suelta']);
});

test('MUERDE: el lápiz por fila de una lista a mano no tiene precedente si el resto del Supervisor usa la tabla', () => {
  const indice = indiceDePrecedentes([['agenda.html', AGENDA]], opciones);
  const malas = revisarPlantilla(LAPIZ, indice, opciones).filter((f) => f.falla).map((f) => f.firma);
  assert.deepEqual(malas, ['<ul> a mano · suelta', 'sc-tag · repetida', 'sc-button solo icono «edit» · repetida']);
});

test('con precedente no falla, y dice dónde está el primero', () => {
  const indice = indiceDePrecedentes([['agenda.html', AGENDA]], opciones);
  const fila = revisarPlantilla(AGENDA, indice, opciones).find((f) => f.firma.startsWith('sc-datatable'));
  assert.equal(fila.falla, false);
  assert.equal(fila.ejemplo, 'agenda.html:1');
});

test('declarada en las tres líneas anteriores con su DD no falla; sin DD, o más arriba, sí', () => {
  const indice = new Map();
  const declarada = '<!-- pieza nueva: DD-252, la rejilla del año -->\n<table role="grid"></table>';
  assert.equal(revisarPlantilla(declarada, indice, opciones).every((f) => !f.falla), true);
  const sinDd = '<!-- pieza nueva, porque sí -->\n<table></table>';
  assert.equal(revisarPlantilla(sinDd, indice, opciones)[0].falla, true);
  const lejos = '<!-- pieza nueva: DD-252 -->\n\n\n\n<table></table>';
  assert.equal(revisarPlantilla(lejos, indice, opciones)[0].falla, true);
});

test('un comentario no es una pieza y no mueve las líneas', () => {
  const html = '<!-- <sc-button icon="edit" iconOnly /> -->\n<sc-tag value="x" />';
  assert.deepEqual(piezasDe(html, opciones), [{ firma: 'sc-tag · suelta', linea: 2, declarada: false }]);
});

test('los selectores salen de sus decoradores', () => {
  assert.deepEqual([...selectoresDe(["@Component({ selector: 'sc-uno', template: '' })", "selector: 'sc-dos',"])], ['sc-uno', 'sc-dos']);
});

// «Todas las combinaciones» de sc-docs (`matriz.core.mjs`): qué controles son eje, con cuáles abre, cuántas casillas
// salen y qué args lleva cada una. node:test, dentro de `test:unit`.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  construirRejilla,
  contarCeldas,
  ejesCandidatos,
  ejesPorDefecto,
} from '../../projects/sc-docs/src/app/storybook/matriz.core.mjs';

// Los controles del Playground de sc-button, en su orden (`button-demo.component.ts`), recortados a lo que importa.
const BOTON = [
  { name: 'label', control: { kind: 'text' } },
  { name: 'variant', control: { kind: 'select', options: ['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast', 'plain'] } },
  { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
  { name: 'disabled', control: { kind: 'boolean' } },
  { name: 'appearance', control: { kind: 'select', options: ['filled', 'outlined', 'text', 'link'] } },
  { name: 'iconSize', control: { kind: 'number' } },
];

test('ejesCandidatos: desplegables y interruptores, en el orden de la ficha; el texto y los números no', () => {
  assert.deepEqual(
    ejesCandidatos(BOTON).map((e) => `${e.nombre}:${e.valores.length}`),
    ['variant:9', 'size:3', 'disabled:2', 'appearance:4'],
  );
  assert.deepEqual(ejesCandidatos([{ name: 'x', control: { kind: 'select', options: ['solo'] } }]), []);
});

test('ejesPorDefecto: primero los desplegables; el botón abre en variante × tamaño × apariencia = 108', () => {
  const c = ejesCandidatos(BOTON);
  const ejes = ejesPorDefecto(c);
  assert.deepEqual(ejes, { filas: 'variant', columnas: 'size', grupos: 'appearance' });
  assert.equal(contarCeldas(ejes, c), 108);
});

test('ejesPorDefecto: con un solo eje, el resto queda vacío; sin ejes, cero casillas', () => {
  const c = ejesCandidatos([{ name: 'checked', control: { kind: 'boolean' } }]);
  assert.deepEqual(ejesPorDefecto(c), { filas: 'checked', columnas: null, grupos: null });
  assert.equal(contarCeldas(ejesPorDefecto(c), c), 2);
  assert.equal(contarCeldas({ filas: null, columnas: null, grupos: null }, []), 0);
});

test('contarCeldas: un eje repetido no multiplica', () => {
  const c = ejesCandidatos(BOTON);
  assert.equal(contarCeldas({ filas: 'variant', columnas: 'variant', grupos: null }, c), 9);
});

test('construirRejilla: cada casilla lleva la base con sus tres valores, y las imposibles van marcadas', () => {
  const c = ejesCandidatos(BOTON);
  const base = { label: 'Un texto larguísimo', variant: 'primary', size: 'md', appearance: 'filled' };
  const plainRelleno = (a) => a.variant === 'plain' && (a.appearance === 'filled' || a.appearance === 'link');
  const rejilla = construirRejilla({ filas: 'variant', columnas: 'size', grupos: 'appearance' }, c, base, plainRelleno);

  assert.equal(rejilla.length, 4);
  assert.equal(rejilla[0].filas.length, 9);
  assert.equal(rejilla[0].filas[0].celdas.length, 3);
  const celda = rejilla[1].filas[5].celdas[0];
  assert.deepEqual(celda.args, { label: 'Un texto larguísimo', variant: 'help', size: 'sm', appearance: 'outlined' });
  assert.equal(celda.imposible, false);

  const imposibles = rejilla.flatMap((g) => g.filas.flatMap((f) => f.celdas)).filter((x) => x.imposible);
  assert.equal(imposibles.length, 6); // plain × (filled, link) × 3 tamaños
  assert.equal(base.variant, 'primary', 'la base no se toca');
});

test('construirRejilla: columnas o grupos iguales a filas se quedan en filas', () => {
  const c = ejesCandidatos(BOTON);
  const r = construirRejilla({ filas: 'size', columnas: 'size', grupos: 'size' }, c, {});
  assert.equal(r.length, 1);
  assert.deepEqual(r[0].filas.map((f) => f.celdas.length), [1, 1, 1]);
});

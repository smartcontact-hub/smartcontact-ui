// Las tipificaciones sin el navegador: su árbol de hasta tres niveles (cada rama hasta donde haga falta), lo que le falta
// para guardarse, y cómo entran y salen de un CSV. node:test, dentro de `test:unit`. Desde la revisión del 2026-10-09 una
// tipificación es nombre, descripción y árbol: la dirección, el comentario y los grupos los decide cada grupo.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  filasParaDescargar,
  hermanasRepetidas,
  nivelesDe,
  nuevoIdDeOpcion,
  opcionesPorNivel,
  parsearTipificacionesCsv,
  profundidad,
  ramasIncompletas,
  recortarANiveles,
  totalDeOpciones,
} from '../../projects/supervisor/src/app/features/admin/repositories/state/tipificaciones.core.mjs';

const op = (id, label, children = []) => ({ id, label, children });

/** Compra › Carne › (Pollo, Cerdo) · Compra › Pescado (sin hijas) · Venta (sin hijas). */
const ARBOL = [op('o1', 'Compra', [op('o2', 'Carne', [op('o3', 'Pollo'), op('o4', 'Cerdo')]), op('o5', 'Pescado')]), op('o6', 'Venta')];

const tip = (id, name, extra = {}) => ({ id, name, description: '', levels: 1, options: [], ...extra });

test('opcionesPorNivel y totalDeOpciones cuentan cada nivel del árbol', () => {
  assert.deepEqual(opcionesPorNivel(ARBOL, 3), [2, 2, 2]);
  assert.deepEqual(opcionesPorNivel(ARBOL, 1), [2]);
  assert.equal(totalDeOpciones(ARBOL), 6);
});

test('profundidad: los niveles son los de la rama más larga, de 1 a 3; sin opciones, 1', () => {
  assert.equal(profundidad(ARBOL), 3);
  assert.equal(profundidad([op('o1', 'Sí'), op('o2', 'No')]), 1);
  assert.equal(profundidad([op('o1', 'A', [op('o2', 'B')]), op('o3', 'C')]), 2);
  assert.equal(profundidad([]), 1);
});

test('ramasIncompletas sigue diciendo qué ramas no llegan a un nivel (ya no impide guardar)', () => {
  assert.deepEqual(ramasIncompletas(ARBOL, 3), [['Compra', 'Pescado'], ['Venta']]);
  assert.deepEqual(ramasIncompletas(ARBOL, 1), []);
  assert.deepEqual(ramasIncompletas([], 2), [[]]);
});

test('recortarANiveles quita lo de debajo y cuenta cuánto quita', () => {
  const { opciones, quitadas } = recortarANiveles(ARBOL, 1);
  assert.deepEqual(opciones, [op('o1', 'Compra'), op('o6', 'Venta')]);
  assert.equal(quitadas, 4);
  assert.equal(recortarANiveles(ARBOL, 3).quitadas, 0);
});

test('hermanasRepetidas compara sin mayúsculas ni espacios, solo entre hermanas', () => {
  const arbol = [op('o1', 'Compra', [op('o2', 'Otros'), op('o3', ' otros ')]), op('o4', 'Venta', [op('o5', 'Otros')])];
  assert.deepEqual(hermanasRepetidas(arbol), [['Compra', ' otros ']]);
});

test('nuevoIdDeOpcion no repite ningún id del árbol', () => {
  assert.equal(nuevoIdDeOpcion(ARBOL), 'o7');
  assert.equal(nuevoIdDeOpcion([]), 'o1');
});

test('nivelesDe: los de su árbol', () => {
  assert.equal(nivelesDe({ levels: 3 }), 3);
  assert.equal(nivelesDe({ levels: 1 }), 1);
});

test('parsearTipificacionesCsv: una línea por camino; las de un mismo nombre son una tipificación, con ramas de largo libre', () => {
  const csv = [
    '﻿nombre;descripción;nivel 1;nivel 2;nivel 3',
    'Atención;Cierre de llamadas;Compra;Carne;Pollo',
    'Atención;;Compra;Carne;Cerdo',
    'Atención;;Venta;;',
    '',
    'Encuesta;;Satisfecho;;',
    'Encuesta;;Insatisfecho;;',
  ].join('\r\n');
  const r = parsearTipificacionesCsv(csv, []);
  assert.deepEqual(r.errores, []);
  assert.deepEqual(
    r.nuevas.map((t) => [t.name, t.description, t.levels, totalDeOpciones(t.options)]),
    [
      ['Atención', 'Cierre de llamadas', 3, 5],
      ['Encuesta', '', 1, 2],
    ],
  );
  assert.deepEqual(r.nuevas[0].options[0].children[0].children.map((o) => o.label), ['Pollo', 'Cerdo']);
  // Venta se queda en el primer nivel: cada rama llega hasta donde haga falta.
  assert.deepEqual(r.nuevas[0].options[1], { id: r.nuevas[0].options[1].id, label: 'Venta', children: [] });
});

test('parsearTipificacionesCsv: cada error con su línea; las que ya existen se saltan y se cuentan una vez', () => {
  const csv = [
    'name,description,level 1,level 2,level 3',
    ',,A,,',
    'Hueco,,A,,C',
    'Muda,,,,',
    'Corta,,A,B,',
    'Corta,,A,,',
    'Existe,,A,,',
    'Existe,,B,,',
  ].join('\n');
  const r = parsearTipificacionesCsv(csv, [{ name: 'existe' }]);
  assert.deepEqual(r.errores, [
    { linea: 2, motivo: 'nombre' },
    { linea: 3, motivo: 'hueco' },
    { linea: 4, motivo: 'vacia' },
  ]);
  assert.deepEqual(r.nuevas.map((t) => [t.name, t.levels]), [['Corta', 2]]);
  assert.equal(r.repetidas, 1);
});

test('parsearTipificacionesCsv: lo que pasa del tope se cuenta y no entra', () => {
  const r = parsearTipificacionesCsv('A;;x;;\nB;;x;;\nC;;x;;', [], 2);
  assert.deepEqual(r.nuevas.map((t) => t.name), ['A', 'B']);
  assert.equal(r.sobran, 1);
});

test('filasParaDescargar vuelve a entrar tal cual: una fila por camino, cada una hasta su hoja', () => {
  const t = tip(1, 'Atención', {
    levels: 3,
    options: [op('o1', 'Compra', [op('o2', 'Carne', [op('o3', 'Pollo'), op('o4', 'Cerdo')])]), op('o5', 'Venta')],
  });
  const filas = filasParaDescargar([t]);
  assert.deepEqual(filas, [
    ['Atención', '', 'Compra', 'Carne', 'Pollo'],
    ['Atención', '', 'Compra', 'Carne', 'Cerdo'],
    ['Atención', '', 'Venta', '', ''],
  ]);
  const vuelta = parsearTipificacionesCsv(filas.map((f) => f.join(';')).join('\n'), []);
  assert.deepEqual(vuelta.errores, []);
  assert.equal(totalDeOpciones(vuelta.nuevas[0].options), 5);
  assert.equal(vuelta.nuevas[0].levels, 3);
});

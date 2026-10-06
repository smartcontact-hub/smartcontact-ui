// Las tipificaciones sin el navegador: su árbol de hasta tres niveles, lo que le falta para guardarse, con qué choca en
// un grupo, y cómo entran y salen de un CSV. node:test, dentro de `test:unit`.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  asignarAGrupo,
  choquesDe,
  filasParaDescargar,
  gruposAlDia,
  hermanasRepetidas,
  nivelesDe,
  nuevoIdDeOpcion,
  opcionesPorNivel,
  parsearTipificacionesCsv,
  ramasIncompletas,
  recortarANiveles,
  totalDeOpciones,
} from '../../projects/supervisor/src/app/features/admin/repositories/state/tipificaciones.core.mjs';

const op = (id, label, children = []) => ({ id, label, children });

/** Compra › Carne › (Pollo, Cerdo) · Compra › Pescado (sin hijas) · Venta (sin hijas). */
const ARBOL = [op('o1', 'Compra', [op('o2', 'Carne', [op('o3', 'Pollo'), op('o4', 'Cerdo')]), op('o5', 'Pescado')]), op('o6', 'Venta')];

const tip = (id, name, extra = {}) => ({
  id,
  name,
  description: '',
  inbound: true,
  outbound: false,
  categorization: true,
  comments: true,
  levels: 1,
  options: [],
  groups: [],
  ...extra,
});

test('opcionesPorNivel y totalDeOpciones cuentan cada nivel del árbol', () => {
  assert.deepEqual(opcionesPorNivel(ARBOL, 3), [2, 2, 2]);
  assert.deepEqual(opcionesPorNivel(ARBOL, 1), [2]);
  assert.equal(totalDeOpciones(ARBOL), 6);
});

test('ramasIncompletas: con tres niveles, cada opción de arriba necesita hijas; un primer nivel vacío también falta', () => {
  assert.deepEqual(ramasIncompletas(ARBOL, 3), [['Compra', 'Pescado'], ['Venta']]);
  assert.deepEqual(ramasIncompletas(ARBOL, 1), []);
  assert.deepEqual(ramasIncompletas([], 2), [[]]);
  // Sin categorización no se pide árbol.
  assert.deepEqual(ramasIncompletas([], 0), []);
});

test('recortarANiveles quita lo de debajo y cuenta cuánto quita', () => {
  const { opciones, quitadas } = recortarANiveles(ARBOL, 1);
  assert.deepEqual(opciones, [op('o1', 'Compra'), op('o6', 'Venta')]);
  assert.equal(quitadas, 4);
  // Al mismo nivel (o más) no cambia nada.
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

test('nivelesDe: sin categorización, ninguno', () => {
  assert.equal(nivelesDe({ categorization: true, levels: 3 }), 3);
  assert.equal(nivelesDe({ categorization: false, levels: 3 }), 0);
});

test('choquesDe: misma dirección y mismo canal en el mismo grupo; la propia no cuenta', () => {
  const atencion = tip(1, 'Atención', { groups: [{ groupId: 11, channels: ['phone', 'chat'] }] });
  const ventas = tip(2, 'Ventas', { inbound: false, outbound: true, groups: [{ groupId: 11, channels: ['phone'] }] });
  const chat = tip(3, 'Cierre de chat', { groups: [{ groupId: 11, channels: ['chat'] }] });
  const todas = [atencion, ventas, chat];
  // Ventas es saliente: no choca. Cierre de chat entra por chat como Atención: choca.
  assert.deepEqual(choquesDe(atencion, todas), [
    { groupId: 11, otherId: 3, otherName: 'Cierre de chat', direction: 'inbound', channel: 'chat' },
  ]);
  // En borrador, Ventas pasa a cubrir también las entrantes: ahora choca por teléfono con Atención.
  assert.deepEqual(choquesDe({ ...ventas, inbound: true }, todas), [
    { groupId: 11, otherId: 1, otherName: 'Atención', direction: 'inbound', channel: 'phone' },
  ]);
});

test('asignarAGrupo añade con los canales del grupo, quita la que sale y deja igual la que sigue', () => {
  const a = tip(1, 'A', { groups: [{ groupId: 5, channels: ['phone'] }] });
  const b = tip(2, 'B');
  const c = tip(3, 'C', { groups: [{ groupId: 5, channels: ['chat'] }] });
  const cambian = asignarAGrupo([a, b, c], [1, 2], 5, ['phone', 'chat']);
  assert.deepEqual(
    cambian.map((t) => [t.id, t.groups]),
    [
      [2, [{ groupId: 5, channels: ['phone', 'chat'] }]],
      [3, []],
    ],
  );
});

test('gruposAlDia: fuera el grupo borrado y los canales que el grupo ya no ofrece; si no cambia, el mismo objeto', () => {
  const t = tip(1, 'A', { groups: [{ groupId: 1, channels: ['phone', 'chat'] }, { groupId: 2, channels: ['phone'] }] });
  const familias = { 1: ['phone'], 2: ['phone'] };
  const alDia = gruposAlDia(t, (id) => familias[id] ?? null);
  assert.deepEqual(alDia.groups, [{ groupId: 1, channels: ['phone'] }, { groupId: 2, channels: ['phone'] }]);
  assert.equal(gruposAlDia(alDia, (id) => familias[id] ?? null), alDia);
  assert.deepEqual(gruposAlDia(t, (id) => (id === 1 ? ['phone', 'chat'] : null)).groups, [{ groupId: 1, channels: ['phone', 'chat'] }]);
});

test('parsearTipificacionesCsv: una línea por camino; las de un mismo nombre son una tipificación', () => {
  const csv = [
    '﻿nombre;descripción;dirección;comentarios;nivel 1;nivel 2;nivel 3',
    'Atención;Cierre de llamadas;Entrantes;Sí;Compra;Carne;Pollo',
    'Atención;;;;Compra;Carne;Cerdo',
    'Atención;;;;Venta;Ropa;Camisa',
    '',
    'Encuesta;;Salientes;no;Satisfecho;;',
    'Encuesta;;;;Insatisfecho;;',
    'Notas;Solo comentario;Ambas;sí;;;',
  ].join('\r\n');
  const r = parsearTipificacionesCsv(csv, []);
  assert.deepEqual(r.errores, []);
  assert.deepEqual(
    r.nuevas.map((t) => [t.name, t.inbound, t.outbound, t.comments, t.categorization, t.levels, totalDeOpciones(t.options)]),
    [
      ['Atención', true, false, true, true, 3, 7],
      ['Encuesta', false, true, false, true, 1, 2],
      ['Notas', true, true, true, false, 1, 0],
    ],
  );
  assert.deepEqual(r.nuevas[0].options[0].children[0].children.map((o) => o.label), ['Pollo', 'Cerdo']);
});

test('parsearTipificacionesCsv: cada error con su línea; las que ya existen se saltan y se cuentan una vez', () => {
  const csv = [
    'name,description,direction,comments,level 1,level 2,level 3',
    ',,Inbound,yes,A,,',
    'Mala,,Lateral,yes,A,,',
    'Hueco,,Inbound,yes,A,,C',
    'Corta,,Inbound,yes,A,B,',
    'Corta,,,,A,,',
    'Muda,,Inbound,no,,,',
    'Rara,,Inbound,quizá,A,,',
    'Existe,,Inbound,yes,A,,',
    'Existe,,Inbound,yes,B,,',
  ].join('\n');
  const r = parsearTipificacionesCsv(csv, [{ name: 'existe' }]);
  assert.deepEqual(r.errores, [
    { linea: 2, motivo: 'nombre' },
    { linea: 3, motivo: 'direccion' },
    { linea: 4, motivo: 'hueco' },
    { linea: 6, motivo: 'nivel' },
    { linea: 7, motivo: 'vacia' },
    { linea: 8, motivo: 'comentarios' },
  ]);
  assert.deepEqual(r.nuevas.map((t) => t.name), ['Corta']);
  assert.equal(r.repetidas, 1);
});

test('parsearTipificacionesCsv: lo que pasa del tope se cuenta y no entra', () => {
  const r = parsearTipificacionesCsv('A;;Entrantes;sí;;;\nB;;Entrantes;sí;;;\nC;;Entrantes;sí;;;', [], 2);
  assert.deepEqual(r.nuevas.map((t) => t.name), ['A', 'B']);
  assert.equal(r.sobran, 1);
});

test('filasParaDescargar vuelve a entrar tal cual: una fila por camino', () => {
  const textos = { inbound: 'Entrantes', outbound: 'Salientes', both: 'Ambas', yes: 'Sí', no: 'No' };
  const t = tip(1, 'Atención', {
    levels: 3,
    options: [op('o1', 'Compra', [op('o2', 'Carne', [op('o3', 'Pollo'), op('o4', 'Cerdo')])])],
  });
  const filas = filasParaDescargar([t, tip(2, 'Notas', { categorization: false, inbound: true, outbound: true })], textos);
  assert.deepEqual(filas, [
    ['Atención', '', 'Entrantes', 'Sí', 'Compra', 'Carne', 'Pollo'],
    ['Atención', '', 'Entrantes', 'Sí', 'Compra', 'Carne', 'Cerdo'],
    ['Notas', '', 'Ambas', 'Sí', '', '', ''],
  ]);
  const vuelta = parsearTipificacionesCsv(filas.map((f) => f.join(';')).join('\n'), []);
  assert.deepEqual(vuelta.errores, []);
  assert.equal(totalDeOpciones(vuelta.nuevas[0].options), 4);
  assert.equal(vuelta.nuevas[1].categorization, false);
});

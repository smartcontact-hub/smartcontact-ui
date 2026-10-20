/**
 * Tests de las reglas del índice de una ficha
 * (`projects/supervisor/src/app/shared/utils/alta-secciones.core.mjs`, DD-216). Puro, node:test, dentro del gate
 * (`test:unit`).
 *
 * Contratos clave: el ✓ es de la sección que se dejó TAL COMO ESTÁ (su firma) y completa; lo que falta se dice si
 * faltaba al intentar crear o guardar, o si lo guardado ya venía sin ello, y nada más.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  dejarSeccion,
  firmaDe,
  seccionesHechas,
  seDice,
} from '../../projects/supervisor/src/app/shared/utils/alta-secciones.core.mjs';

const ids = ['general', 'distribucion', 'recursos', 'agentes'];

test('seccionesHechas: ✓ en la dejada y completa, no en la abierta ni en la que no se dejó', () => {
  const dejadas = new Map([['general', ''], ['distribucion', 'phone']]);
  const hechas = seccionesHechas({
    ids,
    abierta: 'distribucion',
    dejadas,
    firma: (id) => (id === 'general' ? '' : 'phone'),
    completa: () => true,
  });
  assert.deepEqual([...hechas], ['general']);
});

test('seccionesHechas ROJO: el caso del 2026-10-20, quitar Teléfono le quita el ✓ a Distribución y colas', () => {
  const dejadas = new Map([['distribucion', firmaDe(['phone'])]]);
  const con = (canales) =>
    seccionesHechas({
      ids,
      abierta: 'general',
      dejadas,
      firma: (id) => (id === 'general' ? '' : firmaDe(canales)),
      completa: () => true,
    });
  assert.deepEqual([...con(['phone'])], ['distribucion']);
  assert.deepEqual([...con([])], []);
  // Volver a marcarlo devuelve lo que se vio: la firma es la misma.
  assert.deepEqual([...con(['phone'])], ['distribucion']);
});

test('seccionesHechas: una sección dejada pero incompleta no lleva ✓', () => {
  const hechas = seccionesHechas({
    ids,
    abierta: 'general',
    dejadas: new Map([['distribucion', '']]),
    firma: () => '',
    completa: (id) => id !== 'distribucion',
  });
  assert.equal(hechas.size, 0);
});

test('dejarSeccion: un mapa nuevo con la firma de ese momento, sin tocar el de antes', () => {
  const antes = new Map([['general', '']]);
  const despues = dejarSeccion(antes, 'distribucion', 'chat,phone');
  assert.equal(antes.size, 1);
  assert.equal(despues.get('distribucion'), 'chat,phone');
  // Dejarla otra vez apunta la firma nueva.
  assert.equal(dejarSeccion(despues, 'distribucion', 'phone').get('distribucion'), 'phone');
});

test('seDice: nada antes de intentar; al intentar, lo que faltaba entonces; lo que falta después, callado', () => {
  const guardado = new Set();
  assert.equal(seDice('name', null, guardado), false);
  const intento = new Set(['name', 'phone']);
  assert.equal(seDice('name', intento, guardado), true);
  assert.equal(seDice('phone', intento, guardado), true);
  assert.equal(seDice('typification', intento, guardado), false);
});

test('seDice: lo guardado que ya venía sin algo se dice sin intentar (DD-142)', () => {
  assert.equal(seDice('phone', null, new Set(['phone'])), true);
  assert.equal(seDice('name', null, new Set(['phone'])), false);
});

test('firmaDe: la misma con otro orden o con repetidos', () => {
  assert.equal(firmaDe(['phone', 'chat']), firmaDe(['chat', 'phone', 'chat']));
  assert.notEqual(firmaDe(['phone']), firmaDe(['phone', 'email']));
  assert.equal(firmaDe([]), '');
});

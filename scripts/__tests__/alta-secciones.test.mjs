/**
 * Tests de las reglas del índice de una ficha
 * (`projects/supervisor/src/app/shared/utils/alta-secciones.core.mjs`, DD-217). Puro, node:test, dentro del gate
 * (`test:unit`).
 *
 * Contratos clave: el ✓ es de la sección que se dejó TAL COMO ESTÁ (su firma) y completa; lo que falta se dice si
 * faltaba al intentar crear o guardar, o si lo guardado ya venía sin ello, y nada más.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  dejarSeccion,
  estadosDeSecciones,
  firmaDe,
  firmaVista,
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

test('seccionesHechas: añadir un canal quita el ✓ (hay algo nuevo que no viste); quitarlo, no', () => {
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
  // Añadir Chat trae un bloque que no viste: se va el ✓.
  assert.deepEqual([...con(['phone', 'chat'])], []);
  // Quitar Teléfono no trae nada nuevo: la sección sigue como la dejaste.
  assert.deepEqual([...con([])], ['distribucion']);
});

test('firmaVista: lo de ahora cabe en lo visto; lo nunca visto no', () => {
  const dejadas = new Map([['a', 'chat,phone']]);
  assert.equal(firmaVista(dejadas, 'a', 'phone'), true);
  assert.equal(firmaVista(dejadas, 'a', 'chat,phone'), true);
  assert.equal(firmaVista(dejadas, 'a', ''), true);
  assert.equal(firmaVista(dejadas, 'a', 'email,phone'), false);
  assert.equal(firmaVista(dejadas, 'b', ''), false);
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

test('seDice: el campo tocado y dejado se dice en rojo; los demás, no (DD-219)', () => {
  const tocados = new Set(['name']);
  assert.equal(seDice('name', null, new Set(), tocados), true);
  assert.equal(seDice('phone', null, new Set(), tocados), false);
  // Sin `tocados`, como lo pide el índice, tocar no cuenta.
  assert.equal(seDice('name', null, new Set()), false);
});

test('firmaDe: la misma con otro orden o con repetidos', () => {
  assert.equal(firmaDe(['phone', 'chat']), firmaDe(['chat', 'phone', 'chat']));
  assert.notEqual(firmaDe(['phone']), firmaDe(['phone', 'email']));
  assert.equal(firmaDe([]), '');
});

test('estadosDeSecciones: actual la abierta, hecha o error la dejada, pendiente la no vista o con otra firma', () => {
  const dejadas = new Map([['general', ''], ['distribucion', 'phone'], ['recursos', '']]);
  const estados = estadosDeSecciones({
    ids,
    abierta: 'agentes',
    dejadas,
    firma: (id) => (id === 'recursos' ? 'otra' : id === 'distribucion' ? 'phone' : ''),
    completa: (id) => id !== 'general',
  });
  assert.deepEqual(Object.fromEntries(estados), {
    general: 'error',
    distribucion: 'hecha',
    recursos: 'pendiente',
    agentes: 'actual',
  });
});

test('estadosDeSecciones: la verde sigue verde al abrirla, y la roja pasa a verde en vivo al rellenar lo que faltaba', () => {
  const dejadas = new Map([['general', ''], ['distribucion', '']]);
  const resultados = new Map([['general', true], ['distribucion', false]]);
  const con = (abierta, ok) =>
    Object.fromEntries(
      estadosDeSecciones({ ids, abierta, dejadas, resultados, firma: () => '', completa: (id) => (id === 'distribucion' ? ok : true) }),
    );
  // Abrir la verde no la pone en «actual».
  assert.equal(con('general', false).general, 'hecha');
  // La roja abierta sigue roja mientras falte, y pasa a verde al rellenar.
  assert.equal(con('distribucion', false).distribucion, 'error');
  assert.equal(con('distribucion', true).distribucion, 'hecha');
  // Una verde que se rompe con la sección abierta no se pone roja hasta que se deja.
  const rota = estadosDeSecciones({ ids, abierta: 'general', dejadas, resultados, firma: () => '', completa: () => false });
  assert.equal(rota.get('general'), 'hecha');
});

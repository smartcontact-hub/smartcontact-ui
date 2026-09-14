import { test } from 'node:test';
import assert from 'node:assert/strict';

import { cerosNuevos, diferencias, leeme, variables } from '../tema-zip.mjs';

test('variables: separa claro y oscuro por la regla, e ignora comentarios', () => {
  const v = variables(':root { --sc-a: 1px; /* --sc-b: 2px; */ } .sc-dark { --sc-a: 3px; }');
  assert.deepEqual([...v], [['claro|--sc-a', '1px'], ['oscuro|--sc-a', '3px']]);
});

test('ceros: rojo si un token con valor pasa a 0; no si ya era 0 o si es nuevo', () => {
  const antes = new Map([['claro|--sc-x', '0.4375rem'], ['claro|--sc-y', '0'], ['claro|--sc-z', '#fff']]);
  const despues = new Map([['claro|--sc-x', '0'], ['claro|--sc-y', '0'], ['claro|--sc-z', '#fff'], ['claro|--sc-nuevo', '0']]);
  assert.deepEqual(cerosNuevos(antes, despues), ['claro|--sc-x']);
  assert.deepEqual(cerosNuevos(antes, new Map([['claro|--sc-x', '0px']])), ['claro|--sc-x'], '0px también es cero');
});

test('diferencias: cambiadas, añadidas y quitadas, ordenadas', () => {
  const a = new Map([['claro|--sc-a', '1'], ['claro|--sc-b', '2']]);
  const b = new Map([['claro|--sc-a', '1'], ['claro|--sc-b', '3'], ['claro|--sc-c', '4']]);
  assert.deepEqual(diferencias(a, b), ['claro|--sc-b', 'claro|--sc-c']);
  assert.deepEqual(diferencias(a, new Map(a)), []);
});

test('guía: dice qué cambia, o que es el primer zip, y nunca la raíz 14', () => {
  const base = { commit: 'abc1234', primeng: '22.0.0', themes: '3.0.0' };
  const primero = leeme({ ...base, comprobaciones: { diferencia: { anterior: false } } });
  assert.match(primero, /Es el primer zip generado así/);
  const cambio = leeme({ ...base, comprobaciones: { diferencia: { anterior: true, variables: ['x'], semanticaComun: true, componentes: ['menu', 'toast'] } } });
  assert.match(cambio, /Variables de tokens: 1/);
  assert.match(cambio, /Semántica común .*: cambia/);
  assert.match(cambio, /menu, toast/);
  assert.match(cambio, /raíz de la página a 16 px/);
});

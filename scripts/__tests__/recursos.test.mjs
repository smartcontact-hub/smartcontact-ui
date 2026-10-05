// Lo que una ficha recibe de Repositorios (DD-164): lo borrado no cuenta y lo inactivo ya puesto se puede quitar.
// node:test, dentro de `test:unit`.
import assert from 'node:assert/strict';
import test from 'node:test';

import { agendasOfrecidas, idsVivos, tipificacionViva } from '../../projects/supervisor/src/app/features/admin/services/recursos.core.mjs';

const AGENDAS = [
  { id: 1, status: 'active' },
  { id: 6, status: 'inactive' },
  { id: 7, status: 'active' },
];

test('idsVivos: un id borrado en Repositorios sale, y el orden de lo puesto se queda', () => {
  assert.deepEqual(idsVivos([7, 99, 1], AGENDAS), [7, 1]);
  assert.deepEqual(idsVivos(new Set([99]), AGENDAS), []);
  assert.deepEqual(idsVivos([], AGENDAS), []);
});

test('agendasOfrecidas: las activas, y la inactiva solo si ya estaba puesta', () => {
  assert.deepEqual(agendasOfrecidas(AGENDAS, []).map((a) => a.id), [1, 7]);
  assert.deepEqual(agendasOfrecidas(AGENDAS, [6]).map((a) => a.id), [1, 6, 7]);
});

test('tipificacionViva: la categoría cuenta solo si le queda alguna tipificación', () => {
  const tips = [{ category: 'Consulta' }, { category: 'Venta' }];
  assert.equal(tipificacionViva('Consulta', tips), true);
  assert.equal(tipificacionViva('Borrada', tips), false);
  assert.equal(tipificacionViva(null, tips), false);
  assert.equal(tipificacionViva('', tips), false);
});

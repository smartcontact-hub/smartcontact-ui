// A quién se asigna una agenda (DD-211 §1): la selección por persona, los grupos enteros (dinámicos) y lo que se
// guarda. node:test, dentro de `test:unit`.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  aplicar,
  claveAgente,
  claveGrupo,
  claves,
  CLAVE_SIN_GRUPO,
  deLoGuardado,
  paraGuardar,
} from '../../projects/supervisor/src/app/features/admin/repositories/state/agenda-asignacion.core.mjs';

// Ángel (1) está en los grupos 1 y 2; Mario (3) y Miguel (4), en el 3 con Lucía (5); el grupo 4 no tiene a nadie; 9 y 10
// no están en ningún grupo.
const estructura = {
  grupos: [
    { id: 1, miembros: [1, 2] },
    { id: 2, miembros: [1, 6] },
    { id: 3, miembros: [3, 4, 5] },
    { id: 4, miembros: [] },
  ],
  sinGrupo: [9, 10],
};
const vacia = { grupos: [], agentes: [] };

test('marcar a un agente lo marca en todos los grupos donde está', () => {
  const a = aplicar(vacia, estructura, { tipo: 'agente', id: 1, marcar: true });
  const c = claves(a, estructura);
  assert.equal(c[claveAgente(1, 1)]?.checked, true);
  assert.equal(c[claveAgente(2, 1)]?.checked, true);
  assert.equal(c[claveGrupo(1)]?.partialChecked, true);
  assert.equal(c[claveGrupo(2)]?.partialChecked, true);
  assert.deepEqual(a.grupos, []);
});

test('marcar un grupo marca a sus agentes también en los otros grupos, y el grupo es entero', () => {
  const a = aplicar(vacia, estructura, { tipo: 'grupo', id: 1, marcar: true });
  assert.deepEqual(a.grupos, [1]);
  assert.deepEqual(a.agentes, [1, 2]);
  const c = claves(a, estructura);
  assert.equal(c[claveAgente(2, 1)]?.checked, true, 'Ángel, marcado también en el grupo 2');
  assert.equal(c[claveGrupo(2)]?.partialChecked, true);
});

test('marcar uno a uno a todos los agentes de un grupo lo deja entero (dinámico)', () => {
  let a = vacia;
  for (const id of [3, 4, 5]) a = aplicar(a, estructura, { tipo: 'agente', id, marcar: true });
  assert.deepEqual(a.grupos, [3]);
  assert.equal(claves(a, estructura)[claveGrupo(3)]?.checked, true);
});

test('desmarcar a un agente de un grupo entero lo deja parcial, también si se desmarca en otro grupo', () => {
  const entero = aplicar(vacia, estructura, { tipo: 'grupo', id: 1, marcar: true });
  const a = aplicar(entero, estructura, { tipo: 'agente', id: 1, marcar: false });
  assert.deepEqual(a.grupos, [], 'el grupo 1 deja de ser dinámico');
  assert.deepEqual(a.agentes, [2]);
  const c = claves(a, estructura);
  assert.equal(c[claveGrupo(1)]?.partialChecked, true);
  assert.equal(c[claveAgente(2, 1)], undefined);
});

test('desmarcar un grupo quita a sus agentes de todos sus grupos', () => {
  const dos = aplicar(aplicar(vacia, estructura, { tipo: 'grupo', id: 1, marcar: true }), estructura, { tipo: 'grupo', id: 2, marcar: true });
  assert.deepEqual(dos.grupos, [1, 2]);
  const a = aplicar(dos, estructura, { tipo: 'grupo', id: 1, marcar: false });
  assert.deepEqual(a.grupos, [], 'el grupo 2 pierde a Ángel: parcial');
  assert.deepEqual(a.agentes, [6]);
});

test('un grupo sin agentes solo es entero si se marca él', () => {
  const a = aplicar(vacia, estructura, { tipo: 'grupo', id: 4, marcar: true });
  assert.deepEqual(a.grupos, [4]);
  assert.equal(claves(a, estructura)[claveGrupo(4)]?.checked, true);
  assert.deepEqual(aplicar(a, estructura, { tipo: 'grupo', id: 4, marcar: false }).grupos, []);
  assert.equal(claves(vacia, estructura)[claveGrupo(4)], undefined, 'sin marcar, no está entero aunque no le falte nadie');
});

test('«Sin grupo» marca y desmarca a los que no están en ningún grupo, y nunca es dinámico', () => {
  const a = aplicar(vacia, estructura, { tipo: 'sinGrupo', id: 0, marcar: true });
  assert.deepEqual(a.agentes, [9, 10]);
  assert.deepEqual(a.grupos, []);
  assert.equal(claves(a, estructura)[CLAVE_SIN_GRUPO]?.checked, true);
  assert.deepEqual(aplicar(a, estructura, { tipo: 'sinGrupo', id: 0, marcar: false }).agentes, []);
});

test('lo guardado: los agentes de los grupos que la llevan cuentan como marcados', () => {
  const a = deLoGuardado([3], [9], estructura);
  assert.deepEqual(a.agentes, [3, 4, 5, 9]);
  assert.deepEqual(a.grupos, [3]);
});

test('al guardar, quien la tiene por un grupo entero no la lleva además suelta', () => {
  const a = aplicar(aplicar(vacia, estructura, { tipo: 'grupo', id: 3, marcar: true }), estructura, { tipo: 'agente', id: 1, marcar: true });
  assert.deepEqual(paraGuardar(a, estructura), { grupos: [3], agentesSueltos: [1] });
});

/**
 * Tests de `stableStringify` — núcleo del dirty-state compartido de formularios
 * (`projects/supervisor/src/app/shared/utils/form-dirty-state.core.mjs`). Puro,
 * node:test, dentro del gate (`test:unit`).
 *
 * Contrato clave: deshacer un cambio devuelve el MISMO string (Guardar vuelve a
 * desactivarse) y los Sets/objetos no marcan "sucio" por orden.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { stableStringify } from '../../projects/supervisor/src/app/shared/utils/form-dirty-state.core.mjs';

test('Set: el orden no marca sucio', () => {
  assert.equal(stableStringify(new Set([3, 1, 2])), stableStringify(new Set([1, 2, 3])));
});

test('objeto: el orden de claves no marca sucio', () => {
  assert.equal(stableStringify({ a: 1, b: 2 }), stableStringify({ b: 2, a: 1 }));
});

test('array: el orden SÍ importa (prioridad de links, idiomas)', () => {
  assert.notEqual(stableStringify([1, 2]), stableStringify([2, 1]));
});

test('deshacer un cambio en un Set → mismo snapshot (cambio neto cero)', () => {
  const pristine = stableStringify({ name: 'Ana', labelIds: new Set([1, 2]) });
  const afterUndo = stableStringify({ name: 'Ana', labelIds: new Set([2, 1]) });
  assert.equal(pristine, afterUndo);
});

test('un cambio real → snapshot distinto', () => {
  assert.notEqual(
    stableStringify({ name: 'Ana', labelIds: new Set([1]) }),
    stableStringify({ name: 'Ana', labelIds: new Set([1, 2]) }),
  );
});

test('objeto anidado (permissions): orden de claves irrelevante', () => {
  assert.equal(
    stableStringify({ permissions: { read: true, write: false } }),
    stableStringify({ permissions: { write: false, read: true } }),
  );
});

test('null / undefined / primitivos', () => {
  assert.equal(stableStringify(null), 'null');
  assert.equal(stableStringify(undefined), 'null');
  assert.equal(stableStringify('x'), '"x"');
  assert.equal(stableStringify(42), '42');
  assert.equal(stableStringify(true), 'true');
});

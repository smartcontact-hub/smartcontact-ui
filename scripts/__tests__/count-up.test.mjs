/**
 * Tests del núcleo de la cuenta de las cifras del resumen
 * (`projects/supervisor/src/app/shared/utils/count-up.core.mjs`). Puro, node:test, dentro del gate
 * (`test:unit`).
 *
 * Contrato clave: la cuenta acaba EXACTAMENTE en la cifra final a su duración, y sin duración (menos
 * movimiento, o las e2e con las animaciones apagadas) pinta la final de una vez.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { countUpValue, cssDurationMs } from '../../projects/supervisor/src/app/shared/utils/count-up.core.mjs';

test('la duración se lee de la cadena del CSS, en s o en ms', () => {
  assert.equal(cssDurationMs('0.3s'), 300);
  assert.equal(cssDurationMs('300ms'), 300);
  assert.equal(cssDurationMs('0s'), 0);
  // El reset de menos movimiento deja 0,01 ms, que el navegador escribe así.
  assert.equal(cssDurationMs('1e-05s'), 0.01);
  // Con varias transiciones, manda la primera.
  assert.equal(cssDurationMs('0.2s, 0.4s'), 200);
  assert.equal(cssDurationMs(''), 0);
});

test('sin duración, o por debajo de 1 ms, la cifra sale ya final', () => {
  assert.equal(countUpValue(0, 13, 0, 0), 13);
  assert.equal(countUpValue(0, 13, 0, 0.01), 13);
});

test('empieza en la de antes, acaba en la final y nunca se pasa', () => {
  assert.equal(countUpValue(5, 13, 0, 300), 5);
  assert.equal(countUpValue(5, 13, 300, 300), 13);
  assert.equal(countUpValue(5, 13, 900, 300), 13);
  for (let t = 0; t <= 300; t += 10) {
    const v = countUpValue(0, 11, t, 300);
    assert.ok(Number.isInteger(v) && v >= 0 && v <= 11, `t=${t} → ${v}`);
  }
});

test('también cuenta hacia abajo (quitar un permiso)', () => {
  assert.equal(countUpValue(5, 2, 0, 300), 5);
  assert.equal(countUpValue(5, 2, 300, 300), 2);
  const mitad = countUpValue(5, 2, 150, 300);
  assert.ok(mitad <= 5 && mitad >= 2);
});

test('sale rápido y frena al llegar (ease-out): a mitad de tiempo ya pasó de la mitad', () => {
  assert.ok(countUpValue(0, 100, 150, 300) > 50);
});

test('la cifra final llega justo al acabar, a la vez que el arco, y no antes', () => {
  assert.equal(countUpValue(0, 8, 290, 300), 7);
  assert.equal(countUpValue(0, 8, 300, 300), 8);
  assert.equal(countUpValue(8, 2, 290, 300), 3);
  assert.equal(countUpValue(8, 2, 300, 300), 2);
});

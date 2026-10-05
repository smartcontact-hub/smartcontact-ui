// Los contactos de una agenda (DD-163): el teléfono que vale, el que se repite y lo que se guardaba antes. node:test,
// dentro de `test:unit`.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  contactoCoincide,
  contactosDeNumeros,
  normalizarTelefono,
  telefonoValido,
} from '../../projects/supervisor/src/app/features/admin/repositories/state/agenda-contacts.core.mjs';

test('telefonoValido: con prefijo, separadores, extensiones; sin letras ni de más', () => {
  for (const ok of ['900 100 200', '+34 900 100 200', '900-100-200', '(91) 794 54 49', '1001', '112']) {
    assert.equal(telefonoValido(ok), true, ok);
  }
  for (const mal of ['', '  ', '12', 'nueve', '900 1OO 200', '+', '++34 900', '1234567890123456', '900/100']) {
    assert.equal(telefonoValido(mal), false, mal);
  }
});

test('normalizarTelefono: solo cifras y el + de delante, para comparar sin mirar cómo se escribió', () => {
  assert.equal(normalizarTelefono('900 100 200'), '900100200');
  assert.equal(normalizarTelefono('900-100-200'), normalizarTelefono('900 100 200'));
  assert.equal(normalizarTelefono(' +34 (91) 794 '), '+3491794');
  // Un prefijo distinto es otro número: no se adivina el país.
  assert.notEqual(normalizarTelefono('+34 900 100 200'), normalizarTelefono('900 100 200'));
});

test('contactosDeNumeros: el texto de antes, un contacto por número y sin nombre', () => {
  assert.deepEqual(contactosDeNumeros('900 100 200, 900 100 201'), [
    { id: 1, name: '', phone: '900 100 200' },
    { id: 2, name: '', phone: '900 100 201' },
  ]);
  assert.deepEqual(contactosDeNumeros(' , 900 ,,'), [{ id: 1, name: '', phone: '900' }]);
  // El mismo número escrito de dos maneras entra una vez: la agenda nueva no admite teléfonos repetidos.
  assert.deepEqual(
    contactosDeNumeros('900 100 200, 900-100-200, 900 100 201').map((c) => c.phone),
    ['900 100 200', '900 100 201'],
  );
  assert.deepEqual(contactosDeNumeros(''), []);
  assert.deepEqual(contactosDeNumeros(undefined), []);
});

test('contactoCoincide: el nombre y el teléfono por subcadena; un teléfono, también por sus cifras', () => {
  const centralita = { id: 1, name: 'Centralita de ventas', phone: '900 100 200' };
  const exterior = { id: 2, name: 'Atención en México', phone: '+52 800 123 4567' };
  assert.equal(contactoCoincide(centralita, ''), true);
  assert.equal(contactoCoincide(centralita, 'VENTAS'), true);
  assert.equal(contactoCoincide(centralita, '100 2'), true);
  // Se compara como los repetidos: escrito sin espacios o con guiones, es el mismo teléfono.
  assert.equal(contactoCoincide(centralita, '900100200'), true);
  assert.equal(contactoCoincide(centralita, '900-100'), true);
  assert.equal(contactoCoincide(exterior, '+52 800'), true);
  // Un texto con cifras no es un teléfono: «ventas 2» no encuentra todo lo que lleva un 2.
  assert.equal(contactoCoincide(exterior, 'ventas 2'), false);
  // Sin cifras no hay teléfono que comparar: un guion no encuentra cualquier cosa.
  assert.equal(contactoCoincide(centralita, '-'), false);
  assert.equal(contactoCoincide(centralita, '911'), false);
});

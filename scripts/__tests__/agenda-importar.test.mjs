// Importar contactos a una agenda desde un CSV (DD-166): qué entra, qué no y por qué, sin el navegador. node:test,
// dentro de `test:unit`.
import assert from 'node:assert/strict';
import test from 'node:test';
import { TextEncoder } from 'node:util';

import {
  decodificarCsv,
  parsearContactosCsv,
} from '../../projects/supervisor/src/app/features/admin/repositories/state/agenda-contacts.core.mjs';

const CENTRALITA = { id: 1, name: 'Centralita', phone: '900 100 200' };

test('parsearContactosCsv: punto y coma o coma, comillas y BOM; la cabecera y las líneas vacías no cuentan', () => {
  const r = parsearContactosCsv('﻿nombre;teléfono\n"Ventas, central";900 100 210\n\nSoporte;900 100 211\n', []);
  assert.deepEqual(r.nuevos, [
    { name: 'Ventas, central', phone: '900 100 210' },
    { name: 'Soporte', phone: '900 100 211' },
  ]);
  assert.deepEqual(r.errores, []);
  // Con comas, y una comilla doble escrita dentro de un campo entre comillas.
  const c = parsearContactosCsv('name,phone\r\nVentas,900 100 210\r\n"Oficina ""norte""","900 100 211"', []);
  assert.deepEqual(c.nuevos, [
    { name: 'Ventas', phone: '900 100 210' },
    { name: 'Oficina "norte"', phone: '900 100 211' },
  ]);
});

test('parsearContactosCsv: cada error con su línea del archivo; los repetidos se saltan y se cuentan', () => {
  const r = parsearContactosCsv(
    'nombre;teléfono\nSin teléfono;abc\n;900 100 300\nCentralita bis;900-100-200\nCopia;900 100 400\nOtra copia;900100400',
    [CENTRALITA],
  );
  assert.deepEqual(r.errores, [
    { linea: 2, motivo: 'telefono' },
    { linea: 3, motivo: 'nombre' },
  ]);
  assert.deepEqual(r.nuevos, [{ name: 'Copia', phone: '900 100 400' }]);
  // El de la agenda (escrito con guiones) y el repetido dentro del propio archivo.
  assert.equal(r.repetidos, 2);
  assert.equal(r.sobran, 0);
});

test('parsearContactosCsv: con la agenda en el tope, lo que no cabe se cuenta y no entra', () => {
  const lineas = Array.from({ length: 5 }, (_, i) => `Punto ${i};900 100 ${500 + i}`).join('\n');
  const r = parsearContactosCsv(lineas, [CENTRALITA], 4);
  assert.equal(r.nuevos.length, 3);
  assert.equal(r.sobran, 2);
  assert.deepEqual(parsearContactosCsv('', []), { nuevos: [], errores: [], repetidos: 0, sobran: 0 });
});

test('decodificarCsv: UTF-8, y si no lo es, windows-1252, que es como guarda Excel en español', () => {
  assert.equal(decodificarCsv(new TextEncoder().encode('Señal;900 100 200')), 'Señal;900 100 200');
  // «Señal;9» en windows-1252: la «ñ» es un solo byte, 0xF1, que en UTF-8 no vale.
  assert.equal(decodificarCsv(new Uint8Array([0x53, 0x65, 0xf1, 0x61, 0x6c, 0x3b, 0x39])), 'Señal;9');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { nombreCaptura, nombreDe } from '../revision-pantalla.mjs';

test('nombreCaptura: la vista da un nombre de fichero legible y estable', () => {
  assert.equal(nombreCaptura('admin/grupos/editar/11 · Distribución y colas'), 'admin-grupos-editar-11--distribucion-y-colas');
  assert.equal(nombreCaptura('login'), 'login');
  assert.equal(nombreCaptura('config/aed/servicio'), 'config-aed-servicio');
});

test('nombreDe: quita la ligadura del icono que va delante del texto de una pestaña', () => {
  assert.equal(nombreDe('alt_route\nDistribución y colas'), 'Distribución y colas');
  assert.equal(nombreDe('  library_books\n Recursos '), 'Recursos');
  assert.equal(nombreDe('Identidad'), 'Identidad', 'sin icono, el texto queda igual');
  // Los pasos de un alta (DD-138): el nativo pinta su número delante del título.
  assert.equal(nombreDe('1\nGeneral'), 'General', 'el número del paso no es parte del nombre');
  assert.equal(nombreDe('12\nGrupos asignados'), 'Grupos asignados');
});

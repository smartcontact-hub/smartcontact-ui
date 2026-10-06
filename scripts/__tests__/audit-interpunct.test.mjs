import { test } from 'node:test';
import assert from 'node:assert/strict';

import { clavesConPunto, lineasConPunto } from '../audit-interpunct.mjs';

// El valor del gate está en lo que NO marca: un comentario o una clave interna dan ruido (LEARNINGS #2).

test('ROJO: un punto medio entre datos de un texto de TypeScript', () => {
  assert.deepEqual(lineasConPunto('const x = `${a} \u00b7 ${b}`;', 'a.ts'), [[1, 'const x = `${a} \u00b7 ${b}`;']]);
});

test('ROJO: un punto medio suelto en una plantilla', () => {
  assert.equal(lineasConPunto('<span>\u00b7 {{ x }}</span>', 'a.html').length, 1);
});

test('ROJO: el que va en un `content` de SCSS', () => {
  assert.equal(lineasConPunto("&::before { content: '\u00b7 '; }", 'a.scss').length, 1);
});

test('VERDE: en comentarios de línea, de bloque y de plantilla no cuenta', () => {
  assert.equal(lineasConPunto('// a \u00b7 b\n/* c \u00b7 d */', 'a.ts').length, 0);
  assert.equal(lineasConPunto('<!-- a \u00b7 b --><p>ok</p>', 'a.html').length, 0);
});

test('VERDE: una clave interna, sin espacios, no se pinta', () => {
  assert.equal(lineasConPunto('const k = `${id}\u00b7${dir}`;', 'a.ts').length, 0);
});

test('ROJO: la clave del i18n cuyo texto lleva el punto, con su ruta', () => {
  assert.deepEqual(clavesConPunto({ a: { b: 'x \u00b7 y', c: 'x, y' } }), ['a.b']);
});

test('VERDE: un i18n sin punto no avisa', () => {
  assert.deepEqual(clavesConPunto({ a: 'x, y', b: { c: 'z' } }), []);
});

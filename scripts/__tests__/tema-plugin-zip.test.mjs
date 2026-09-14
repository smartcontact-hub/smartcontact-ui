import { test } from 'node:test';
import assert from 'node:assert/strict';

import { declaraciones, elegirTema, normalizar, pesosConPx, resolver, soloDensidad } from '../tema-plugin-zip.mjs';

test('elegirTema: el valor de su tema, también anidado (así lo escriben Aura y el plugin)', () => {
  const v = 'light-dark(light-dark(#dadfe6, #e4e4e7), light-dark(#4f5663, #3f3f46))';
  assert.equal(elegirTema(v, 'claro'), '#dadfe6');
  assert.equal(elegirTema(v, 'oscuro'), '#3f3f46');
  assert.equal(elegirTema('0 1px light-dark(#aaa, #bbb)', 'oscuro'), '0 1px #bbb');
});

test('normalizar: la misma cosa escrita distinto compara igual', () => {
  assert.equal(normalizar('0.625rem'), '10px');
  assert.equal(normalizar('rgba(0, 0, 0, 0.4)'), normalizar('rgb(0 0 0 / 0.4)'));
  assert.equal(normalizar('transparent'), '#00000000');
  assert.equal(normalizar('#FFFFFFFF'), '#ffffff');
  assert.equal(normalizar('200ms'), '0.2s');
  assert.notEqual(normalizar('#dadfe6'), normalizar('#c6ccd6'));
});

test('resolver: sigue var() en su tema y el oscuro cae al claro', () => {
  const m = declaraciones(':root { --sc-a: #fff; --p-x: var(--sc-a); --p-y: var(--nada, 4px); } .sc-dark { --sc-a: #000; }');
  assert.equal(resolver(m, 'claro|--p-x'), '#fff');
  assert.equal(resolver(m, 'oscuro|--p-x'), '#000');
  assert.equal(resolver(m, 'claro|--p-y'), '4px');
});

test('soloDensidad: ×16/14 en todas las longitudes y la misma forma; nada más', () => {
  assert.equal(soloDensidad('8px 12px', '7px 10.5px'), true);
  assert.equal(soloDensidad('20px', '15.75px'), false, 'Figma cambió la medida: no es solo raíz');
  assert.equal(soloDensidad('#fff', '#fff'), false);
  assert.equal(soloDensidad('8px', '8px'), false, 'igual no es densidad');
});

test('pesos con px: los caza (CSS inválido) y deja pasar los números', () => {
  const m = new Map([['claro|--p-typography-font-weight-bold', '600px'], ['claro|--p-tag-font-weight', '700'], ['claro|--p-button-padding-x', '10px']]);
  assert.deepEqual(pesosConPx(m), ['claro|--p-typography-font-weight-bold']);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PNG } from 'pngjs';

import { comparar, parejas, renderMarkdown } from '../tokens-sync-capturas.mjs';

/** PNG de 20×10 de un color, con un bloque de 4×4 de otro si se pide. */
const png = (rgb, bloque = null) => {
  const img = new PNG({ width: 20, height: 10 });
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 20; x++) {
      const i = (y * 20 + x) * 4;
      const c = bloque && x < 4 && y < 4 ? bloque : rgb;
      [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]] = [...c, 255];
    }
  }
  return PNG.sync.write(img);
};

test('parejas: junta antes y después por ruta y tema, y descarta las cojas', () => {
  const p = parejas(['admin_usuarios--claro--antes.png', 'admin_usuarios--claro--despues.png', 'admin_grupos--oscuro--antes.png', 'resumen.json']);
  assert.deepEqual(p, [{ ruta: 'admin/usuarios', tema: 'claro', antes: 'admin_usuarios--claro--antes.png', despues: 'admin_usuarios--claro--despues.png' }]);
});

test('comparar: 0 con la misma imagen; cuenta el bloque que cambia de color de marca; tamaño distinto = todo', () => {
  const blanco = [255, 255, 255];
  assert.equal(comparar(png(blanco), png(blanco)).distintos, 0);
  assert.equal(comparar(png(blanco), png(blanco, [20, 100, 254])).distintos, 16);
  const grande = new PNG({ width: 30, height: 10 });
  assert.equal(comparar(png(blanco), PNG.sync.write(grande)).distintos, 200);
});

test('markdown: solo enseña lo que cambia, y dice en voz alta cuando no cambia nada', () => {
  const base = { antes: 'a.png', despues: 'd.png', total: 1000 };
  const md = renderMarkdown([{ ...base, ruta: 'admin/usuarios', tema: 'claro', distintos: 50 }, { ...base, ruta: 'admin/grupos', tema: 'claro', distintos: 0 }], 'https://x/y');
  assert.match(md, /Cambian 1 de 2 pantallas/);
  assert.match(md, /admin\/usuarios<\/b> · claro · 5\.0 %/);
  assert.doesNotMatch(md, /admin\/grupos/);
  assert.match(md, /<img src="https:\/\/x\/y\/d\.png"/);
  assert.match(renderMarkdown([{ ...base, ruta: 'r', tema: 'claro', distintos: 0 }], '.'), /Ninguna de las 1 pantallas cambia/);
  assert.match(renderMarkdown([], '.'), /No hay capturas/);
});

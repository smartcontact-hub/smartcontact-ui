// El enlace de una story de sc-docs (`story-url.core.mjs`): su nombre en la URL y los valores de sus controles, ida y
// vuelta sin perder el tipo. node:test, dentro de `test:unit`.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  codificarArgs,
  decodificarArgs,
  slugHistoria,
  urlDeHistoria,
} from '../../projects/sc-docs/src/app/storybook/story-url.core.mjs';

test('slugHistoria: minúsculas, sin acentos, lo demás a guiones', () => {
  assert.equal(slugHistoria('Solo icono'), 'solo-icono');
  assert.equal(slugHistoria('Pulsación (táctil)'), 'pulsacion-tactil');
  assert.equal(slugHistoria('  «Raised» del Kit  '), 'raised-del-kit');
  assert.equal(slugHistoria('Playground'), 'playground');
});

test('codificarArgs: solo lo que cambia respecto a la story, en el orden de los controles', () => {
  const base = { label: 'Guardar', variant: 'primary', loading: false, size: 'md' };
  const args = { ...base, loading: true, variant: 'danger' };
  assert.equal(codificarArgs(args, base, ['label', 'variant', 'size', 'loading']), 'variant:danger;loading:!true');
  assert.equal(codificarArgs(base, base), '');
});

test('codificarArgs/decodificarArgs: ida y vuelta con cada tipo, y el texto que choca con el formato', () => {
  const args = { a: 'texto: con ; y %', b: true, c: false, d: null, e: 12.5, f: '!no soy un literal', g: '', h: 0 };
  const texto = codificarArgs(args, {});
  assert.deepEqual(decodificarArgs(texto), args);
});

test('codificarArgs: lo que no cabe en una URL (objetos, funciones) se queda fuera', () => {
  assert.equal(codificarArgs({ opciones: [1, 2], fn: () => 1, label: 'x' }, {}), 'label:x');
});

test('decodificarArgs: descarta lo que no es un control de la story, y un % roto no tumba el resto', () => {
  assert.deepEqual(decodificarArgs('variant:danger;onclick:alert;label:hola', ['variant', 'label']), {
    variant: 'danger',
    label: 'hola',
  });
  assert.deepEqual(decodificarArgs('label:%E0%A4%A;size:lg'), { size: 'lg' });
  assert.deepEqual(decodificarArgs(null), {});
  assert.deepEqual(decodificarArgs('sinvalor;:vacio'), {});
});

test('urlDeHistoria: la página, la story y lo demás como query del hash', () => {
  assert.equal(urlDeHistoria({ pagina: 'button', historia: 'variantes' }), '#/components/button?historia=variantes');
  assert.equal(
    urlDeHistoria({ pagina: 'button', historia: 'playground', args: 'variant:danger', solo: true, extra: { tema: 'oscuro', ancho: '' } }),
    '#/components/button?historia=playground&args=variant%3Adanger&solo=1&tema=oscuro',
  );
});

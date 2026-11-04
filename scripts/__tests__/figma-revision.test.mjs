import { test } from 'node:test';
import assert from 'node:assert/strict';

import { costura, scriptDeRevision } from '../../tools/figma-revision.mjs';

// Las notas que se quitaron del Figma del Supervisor el 2026-11-04: si una deja de cazarse, la revisión miente.
const COSTURAS_REALES = [
  'Limitaciones del Kit de Figma',
  'El selectbutton de Figma llega a 4. Se ha compuesto con 5 togglebutton. En código no hay tope.',
  'Repository card (propia; componente local): borde de tono, marcada',
  'Propio de esta pantalla (candidato a subir al DS)',
  'Ya viene del shell; no se ha tocado.',
  'El DS de Figma no tiene variante de tono «label»: el tono va sobrescrito con las paletas.',
  'Por decidir',
  'Único componente local (ni en el DS de Figma ni en ui.smart-contact.com): la vista del agente.',
  'Va con el SCSS de sc-list-page.',
  'Lo decide DD-239.',
];

// Notas para desarrollo que tienen que pasar.
const NOTAS_BUENAS = [
  'Usad estos componentes tal cual. El filtro por categoría tiene cinco opciones.',
  'Botón con icono, cifra, nombre y descripción. No está en nuestro DS ni en PrimeNG.',
  'Naranja: propio de esta pantalla. No está en nuestro DS ni en PrimeNG: hay que construirlo.',
  'Piezas propias',
  'Al pasar, el borde toma el tono fuerte de su categoría (1 px).',
];

test('caza cada costura que se limpió del Figma', () => {
  for (const nota of COSTURAS_REALES) assert.ok(costura(nota), `no caza: ${nota}`);
});

test('deja pasar las notas para desarrollo', () => {
  for (const nota of NOTAS_BUENAS) assert.equal(costura(nota), null, `caza de más: ${nota}`);
});

test('el script lleva la página como dato y los mismos patrones', () => {
  const js = scriptDeRevision('↳ Tipificaciones');
  assert.match(js, /"↳ Tipificaciones"/);
  assert.match(js, /componentes\? locale\?s\?/);
  assert.match(js, /return \{ pagina: page\.name, costuras, sinEstilo, menusApretados \}/);
});

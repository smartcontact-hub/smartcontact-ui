import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ZONAS, exceso, literalesDe } from '../audit-css-literals.mjs';

/*
 * El gate nació de tres literales que nadie veía (2026-10-09): `line-height: 1.45` en la ayuda de
 * los campos del DS, `1.4` en el título de `sc-dialog` y `letter-spacing: -0.01em` en el de
 * `sc-section-card`. Cada uno tiene aquí su caso: si el patrón deja de verlos, el test enrojece.
 */

test('tipografía: caza los tres literales que se colaron, en selectores de clase, de elemento y dentro de @media', () => {
  const scss = `
    .sc-field-msg { font-size: var(--sc-font-size-100); line-height: 1.45; }
    h2 { line-height: 1.4 }
    @media (min-width: 40rem) { .title { letter-spacing: -0.01em; } }
  `;
  assert.deepEqual(literalesDe(scss, 'tipografia'), ['line-height: 1.45', 'line-height: 1.4', 'letter-spacing: -0.01em']);
});

test('tipografía: lo atado a variable, lo que no fija nada y los comentarios no cuentan', () => {
  const scss = `
    /* antes: line-height: 1.45 */
    .a { line-height: var(--sc-line-height-caption); font-weight: var(--sc-font-weight-semibold); }
    .b { font-size: inherit; letter-spacing: normal; min-height: 1lh; line-height: 1lh; }
    // font-size: 13px
    .c { font-size: calc(var(--sc-font-size-200) * 1); }
  `;
  assert.deepEqual(literalesDe(scss, 'tipografia'), []);
});

test('espaciado: caza px, rem y em a mano, también dentro de un calc() con variable', () => {
  const scss = `
    .a { gap: 2px; padding: 3px var(--sc-spacing-0-5); }
    .b { padding-inline-start: calc(var(--sc-spacing-0-625) + 22px); margin-top: -0.5em; }
    .c { margin-block-end: 1rem; }
  `;
  assert.deepEqual(literalesDe(scss, 'espaciado'), [
    'gap: 2px',
    'padding: 3px var(--sc-spacing-0-5)',
    'padding-inline-start: calc(var(--sc-spacing-0-625) + 22px)',
    'margin-top: -0.5em',
    'margin-block-end: 1rem',
  ]);
});

test('espaciado: variables, cero y auto no cuentan; una variable con px de reserva tampoco', () => {
  const scss = `
    .a { gap: var(--sc-spacing-1); padding: 0; margin: 0 auto; }
    .b { padding-block: var(--sc-spacing-0-5) var(--sc-spacing-1); margin-inline: var(--x, 4px); }
    .c { border-width: 1px; inline-size: 24px; }
  `;
  assert.deepEqual(literalesDe(scss, 'espaciado'), []);
});

test('el trinquete: por encima del tope falla, por debajo pide bajarlo, en el tope calla', () => {
  const zona = { nombre: 'DS · tipografía', max: 15 };
  assert.match(exceso(zona, 16), /16 declaraciones .* el tope es 15/);
  assert.match(exceso(zona, 14), /Baja su `max` a 14/);
  assert.equal(exceso(zona, 15), null);
});

test('las cuatro zonas: DS y Supervisor, tipografía y espaciado', () => {
  assert.deepEqual(
    ZONAS.map((z) => z.nombre),
    ['DS · tipografía', 'DS · espaciado', 'Supervisor · tipografía', 'Supervisor · espaciado'],
  );
});

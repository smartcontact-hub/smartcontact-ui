import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CAJAS_A_MANO,
  CAJAS_A_MANO_MOTIVO,
  HOJA_COMPARTIDA,
  HOJA_REFERENCIA,
  VOCABULARIO,
  aplanar,
  cajasAMano,
  componer,
  diferencias,
  esHojaDePantalla,
  sangraContenido,
  sinComentarios,
  usaCajaCard,
  vocabularioDe,
} from '../audit-screen-vocabulary.mjs';

/*
 * Lo que este gate afirma es «este nombre está declarado con ESTOS valores en ESTA
 * hoja», así que lo que hay que probar es el PARSER: si aplana mal, el gate compara dos
 * cosas que no son las que pone el fichero y su rojo (o su verde) no significa nada.
 *
 * Dos casos merecen su test por haber fallado de verdad al construirlo (2026-09-10):
 * el selector escrito en LISTA (`&__label, &__label-inline`), que se perdía entero y
 * dejaba pasar la divergencia más repetida del repo; y las @-reglas, cuyo cuerpo es
 * condicional y no se puede comparar con uno de fuera.
 */

/* ── sinComentarios ───────────────────────────────────────────────────────── */

test('un valor citado en un comentario NO cuenta como declaración', () => {
  const reglas = aplanar('/* .grid { gap: 99px } */\n.grid { column-gap: 1px; }');
  assert.deepEqual(reglas.get('.grid'), { 'column-gap': '1px' });
});

test('sinComentarios no se come una URL con //', () => {
  assert.match(sinComentarios('.a { background: url(https://x/y.png); }'), /https:\/\/x/);
});

/* ── componer ─────────────────────────────────────────────────────────────── */

test('pega el sufijo BEM al padre', () => {
  assert.equal(componer('.field', '&__label'), '.field__label');
  assert.equal(componer('.grid', '&--2'), '.grid--2');
});

test('una LISTA resuelve todas sus ramas, no ninguna', () => {
  assert.equal(componer('.field', '&__label,\n  &__label-inline'), '.field__label .field__label-inline');
});

test('las ramas que no son nombres de vocabulario se descartan', () => {
  for (const rama of ['& + &', '&:hover', '& > sc-icon', '&::placeholder', 'thead th']) {
    assert.equal(componer('.field', rama), '', rama);
  }
});

/* ── aplanar ──────────────────────────────────────────────────────────────── */

test('el selector en LISTA registra CADA nombre por separado', () => {
  const reglas = aplanar('.field {\n  display: flex;\n  &__label,\n  &__label-inline {\n    font-size: 12px;\n  }\n}');
  assert.deepEqual(reglas.get('.field__label'), { 'font-size': '12px' });
  assert.deepEqual(reglas.get('.field__label-inline'), { 'font-size': '12px' });
  assert.equal(reglas.has('.field__label .field__label-inline'), false);
});

test('lo que va dentro de una @-regla NO se compara con lo de fuera', () => {
  const reglas = aplanar('.grid {\n  column-gap: 10px;\n}\n@media (max-width: 720px) {\n  .grid { column-gap: 0; }\n}');
  assert.deepEqual(reglas.get('.grid'), { 'column-gap': '10px' });
});

test('la última declaración de un bloque cuenta aunque no lleve `;`', () => {
  assert.deepEqual(aplanar('.a { color: red }').get('.a'), { color: 'red' });
});

/* ── diferencias ──────────────────────────────────────────────────────────── */

test('una propiedad que solo tiene un lado sale como ausencia, no se calla', () => {
  const filas = diferencias({ gap: '7px' }, {});
  assert.deepEqual(filas, [{ propiedad: 'gap', referencia: '7px', otro: '—' }]);
});

test('mismos valores = ninguna fila', () => {
  assert.deepEqual(diferencias({ gap: '7px' }, { gap: '7px' }), []);
});

/* ── cajasAMano ───────────────────────────────────────────────────────────── */

test('caja = fondo + borde + radio, y el nombre habla de sección', () => {
  const scss = '.card { background: #fff; border: 1px solid #ccc; border-radius: 12px; }';
  assert.deepEqual(cajasAMano(scss).map((c) => c.selector), ['.card']);
});

test('NO es caja lo que no tiene las tres, ni lo que no es de nivel de sección', () => {
  assert.deepEqual(cajasAMano('.card { background: #fff; border-radius: 12px; }'), []);
  assert.deepEqual(cajasAMano('.card { background: #fff; border: 0; border-radius: 12px; }'), []);
  assert.deepEqual(
    cajasAMano('.chip { background: #fff; border: 1px solid #ccc; border-radius: 999px; }'),
    [],
  );
});

test('lo de la caja solo se mira en hojas de PÁGINA o de SECCIÓN', () => {
  assert.equal(esHojaDePantalla('a/b/sistema-page.component.scss'), true);
  assert.equal(esHojaDePantalla('a/sections/numeracion-especial-section.component.scss'), true);
  // un panel lateral, un modal o una tabla son muebles distintos: su caja es suya
  assert.equal(esHojaDePantalla('a/components/label-form-panel/label-form-panel.component.scss'), false);
  assert.equal(esHojaDePantalla('projects/supervisor/src/styles/_sc-list-table.scss'), false);
});

/* ── contra los ficheros REALES ───────────────────────────────────────────── */

test('la hoja de REFERENCIA existe y declara vocabulario del que leer el canon', () => {
  const canon = vocabularioDe(readFileSync(HOJA_REFERENCIA, 'utf8'));
  assert.ok(canon.size > 0, 'sin canon el gate no compara contra nada');
});

test('el vocabulario de formulario vive en la hoja COMPARTIDA, no en una pantalla', () => {
  const compartida = vocabularioDe(readFileSync(HOJA_COMPARTIDA, 'utf8'));
  for (const nombre of ['.grid', '.grid--2', '.field', '.field__label']) {
    assert.ok(compartida.has(nombre), `${nombre} debería declararse en ${HOJA_COMPARTIDA}`);
  }
});

test('`.grid` compartida usa las dos separaciones de la maqueta, no un `gap` único', () => {
  const props = vocabularioDe(readFileSync(HOJA_COMPARTIDA, 'utf8')).get('.grid');
  assert.equal(props['column-gap'], 'var(--sc-spacing-1-75)');
  assert.equal(props['row-gap'], 'var(--sc-spacing-0-875)');
  assert.equal(props['gap'], undefined, 'un `gap` único vuelve a igualar los dos ejes');
});

test('toda entrada del trinquete lleva su motivo, y todo motivo su entrada', () => {
  for (const ruta of Object.keys(CAJAS_A_MANO)) {
    assert.ok(CAJAS_A_MANO_MOTIVO[ruta], `${ruta} sin motivo escrito`);
  }
  for (const ruta of Object.keys(CAJAS_A_MANO_MOTIVO)) {
    assert.ok(ruta in CAJAS_A_MANO, `${ruta} tiene motivo pero no está en el trinquete`);
  }
});

test('VOCABULARIO no tiene nombres repetidos', () => {
  assert.equal(new Set(VOCABULARIO).size, VOCABULARIO.length);
});

/* ── el contrato de `surface="card"` ──────────────────────────────────────── */

/*
 * Esta es la comprobación que faltaba el 2026-09-10: `sistema-page` pasó a la caja del DS con
 * sus cinco cards midiendo EXACTAS —radio, borde, paddings, todo verde— y aun así el título
 * salía a 37.75 del filo con el contenido a 25.5, porque la cabecera se sangra 12.25 a sí misma
 * y el contenido no la llevaba. Medir la caja no basta; hay que medir la RELACIÓN.
 */

test('detecta quién usa la caja `card`, y no confunde la palabra en un comentario', () => {
  assert.equal(usaCajaCard('<sc-section-card surface="card">x</sc-section-card>'), true);
  assert.equal(usaCajaCard('<sc-section-card>x</sc-section-card>'), false);
  assert.equal(usaCajaCard('<!-- antes era surface="card" --><sc-section-card>x</sc-section-card>'), false);
});

test('la sangría del contenido se reconoce por `.sub-section`, también junto a otras clases', () => {
  assert.equal(sangraContenido('<div class="sub-section">x</div>'), true);
  assert.equal(sangraContenido('<section class="sub-section sub-section--x">x</section>'), true);
  assert.equal(sangraContenido('<div class="card__body">x</div>'), false);
  // no vale que el nombre solo aparezca en un comentario
  assert.equal(sangraContenido('<!-- usa sub-section --><div class="card__body">x</div>'), false);
  // ni que sea otra clase que EMPIEZA igual
  assert.equal(sangraContenido('<div class="sub-sectioning">x</div>'), false);
});

test('toda plantilla que usa `surface="card"` sangra su contenido', () => {
  const rutas = execSync(
    "find projects/supervisor/src/app -name '*.component.html'",
    { encoding: 'utf8' },
  )
    .split('\n')
    .filter(Boolean);
  for (const ruta of rutas) {
    const html = readFileSync(ruta, 'utf8');
    if (!usaCajaCard(html)) continue;
    assert.ok(sangraContenido(html), `${ruta} usa la caja card y no sangra su contenido`);
  }
});

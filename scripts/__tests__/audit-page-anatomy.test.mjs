import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ANCHOS_PENDIENTES,
  ARQUETIPOS,
  EXENTAS,
  anchosSueltos,
  arquetipoDe,
  maxWidthEnInner,
  redeclaraMolde,
  revisarPagina,
} from '../audit-page-anatomy.mjs';

/*
 * El valor de este gate está en no dar falsos positivos: casi todo el SCSS de una
 * página menciona el molde en sus comentarios (los punteros que dejó DD-53), y un
 * guardián que se queja de un comentario enseña a ignorarlo (LEARNINGS #2). Por eso
 * los ejes de EXCLUSIÓN se prueban antes que los de detección, y el caso verde se
 * mide contra los ficheros REALES, no contra un fixture amable.
 */

/* ── arquetipoDe ──────────────────────────────────────────────────────────── */

test('detecta el arquetipo declarado en la plantilla', () => {
  const r = arquetipoDe('<div class="page__inner page__inner--list">x</div>');
  assert.equal(r.tiene, true);
  assert.deepEqual(r.modificadores, ['list']);
});

test('sin modificador = editor por defecto, no ausencia de arquetipo', () => {
  const r = arquetipoDe('<div class="page__inner">x</div>');
  assert.equal(r.tiene, true);
  assert.deepEqual(r.modificadores, []);
});

test('EXCLUYE lo que solo aparece en un comentario HTML', () => {
  assert.equal(arquetipoDe('<!-- usa page__inner--list --><div>x</div>').tiene, false);
});

test('caza dos arquetipos a la vez', () => {
  const r = arquetipoDe('<div class="page__inner page__inner--list page__inner--hub">x</div>');
  assert.deepEqual(r.modificadores.sort(), ['hub', 'list']);
});

/* ── redeclaraMolde ───────────────────────────────────────────────────────── */

test('EXCLUYE el molde nombrado en comentarios (los punteros de DD-53)', () => {
  const scss = `/* El MOLDE no vive aquí: .page__inner--with-panel y .page__form están en
   * styles/_page.scss, y .ipanel en styles/_forms.scss. */
.page {
  background: var(--sc-bg-surface);
}`;
  assert.deepEqual(redeclaraMolde(scss), []);
});

test('caza una página que vuelve a declarar el rail', () => {
  assert.deepEqual(redeclaraMolde('.ipanel {\n  position: sticky;\n}'), ['.ipanel']);
});

test('caza el modificador y la columna re-declarados', () => {
  const scss =
    '.page {\n  &__inner {\n    &--with-panel { display: grid; }\n  }\n  &__form { max-width: 1100px; }\n}';
  assert.deepEqual(redeclaraMolde(scss).sort(), ['--with-panel', '.page__form']);
});

/* ── maxWidthEnInner ──────────────────────────────────────────────────────── */

test('caza un max-width que pisa el arquetipo desde el SCSS de la página', () => {
  assert.equal(maxWidthEnInner('.page {\n  &__inner {\n    max-width: 900px;\n  }\n}'), 1);
});

test('EXCLUYE un max-width que vive en otro bloque de la misma página', () => {
  assert.equal(maxWidthEnInner('.page {\n  &__search {\n    max-width: 480px;\n  }\n}'), 0);
});

/* ── anchosSueltos ────────────────────────────────────────────────────────── */

test('caza los dos anchos que la Ola 3 dijo cerrar y no cerró (1100px y 78rem)', () => {
  assert.equal(anchosSueltos('.x { max-width: 1100px; }\n.y { max-width: 78rem; }'), 2);
});

test('EXCLUYE anchos pequeños legítimos (480px, 56ch, 20rem)', () => {
  assert.equal(
    anchosSueltos('.a { max-width: 480px; }\n.b { max-width: 56ch; }\n.c { max-width: 20rem; }'),
    0,
  );
});

test('EXCLUYE la CONDICIÓN de una media query, que no es una declaración', () => {
  assert.equal(anchosSueltos('@media (max-width: 1024px) {\n  .a { display: block; }\n}'), 0);
});

/* ── revisarPagina: verde sobre lo real, rojo con la regresión puesta ──────── */

const RUTA_REAL =
  'projects/supervisor/src/app/features/admin/users/pages/user-form-page.component';
const htmlReal = readFileSync(`${RUTA_REAL}.html`, 'utf8');
const scssReal = readFileSync(`${RUTA_REAL}.scss`, 'utf8');

test('el alta de usuario REAL pasa el gate', () => {
  assert.deepEqual(revisarPagina(`${RUTA_REAL}.html`, htmlReal, scssReal), []);
});

test('ROJO: una página sin arquetipo y no exenta', () => {
  const p = revisarPagina(
    'projects/supervisor/src/app/x-page.component.html',
    '<div class="page">x</div>',
    null,
  );
  assert.equal(p.length, 1);
  assert.match(p[0][0], /no declara arquetipo/);
});

test('ROJO: arquetipo inventado', () => {
  const p = revisarPagina('x.html', '<div class="page__inner page__inner--ancho">x</div>', null);
  assert.match(p[0][0], /arquetipo desconocido/);
});

test('ROJO: la página real con el molde re-declarado encima', () => {
  const p = revisarPagina(
    `${RUTA_REAL}.html`,
    htmlReal,
    `${scssReal}\n.ipanel { position: sticky; }`,
  );
  assert.equal(p.length, 1);
  assert.match(p[0][0], /re-declara `\.ipanel`/);
});

test('ROJO: una exención que ya caducó (la página declara arquetipo)', () => {
  const ruta = Object.keys(EXENTAS)[0];
  const p = revisarPagina(ruta, '<div class="page__inner">x</div>', null);
  assert.match(p[0][0], /YA declara arquetipo/);
});

/* ── higiene de las listas ────────────────────────────────────────────────── */

test('EXENTAS: cada excepción trae su motivo escrito', () => {
  for (const [ruta, motivo] of Object.entries(EXENTAS)) {
    assert.ok(motivo && motivo.length > 20, `${ruta} necesita un motivo, no una etiqueta`);
  }
});

test('las listas están ordenadas y sin duplicados', () => {
  const claves = Object.keys(EXENTAS);
  assert.deepEqual(claves, [...new Set(claves)].sort());
  const anchos = Object.keys(ANCHOS_PENDIENTES);
  assert.deepEqual(anchos, [...new Set(anchos)].sort());
});

test('ARQUETIPOS cuadra con lo que declara _page.scss', () => {
  const page = readFileSync('projects/supervisor/src/styles/_page.scss', 'utf8');
  for (const mod of ARQUETIPOS) {
    assert.match(page, new RegExp(`&--${mod}\\s*\\{`), `_page.scss no declara --${mod}`);
  }
});

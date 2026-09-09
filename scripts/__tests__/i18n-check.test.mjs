import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clavesPedidas,
  copyAPelo,
  divergencias,
  flat,
  localesClavados,
  vars,
} from '../i18n-check.mjs';

// Las seis funciones son PURAS sobre el texto → fixtures directos, sin tocar el disco.
// Cada test es un fallo REAL medido el 2026-09-09 en el Supervisor, o el falso positivo que
// apareció al escribir la regla. Un gate de i18n que solo caza lo fácil deja pasar lo que se ve
// en pantalla, que es lo caro.

test('claves pedidas: las coge del pipe y de translate.instant', () => {
  const html = `<h1>{{ 'memory.rules.page_title' | translate }}</h1>`;
  const ts = `const t = this.translate.instant('common.delete_dialog.reset');`;
  assert.deepEqual([...clavesPedidas(html)], ['memory.rules.page_title']);
  assert.deepEqual([...clavesPedidas(ts)], ['common.delete_dialog.reset']);
});

test('claves pedidas: NO confunde cualquier `.get(...)` con una traducción', () => {
  // El eje que hacía inservible la primera versión: `paramMap.get('id')` y `cache.get(...)`
  // daban claves fantasma, y con cuatro falsos positivos nadie mira el listado.
  const ts = `
    const idParam = this.route.snapshot.paramMap.get('id');
    const x = this.cache.get('agents.channel');
  `;
  assert.deepEqual([...clavesPedidas(ts)], []);
});

test('claves pedidas: ignora el prefijo que el código concatena', () => {
  // `'config.seguridad.policies.min_length_options.' + n` no es una clave: la clave es la suma.
  const html = `{{ 'config.seguridad.policies.min_length_options.' + n | translate }}`;
  assert.deepEqual([...clavesPedidas(html)], []);
});

test('copy a pelo: caza el atributo estático con texto', () => {
  // Los que se colaron de verdad: la sidebar decía "Navegación principal" también en francés.
  assert.deepEqual(copyAPelo(`<aside aria-label="Navegación principal">`), [
    'aria-label="Navegación principal"',
  ]);
  assert.equal(copyAPelo(`<input placeholder="Nombre del agente" />`).length, 1);
  assert.equal(copyAPelo(`<img alt="SmartContact, a Digital Virgo tool" />`).length, 1);
});

test('copy a pelo: caza el literal dentro de un binding', () => {
  const html = `<sc-cell [ariaLabel]="'Renombrar ' + agent.name" />`;
  assert.deepEqual(copyAPelo(html), [`'Renombrar '`]);
});

test('copy a pelo: lo que SÍ pasa por i18n no se marca', () => {
  const ok = [
    `<aside [attr.aria-label]="'common.form_index_aria' | translate">`,
    // clave compuesta por concatenación: el literal es un prefijo, no copy
    `<span [title]="'agents.channel.' + channel | translate">`,
    // separador sin letras entre dos claves traducidas
    `<td [attr.aria-label]="('a.row_' + r | translate) + ' — ' + ('a.col_' + c | translate)">`,
    // literal de comparación: es lógica, no texto que lea nadie
    `<i [title]="(trend === 'up' ? 'm.trend_up' : 'm.trend_down') | translate">`,
    // dentro de un comentario no hay UI
    `<!-- aria-label="Índice del formulario" -->`,
  ];
  for (const html of ok) assert.deepEqual(copyAPelo(html), [], html);
});

test('locale clavado: distingue el formato del idioma de otros toLocale…', () => {
  assert.deepEqual(localesClavados(`date.toLocaleDateString('es-ES', { day: 'numeric' })`), [
    'es-ES',
  ]);
  assert.deepEqual(localesClavados(`n.toLocaleString('es-ES')`), ['es-ES']);
  assert.deepEqual(localesClavados(`s.toLocaleUpperCase()`), []);
  assert.deepEqual(localesClavados(`date.toLocaleDateString(this.language.locale())`), []);
});

test('divergencias: una frase con dos traducciones en el mismo idioma sale en rojo', () => {
  // Medido: "usuario" era `utilizador` (Portugal) en un sitio y `usuário` (Brasil) en otro.
  const ref = { a: 'usuario', b: 'usuario' };
  const pt = { a: 'utilizador', b: 'usuário' };
  const d = divergencias(ref, pt, 'pt', []);
  assert.equal(d.length, 1);
  assert.equal(d[0][0], 'usuario');
});

test('divergencias: la excepción razonada calla, y solo en su idioma', () => {
  // La concordancia de género es divergencia LEGÍTIMA: "seleccionada" acompaña a plantilla
  // (fem. en es) pero a `modèle` (masc. en fr).
  const ref = { a: 'seleccionada', b: 'seleccionada' };
  const fr = { a: 'sélectionnée', b: 'sélectionné' };
  const exc = [{ locales: ['fr'], frases: ['seleccionada'], motivo: 'género' }];
  assert.deepEqual(divergencias(ref, fr, 'fr', exc), []);
  assert.equal(divergencias(ref, fr, 'pt', exc).length, 1);
});

test('variables: la comparación es por nombre, no por orden ni por espacios', () => {
  assert.equal(vars('Abrir {{id}} — {{state}}'), vars('Open {{ state }} · {{id}}'));
  assert.notEqual(vars('Abrir conversación {{id}}'), vars('Open conversation'));
});

test('flat: aplana a dot-path y deja el array como hoja', () => {
  assert.deepEqual(flat({ a: { b: 'x' }, c: ['y'] }), { 'a.b': 'x', c: ['y'] });
});

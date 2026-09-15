import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { FICHEROS, cerosNuevos, comparaPreset, contratoDelPlugin, diferencias, extendDesdeKit, ficherosDistintos, hayCambios, leeme, paqueteNpm, retirados, variables } from '../tema-zip.mjs';

const hoja = ($value) => ({ $value });
const CUSTOM = {
  primitive: { typography: { font: { size: { 100: hoja(12), 950: hoja(70) }, weight: { semibold: hoja(600) } } } },
  semantic: { text: { accent: hoja('{violet.400}') }, presence: { available: hoja('{green.400}') } },
  component: { custommodal: { header: { gap: hoja('{scale.0-5}') }, footer: { padding: { top: hoja(0) } } } },
  app: { typography: { md: { fontSize: hoja('{primitive.typography.font.size.200}') }, xl: { lineHeight: hoja('{primitive.typography.line.height.300}') } } },
};

test('extend del plugin: a nuestro token si existe, el valor del Kit si no, y lo nuestro gana', () => {
  const declaradas = new Set(['--sc-font-size-100', '--sc-font-weight-semibold', '--sc-scale-0-5']);
  const e = extendDesdeKit(CUSTOM, declaradas, { app: { typography: { md: { fontSize: 'var(--sc-font-size-200)' } } } });
  assert.equal(e.primitive.typography.font.size[100], 'var(--sc-font-size-100)');
  assert.equal(e.primitive.typography.font.size[950], '70px', 'sin token, el valor del Kit');
  assert.equal(e.primitive.typography.font.weight.semibold, 'var(--sc-font-weight-semibold)');
  assert.equal(e.semantic.text.accent, 'var(--sc-text-accent)', 'divergencia escrita: manda el DS');
  assert.equal(e.semantic.presence.available, '{green.400}', 'sin divergencia: el Kit');
  assert.equal(e.component.custommodal.header.gap, 'var(--sc-scale-0-5)');
  assert.equal(e.component.custommodal.footer.padding.top, '0');
  assert.equal(e.app.typography.md, undefined, 'lo que nuestro extend ya declara no se pisa');
  assert.equal(e.app.typography.xl.lineHeight, '{primitive.typography.line.height.300}');
  assert.equal(extendDesdeKit({ primitive: { typography: { font: { weight: { bold: hoja(700) } } } } }, new Set()).primitive.typography.font.weight.bold, '700', 'peso sin «px»');
});

test('contrato del plugin: los nombres que da el runtime (sin primitive./semantic., con component./app.)', () => {
  assert.deepEqual(contratoDelPlugin(CUSTOM), [
    '--p-typography-font-size-100', '--p-typography-font-size-950', '--p-typography-font-weight-semibold',
    '--p-text-accent', '--p-presence-available',
    '--p-component-custommodal-header-gap', '--p-component-custommodal-footer-padding-top',
    '--p-app-typography-md-font-size', '--p-app-typography-xl-line-height',
  ]);
});

test('paquete npm: versión semver válida (sin ceros delante) y solo los ficheros del tema', () => {
  const p = paqueteNpm({ commit: 'abc1234', generado: '2026-09-04T09:05:00Z' });
  assert.equal(p.version, '0.20260904.905');
  assert.match(p.version, /^\d+\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  assert.equal(p.exports['.'].default, './sc-preset.mjs');
  assert.deepEqual(p.files.filter((f) => !/\.(md|json)$/.test(f)), ['sc-preset.mjs', 'sc-preset.d.ts', 'smartcontact-tokens.css', 'smartcontact-typography.css']);
});

test('variables: separa claro y oscuro por la regla, e ignora comentarios', () => {
  const v = variables(':root { --sc-a: 1px; /* --sc-b: 2px; */ } .sc-dark { --sc-a: 3px; }');
  assert.deepEqual([...v], [['claro|--sc-a', '1px'], ['oscuro|--sc-a', '3px']]);
});

test('ceros: rojo si un token con valor pasa a 0; no si ya era 0 o si es nuevo', () => {
  const antes = new Map([['claro|--sc-x', '0.4375rem'], ['claro|--sc-y', '0'], ['claro|--sc-z', '#fff']]);
  const despues = new Map([['claro|--sc-x', '0'], ['claro|--sc-y', '0'], ['claro|--sc-z', '#fff'], ['claro|--sc-nuevo', '0']]);
  assert.deepEqual(cerosNuevos(antes, despues), ['claro|--sc-x']);
  assert.deepEqual(cerosNuevos(antes, new Map([['claro|--sc-x', '0px']])), ['claro|--sc-x'], '0px también es cero');
});

test('diferencias: cambiadas, añadidas y quitadas, ordenadas', () => {
  const a = new Map([['claro|--sc-a', '1'], ['claro|--sc-b', '2']]);
  const b = new Map([['claro|--sc-a', '1'], ['claro|--sc-b', '3'], ['claro|--sc-c', '4']]);
  assert.deepEqual(diferencias(a, b), ['claro|--sc-b', 'claro|--sc-c']);
  assert.deepEqual(diferencias(a, new Map(a)), []);
});

test('preset: un cambio SOLO en las reglas CSS globales se ve (lo que traía #160 en css.ts)', () => {
  const antes = { comun: 'c', reglas: '.p-button{line-height:normal}', componentes: { button: 'b' } };
  const ahora = { ...antes, reglas: '.p-button{line-height:var(--p-app-typography-md-line-height)}' };
  assert.deepEqual(comparaPreset(antes, ahora), { semanticaComun: false, reglasCss: true, componentes: [] });
  assert.deepEqual(comparaPreset(antes, { ...antes, componentes: { button: 'b2' } }).componentes, ['button']);
});

test('publicar: manda que cambie un fichero, aunque el desglose diga «igual»', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tema-zip-'));
  for (const d of ['a', 'b']) mkdirSync(join(dir, d));
  for (const f of FICHEROS) { writeFileSync(join(dir, 'a', f), 'x'); writeFileSync(join(dir, 'b', f), 'x'); }
  assert.deepEqual(ficherosDistintos(join(dir, 'a'), join(dir, 'b')), []);
  writeFileSync(join(dir, 'b', 'sc-preset.mjs'), 'y');
  const ficheros = ficherosDistintos(join(dir, 'a'), join(dir, 'b'));
  assert.deepEqual(ficheros, ['sc-preset.mjs']);
  assert.equal(hayCambios({ anterior: true, ficheros, variables: [], semanticaComun: false, reglasCss: false, componentes: [] }), true);
  assert.equal(hayCambios({ anterior: true, ficheros: [] }), false);
  assert.equal(hayCambios({ anterior: false, ficheros: [] }), true, 'sin zip anterior se publica');
});

test('guía: versión, cambios o primera versión, comprobaciones, raíz 16 y sin tuteo', () => {
  const base = { commit: 'abc1234', primeng: '22.0.0', themes: '3.0.0', version: '0.20260914.1133', generado: '2026-09-14T11:33:00Z' };
  const ok = { ceros: [], contratoPlugin: { promete: 65, faltan: [] } };
  const primero = leeme({ ...base, comprobaciones: { ...ok, diferencia: { anterior: false } } });
  assert.match(primero, /Primera versión distribuida como paquete/);
  assert.match(primero, /Versión 0\.20260914\.1133 · 2026-09-14/);
  assert.match(primero, /npm install \.\/local-libs\/archives\/smartcontact-tema\.tgz/, 'nombre fijo: el del enlace de descarga');
  const cambio = leeme({ ...base, comprobaciones: { ...ok, diferencia: { anterior: true, ficheros: ['sc-preset.mjs'], variables: ['x'], semanticaComun: true, reglasCss: true, componentes: ['menu', 'toast'] } } });
  assert.match(cambio, /Ficheros modificados: sc-preset\.mjs/);
  assert.match(cambio, /Tokens de diseño modificados: 1/);
  assert.match(cambio, /Estilos comunes del tema: modificados/);
  assert.match(cambio, /Reglas CSS del tema: modificadas/);
  assert.match(cambio, /menu, toast/);
  assert.match(cambio, /Variables `extend` del plugin de Figma definidas: 65 de 65/);
  assert.match(cambio, /fuente raíz de 16 px/);
  assert.doesNotMatch(cambio, /\b(vuestr[oa]s?|os pasamos|pon la|nuestras)\b/i, 'redacción neutra, sin tuteo');
});

test('retirados: nombra los tokens que desaparecen del todo, no los que solo cambian de valor o de modo', () => {
  const antes = new Map([['claro|--sc-a', '1'], ['oscuro|--sc-a', '2'], ['claro|--sc-b', '1'], ['oscuro|--sc-c', '3']]);
  const despues = new Map([['claro|--sc-a', '9'], ['claro|--sc-c', '3']]);
  assert.deepEqual(retirados(antes, despues), ['--sc-b']);
  assert.deepEqual(retirados(antes, new Map(antes)), []);
});

test('guía: los tokens retirados salen por su nombre, y sin retirados no hay línea', () => {
  const base = { commit: 'abc1234', version: '0.1', generado: '2026-09-15T10:00:00Z' };
  const ok = { ceros: [], contratoPlugin: { promete: 1, faltan: [] } };
  const dif = { anterior: true, ficheros: [], variables: ['x'], semanticaComun: false, reglasCss: false, componentes: [] };
  const con = leeme({ ...base, comprobaciones: { ...ok, diferencia: { ...dif, retirados: ['--sc-dialog-padding-x', '--sc-toast-close'] } } });
  assert.match(con, /Tokens de diseño retirados .*`--sc-dialog-padding-x`, `--sc-toast-close`/);
  const sin = leeme({ ...base, comprobaciones: { ...ok, diferencia: { ...dif, retirados: [] } } });
  assert.doesNotMatch(sin, /retirados/);
});

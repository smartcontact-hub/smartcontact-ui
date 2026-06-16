import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport } from '../token-report.mjs';

// Líneas técnicas REALES (copiadas de la salida de token-parity / token-gen-color).
const A11Y =
  '  ✗ [light] a11y: --sc-text-on-primary sobre --sc-bg-primary = 1.92:1 (< AA 4.5; #ffffff/#34d399)';
const OUT_OF_PALETTE = '    · [light] primary.color = #123456 (sin --sc-color-* primitiva)';
const COLOR_DRIFT =
  '  ✗ [light] primary.color: export=#1b273d vs --sc-bg-primary=#abcdef → pega en 02-semantic.css';
const SIZING_DRIFT = '  ✗ button.sm.padding.y: DRIFT — export=7 vs preset=8';

test('verde: sin fallos → "cuadra con el sistema"', () => {
  const md = buildReport('✓ PARIDAD OK', { failed: false });
  assert.match(md, /✅/);
  assert.match(md, /cuadra con el sistema/);
  assert.doesNotMatch(md, /❌/);
});

test('a11y: contraste bajo → frase en cristiano con ratio y hexes', () => {
  const md = buildReport(A11Y, { failed: true });
  assert.match(md, /❌/);
  assert.match(md, /Contraste insuficiente \(modo claro\)/);
  assert.match(md, /1\.92:1/);
  assert.match(md, /4\.5:1/);
  assert.match(md, /#34d399/);
});

test('dark: el modo se traduce a "modo oscuro"', () => {
  const md = buildReport(A11Y.replace('[light]', '[dark]'), { failed: true });
  assert.match(md, /modo oscuro/);
});

test('color fuera de paleta → explica usar un paso existente', () => {
  const md = buildReport(OUT_OF_PALETTE, { failed: true });
  assert.match(md, /fuera de la paleta/);
  assert.match(md, /#123456/);
});

test('color desalineado y sizing drift se reconocen', () => {
  assert.match(buildReport(COLOR_DRIFT, { failed: true }), /Color desalineado/);
  assert.match(buildReport(SIZING_DRIFT, { failed: true }), /Tamaño desalineado/);
});

test('fallo no reconocido → fallback con el detalle técnico crudo (no deja a ciegas)', () => {
  const md = buildReport('  ✗ algo rarísimo que no tiene traductor', { failed: true });
  assert.match(md, /no reconoce/);
  assert.match(md, /algo rarísimo/);
});

test('dedup: la misma línea dos veces → una sola viñeta', () => {
  const md = buildReport(`${A11Y}\n${A11Y}`, { failed: true });
  assert.equal((md.match(/Contraste insuficiente/g) || []).length, 1);
  assert.match(md, /1 cosa\(s\)/);
});

test('multi-fallo: cuenta correcta', () => {
  const md = buildReport(`${A11Y}\n${SIZING_DRIFT}`, { failed: true });
  assert.match(md, /2 cosa\(s\)/);
});

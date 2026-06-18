import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport } from '../token-report.mjs';

// Líneas técnicas REALES (copiadas de la salida de token-parity / token-gen-color).
const A11Y =
  '  ✗ [light] a11y: --sc-text-on-primary sobre --sc-bg-primary = 1.92:1 (< AA 4.5; #ffffff/#34d399)';
// Formato REAL del generador (token-gen-cmp-color): `= <resuelto> (base <base> sin --sc-color-* primitiva)`.
// (El viejo fixture `= #facc15 (sin …)` NO coincidía con la salida real → el traductor fallaba.)
const OUT_OF_PALETTE = '    · [light] primary.color = #facc1580 (base #facc15 sin --sc-color-* primitiva)';
const DS_PALETTE = [
  { name: 'sc-color-amber-400', hex: '#fbbf24' },
  { name: 'sc-color-blue-700', hex: '#1b273d' },
];
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

test('color fuera de paleta → familia no curada + "omitido, el resto fluye" (red de seguridad)', () => {
  const md = buildReport(OUT_OF_PALETTE, { failed: false }); // generador ya NO falla (no-fatal) → failed:false
  assert.match(md, /fuera de la paleta del DS/);
  assert.match(md, /#facc15/); // la BASE de 6 dígitos
  assert.match(md, /omitido/i); // deja claro que no se aplica pero el resto sí
  assert.doesNotMatch(md, /intermedio/); // el mensaje viejo era engañoso
});

test('color fuera de paleta + paleta → sugiere la primitiva EXISTENTE más cercana', () => {
  const md = buildReport(OUT_OF_PALETTE, { failed: true, palette: DS_PALETTE });
  assert.match(md, /sc-color-amber-400/); // #facc15 → más cercano amber-400 (#fbbf24)
  assert.match(md, /#fbbf24/);
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

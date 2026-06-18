import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintPreset, tokenFor } from '../cmp-color-rewire.mjs';

// El guard quedó adelgazado a la rama VIVA (anti-regresión). `lintPreset` es PURA → fixtures directos.
// `gen = { light, dark }` = Sets de tokens de color generados POR MODO.

test('tokenFor kebab-iza el path del preset', () => {
  assert.equal(
    tokenFor('toast', ['info', 'closeButton', 'focusRing', 'color']),
    'sc-cmp-toast-info-close-button-focus-ring-color',
  );
});

const PRESET = (body) => `export default { colorScheme: ${body} } satisfies ThemePreset;`;
const GEN = (...names) => ({ light: new Set(names), dark: new Set(names) });

test('CARA ROJA · hex hardcodeado en un slot GENERADO → problema (2º verde-mudo)', () => {
  const src = PRESET(`{ light: { info: { background: "#3b82f6" } } }`);
  const probs = lintPreset('toast', src, GEN('sc-cmp-toast-info-background'));
  assert.equal(probs.length, 1);
  assert.match(probs[0], /hex hardcodeado/);
});

test('CARA VERDE · var(--sc-cmp-*) correcto del slot → sin problema', () => {
  const src = PRESET(`{ light: { info: { background: "var(--sc-cmp-toast-info-background)" } } }`);
  assert.deepEqual(lintPreset('toast', src, GEN('sc-cmp-toast-info-background')), []);
});

test('CARA ROJA · var(--sc-cmp-*) que NO corresponde al slot → problema', () => {
  const src = PRESET(`{ light: { info: { background: "var(--sc-cmp-toast-info-color)" } } }`);
  const probs = lintPreset('toast', src, GEN('sc-cmp-toast-info-color', 'sc-cmp-toast-info-background'));
  assert.equal(probs.length, 1);
  assert.match(probs[0], /mapea a --sc-cmp-toast-info-background/);
});

test('CARA VERDE · hex en un slot NO generado (excluido) → se ignora (se deja a mano)', () => {
  const src = PRESET(`{ light: { warn: { color: "#f59e0b" } } }`);
  assert.deepEqual(lintPreset('toast', src, GEN()), []);
});

// POR-MODO (load-bearing): un slot generado SOLO en light, hardcodeado en dark (excluido en dark) → OK.
test('CARA VERDE · hex en DARK para un slot solo-light (excluido en dark) → NO rompe', () => {
  const src = PRESET(`{ dark: { info: { hoverBackground: "#38bdf80a" } } }`);
  const gen = { light: new Set(['sc-cmp-button-info-hover-background']), dark: new Set() };
  assert.deepEqual(lintPreset('button', src, gen), []);
});
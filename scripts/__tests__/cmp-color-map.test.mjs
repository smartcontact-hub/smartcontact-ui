import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitAlpha, toCssColor, tokenName, resolved, missing, unresolved } from '../token-gen-cmp-color.mjs';

// Mapa hex→primitiva FIJO (no depende del export) — para asertar la conversión de valor.
const MAP = new Map([
  ['#22c55e', 'sc-color-green-500'],
  ['#ffffff', 'sc-color-slate-0'],
]);

// ── conversión de valor (lo "difícil": reconstruir el alfa como color-mix) ──────
test('opaco → var(--sc-color-*)', () => {
  assert.deepEqual(toCssColor('#22c55e', MAP), { value: 'var(--sc-color-green-500)' });
});

test('translúcido #rrggbbaa → color-mix con el % correcto', () => {
  // 0x80 = 128 → 128/255 = 50%
  assert.deepEqual(toCssColor('#22c55e80', MAP), {
    value: 'color-mix(in srgb, var(--sc-color-green-500) 50%, transparent)',
  });
  // 0xf2 = 242 → 95%
  assert.deepEqual(toCssColor('#22c55ef2', MAP), {
    value: 'color-mix(in srgb, var(--sc-color-green-500) 95%, transparent)',
  });
});

test('alfa 0 → transparent (sin necesidad de primitiva)', () => {
  assert.deepEqual(toCssColor('#00000000', MAP), { value: 'transparent' });
});

test('base sin primitiva → { missing } (no inventa hex crudo)', () => {
  assert.deepEqual(toCssColor('#abcdef', MAP), { missing: '#abcdef' });
});

test('splitAlpha separa base y alfa (255 si opaco)', () => {
  assert.deepEqual(splitAlpha('#22c55e'), { base: '#22c55e', alpha: 255 });
  assert.deepEqual(splitAlpha('#22c55e80'), { base: '#22c55e', alpha: 128 });
});

test('tokenName: ruta del export → sc-cmp-<kebab>', () => {
  assert.equal(tokenName('toast.info.background'), 'sc-cmp-toast-info-background');
  assert.equal(tokenName('button.primary.hover.border.color'), 'sc-cmp-button-primary-hover-border-color');
});

// ── garantía sobre el export REAL: nada se cae en silencio ──────────────────────
test('el export real no deja NADA sin resolver ni sin primitiva (0 verde-mudo)', () => {
  assert.equal(unresolved.length, 0, `refs sin resolver:\n  ${unresolved.join('\n  ')}`);
  assert.equal(missing.length, 0, `colores sin primitiva (¿falta auto-import o EXCLUDE?):\n  ${missing.join('\n  ')}`);
});

test('el generador produce ambos idiomas sobre datos reales: var(--sc-color-*) y color-mix', () => {
  const light = resolved.find((z) => z.mode === 'light').body;
  assert.match(light, /: var\(--sc-color-[a-z0-9-]+\);/); // opaco
  assert.match(light, /color-mix\(in srgb, var\(--sc-color-[a-z0-9-]+\) \d+%, transparent\)/); // translúcido
});

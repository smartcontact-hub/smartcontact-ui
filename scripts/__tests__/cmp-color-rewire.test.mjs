import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toRGBA, eqRGBA, presetRefToCss, tokenFor, analyze } from '../cmp-color-rewire.mjs';

// ── remapa de marca de base.ts (lo "difícil": el preset NO es 1:1 con el Kit) ──────
test('presetRefToCss aplica la remapa de marca de base.ts', () => {
  assert.equal(presetRefToCss('{yellow.500}'), 'var(--sc-color-amber-500)'); // warn = amber, no yellow
  assert.equal(presetRefToCss('{orange.500}'), 'var(--sc-color-amber-500)'); // orange = amber
  assert.equal(presetRefToCss('{surface.950}'), 'var(--sc-color-gray-950)'); // surface = gray de marca
  assert.equal(presetRefToCss('{blue.500}'), 'var(--sc-color-blue-500)'); // blue = navy de marca
  assert.equal(presetRefToCss('#3b82f629'), '#3b82f629'); // hex literal pasa tal cual
});

// ── matemática de color: reconstruir RGBA terminal (hex/alfa/color-mix/var) ─────────
test('toRGBA parsea hex con y sin alfa', () => {
  assert.deepEqual(toRGBA('#3b82f6', 'light'), { r: 59, g: 130, b: 246, a: 1 });
  const t = toRGBA('#3b82f629', 'light'); // 0x29 = 41 → 41/255 ≈ 0.1608
  assert.deepEqual({ r: t.r, g: t.g, b: t.b }, { r: 59, g: 130, b: 246 });
  assert.ok(Math.abs(t.a - 41 / 255) < 1e-9);
});

test('toRGBA resuelve color-mix translúcido sobre transparent', () => {
  const c = toRGBA('color-mix(in srgb, #22c55e 16%, transparent)', 'light');
  assert.deepEqual(c, { r: 34, g: 197, b: 94, a: 0.16 });
});

test('toRGBA: transparent y no-color', () => {
  assert.deepEqual(toRGBA('transparent', 'light'), { r: 0, g: 0, b: 0, a: 0 });
  assert.equal(toRGBA('0.714286rem', 'light'), null); // blur, no es color
});

test('eqRGBA tolera el redondeo de alfa del generador (≤1.2%)', () => {
  assert.ok(eqRGBA({ r: 59, g: 130, b: 246, a: 41 / 255 }, { r: 59, g: 130, b: 246, a: 0.16 }));
  assert.ok(!eqRGBA({ r: 245, g: 158, b: 11, a: 1 }, { r: 234, g: 179, b: 8, a: 1 })); // amber ≠ yellow
});

test('tokenFor kebab-iza el path del preset', () => {
  assert.equal(tokenFor('toast', ['info', 'closeButton', 'focusRing', 'color']), 'sc-cmp-toast-info-close-button-focus-ring-color');
});

// ── INTEGRACIÓN: el repunte de toast/message es un no-op DEMOSTRABLE ────────────────
// Invariante clave (filosofía del chivato): tras excluir las divergencias de marca, NINGÚN
// slot que generamos puede cambiar el pixel. Si Figma cambiara uno a `diverge`, esto rompe.
for (const comp of ['toast', 'message']) {
  test(`analyze(${comp}): 0 diverge — todo lo generado es no-op vs lo que renderiza hoy`, () => {
    const rows = analyze(comp);
    const diverge = rows.filter((r) => r.status === 'diverge');
    assert.equal(diverge.length, 0, `slots que cambiarían el pixel: ${diverge.map((r) => `${r.mode}.${r.path}`).join(', ')}`);
    assert.ok(rows.some((r) => r.status === 'noop'), 'debe haber slots no-op repuntables');
  });
}

test('analyze(toast): clasificación de slots clave', () => {
  const rows = analyze('toast');
  const at = (mode, path) => rows.find((r) => r.mode === mode && r.path === path)?.status;
  assert.equal(at('dark', 'info.background'), 'noop'); // azure translúcido literal → fluye
  assert.equal(at('dark', 'info.color'), 'noop'); // navy {blue.500} == blue-500 generado
  assert.equal(at('dark', 'warn.background'), 'noop'); // yellow literal → fluye
  assert.equal(at('dark', 'warn.color'), 'no-token'); // amber de marca → excluido, se preserva
  assert.equal(at('dark', 'contrast.color'), 'no-token'); // surface gris de marca → excluido
});

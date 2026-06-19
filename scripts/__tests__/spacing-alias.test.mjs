import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// PARIDAD / decisión 2026-06-19: se MANTIENE el alias `--sc-spacing-*` sobre `--sc-scale-*`
// (lee como intención en el call-site; la primitiva `--sc-scale-*` ya casa 1:1 con Figma `scale/*`).
// Para que el alias NUNCA derive en una mentira tipo `soft-blue↔cyan` (nombre que se desfasó del
// valor), este test BLINDA que cada `--sc-spacing-<suf>` sea EXACTAMENTE `var(--sc-scale-<suf>)`:
// 1:1, mismo sufijo. Si alguien le mete un valor propio, ROJO.

const css = readFileSync(
  resolve(import.meta.dirname, '../../projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css'),
  'utf8',
);

test('cada --sc-spacing-<suf> es alias 1:1 de var(--sc-scale-<suf>) (mismo sufijo)', () => {
  const offenders = [];
  for (const m of css.matchAll(/--sc-spacing-([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const [, suf, value] = m;
    const expected = `var(--sc-scale-${suf})`;
    if (value.trim() !== expected) offenders.push(`--sc-spacing-${suf}: ${value.trim()} (esperado ${expected})`);
  }
  assert.equal(offenders.length, 0, `alias spacing roto (debe ser 1:1 con --sc-scale-*):\n  ${offenders.join('\n  ')}`);
});

test('sanity: el bloque spacing existe (≥20 aliases)', () => {
  const n = [...css.matchAll(/--sc-spacing-[a-z0-9-]+\s*:/g)].length;
  assert.ok(n >= 20, `solo ${n} aliases --sc-spacing-* encontrados (¿bloque movido/borrado?)`);
});

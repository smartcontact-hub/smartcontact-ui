#!/usr/bin/env node
/*
 * tokens:type-parity — comprobador SOLO-LECTURA de tipografía (font-size).
 * ============================================================================
 * Hermano de `tokens:parity` (escala/radio/color), enfocado a TIPO. Cruza los
 * `font-size` del código contra los tokens `--sc-font-size-*` (resueltos a px
 * desde la rampa redonda en rem: `font-size-X → calc(N/16*1rem) → N px`). Reporta:
 *   - cobertura: tokenizado `var(--sc-font-size-*)` vs literal px/rem
 *   - mapa valor→token más cercano (Δpx)
 *   - olas: 1 (snap ≤0.5px, cambio invisible) / 2 (off-scale, requiere decisión)
 *
 * NO reescribe nada (comprobador, no generador). Line-heights no se cubren
 * (mueven layout → fase aparte con regresión visual).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PRIM = 'projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css';
const SNAP = 0.5; // ≤ esto = ola 1 (imperceptible)

// 1. Resolver --sc-font-size-* → px
const prim = readFileSync(join(ROOT, PRIM), 'utf8');
const tokenPx = {};
for (const m of prim.matchAll(/--sc-font-size-(\w+):\s*calc\(([\d.]+)\s*\/\s*16\s*\*\s*1rem\)/g)) {
  tokenPx[`font-size-${m[1]}`] = +parseFloat(m[2]).toFixed(3);
}
const tokens = [...new Set(Object.values(tokenPx))].sort((a, b) => a - b);
const tokenFor = (px) => Object.keys(tokenPx).find((k) => tokenPx[k] === px);

// 2. Escanear SCSS de projects/
function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (e.endsWith('.scss')) acc.push(p);
  }
  return acc;
}
const files = walk(join(ROOT, 'projects'));

let tokenized = 0;
const literals = {};
for (const f of files) {
  const css = readFileSync(f, 'utf8');
  tokenized += (css.match(/font-size:\s*var\(--sc-font-size-/g) || []).length;
  for (const m of css.matchAll(/font-size:\s*([0-9.]+)(px|rem)\b/g)) {
    const px = +(parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1)).toFixed(3);
    literals[px] = (literals[px] || 0) + 1;
  }
}

// 3. Clasificar literales
const totalLit = Object.values(literals).reduce((a, b) => a + b, 0);
let ola1 = 0;
let ola2 = 0;
const rows = Object.entries(literals)
  .map(([pxStr, n]) => {
    const px = +pxStr;
    const near = tokens.reduce((a, b) => (Math.abs(b - px) < Math.abs(a - px) ? b : a));
    const d = +(px - near).toFixed(2);
    const wave = Math.abs(d) <= SNAP ? 1 : 2;
    if (wave === 1) ola1 += n;
    else ola2 += n;
    return { px, n, token: tokenFor(near), d, wave };
  })
  .sort((a, b) => b.n - a.n);

// 4. Reporte
console.log('=== tokens --sc-font-size-* (px, rampa redonda) ===');
console.log('  ' + tokens.map((t) => `${t}=${tokenFor(t)}`).join('  '));
console.log('\n=== cobertura font-size en SCSS (projects/) ===');
const denom = tokenized + totalLit;
const pct = denom ? ((tokenized / denom) * 100).toFixed(0) : '100';
console.log(`  tokenizado var(--sc-font-size-*): ${tokenized}  (${pct}%)`);
console.log(`  literal px/rem: ${totalLit}  →  ola1 (snap ≤${SNAP}px): ${ola1} · ola2 (decidir): ${ola2}`);
if (rows.length) {
  console.log('\n=== literales font-size → token más cercano ===');
  for (const r of rows) {
    console.log(
      `  ${String(r.px).padStart(6)} ×${String(r.n).padStart(3)}  → ${(r.token || '?').padEnd(15)} Δ${String(r.d).padStart(5)}  ${r.wave === 1 ? 'ola 1 (invisible)' : 'ola 2 (decidir)'}`,
    );
  }
}
console.log('\nSolo lectura. Ola 1 = snap directo. Ola 2 = decisión humana.');

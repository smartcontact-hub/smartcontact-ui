#!/usr/bin/env node
/*
 * tokens:type-parity — PARIDAD de tipografía (font-size + line-height) export ↔ código. GATE.
 * ============================================================================
 * Verifica que cada `typography.font.size.N` y `typography.line.height.N` del Kit (Figma)
 * tiene su `--sc-font-size-N` / `--sc-line-height-N` en código con el MISMO valor px. Sale ≠0
 * si alguno DRIFTA (un cambio de tipografía en Figma que no llegó al código → se escaparía).
 *
 * Por qué importa (Rafa, 2026-06-18): los text styles de Figma vinculan font-size Y line-height
 * a variables; antes esto era un informe SOLO-LECTURA que solo miraba font-size y NUNCA
 * line-height → el line-height podía desfasarse en silencio. Ahora NO.
 *
 * Reparto de trabajo:
 *   - `tokens:guard` rule 5 bloquea el `font-size` LITERAL en SCSS (que se use el token).
 *   - ESTE bloquea el DRIFT del VALOR del token vs el export (font-size + line-height).
 *   - letter-spacing / tracking: NO existe en el export → nada que vigilar.
 *   - font-weight / font-family: semánticos de código, no primitivas del export → fuera de alcance.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadKitExport } from './dtcg-export.mjs';

const root = resolve(import.meta.dirname, '..');
const EXPORT = resolve(root, 'projects/design-tokens/scripts/kit-export-dtcg.json');
const LAYERS = resolve(root, 'projects/design-tokens/src/lib/styles/tokens/layers');
const log = (s = '') => process.stdout.write(s + '\n');

// Las dos clases de tipografía primitiva del export y su prefijo de token en código.
const KINDS = [
  { ns: 'font.size', prefix: 'sc-font-size-' },
  { ns: 'line.height', prefix: 'sc-line-height-' },
];

/** Lista [{ kind, step, token, exp }] de las primitivas de tipografía del export (resueltas a px). */
export function exportTypography(kit) {
  const custom = kit.groups['aura/custom'];
  const out = [];
  if (!custom) return out;
  for (const { ns, prefix } of KINDS) {
    const re = new RegExp(`^typography\\.${ns.replace('.', '\\.')}\\.(\\w+)$`);
    for (const [p, leaf] of custom) {
      const m = p.match(re);
      if (m) out.push({ kind: ns, step: m[1], token: prefix + m[1], exp: kit.resolve(leaf.$value) });
    }
  }
  return out;
}

/** `--name` → px de código: calc(N/16*1rem)→N · rem→×16 · número crudo (line-height) · si no, undefined. */
export function codePx(css, name) {
  const m = css.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`));
  if (!m) return undefined;
  const v = m[1].trim();
  let g = v.match(/calc\(\s*([\d.]+)\s*\/\s*16/);
  if (g) return +(+g[1]).toFixed(3);
  g = v.match(/^([\d.]+)rem$/);
  if (g) return +(+g[1] * 16).toFixed(3);
  g = v.match(/^([\d.]+)(px)?$/);
  if (g) return +(+g[1]).toFixed(3);
  return undefined;
}

/**
 * PURA (testeable): drift entre el listado del export y el código. `pxOf(token)` resuelve un
 * token a px (o undefined). Devuelve [{ token, exp, got }] — vacío = todo 1:1.
 */
export function typographyDrift(list, pxOf) {
  const drift = [];
  for (const { token, exp } of list) {
    const got = pxOf(token);
    if (got === undefined) drift.push({ token, exp, got: 'AUSENTE' });
    else if (typeof exp === 'number' && Math.abs(exp - got) > 0.01) drift.push({ token, exp, got });
  }
  return drift;
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const kit = loadKitExport(EXPORT);
  const css = ['01-primitive', '02-semantic', '03-palette', '04-component', '05-extensions']
    .map((l) => readFileSync(resolve(LAYERS, `${l}.css`), 'utf8'))
    .join('\n');
  const list = exportTypography(kit);
  const drift = typographyDrift(list, (t) => codePx(css, t));

  log('\n=== tokens:type-parity · font-size + line-height (export ↔ código, 1:1 por valor) ===');
  for (const d of drift)
    log(`  ✗ --${d.token} = ${d.got} pero el Kit dice ${d.exp}px → DRIFT (cambio de tipografía de Figma que no llegó al código).`);
  const fs = list.filter((x) => x.kind === 'font.size').length;
  const lh = list.filter((x) => x.kind === 'line.height').length;
  log(`  ✓ ${list.length - drift.length}/${list.length} valores 1:1 con el export (${fs} font-size + ${lh} line-height).`);
  log('  (literal font-size → lo bloquea tokens:guard rule 5 · letter-spacing no existe en el export.)');

  if (drift.length) {
    log(`\n✗ ${drift.length} drift(s) de tipografía — corre \`npm run tokens:import\` o cuadra el valor en la capa.`);
    process.exit(1);
  }
  log('✓ tipografía al día con el export.');
  process.exit(0);
}

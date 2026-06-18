#!/usr/bin/env node
/**
 * Generador de EFFECTS (sombras) — Kit (Figma) → código. Hermano de `token-gen-cmp-color.mjs`.
 *
 * Lee `aura/effects` del export (sombras de elevación por componente), convierte cada una a
 * `box-shadow` (effects-map.mjs) y la vierte como `--sc-cmp-<componente>-<parte>` en la zona
 * `@sc-gen:effects` de 05-extensions.css (:root). El preset referenciará estos tokens (rewire,
 * Etapa 2) → una sombra cambiada en Figma fluye sin mano.
 *
 * Reglas de valor: ver effects-map.mjs (px literal · color = hex exacto del Kit · capa/sombra
 * transparente se descarta — las 71 *.focus.ring.shadow son no-op porque el DS hace el foco por
 * outline, no por shadow-ring). NO emite las transparentes.
 *
 * Uso:
 *   node scripts/token-gen-effects.mjs           # check (CI) — ≠0 si drift
 *   node scripts/token-gen-effects.mjs --emit      # imprime la zona + informe
 *   node scripts/token-gen-effects.mjs --write     # reescribe la zona
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadKitExport } from './dtcg-export.mjs';
import { rewriteRegion } from './marker-rewrite.mjs';
import { shadowToCss, tokenName } from './effects-map.mjs';

const root = resolve(import.meta.dirname, '..');
// Override por env (SC_KIT_EXPORT / SC_LAYERS_DIR) para el mini-test e2e en sandbox.
const EXPORT_PATH = process.env.SC_KIT_EXPORT
  ? resolve(process.env.SC_KIT_EXPORT)
  : resolve(root, 'projects/design-tokens/scripts/kit-export-dtcg.json');
const LAYERS = process.env.SC_LAYERS_DIR
  ? resolve(process.env.SC_LAYERS_DIR)
  : resolve(root, 'projects/design-tokens/src/lib/styles/tokens/layers');
const EXT_CSS = resolve(LAYERS, '05-extensions.css');

const emit = process.argv.includes('--emit');
const write = process.argv.includes('--write');
const log = (s = '') => process.stdout.write(s + '\n');

const START = '/* @sc-gen:effects';
const END = '/* @sc-gen:effects:end */';
const HEADER =
  '/* @sc-gen:effects — bloque GENERADO desde kit-export-dtcg.json por `npm run tokens:import`\n' +
  '   * (token-gen-effects.mjs). NO editar a mano. Sombras de componente (aura/effects) 1:1 con el\n' +
  '   * Kit: px literal + color de efecto exacto. El preset referencia estos --sc-cmp-*-shadow; así\n' +
  '   * una sombra cambiada en Figma fluye sin mano. Las *.focus.ring.shadow (transparentes) no se\n' +
  "   * emiten: el foco del DS es por outline (--sc-focus-ring-width), no shadow-ring. */";

/** Cuerpo de la zona + lista de tokens (para test/informe). PURA respecto al kit pasado. */
export function buildEffects(kit) {
  const group = kit.groups['aura/effects'];
  const lines = [];
  const tokens = [];
  if (group) {
    for (const [path, leaf] of group) {
      const css = shadowToCss(kit.resolve(leaf.$value));
      if (css == null) continue; // sombra transparente (no-op)
      const name = tokenName(path);
      lines.push(`  --${name}: ${css};`);
      tokens.push(name);
    }
  }
  return { body: lines.join('\n'), tokens };
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!existsSync(EXPORT_PATH)) {
    log(`⚠️  No existe ${EXPORT_PATH}`);
    process.exit(2);
  }
  const kit = loadKitExport(EXPORT_PATH);
  const { body, tokens } = buildEffects(kit);

  if (emit) {
    log(HEADER);
    log(body);
    log(`\n/* ── INFORME ── ${tokens.length} sombras emitidas (71 *.focus.ring.shadow transparentes omitidas) */`);
    process.exit(0);
  }

  const txt = readFileSync(EXT_CSS, 'utf8');
  const next = rewriteRegion(txt, START, END, HEADER, body);
  if (next == null) {
    log(`✗ Faltan los marcadores ${START} … :end en 05-extensions.css.`);
    process.exit(2);
  }

  if (write) {
    if (next !== txt) {
      writeFileSync(EXT_CSS, next);
      log(`✓ Zona @sc-gen:effects reescrita (${tokens.length} sombras) desde el export.`);
    } else {
      log('✓ effects: ya al día con el export (sin cambios).');
    }
    process.exit(0);
  }

  if (next !== txt) {
    log('✗ effects: la zona @sc-gen:effects en 05-extensions.css no está al día con el export.');
    log('  Corre `npm run tokens:import`.');
    process.exit(1);
  }
  log(`✓ effects OK — ${tokens.length} sombras de componente al día con el export.`);
  process.exit(0);
}

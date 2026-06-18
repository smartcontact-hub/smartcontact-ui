#!/usr/bin/env node
/**
 * Generador del SIZING DE COMPONENTE — Kit (Figma) → código.
 * Hermano de `token-gen.mjs` (primitivos de escala/radio/paleta); éste cubre la
 * métrica de componente (radio/padding/fontSize/width/gap… de botón, input,
 * overlay, tabs, tooltip, divider, toggleswitch).
 *
 * Lee cada slot del mapa `sizing-map.mjs` desde el export DTCG (siguiendo refs) y
 * reescribe la zona `@sc-gen:cmp-sizing` de 04-component.css con tokens
 * `--sc-cmp-*` (rem = px/16, px de diseño en comentario — igual que los
 * primitivos). El preset referencia esos tokens, así un cambio de sizing en Figma
 * fluye a código sin mano. Las divergencias conscientes (DIVERGE_SIZING) NO se
 * auto-escriben (las protege un humano).
 *
 * Uso:
 *   node scripts/token-gen-component.mjs           # check (CI/pre-commit) — ≠0 si drift
 *   node scripts/token-gen-component.mjs --emit     # imprime la zona canónica
 *   node scripts/token-gen-component.mjs --write    # reescribe la zona
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadKitExport } from './dtcg-export.mjs';
import { toRem } from './token-naming.mjs';
import { rewriteRegion } from './marker-rewrite.mjs';
import { SIZING, GROUPS, DIVERGE_SIZING, cmpName } from './sizing-map.mjs';

const root = resolve(import.meta.dirname, '..');
// Override por env (SC_KIT_EXPORT / SC_LAYERS_DIR) para el mini-test e2e en sandbox.
const EXPORT_PATH = process.env.SC_KIT_EXPORT
  ? resolve(process.env.SC_KIT_EXPORT)
  : resolve(root, 'projects/design-tokens/scripts/kit-export-dtcg.json');
const LAYERS_DIR = process.env.SC_LAYERS_DIR
  ? resolve(process.env.SC_LAYERS_DIR)
  : resolve(root, 'projects/design-tokens/src/lib/styles/tokens/layers');
const COMPONENT_CSS = resolve(LAYERS_DIR, '04-component.css');
const START = '/* @sc-gen:cmp-sizing';
const END = '/* @sc-gen:cmp-sizing:end */';

const emit = process.argv.includes('--emit');
const write = process.argv.includes('--write');
const log = (s = '') => process.stdout.write(s + '\n');

if (!existsSync(EXPORT_PATH)) {
  log(`⚠️  No existe ${EXPORT_PATH}`);
  process.exit(2);
}
const kit = loadKitExport(EXPORT_PATH);

// Export → px de diseño (resuelve refs DTCG). Igual que el helper de parity.
const exp = (group, path) => {
  const leaf = kit.groups[group]?.get(path);
  if (!leaf) return undefined;
  const v = kit.resolve(leaf.$value);
  return typeof v === 'number' ? v : NaN;
};

// Resuelve cada slot (saltando divergencias conscientes) a su declaración rem.
// Orden estable = el del mapa → repeticiones byte-idénticas (idempotente).
const diverge = new Set(DIVERGE_SIZING.map((d) => d.label));
const rows = [];
const missing = [];
for (const r of SIZING) {
  if (diverge.has(r.label)) continue;
  const px = exp(GROUPS[r.group], r.exp);
  if (px == null || Number.isNaN(px)) missing.push(r.label);
  else rows.push(`  --sc-cmp-${cmpName(r.label)}: ${toRem(px)}; /* ${px}px */`);
}

if (missing.length) {
  log('✗ token-gen-component: claves de sizing ausentes/sin resolver en el export');
  log('  (¿renombradas en el Kit? — corrígelas en scripts/sizing-map.mjs):');
  for (const l of missing) log(`    · ${l}`);
  process.exit(1);
}

const HEADER =
  '/* @sc-gen:cmp-sizing — bloque GENERADO desde kit-export-dtcg.json por\n' +
  '   * `npm run tokens:import` (token-gen-component.mjs). NO editar a mano.\n' +
  '   * Métrica de componente 1:1 con el export (radio/padding/fontSize/width…),\n' +
  '   * en rem (px/16, px de diseño en comentario). El preset referencia estos\n' +
  '   * `--sc-cmp-*`; así un cambio de sizing en Figma fluye a código sin mano.\n' +
  '   * Divergencias conscientes → DIVERGE_SIZING en scripts/sizing-map.mjs. */';
const BODY = rows.join('\n');

if (emit) {
  log(HEADER);
  log(BODY);
  process.exit(0);
}

const txt = readFileSync(COMPONENT_CSS, 'utf8');
const next = rewriteRegion(txt, START, END, HEADER, BODY);
if (next == null) {
  log('✗ Faltan los marcadores @sc-gen:cmp-sizing … :end en 04-component.css.');
  process.exit(2);
}

if (write) {
  if (next === txt) log('✓ cmp-sizing: ya al día con el export (sin cambios).');
  else {
    writeFileSync(COMPONENT_CSS, next);
    log(`✓ Zona @sc-gen:cmp-sizing reescrita (${rows.length} tokens desde el export).`);
  }
  process.exit(0);
}

// CHECK — la zona en disco ↔ la canónica derivada del export.
if (next !== txt) {
  log('✗ cmp-sizing: la zona en 04-component.css no está al día con el export.');
  log('  Corre `npm run tokens:import` (regenera primitivos + sizing de componente).');
  process.exit(1);
}
log(`✓ cmp-sizing OK — ${rows.length} métricas de componente al día con el export.`);
process.exit(0);

#!/usr/bin/env node
/**
 * Generador del COLOR DE COMPONENTE — Kit (Figma) → código. GENERAL: uno solo para
 * TODOS los componentes (hermano de `token-gen-color.mjs`, que hace el color semántico).
 *
 * Lee `aura/component/light|dark` del export (toast/button/tag/message/badge/…), resuelve
 * cada color a su hex terminal y lo vierte como `--sc-cmp-<componente>-<parte>` en dos
 * zonas marcadas:
 *   - `@sc-gen:cmp-color-light` en 04-component.css   (:root)
 *   - `@sc-gen:cmp-color-dark`  en 07-dark.css         (.sc-dark)
 *
 * REGLAS de valor (mismo idioma que el CSS curado ya usa — nunca hex crudo):
 *   - opaco            → `var(--sc-color-X)`            (primitiva por hex)
 *   - translúcido aaff → `color-mix(in srgb, var(--sc-color-X) N%, transparent)`
 *   - alfa 0           → `transparent`
 * Las familias que solo referencia el color de componente (sky, orange…) las importa
 * el auto-import de `token-gen.mjs` como primitivas → aquí siempre hay `--sc-color-X`.
 *
 * Por defecto ESPEJA todo (la marca se cura EN Figma). Las divergencias afinadas a mano
 * se excluyen en `cmp-color-map.mjs` (EXCLUDE) y las vigila el chivato §7.
 *
 * Falla RUIDOSO si un color no resuelve o su base no tiene primitiva (no emite hex crudo).
 *
 * Uso:
 *   node scripts/token-gen-cmp-color.mjs           # check (CI) — ≠0 si drift
 *   node scripts/token-gen-cmp-color.mjs --emit     # imprime las zonas + informe
 *   node scripts/token-gen-cmp-color.mjs --write    # reescribe las zonas
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadKitExport } from './dtcg-export.mjs';
import { rewriteRegion } from './marker-rewrite.mjs';
import { isExcluded } from './cmp-color-map.mjs';

const root = resolve(import.meta.dirname, '..');
const EXPORT_PATH = resolve(root, 'projects/design-tokens/scripts/kit-export-dtcg.json');
const LAYERS = resolve(root, 'projects/design-tokens/src/lib/styles/tokens/layers');
const PRIMITIVE_CSS = resolve(LAYERS, '01-primitive.css');

const emit = process.argv.includes('--emit');
const write = process.argv.includes('--write');
const log = (s = '') => process.stdout.write(s + '\n');

if (!existsSync(EXPORT_PATH)) {
  log(`⚠️  No existe ${EXPORT_PATH}`);
  process.exit(2);
}
const kit = loadKitExport(EXPORT_PATH);

// hex (opaco, #rrggbb) → primitiva `--sc-color-*` (de 01-primitive.css; first-wins).
// Mismo enfoque que token-gen-color: comparamos por VALOR, no por nombre del Kit.
const hexToPrim = new Map();
for (const m of readFileSync(PRIMITIVE_CSS, 'utf8').matchAll(
  /--(sc-color-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g,
)) {
  const hex = m[2].toLowerCase();
  if (!hexToPrim.has(hex)) hexToPrim.set(hex, m[1]);
}

// #rrggbb[aa] → { base:'#rrggbb', alpha:0..255 }. (#rgb no aparece en el export.) PURA → testeable.
export function splitAlpha(hex) {
  const s = hex.toLowerCase();
  const base = s.slice(0, 7);
  const alpha = s.length === 9 ? parseInt(s.slice(7, 9), 16) : 255;
  return { base, alpha };
}

// hex terminal + mapa hex→primitiva → valor CSS (var / color-mix / transparent), o { missing }.
// PURA (recibe el mapa) → el test fija un mapa conocido y asserta la reconstrucción del alfa.
export function toCssColor(hex, hexToPrim) {
  const { base, alpha } = splitAlpha(hex);
  if (alpha === 0) return { value: 'transparent' };
  const prim = hexToPrim.get(base);
  if (!prim) return { missing: base };
  if (alpha === 255) return { value: `var(--${prim})` };
  const pct = Math.round((alpha / 255) * 100);
  return { value: `color-mix(in srgb, var(--${prim}) ${pct}%, transparent)` };
}

// token name: `aura/component/<mode>` path → `sc-cmp-<path-kebab>`.
export const tokenName = (path) => `sc-cmp-${path.replace(/\./g, '-')}`;

// Resuelve un modo → { body, missing[], unresolved[] }.
function resolveZone(mode) {
  const group = kit.groups[`aura/component/${mode}`];
  if (!group) return { body: '', missing: [], unresolved: [] };
  const lines = [];
  const missing = [];
  const unresolved = [];
  for (const [path, leaf] of group) {
    if (isExcluded(mode, path, leaf.$value)) continue;
    let resolved;
    try {
      resolved = kit.resolve(leaf.$value, mode);
    } catch (e) {
      unresolved.push(`[${mode}] ${path}: ${e.message}`);
      continue;
    }
    if (typeof resolved !== 'string' || !/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(resolved)) continue; // no es color
    const { value, missing: miss } = toCssColor(resolved, hexToPrim);
    if (miss) {
      missing.push(`[${mode}] ${path} = ${resolved} (base ${miss} sin --sc-color-* primitiva)`);
      continue;
    }
    lines.push(`  --${tokenName(path)}: ${value};`);
  }
  return { body: lines.join('\n'), missing, unresolved };
}

const ZONES = [
  {
    mode: 'light',
    css: resolve(LAYERS, '04-component.css'),
    file: '04-component.css',
    start: '/* @sc-gen:cmp-color-light',
    end: '/* @sc-gen:cmp-color-light:end */',
    header:
      '/* @sc-gen:cmp-color-light — bloque GENERADO desde kit-export-dtcg.json por\n' +
      '   * `npm run tokens:import` (token-gen-cmp-color.mjs). NO editar a mano.\n' +
      '   * Color de componente (light) 1:1 con el export: var(--sc-color-*) u color-mix\n' +
      '   * para translúcidos. El preset referencia estos --sc-cmp-*; así un cambio de color\n' +
      '   * de componente en Figma fluye sin mano. Divergencias afinadas → scripts/cmp-color-map.mjs. */',
  },
  {
    mode: 'dark',
    css: resolve(LAYERS, '07-dark.css'),
    file: '07-dark.css',
    start: '/* @sc-gen:cmp-color-dark',
    end: '/* @sc-gen:cmp-color-dark:end */',
    header:
      '/* @sc-gen:cmp-color-dark — bloque GENERADO desde kit-export-dtcg.json por\n' +
      '   * `npm run tokens:import` (token-gen-cmp-color.mjs). NO editar a mano.\n' +
      '   * Color de componente (dark, .sc-dark) 1:1 con el export. Divergencias afinadas a\n' +
      '   * mano → scripts/cmp-color-map.mjs (EXCLUDE), vigiladas por el chivato §7. */',
  },
];

export const resolved = ZONES.map((z) => ({ ...z, ...resolveZone(z.mode) }));
export const missing = resolved.flatMap((z) => z.missing);
export const unresolved = resolved.flatMap((z) => z.unresolved);

// ── CLI (solo al ejecutar directo; al importar desde un test, NADA de esto corre —
//    el módulo solo expone las puras + resolved/missing/unresolved, sin process.exit) ──
if (import.meta.url === `file://${process.argv[1]}`) {
  // RED DE SEGURIDAD (no tumbar el sync entero por un color): si un color elegido en Figma
  // NO está en la paleta (su base no tiene primitiva --sc-color-*), se OMITE ese slot (no se
  // aplica) y se AVISA — el resto de tokens fluye igual. Antes esto era `exit 1` y un solo
  // color fuera de paleta crasheaba TODO el sync. El veredicto en cristiano (token-report.mjs)
  // traduce estas líneas y sugiere el color registrado más cercano. NO sale ≠0 por esto.
  if (missing.length && !emit) {
    log(`⚠ token-gen-cmp-color: ${missing.length} color(es) FUERA DE LA PALETA → OMITIDO(s) (no aplicados).`);
    log('  Añade esa familia como primitiva en Figma, o elige un color que el DS ya tenga:');
    for (const l of missing.slice(0, 40)) log(`    · ${l}`);
    if (missing.length > 40) log(`    … y ${missing.length - 40} más`);
    // sigue: escribe las zonas SIN esos slots (ya quedaron fuera en resolveZone).
  }
  if (unresolved.length && !emit) {
    log('✗ token-gen-cmp-color: referencias sin resolver en el export:');
    for (const l of unresolved.slice(0, 20)) log(`    · ${l}`);
    process.exit(1);
  }

  if (emit) {
    for (const z of resolved) {
      log(`\n/* ===== ${z.file} (${z.mode}) ===== */`);
      log(z.header);
      log(z.body);
    }
    log(`\n/* ── INFORME ──`);
    for (const z of resolved) log(`   ${z.mode}: ${z.body ? z.body.split('\n').length : 0} tokens`);
    log(`   missing-primitiva: ${missing.length} · sin-resolver: ${unresolved.length} */`);
    if (missing.length) {
      log('\n/* MISSING (base sin primitiva — necesitan auto-import o curación): */');
      for (const l of missing.slice(0, 60)) log(`/*   ${l} */`);
    }
    process.exit(0);
  }

  // WRITE / CHECK
  let drift = 0;
  const results = [];
  for (const z of resolved) {
    const txt = readFileSync(z.css, 'utf8');
    const next = rewriteRegion(txt, z.start, z.end, z.header, z.body);
    if (next == null) {
      log(`✗ Faltan los marcadores ${z.start} … :end en ${z.file}.`);
      process.exit(2);
    }
    results.push({ z, txt, next });
    if (next !== txt) drift++;
  }

  if (write) {
    let wrote = 0;
    for (const { z, txt, next } of results) {
      if (next !== txt) {
        writeFileSync(z.css, next);
        wrote++;
      }
    }
    log(
      wrote === 0
        ? '✓ cmp-color: ya al día con el export (sin cambios).'
        : `✓ Zonas @sc-gen:cmp-color-* reescritas (${wrote} fichero/s) desde el export.`,
    );
    process.exit(0);
  }

  if (drift) {
    log('✗ cmp-color: las zonas en 04-component.css / 07-dark.css no están al día con el export.');
    log('  Corre `npm run tokens:import`.');
    process.exit(1);
  }
  log('✓ cmp-color OK — color de componente al día con el export (light+dark).');
  process.exit(0);
}

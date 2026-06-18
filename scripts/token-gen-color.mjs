#!/usr/bin/env node
/**
 * Generador del COLOR SEMÁNTICO de marca — Kit (Figma) → código.
 * Hermano de `token-gen-component.mjs` (sizing) y `token-gen.mjs` (primitivos).
 *
 * Lee las filas GENERABLES de `color-map.mjs` (las semánticas enforce; las
 * `surface.*`→`sc-color-*` las posee `token-gen.mjs`), resuelve cada una del export a
 * su hex terminal (siguiendo refs DTCG), lo mapea a la primitiva `--sc-color-*`
 * EXISTENTE, y reescribe dos zonas marcadas:
 *   - `@sc-gen:semantic-color-light` en 02-semantic.css  (modo light)
 *   - `@sc-gen:semantic-color-dark`  en 07-dark.css       (modo dark, `.sc-dark`)
 * con declaraciones `--sc-token: var(--sc-color-*);`. Así un cambio de color en Figma
 * fluye a código sin mano, preservando el contrato `--sc-*` y la indirección a la
 * primitiva. Divergencias conscientes (color-map DIVERGE) y `color-mix` quedan FUERA
 * de la zona (a mano). Falla ruidoso si una clave no resuelve o no tiene primitiva
 * (nunca emite hex crudo: rompería la regla "sin hex en capas curadas").
 *
 * Uso:
 *   node scripts/token-gen-color.mjs           # check (CI/pre-commit) — ≠0 si drift
 *   node scripts/token-gen-color.mjs --emit     # imprime las zonas canónicas
 *   node scripts/token-gen-color.mjs --write    # reescribe las zonas
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadKitExport } from './dtcg-export.mjs';
import { rewriteRegion } from './marker-rewrite.mjs';
import { GENERATED } from './color-map.mjs';

const root = resolve(import.meta.dirname, '..');
// Override por env (SC_KIT_EXPORT / SC_LAYERS_DIR) para el mini-test e2e en sandbox.
const EXPORT_PATH = process.env.SC_KIT_EXPORT
  ? resolve(process.env.SC_KIT_EXPORT)
  : resolve(root, 'projects/design-tokens/scripts/kit-export-dtcg.json');
const LAYERS = process.env.SC_LAYERS_DIR
  ? resolve(process.env.SC_LAYERS_DIR)
  : resolve(root, 'projects/design-tokens/src/lib/styles/tokens/layers');
const PRIMITIVE_CSS = resolve(LAYERS, '01-primitive.css');

const emit = process.argv.includes('--emit');
const write = process.argv.includes('--write');
const log = (s = '') => process.stdout.write(s + '\n');

if (!existsSync(EXPORT_PATH)) {
  log(`⚠️  No existe ${EXPORT_PATH}`);
  process.exit(2);
}
const kit = loadKitExport(EXPORT_PATH);

// #rrggbbff → #rrggbb (alpha opaca); minúsculas. Igual criterio que el de parity.
const normHex = (h) => {
  const s = String(h).toLowerCase().replace(/^#/, '');
  return s.length === 8 ? (s.slice(6) === 'ff' ? '#' + s.slice(0, 6) : '#' + s) : '#' + s;
};

// export semantic path → hex terminal (resuelve refs DTCG en el modo dado).
const expHex = (mode, path) => {
  const leaf = kit.groups[`aura/semantic/${mode}`]?.get(path);
  if (!leaf) return undefined;
  const v = kit.resolve(leaf.$value, mode);
  return typeof v === 'string' && /^#/.test(v) ? normHex(v) : undefined;
};

// hex → primitiva `--sc-color-*` (de 01-primitive.css; determinista, 0 colisiones
// verificadas). Mismo enfoque first-wins que el hint de parity. Absorbe el rename
// slate→gray del Kit "gratis": comparamos por valor, no por nombre del Kit.
const hexToPrim = new Map();
for (const m of readFileSync(PRIMITIVE_CSS, 'utf8').matchAll(
  /--(sc-color-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g,
)) {
  const hex = normHex(m[2]);
  if (!hexToPrim.has(hex)) hexToPrim.set(hex, m[1]);
}

const ZONES = [
  {
    mode: 'light',
    css: resolve(LAYERS, '02-semantic.css'),
    file: '02-semantic.css',
    start: '/* @sc-gen:semantic-color-light',
    end: '/* @sc-gen:semantic-color-light:end */',
    header:
      '/* @sc-gen:semantic-color-light — bloque GENERADO desde kit-export-dtcg.json por\n' +
      '   * `npm run tokens:import` (token-gen-color.mjs). NO editar a mano.\n' +
      '   * Color semántico de marca (light) 1:1 con el export, vía la primitiva --sc-color-*\n' +
      '   * (preserva el contrato --sc-* y la indirección). El preset/app referencian estos\n' +
      '   * --sc-*; así un cambio de color en Figma fluye sin mano. Divergencias conscientes y\n' +
      '   * color-mix → FUERA de la zona (a mano). Divergencias → DIVERGE en scripts/color-map.mjs. */',
  },
  {
    mode: 'dark',
    css: resolve(LAYERS, '07-dark.css'),
    file: '07-dark.css',
    start: '/* @sc-gen:semantic-color-dark',
    end: '/* @sc-gen:semantic-color-dark:end */',
    header:
      '/* @sc-gen:semantic-color-dark — bloque GENERADO desde kit-export-dtcg.json por\n' +
      '   * `npm run tokens:import` (token-gen-color.mjs). NO editar a mano.\n' +
      '   * Color de marca 1:1 con el export en dark (hoy solo el primary; el resto del dark\n' +
      '   * es divergencia consciente y vive FUERA de la zona). */',
  },
];

// Resuelve las filas generables de un modo → Map(token → primitiva), deduplicando por
// token con assert-equal: dos export-paths al MISMO --sc-* deben dar la misma primitiva;
// si no, es una contradicción del Kit que el humano debe ver (no se silencia).
function resolveZone(mode) {
  const byToken = new Map();
  const missing = [];
  const conflict = [];
  for (const r of GENERATED) {
    if (r.mode !== mode) continue;
    const hex = expHex(r.mode, r.exp);
    if (hex === undefined) {
      missing.push(`[${r.mode}] ${r.exp}`);
      continue;
    }
    const prim = hexToPrim.get(hex);
    if (!prim) {
      missing.push(`[${r.mode}] ${r.exp} = ${hex} (sin --sc-color-* primitiva)`);
      continue;
    }
    const prev = byToken.get(r.token);
    if (prev && prev !== prim) conflict.push(`--${r.token}: ${prev} vs ${prim} (paths del Kit en contradicción)`);
    else if (!prev) byToken.set(r.token, prim);
  }
  const body = [...byToken.entries()].map(([t, p]) => `  --${t}: var(--${p});`).join('\n');
  return { body, missing, conflict };
}

// Resolver todas las zonas; agregar errores y fallar ruidoso (como token-gen-component).
const resolved = ZONES.map((z) => ({ ...z, ...resolveZone(z.mode) }));
const missing = resolved.flatMap((z) => z.missing);
const conflict = resolved.flatMap((z) => z.conflict);

if (missing.length) {
  log('✗ token-gen-color: claves de color ausentes/sin resolver (o sin primitiva):');
  log('  (¿renombradas en el Kit, o falta la primitiva en 01-primitive.css? — ver scripts/color-map.mjs):');
  for (const l of missing) log(`    · ${l}`);
  process.exit(1);
}
if (conflict.length) {
  log('✗ token-gen-color: el Kit asigna el MISMO --sc-* a colores distintos:');
  for (const l of conflict) log(`    · ${l}`);
  process.exit(1);
}

if (emit) {
  for (const z of resolved) {
    log(`\n/* ===== ${z.file} ===== */`);
    log(z.header);
    log(z.body);
  }
  process.exit(0);
}

// WRITE / CHECK — reescribir o comparar cada zona en su fichero.
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
      ? '✓ semantic-color: ya al día con el export (sin cambios).'
      : `✓ Zonas @sc-gen:semantic-color-* reescritas (${wrote} fichero/s) desde el export.`,
  );
  process.exit(0);
}

// CHECK
if (drift) {
  log('✗ semantic-color: las zonas en 02-semantic.css / 07-dark.css no están al día con el export.');
  log('  Corre `npm run tokens:import` (regenera primitivos + sizing + color).');
  process.exit(1);
}
log('✓ semantic-color OK — color semántico de marca al día con el export (light+dark).');
process.exit(0);

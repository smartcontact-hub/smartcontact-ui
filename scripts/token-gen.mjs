#!/usr/bin/env node
/**
 * Generador único de los PRIMITIVOS métricos — Kit (Figma) → código.
 * Fusión del importador DTCG del repo de desarrollo (`convert-tokens.js`) y
 * de la ley de escala SCDS (`tokens:gen`): UN punto de transformación
 * Figma → CSS, alimentado por el export DTCG del Kit
 * (`projects/design-tokens/scripts/kit-export-dtcg.json`).
 *
 * Cubre tres zonas marcadas de `01-primitive.css`:
 *   @sc-gen:scale    — escala 14-base (`--sc-scale-*`)
 *   @sc-gen:radius   — radios (`--sc-radius-*`)
 *   @sc-gen:palette  — familias primitivas de color que el preset referencia
 *                      y que la capa curada no cubre (hoy: zinc)
 *
 * ── ESCALA ──  Ley: nombre(v) = (v<0?"neg-":"") + |v|/14   con  "." → "-"
 *   (14 = base del Kit. 5.25 → 0.375 → `--sc-scale-0-375`.) El nombre deriva
 *   del VALOR px de diseño del export, nunca del string de la clave.
 *
 * ── REM CENTRALIZADO ──  Decisión cerrada (pre-flight §1): diseño en 14-base
 *   → conversión a rem en UN punto. Ese punto es ESTE generador: cada paso se
 *   emite como `px/16` rem (root 16) con el px de diseño en comentario:
 *       --sc-scale-1: 0.875rem (14px de diseño)
 *   El zoom de fuente del usuario escala todo; el render por defecto es
 *   idéntico al px. Los cuantos de 0.25px de la escala 14-base dividen exacto
 *   entre 16 → sin pérdida. `--sc-radius-full` (clamp de pill) queda en px.
 *
 * Solo se reescribe entre los marcadores `@sc-gen:* … :end`; el resto de la
 * capa (familias curadas, aliases, comentarios) queda intacto.
 *
 * Uso:
 *   node scripts/token-gen.mjs            # check (CI/pre-commit) — ≠0 si drift
 *   node scripts/token-gen.mjs --emit     # imprime los bloques canónicos
 *   node scripts/token-gen.mjs --write    # reescribe las zonas @sc-gen
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadKitExport } from './dtcg-export.mjs';
import { scaleSuffix, toRem, dropAlpha } from './token-naming.mjs';
import { rewriteRegion } from './marker-rewrite.mjs';

const root = resolve(import.meta.dirname, '..');
const EXPORT_PATH = resolve(root, 'projects/design-tokens/scripts/kit-export-dtcg.json');
const PRIMITIVE_CSS = resolve(
  root,
  'projects/design-tokens/src/lib/styles/tokens/layers/01-primitive.css',
);

const emit = process.argv.includes('--emit');
const write = process.argv.includes('--write');
const log = (s = '') => process.stdout.write(s + '\n');

if (!existsSync(EXPORT_PATH)) {
  log(`⚠️  No existe ${EXPORT_PATH}`);
  process.exit(2);
}
const kit = loadKitExport(EXPORT_PATH);
const prim = kit.groups['aura/primitive'];

const declare = (name, px) => `  --${name}: ${toRem(px)}; /* ${px}px */`;

// ─────────────────────────────────────────────────────────────────────────────
// ESCALA
// ─────────────────────────────────────────────────────────────────────────────
// Extras = pasos que el export no trae pero el código usa, con su razón.
const EXTRA_SCALE = [{ value: 0, reason: 'reset — no es un paso métrico' }];
const scaleCanon = new Map(); // name (sin "--") → px de diseño
for (const [path, leaf] of prim) {
  if (!path.startsWith('scale.') || typeof leaf.$value !== 'number') continue;
  scaleCanon.set('sc-scale-' + scaleSuffix(leaf.$value), leaf.$value);
}
for (const { value } of EXTRA_SCALE) scaleCanon.set('sc-scale-' + scaleSuffix(value), value);

function renderScale() {
  const pos = [...scaleCanon.entries()].filter(([, v]) => v > 0).sort((a, b) => a[1] - b[1]);
  const neg = [...scaleCanon.entries()].filter(([, v]) => v < 0).sort((a, b) => b[1] - a[1]);
  const out = ['  --sc-scale-0: 0;', '', '  /* Positivos */'];
  for (const [name, v] of pos) out.push(declare(name, v));
  out.push('', '  /* Negativos (margins negativos, transform offsets) */');
  for (const [name, v] of neg) out.push(declare(name, v));
  return out.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// RADIOS
// ─────────────────────────────────────────────────────────────────────────────
const EXTRA_RADIUS = [
  { name: '2xl', value: 16, reason: 'paso 16px custom SC (dialog/overlay grande)' },
  { name: 'full', value: 9999, reason: 'pill/círculo — clamp, queda en px' },
];
const radiusCanon = new Map();
for (const [path, leaf] of prim) {
  const m = path.match(/^border\.radius\.([a-z0-9]+)$/);
  if (m && typeof leaf.$value === 'number') radiusCanon.set('sc-radius-' + m[1], leaf.$value);
}
for (const { name, value } of EXTRA_RADIUS) radiusCanon.set('sc-radius-' + name, value);

function renderRadius() {
  const fromExport = [...radiusCanon.keys()].filter(
    (n) => !EXTRA_RADIUS.some((e) => 'sc-radius-' + e.name === n),
  );
  fromExport.sort((a, b) => radiusCanon.get(a) - radiusCanon.get(b));
  const out = [];
  for (const n of fromExport) {
    const v = radiusCanon.get(n);
    out.push(v === 0 ? `  --${n}: 0;` : declare(n, v));
  }
  out.push('', '  /* Custom SC (no en el Kit) */');
  out.push('  --sc-radius-2xl: 1rem; /* 16px */');
  out.push('  --sc-radius-full: 9999px; /* clamp de pill — no escala */');
  return out.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// PALETA COMPLEMENTARIA — familias que el preset referencia ({yellow.*},
// {zinc.*} = surface dark del Kit) y la capa curada no define. 1:1 del export.
// ─────────────────────────────────────────────────────────────────────────────
const PALETTE_FAMILIES = ['zinc'];
const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

function renderPalette() {
  const out = [];
  for (const family of PALETTE_FAMILIES) {
    out.push(`  /* ${family} — 1:1 export aura/primitive.${family} */`);
    for (const step of STEPS) {
      const leaf = prim.get(`${family}.${step}`);
      if (!leaf) continue;
      out.push(`  --sc-color-${family}-${step}: ${dropAlpha(String(leaf.$value))};`);
    }
    if (family !== PALETTE_FAMILIES.at(-1)) out.push('');
  }
  return out.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// EMIT / WRITE / CHECK
// ─────────────────────────────────────────────────────────────────────────────
const ZONES = [
  {
    tag: 'scale',
    header:
      '/* @sc-gen:scale — bloque GENERADO desde kit-export-dtcg.json por `npm run tokens:import`.\n' +
      '   * NO editar a mano (el generador lo pisa). Valores en rem (px diseño / 16 — rem\n' +
      '   * centralizado, pre-flight §1); el px de diseño va en comentario y es lo que\n' +
      '   * cruza `tokens:parity`. Ley de naming v/14 — ver tokens/README §"The scale". */',
    render: renderScale,
  },
  {
    tag: 'radius',
    header:
      '/* @sc-gen:radius — bloque GENERADO desde kit-export-dtcg.json (aura/primitive\n' +
      '   * border.radius) por `npm run tokens:import`. NO editar a mano.\n' +
      '   * none/xs/sm/md/lg/xl = export 1:1 en rem; 2xl/full = customs SC documentados. */',
    render: renderRadius,
  },
  {
    tag: 'palette',
    header:
      '/* @sc-gen:palette — bloque GENERADO desde kit-export-dtcg.json. Familias que el\n' +
      '   * preset referencia y la capa curada no cubre (yellow, zinc = surface dark del\n' +
      '   * Kit). NO editar a mano. */',
    render: renderPalette,
  },
];

if (emit) {
  log('/* @sc-generated — node scripts/token-gen.mjs --emit. Fuente: kit-export-dtcg.json. */');
  for (const z of ZONES) {
    log(`\n/* ===== ${z.tag.toUpperCase()} ===== */`);
    log(z.render());
  }
  process.exit(0);
}

if (write) {
  let txt = readFileSync(PRIMITIVE_CSS, 'utf8');
  for (const z of ZONES) {
    const next = rewriteRegion(txt, `/* @sc-gen:${z.tag}`, `/* @sc-gen:${z.tag}:end */`, z.header, z.render());
    if (next == null) {
      log(`✗ Faltan los marcadores @sc-gen:${z.tag} … :end en 01-primitive.css.`);
      process.exit(2);
    }
    txt = next;
  }
  writeFileSync(PRIMITIVE_CSS, txt);
  log('✓ Bloques scale/radius/palette reescritos desde el export. La cascada propaga.');
  process.exit(0);
}

// CHECK — canónico (export-derivado) ↔ lo declarado en 01-primitive.css.
// Las declaraciones generadas son rem con el px de diseño en comentario; se
// resuelven a px (rem × 16) para comparar contra el export.
const css = readFileSync(PRIMITIVE_CSS, 'utf8');
let problems = 0;
const fail = (s) => {
  problems++;
  log('  ✗ ' + s);
};

function readActual(prefix) {
  const map = new Map();
  const re = new RegExp(`--(${prefix}[a-z0-9-]*)\\s*:\\s*(-?[0-9.]+)(rem|px)?\\s*;`, 'g');
  let m;
  while ((m = re.exec(css))) {
    const n = parseFloat(m[2]);
    map.set(m[1], m[3] === 'rem' ? n * 16 : n);
  }
  return map;
}
function checkBlock(label, canon, actual) {
  for (const [name, v] of canon) {
    if (!actual.has(name)) fail(`${label}: falta --${name} (= ${v}px) que el canónico exige`);
    else if (Math.abs(actual.get(name) - v) > 1e-6)
      fail(`${label}: --${name}: canónico=${v} vs css=${actual.get(name)}`);
  }
  for (const [name, v] of actual)
    if (!canon.has(name))
      fail(`${label}: --${name} (= ${v}) en css pero no en el canónico (¿fuera de la ley / sin documentar?)`);
}
function readActualHex(family) {
  const map = new Map();
  const re = new RegExp(`--(sc-color-${family}-\\d+)\\s*:\\s*(#[0-9a-fA-F]{6,8})\\s*;`, 'g');
  let m;
  while ((m = re.exec(css))) map.set(m[1], m[2].toLowerCase());
  return map;
}

log('=== PRIMITIVOS: export-derivado ↔ 01-primitive.css ===');
checkBlock('SCALE', scaleCanon, readActual('sc-scale-'));
checkBlock('RADIUS', radiusCanon, readActual('sc-radius-'));
for (const family of PALETTE_FAMILIES) {
  const actual = readActualHex(family);
  for (const step of STEPS) {
    const leaf = prim.get(`${family}.${step}`);
    if (!leaf) continue;
    const expected = dropAlpha(String(leaf.$value)).toLowerCase();
    const got = actual.get(`sc-color-${family}-${step}`);
    if (!got) fail(`PALETTE: falta --sc-color-${family}-${step} (= ${expected})`);
    else if (got !== expected) fail(`PALETTE: --sc-color-${family}-${step}: export=${expected} vs css=${got}`);
  }
}

log('─'.repeat(60));
if (problems === 0) {
  log('✓ PRIMITIVOS OK — ley v/14 (escala, en rem) + export ∪ extras (escala/radios/paleta).');
  process.exit(0);
}
log(`✗ ${problems} divergencia(s). Corre --emit para ver los bloques canónicos.`);
process.exit(1);

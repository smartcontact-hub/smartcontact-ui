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
import { GENERATED as GENERATED_COLORS } from './color-map.mjs';
import { EXPORT_PATH, LAYERS_DIR } from './paths.mjs';

const PRIMITIVE_CSS = resolve(LAYERS_DIR, '01-primitive.css');

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
// PALETA COMPLEMENTARIA — familias primitivas de color que la capa CURADA no
// define, importadas 1:1 del export. DINÁMICO: el Kit tiene ~22 familias; la capa
// curada cubre ~12. Importamos `zinc` (base — surface dark del Kit) + CUALQUIER
// familia que un color semántico GENERADO referencie y la curada no cubra (p.ej. el
// diseñador pone primary→{yellow.400} en Figma → se importa `yellow` y fluye, sin
// tocar código). Self-cleaning: si deja de referenciarse, desaparece al re-importar.
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const PALETTE_BASE = ['zinc']; // referenciada por la capa dark, no por un semántico generado

// export: hex → familia primitiva (first-wins).
const hexToFamily = new Map();
for (const [path, leaf] of prim) {
  const m = path.match(/^([a-z]+)\.\d+$/);
  if (m && typeof leaf.$value === 'string' && /^#/.test(leaf.$value)) {
    const hex = dropAlpha(String(leaf.$value)).toLowerCase();
    if (!hexToFamily.has(hex)) hexToFamily.set(hex, m[1]);
  }
}
// hexes YA disponibles como primitiva a mano (fuera de @sc-gen:palette). Filtramos por
// HEX, no por nombre: si el color que un semántico referencia ya existe —aunque sea bajo
// otro nombre (el Kit usa `slate`, la capa curada lo tiene como `gray`, mismo hex)— NO se
// re-importa (evita duplicar la rampa con otro nombre).
const curatedHexes = (() => {
  const txt = readFileSync(PRIMITIVE_CSS, 'utf8').replace(
    /\/\* @sc-gen:palette[\s\S]*?@sc-gen:palette:end \*\//,
    '',
  );
  const set = new Set();
  for (const m of txt.matchAll(/--sc-color-[a-z0-9-]+\s*:\s*(#[0-9a-fA-F]{6})/g)) set.add(m[1].toLowerCase());
  return set;
})();
// Familias curadas por NOMBRE (≥1 step fuera de @sc-gen:palette). Sirve para NO auto-importar
// una familia que ya existe a mano (duplicaría la rampa) ni una PARCIAL (un step que falta es
// un hueco de curación consciente — p.ej. green-950 de marca ≠ vanilla — no un auto-import).
const curatedFamilies = (() => {
  const txt = readFileSync(PRIMITIVE_CSS, 'utf8').replace(
    /\/\* @sc-gen:palette[\s\S]*?@sc-gen:palette:end \*\//,
    '',
  );
  const set = new Set();
  for (const m of txt.matchAll(/--sc-color-([a-z]+)-\d+\s*:/g)) set.add(m[1]);
  return set;
})();
// export semantic path → hex terminal (sigue refs DTCG en el modo dado).
function semHex(mode, path) {
  const leaf = kit.groups[`aura/semantic/${mode}`]?.get(path);
  if (!leaf) return undefined;
  const v = kit.resolve(leaf.$value, mode);
  return typeof v === 'string' && /^#/.test(v) ? dropAlpha(v).toLowerCase() : undefined;
}
// Familias que SOLO referencia el COLOR DE COMPONENTE (no la capa curada): p.ej. `yellow`
// (severidad warn de toast/message). Mismo principio que los semánticos: si un componente
// usa una familia del Kit que aún no existe, se importa sola → su color fluye. Filtro a
// nivel de FAMILIA (no de hex) para no duplicar una curada ni importar por un step suelto.
// Ignora el ruido `.figma.` del plugin. Self-cleaning: si deja de usarse, desaparece.
function cmpFamilies() {
  const out = new Set();
  for (const mode of ['light', 'dark']) {
    const group = kit.groups[`aura/component/${mode}`];
    if (!group) continue;
    for (const [path, leaf] of group) {
      if (/(^|\.)figma\./.test(path)) continue;
      let v;
      try {
        v = kit.resolve(leaf.$value, mode);
      } catch {
        continue;
      }
      if (typeof v !== 'string' || !/^#/.test(v)) continue;
      const base = v.slice(0, 7).toLowerCase();
      if (curatedHexes.has(base)) continue;
      const fam = hexToFamily.get(base);
      if (fam && !curatedFamilies.has(fam)) out.add(fam);
    }
  }
  return [...out];
}
const PALETTE_FAMILIES = [
  ...new Set([
    ...PALETTE_BASE,
    ...GENERATED_COLORS.map((r) => semHex(r.mode, r.exp))
      .filter((hex) => hex && !curatedHexes.has(hex)) // solo colores que aún NO existen
      .map((hex) => hexToFamily.get(hex))
      .filter(Boolean),
    ...cmpFamilies(),
  ]),
].sort();

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
// TIPOGRAFÍA — font-size · line-height · font-weight
// ─────────────────────────────────────────────────────────────────────────────
// Era la ÚNICA familia a mano de las diez: el Kit la traía, el generador no la
// escribía y solo la vigilaba `tokens:type-parity` … que estuvo CIEGO semanas
// (regex desfasado). Justo ahí se escondió el drift del line-height md (21 vs 20).
// Generarla la pone al nivel de scale/radius/palette: cambias la letra en Figma,
// pusheas y llega sola.
//
// Dos orígenes, y la diferencia importa:
//   · del KIT  → 19 hojas (8 font-size · 7 line-height · 4 weights), valor 1:1.
//   · SNAPS SC → pasos que el Kit NO tiene y el DS sí, que se PEGAN al vecino del
//     Kit (DD-13). No son inventados: hoy ya valen exactamente eso, y el mapa de
//     abajo lo deja explícito y testeable en vez de repetido a mano en el CSS.

/** Paso extra del DS → paso del Kit del que copia el valor, + la nota que iba en el CSS. */
export const FONT_SIZE_SNAPS = {
  50: { from: 100, note: 'era 10.5 → sube a 12' },
  75: { from: 100, note: 'snap → -100' },
  600: { from: 500, note: 'snap 28' },
  700: { from: 650, note: 'snap 36' },
  900: { from: 800, note: 'snap 64; era 70' },
};
export const LINE_HEIGHT_SNAPS = {
  50: { from: 100, note: '' },
  220: { from: 200, note: 'body-2/3' },
  400: { from: 300, note: 'h4 18' },
  600: { from: 500, note: '' },
  700: { from: 650, note: '' },
  900: { from: 800, note: '' },
};
/** Rol de cada paso del Kit, para que el comentario siga diciendo para qué es. */
const TYPE_NOTES = {
  'font-size': { 450: 'era 21', 800: 'era 56' },
  'line-height': { 100: 'caption 12', 200: 'body 14', 300: 'body-1 16', 450: 'h3 20', 500: 'h2 24', 650: 'h1 32', 800: 'display-1 48' },
};

/** Hojas de tipografía del export → Map(paso → px). Tolera el prefijo `primitive.`. */
function kitTypography(ns) {
  const custom = kit.groups['aura/custom'];
  const re = new RegExp(`^(?:primitive\\.)?typography\\.${ns.replace(/\./g, '\\.')}\\.(\\w+)$`);
  const out = new Map();
  if (!custom) return out;
  for (const [path, leaf] of custom) {
    const m = path.match(re);
    if (m) out.set(m[1], kit.resolve(leaf.$value));
  }
  return out;
}

function renderTypography() {
  const out = [];
  const emitRamp = (ns, cssName, snaps) => {
    const kitSteps = kitTypography(ns);
    if (kitSteps.size === 0) {
      log(`✗ token-gen: 0 hojas de typography.${ns} en el export — ¿renombró el Kit la rama?`);
      process.exit(2);
    }
    // pasos del Kit + snaps, ordenados por número para que la rampa se lea seguida
    const all = [...[...kitSteps.keys()].map(Number), ...Object.keys(snaps).map(Number)].sort((a, b) => a - b);
    for (const step of all) {
      const snap = snaps[step];
      const px = snap ? kitSteps.get(String(snap.from)) : kitSteps.get(String(step));
      if (px == null) {
        // Un snap que apunta a un paso que el Kit ya no trae NO puede desaparecer callando:
        // el token seguiría existiendo en las capas y nadie sabría que quedó huérfano.
        log(`✗ token-gen: --sc-${cssName}-${step} no resuelve` +
            (snap ? ` (snap → ${ns}.${snap.from}, que el Kit ya no trae)` : ` (${ns}.${step} no está en el export)`));
        process.exit(2);
      }
      const notes = [String(px)];
      const extra = snap ? snap.note : (TYPE_NOTES[cssName]?.[step] ?? '');
      if (extra) notes.push(`(${extra})`);
      out.push(`  --sc-${cssName}-${step}: calc(${px} / 16 * 1rem); /* ${notes.join(' ')} */`);
    }
    out.push('');
  };
  emitRamp('font.size', 'font-size', FONT_SIZE_SNAPS);
  emitRamp('line.height', 'line-height', LINE_HEIGHT_SNAPS);
  const weights = kitTypography('font.weight');
  for (const name of ['regular', 'medium', 'semibold', 'bold']) {
    const v = weights.get(name);
    if (v != null) out.push(`  --sc-font-weight-${name}: ${v};`);
  }
  return out.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// EMIT / WRITE / CHECK
// ─────────────────────────────────────────────────────────────────────────────
const ZONES = [
  {
    tag: 'typography',
    header:
      '/* @sc-gen:typography — bloque GENERADO desde kit-export-dtcg.json por `npm run tokens:import`.\n' +
      '   * NO editar a mano. font-size · line-height · font-weight. Los pasos que el Kit NO\n' +
      '   * trae (snaps del DS, DD-13) se derivan del vecino: el mapa vive en token-gen.mjs. */',
    render: renderTypography,
  },
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
      '/* @sc-gen:palette — bloque GENERADO desde kit-export-dtcg.json. Familias de color\n' +
      '   * que la capa curada NO cubre, importadas según se REFERENCIAN (zinc base +\n' +
      '   * cualquier familia que un semántico use — p.ej. primary→yellow). NO editar a mano. */',
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
  log('✓ Bloques typography/scale/radius/palette reescritos desde el export. La cascada propaga.');
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

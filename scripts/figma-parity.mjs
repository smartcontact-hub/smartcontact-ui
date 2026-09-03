#!/usr/bin/env node
/**
 * PARIDAD Figma-VIVO ↔ export DTCG — el eslabón que `tokens:parity` NO cubre.
 *
 * `tokens:parity` compara el EXPORT (`kit-export-dtcg.json`) contra el CSS. Este
 * script compara el FICHERO DE FIGMA VIVO contra ese mismo export. Por ese hueco
 * se coló el desfase de julio-2026: el plugin de sync no había corrido en un mes
 * y nadie medía la distancia entre lo que el Kit tenía y lo que el repo creía.
 *
 * NO puede ser gate de CI (necesita el bridge de Figma abierto), así que es un
 * PROCEDIMIENTO MANUAL. En dos pasos:
 *
 *   1. Con el Desktop Bridge conectado, vuelca las variables vivas a JSON con el
 *      snippet de `figma_execute` documentado en
 *      `projects/design-tokens/README.md` (§ "Figma-live parity"). Guárdalo en un
 *      fichero, p.ej. `.cache/figma-live.json` (gitignored).
 *   2. `node scripts/figma-parity.mjs .cache/figma-live.json`
 *
 * El volcado tiene esta forma:
 *   {
 *     "primitive":  { "blue/700": "#1B273D", ... },            // hex resueltos
 *     "semantic":   { "primary/color": { "light": "#1B273D", "dark": "#4D6990" }, ... },
 *     "typography": { "primitive/typography/font/size/900": { "Light": 64, "Dark": 64 }, ... }
 *   }
 *
 * El bloque `typography` (añadido 2026-09-03) cierra DOS agujeros de golpe:
 *
 *   a) PARIDAD. El script solo miraba COLOR. Por ese hueco entraron 11 variables de
 *      tipografía que existían en Figma y no en el export (`font/size/900` = 64,
 *      `line/height/900` = 78, el tier `app/typography/xl|xxl`, la familia y los cuatro
 *      `font/style`), y ningún gate se enteró: `tokens:type-parity` va export → código, así
 *      que lo que nunca llegó al export le es invisible por construcción.
 *
 *   b) INVARIANCIA POR MODO. La tipografía NO cambia entre claro y oscuro, pero vive en una
 *      colección de Figma con dos modos, así que cada variable carga un valor por modo y
 *      puede divergir en silencio. Pasó: `app/typography/xl|xxl` tenían alias en Light y un
 *      0 CRUDO en Dark, cuatro de treinta y seis, y nadie lo vio en semanas (arreglado el
 *      2026-09-03). La estructura por modos del volcado permite comprobarlo sin más datos.
 *
 * Por qué aquí y no como gate de CI: necesita el bridge de Figma abierto, igual que el
 * resto del script. Es el mismo procedimiento manual, con dos comprobaciones más.
 *
 * ⚠️ La trampa (medida 2026-08-30): hay que resolver AMBOS lados a RGBA final
 * antes de comparar. El export guarda los semánticos como ALIAS (`{primary.700}`,
 * `{surface.0}`), no como hex; y la rampa `primary.*` no vive en `aura/primitive`
 * sino en `aura/semantic/common` (que a su vez apunta a `{blue.N}`). Si comparas
 * el hex de Figma contra el alias sin resolver, salen ~154 falsos positivos. El
 * orden de resolución correcto es: semantic/{modo} → semantic/common → primitive.
 * Y normaliza el alfa (`#RRGGBB` → `#RRGGBBFF`) antes de igualar.
 */
import { readFileSync } from 'node:fs';
import { EXPORT_PATH } from './paths.mjs';

const dumpPath = process.argv[2];
if (!dumpPath) {
  console.error('uso: node scripts/figma-parity.mjs <volcado-figma.json>');
  process.exit(2);
}

const fig = JSON.parse(readFileSync(dumpPath, 'utf8'));
let ek = JSON.parse(readFileSync(EXPORT_PATH, 'utf8'));
if (typeof ek === 'string') ek = JSON.parse(ek);
const g = ek.groups ?? ek;
const prim = g['aura/primitive'];
const common = g['aura/semantic/common'];
const sem = { light: g['aura/semantic/light'], dark: g['aura/semantic/dark'] };
const custom = g['aura/custom'];

const raw = (tree, path) => {
  let node = tree;
  for (const seg of path.split('/')) {
    if (!node || typeof node !== 'object' || !(seg in node)) return null;
    node = node[seg];
  }
  return node && typeof node === 'object' ? node.$value : node;
};

/** Resuelve un `$value` (hex o alias `{a.b.c}`) a hex final, en un modo dado. */
function resolve(val, mode, depth = 0) {
  if (val == null || depth > 15) return null;
  const s = String(val).trim();
  const m = /^\{(.+)\}$/.exec(s);
  if (!m) return s;
  const path = m[1].toLowerCase().replace(/\./g, '/');
  let nxt = raw(sem[mode], path);
  if (nxt == null) nxt = raw(common, path);
  if (nxt == null) nxt = raw(prim, path);
  return resolve(nxt, mode, depth + 1);
}

const norm = (h) => {
  if (!h) return null;
  let x = String(h).toUpperCase().replace('#', '');
  if (x.length === 6) x += 'FF';
  return '#' + x;
};

let ok = 0;
const diffs = [];

// ── primitivas ──────────────────────────────────────────────────────────────
for (const [name, hex] of Object.entries(fig.primitive ?? {})) {
  const [fam, step] = name.split('/');
  const eh = norm(raw(prim, `${fam}/${step}`));
  const fh = norm(hex);
  if (eh == null) diffs.push([`primitive ${name}`, fh, 'SIN CLAVE']);
  else if (eh === fh) ok++;
  else diffs.push([`primitive ${name}`, fh, eh]);
}

// ── semánticos (light + dark) ────────────────────────────────────────────────
for (const [name, modes] of Object.entries(fig.semantic ?? {})) {
  for (const [mode, label] of [
    ['light', 'L'],
    ['dark', 'D'],
  ]) {
    const fh = norm(modes[mode]);
    const ev = raw(sem[mode], name);
    if (ev == null) {
      diffs.push([`semantic ${name} [${label}]`, fh, 'SIN CLAVE']);
      continue;
    }
    const eh = norm(resolve(ev, mode));
    if (eh === fh) ok++;
    else diffs.push([`semantic ${name} [${label}]`, fh, eh]);
  }
}

/**
 * Resuelve un `$value` de `aura/custom` siguiendo alias `{a.b.c}`. Devuelve número O cadena:
 * la tipografía del Kit trae las dos cosas (tamaños y pesos son números; la familia y los
 * cuatro `font/style` son CADENAS, porque Figma necesita el nombre de la cara para atar el
 * `fontStyle` de un text style). Un resolutor solo-numérico daba "SIN CLAVE" en esas cinco y
 * el informe mentía diciendo que faltaban del export.
 */
function resolveVal(val, depth = 0) {
  if (val == null || depth > 15) return null;
  if (typeof val === 'number') return val;
  const m = /^\{(.+)\}$/.exec(String(val).trim());
  if (!m) return String(val).trim();
  return resolveVal(raw(custom, m[1].toLowerCase().replace(/\./g, '/')), depth + 1);
}

/** Iguala número con número y cadena con cadena, sin que "600" y 600 se den por distintos. */
const mismoValor = (a, b) =>
  typeof a === 'number' || typeof b === 'number'
    ? Number(a) === Number(b)
    : String(a).toLowerCase().trim() === String(b).toLowerCase().trim();

// ── tipografía: (a) el mismo valor en TODOS los modos · (b) paridad contra el export ──
const modosMal = [];
let modosOk = 0;
for (const [name, porModo] of Object.entries(fig.typography ?? {})) {
  const modos = Object.entries(porModo);
  if (modos.length === 0) continue;
  const distintos = [...new Set(modos.map(([, v]) => JSON.stringify(v)))];
  if (distintos.length > 1) modosMal.push([name, porModo]);
  else modosOk++;

  // Paridad de VALOR contra el export. Se compara el primer modo: si los modos divergen ya
  // está reportado arriba, y comparar los dos aquí duplicaría el mismo hallazgo.
  const fv = modos[0][1];
  const ev = resolveVal(raw(custom, name));
  if (ev == null) diffs.push([`typography ${name}`, fv, 'SIN CLAVE (no está en el export)']);
  else if (mismoValor(ev, fv)) ok++;
  else diffs.push([`typography ${name}`, fv, ev]);
}

const total = ok + diffs.length;
console.log(`PARIDAD Figma-vivo ↔ export DTCG (${EXPORT_PATH.split('/').slice(-1)[0]})`);
console.log(`  comparados: ${total} · CASAN: ${ok} · DIVERGEN: ${diffs.length}`);
for (const [n, f, e] of diffs) console.log(`  ✗ ${n}: Figma ${f} ≠ export ${e}`);

if (fig.typography) {
  console.log('');
  console.log('TIPOGRAFÍA · el mismo valor en todos los modos (la letra no cambia con el tema)');
  if (modosMal.length === 0) {
    console.log(`  ✓ ${modosOk}/${modosOk} invariantes por modo.`);
  } else {
    console.log(`  comprobadas: ${modosOk + modosMal.length} · INVARIANTES: ${modosOk} · DIVERGEN: ${modosMal.length}`);
    for (const [n, porModo] of modosMal) {
      const detalle = Object.entries(porModo).map(([m, v]) => `${m}=${JSON.stringify(v)}`).join(' · ');
      console.log(`  ✗ ${n}: ${detalle}`);
    }
    console.log('  → iguala el modo que falta al que tiene el alias bueno. Un 0 crudo en un modo');
    console.log('    significa que la variable se creó y ese modo se quedó sin rellenar.');
  }
} else {
  console.log('');
  console.log('ℹ el volcado no trae `typography`: paridad de letra y modos NO comprobadas.');
}

process.exit(diffs.length || modosMal.length ? 1 : 0);

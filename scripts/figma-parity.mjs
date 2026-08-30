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
 *     "primitive": { "blue/700": "#1B273D", ... },            // hex resueltos
 *     "semantic":  { "primary/color": { "light": "#1B273D", "dark": "#4D6990" }, ... }
 *   }
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

const total = ok + diffs.length;
console.log(`PARIDAD Figma-vivo ↔ export DTCG (${EXPORT_PATH.split('/').slice(-1)[0]})`);
console.log(`  comparados: ${total} · CASAN: ${ok} · DIVERGEN: ${diffs.length}`);
for (const [n, f, e] of diffs) console.log(`  ✗ ${n}: Figma ${f} ≠ export ${e}`);
process.exit(diffs.length ? 1 : 0);

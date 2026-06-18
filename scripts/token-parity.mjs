#!/usr/bin/env node
/**
 * Auditoría de paridad de tokens — Kit (Figma) ↔ código (--sc-* + preset).
 *
 * FUENTE DE VERDAD: el export DTCG del Kit
 * (`projects/design-tokens/scripts/kit-export-dtcg.json`).
 *
 * Qué hace (determinista, sin "a ojo"):
 *   1. SCALE / RADIUS: cruza cada valor del export con `--sc-scale-*` /
 *      `--sc-radius-*` (01-primitive.css, valores rem → px ×16).
 *   2. MAPA valor → token (vocabulario para inspección 1:1 de Figma).
 *   3. SIZING DE COMPONENTE: evalúa el preset modular REAL (transpila los
 *      módulos TS y ejecuta `sc-preset/index.ts`, normalizeDesignRem incluido)
 *      y compara cada slot métrico contra el export, valor ↔ valor. Resuelve
 *      `var(--sc-*)` contra las capas CSS y `{a.b.c}` contra el árbol del
 *      preset — igual que lo hará el runtime.
 *   4. Reverse: tokens en código sin equivalente en el export (informativo).
 *   5. COLOR de marca: semánticos light/dark del export ↔ tokens --sc-*
 *      resueltos a hex por capas (07-dark para dark). Tabla con política por
 *      fila: enforce (debe coincidir) / divergencia consciente (informa).
 *
 * Uso:  node scripts/token-parity.mjs   (CI/pre-commit; sale ≠0 si hay gaps)
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { loadKitExport } from './dtcg-export.mjs';
import { SIZING, GROUPS, DIVERGE_SIZING } from './sizing-map.mjs';
import { ENFORCE as COLOR_ENFORCE, DIVERGE as COLOR_DIVERGE } from './color-map.mjs';
import { PRIMITIVE_SOURCE, PRIMITIVE_DIVERGE, primitiveDrift } from './palette-map.mjs';
import { classify, PRIMARY_STEPS } from './coverage-map.mjs';

const root = resolve(import.meta.dirname, '..');
const EXPORT_PATH = resolve(root, 'projects/design-tokens/scripts/kit-export-dtcg.json');
const LAYERS = 'projects/design-tokens/src/lib/styles/tokens/layers';
const PRESET_DIR = resolve(root, 'projects/ui-smartcontact/src/lib/theme/sc-preset');

let problems = 0;
const log = (s = '') => process.stdout.write(s + '\n');
const fail = (s) => {
  problems++;
  log('  ✗ ' + s);
};

const kit = loadKitExport(EXPORT_PATH);
const prim = kit.groups['aura/primitive'];

// ── Capas CSS: declaraciones por modo ────────────────────────────────────────
const cssOf = (f) => readFileSync(resolve(root, LAYERS, f), 'utf8');
const primCssText = cssOf('01-primitive.css');
function declMap(src) {
  const map = new Map();
  for (const m of src.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) map.set(m[1], m[2].trim());
  return map;
}
const primDecls = declMap(primCssText);
const semDecls = new Map([...declMap(cssOf('02-semantic.css')), ...declMap(cssOf('03-palette.css')), ...declMap(cssOf('04-component.css')), ...declMap(cssOf('05-extensions.css'))]);
const darkDecls = declMap(cssOf('07-dark.css'));

// Token CSS → px (rem ×16 · calc(N/16*1rem) → N · px literal · cadena var()).
function tokenToPx(name, mode = 'light', seen = new Set()) {
  if (seen.has(name)) return NaN;
  seen.add(name);
  const raw =
    mode === 'dark' && darkDecls.has(name)
      ? darkDecls.get(name)
      : (semDecls.get(name) ?? primDecls.get(name));
  if (raw == null) return NaN;
  const rem = raw.match(/^(-?[0-9.]+)rem$/);
  if (rem) return parseFloat(rem[1]) * 16;
  const px = raw.match(/^(-?[0-9.]+)(px)?$/);
  if (px) return parseFloat(px[1]);
  const calc = raw.match(/^calc\(\s*([0-9.]+)\s*\/\s*16\s*\*\s*1rem\s*\)$/);
  if (calc) return parseFloat(calc[1]);
  const ref = raw.match(/var\(\s*--([a-z0-9-]+)\s*\)/);
  return ref ? tokenToPx(ref[1], mode, seen) : NaN;
}

// Token CSS → hex (sigue var() por capas; dark vía 07).
function normHex(h) {
  let s = String(h).toLowerCase().replace(/^#/, '');
  if (s.length === 8) return s.slice(6) === 'ff' ? '#' + s.slice(0, 6) : '#' + s;
  return '#' + s;
}
function tokenToHex(name, mode, seen = new Set()) {
  if (seen.has(name)) return undefined;
  seen.add(name);
  const raw =
    mode === 'dark' && darkDecls.has(name)
      ? darkDecls.get(name)
      : (semDecls.get(name) ?? primDecls.get(name));
  if (raw == null) return undefined;
  if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw)) return normHex(raw);
  const v = raw.match(/var\(\s*--([a-z0-9-]+)\s*\)/);
  return v ? tokenToHex(v[1], mode, seen) : undefined; // color-mix → no-hex
}

// ── Tokens de escala/radio del código ────────────────────────────────────────
function readGeneratedPx(prefix) {
  const map = new Map();
  for (const m of primCssText.matchAll(
    new RegExp(`--(${prefix}[a-z0-9-]*)\\s*:\\s*(-?[0-9.]+)(rem|px)?\\s*;`, 'g'),
  )) {
    const n = parseFloat(m[2]);
    map.set(m[1], m[3] === 'rem' ? n * 16 : n);
  }
  return map;
}
const scScale = readGeneratedPx('sc-scale-');
const scRadius = readGeneratedPx('sc-radius-');
const valueToScTokens = new Map();
for (const [name, val] of [...scScale, ...scRadius]) {
  if (!valueToScTokens.has(val)) valueToScTokens.set(val, []);
  valueToScTokens.get(val).push(name);
}

// ── 1. SCALE parity ──────────────────────────────────────────────────────────
log('\n=== 1. SCALE (export aura/primitive.scale ↔ --sc-scale-*) ===');
const exportScale = [...prim].filter(([p, l]) => p.startsWith('scale.') && typeof l.$value === 'number');
const codeScaleValues = new Set(scScale.values());
const before = problems;
for (const [p, l] of exportScale)
  if (!codeScaleValues.has(l.$value)) fail(`export ${p}=${l.$value} sin --sc-scale-* con ese valor`);
log(`  export: ${exportScale.length} valores · código: ${scScale.size} tokens · gaps: ${problems - before}`);

// ── 2. RADIUS parity ─────────────────────────────────────────────────────────
log('\n=== 2. RADIUS (export border.radius ↔ --sc-radius-*) ===');
const codeRadiusValues = new Set(scRadius.values());
let radiusGaps = 0;
for (const [p, l] of prim)
  if (/^border\.radius\./.test(p) && typeof l.$value === 'number' && !codeRadiusValues.has(l.$value)) {
    fail(`export ${p}=${l.$value} sin --sc-radius-* equivalente`);
    radiusGaps++;
  }
if (!radiusGaps) log('  ✓ todos los radios del export tienen --sc-radius-*');

// ── 3. MAPA valor → token ────────────────────────────────────────────────────
log('\n=== 3. MAPA valor(px diseño) → token SC ===');
for (const v of [...new Set(exportScale.map(([, l]) => l.$value))].sort((a, b) => a - b)) {
  const toks = (valueToScTokens.get(v) || []).map((t) => `--${t}`).join(' / ') || '∅';
  log(`  ${String(v).padStart(7)}px  →  ${toks}`);
}

// ── Evaluar el preset modular real ───────────────────────────────────────────
const require_ = createRequire(import.meta.url);
const ts = require_(resolve(root, 'node_modules/typescript'));
function loadPreset() {
  const cache = new Map();
  function load(spec) {
    const file = resolve(PRESET_DIR, spec.replace(/^\.\//, '') + '.ts');
    if (cache.has(file)) return cache.get(file).exports;
    const src = readFileSync(file, 'utf8');
    const js = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const mod = { exports: {} };
    cache.set(file, mod);
    const requireShim = (s) => {
      if (s.startsWith('.')) return load(s);
      throw new Error(`Import no-relativo inesperado en el preset: ${s} (¿import de runtime nuevo?)`);
    };
    new Function('require', 'module', 'exports', js)(requireShim, mod, mod.exports);
    return mod.exports;
  }
  return load('./index').default;
}
const preset = loadPreset();

// Árbol del preset aplanado a rutas con puntos (formField → form.field).
const dotted = (key) => key.replace(/([a-z0-9])([A-Z])/g, '$1.$2').toLowerCase();
function flattenTree(obj, prefix, into) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${dotted(k)}` : dotted(k);
    if (v && typeof v === 'object') flattenTree(v, path, into);
    else into.set(path, v);
  }
  return into;
}
function presetFlat(mode) {
  const flat = new Map();
  flattenTree(preset.primitive ?? {}, '', flat);
  const { colorScheme, ...semRest } = preset.semantic ?? {};
  flattenTree(semRest, '', flat);
  flattenTree(colorScheme?.[mode] ?? {}, '', flat);
  flattenTree(preset.extend ?? {}, '', flat);
  return flat;
}
const flatLight = presetFlat('light');

// Valor de preset → px. Soporta `{ref}`, `var(--sc-*)`, rem (ya browser-rem
// tras normalizeDesignRem → ×16 = px de diseño), '0'.
function presetToPx(raw, seen = new Set()) {
  if (raw == null) return undefined;
  const s = String(raw).trim();
  if (s === '0') return 0;
  const ref = s.match(/^\{([a-z0-9.]+)\}$/i);
  if (ref) {
    if (seen.has(ref[1])) return NaN;
    seen.add(ref[1]);
    return presetToPx(flatLight.get(ref[1]), seen);
  }
  const v = s.match(/^var\(\s*--(sc-[a-z0-9-]+)\s*\)$/);
  if (v) return tokenToPx(v[1]);
  const rem = s.match(/^(-?[0-9.]+)rem$/);
  if (rem) return parseFloat(rem[1]) * 16;
  const px = s.match(/^(-?[0-9.]+)px$/);
  if (px) return parseFloat(px[1]);
  return NaN;
}
const get = (path) =>
  path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), preset);
const shorthand = (path) => {
  const raw = get(path);
  return raw == null ? undefined : String(raw).split(/\s+(?![^(]*\))/).map((t) => presetToPx(t));
};

// Export → px (resuelve refs DTCG).
const exp = (group, path) => {
  const leaf = kit.groups[group]?.get(path);
  if (!leaf) return undefined;
  const v = kit.resolve(leaf.$value);
  return typeof v === 'number' ? v : NaN;
};
// ── 4. SIZING de componente (export ↔ preset evaluado, valor↔valor) ──────────
log('\n=== 4. SIZING de componente (export ↔ preset modular, valor↔valor) ===');
// El mapa export↔preset vive en `sizing-map.mjs` (fuente única, compartida con el
// generador `token-gen-component.mjs`). Reconstruimos [label, esperado(export),
// obtenido(preset)] con los helpers locales; el veredicto de abajo no cambia.
const shCache = new Map();
const sh = (path) => {
  if (!shCache.has(path)) shCache.set(path, shorthand(path));
  return shCache.get(path);
};
const sizing = SIZING.map((r) => {
  const expected = exp(GROUPS[r.group], r.exp);
  let got;
  if (r.read.index === undefined) got = presetToPx(get(r.read.path));
  else {
    const arr = sh(r.read.path);
    got = arr?.[r.read.index] ?? (r.read.fallback !== undefined ? arr?.[r.read.fallback] : undefined);
  }
  return [r.label, expected, got];
});

const sizingDiverge = new Set(DIVERGE_SIZING.map((d) => d.label));
let sizingOk = 0;
for (const [label, expected, got] of sizing) {
  if (sizingDiverge.has(label)) continue; // divergencia consciente — se informa abajo, no falla
  if (expected == null) log(`  ? ${label}: la clave no está en el export (¿renombrada en el Kit?)`);
  else if (got === undefined) fail(`${label}: el export dice ${expected} pero el preset no lo fija`);
  else if (Number.isNaN(got)) fail(`${label}: el preset lo fija pero no resuelve a px`);
  else if (Math.abs(got - expected) > 1e-6) fail(`${label}: DRIFT — export=${expected} vs preset=${got}`);
  else sizingOk++;
}
log(`  ✓ ${sizingOk}/${sizing.length - sizingDiverge.size} valores de sizing fijados 1:1 con el export`);
if (sizingDiverge.size) {
  log('  divergencias de sizing conscientes (no fallan):');
  for (const d of DIVERGE_SIZING) log(`    · ${d.label}: ${d.reason}`);
}

// ── 5. Reverse: tokens en código sin valor en el export (informativo) ────────
log('\n=== 5. Tokens en código sin equivalente en el export (informativo) ===');
const expScaleVals = new Set(exportScale.map(([, l]) => l.$value));
const expRadiusVals = new Set(
  [...prim].filter(([p, l]) => /^border\.radius\./.test(p) && typeof l.$value === 'number').map(([, l]) => l.$value),
);
const codeOnly = [];
for (const [name, val] of scScale) if (!expScaleVals.has(val)) codeOnly.push([name, val]);
for (const [name, val] of scRadius) if (!expRadiusVals.has(val)) codeOnly.push([name, val]);
if (codeOnly.length === 0) log('  ✓ ninguno — código ⊆ export');
else for (const [name, val] of codeOnly) log(`  · --${name} = ${val}px (custom SC documentado / revisar al re-exportar)`);

// ── 6. COLOR de marca (export semantic light/dark ↔ --sc-*, resuelto a hex) ──
log('\n=== 6. COLOR de marca (export ↔ --sc-*, light+dark) ===');
const expHex = (mode, path) => {
  const group = kit.groups[`aura/semantic/${mode}`];
  const leaf = group?.get(path);
  if (!leaf) return undefined;
  const v = kit.resolve(leaf.$value, mode);
  return typeof v === 'string' && /^#/.test(v) ? normHex(v) : undefined;
};
// Filas de color desde la fuente única `color-map.mjs` (extraídas 1:1 de lo que vivía
// aquí inline). enforce → [mode, exp, token]; diverge → [mode, exp|label, reason]. El
// generador `token-gen-color.mjs` consume el mismo mapa, así no se desincronizan.
const ENFORCE = COLOR_ENFORCE.map((r) => [r.mode, r.exp, r.token]);
const DIVERGE = COLOR_DIVERGE.map((r) => [r.mode, r.exp, r.reason]);

// Reverse hex → primitiva, para sugerir el token exacto a pegar cuando un color de marca
// diverge. Solo alimenta el MENSAJE de fallo: nunca cambia el veredicto pass/fail.
const hexToPrimitive = new Map();
for (const name of primDecls.keys()) {
  if (!name.startsWith('sc-color-')) continue;
  const hx = tokenToHex(name, 'light');
  if (hx && !hexToPrimitive.has(hx)) hexToPrimitive.set(hx, name);
}
let colorOk = 0;
for (const [mode, path, token] of ENFORCE) {
  const expected = expHex(mode, path);
  const got = tokenToHex(token, mode);
  if (expected === undefined) log(`  ? [${mode}] ${path}: no está en el export (¿renombrada?)`);
  else if (got === undefined) fail(`[${mode}] ${path} → --${token}: no resuelve a hex`);
  else if (got !== expected) {
    const prim = hexToPrimitive.get(expected);
    const layer = mode === 'dark' ? '07-dark.css' : '02-semantic.css / 03-palette.css / 04-component.css';
    const hint = prim
      ? ` → pega en ${layer}:  --${token}: var(--${prim});`
      : ` → ajusta --${token} en ${layer} para que resuelva a ${expected}`;
    fail(`[${mode}] ${path}: export=${expected} vs --${token}=${got}${hint}`);
  } else colorOk++;
}
log(`  ✓ ${colorOk}/${ENFORCE.length} colores de marca 1:1 con el export (light+dark)`);
log('  divergencias de marca conscientes (no fallan):');
for (const [mode, what, why] of DIVERGE) log(`    · [${mode}] ${what}: ${why}`);

// ── 6b. A11Y · contraste de pares críticos (WCAG AA normal ≥ 4.5:1) ───────────
// Con el color fluyendo de Figma, un cambio podría hundir el contraste. Gate SOLO
// los pares de ALTO contraste que SIEMPRE deben pasar (texto-cuerpo y texto-on-primary
// sobre sus fondos); los grises suaves (secondary/subtle) ya van bajo AA a propósito
// → se informan, no fallan (decisión de marca, W5). Reusa tokenToHex (resuelve por capas).
log('\n=== 6b. A11Y · contraste (WCAG AA normal ≥ 4.5:1) ===');
const relLum = (hex) => {
  const c = hex.replace('#', '');
  const ch = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
const contrast = (h1, h2) => {
  const [hi, lo] = [relLum(h1), relLum(h2)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
};
const AA = 4.5;
const A11Y_GATED = [
  ['sc-text-primary', 'sc-bg-surface'],
  ['sc-text-primary', 'sc-bg-default'],
  ['sc-text-on-primary', 'sc-bg-primary'],
];
const A11Y_INFO = [
  ['sc-text-secondary', 'sc-bg-surface'],
  ['sc-text-subtle', 'sc-bg-surface'],
];
// Sub-AA CONOCIDOS y aceptados (pre-existentes — revisión de marca en W5). Se informan
// con ⚠, NO fallan. Quitar de aquí cuando W5 decida el fix.
const A11Y_KNOWN = new Map([
  ['dark|sc-text-on-primary|sc-bg-primary', 'primary dark (gray-900 sobre blue-400) ~3:1; ni gray-900 ni blanco llegan a AA sobre blue-400 — pide cambiar el color del primary dark (W5)'],
]);
let a11yOk = 0;
for (const mode of ['light', 'dark']) {
  for (const [fg, bg] of A11Y_GATED) {
    const fh = tokenToHex(fg, mode);
    const bh = tokenToHex(bg, mode);
    if (!fh || !bh) {
      log(`  ? [${mode}] --${fg}/--${bg}: no resuelve a hex`);
      continue;
    }
    const r = contrast(fh, bh);
    const known = A11Y_KNOWN.get(`${mode}|${fg}|${bg}`);
    if (known) {
      log(`  ⚠ [${mode}] --${fg}/--${bg} = ${r.toFixed(2)}:1 (conocido < AA — ${known})`);
      continue;
    }
    if (r < AA) fail(`[${mode}] a11y: --${fg} sobre --${bg} = ${r.toFixed(2)}:1 (< AA ${AA}; ${fh}/${bh})`);
    else {
      a11yOk++;
      log(`  ✓ [${mode}] --${fg}/--${bg} = ${r.toFixed(2)}:1`);
    }
  }
  for (const [fg, bg] of A11Y_INFO) {
    const fh = tokenToHex(fg, mode);
    const bh = tokenToHex(bg, mode);
    if (fh && bh) log(`    · [${mode}] --${fg}/--${bg} = ${contrast(fh, bh).toFixed(2)}:1 (informativo, gris suave — W5)`);
  }
}
log(`  ✓ ${a11yOk}/${2 * A11Y_GATED.length} pares críticos cumplen AA`);

// ── 7. CHIVATO de completitud — PRIMITIVAS DE COLOR (el hueco de §1-6) ─────────
// §1-6 cazan escala/radio/sizing/color-semántico, pero NUNCA el color PRIMITIVO. Por ahí se
// desfasó `soft-blue` del `cyan` sin que nadie lo viera. §7 verifica que cada familia primitiva
// del DS sigue 1:1 a su FUENTE del export (mapa Tailwind→marca en `palette-map.mjs`). Las
// divergencias conscientes se informan; cualquier OTRO desajuste → ROJO (un cambio en esa
// primitiva sería MUDO: no lo recogería nadie). Es la "garantía de completitud" para color.
log('\n=== 7. CHIVATO · primitivas de color (DS ← export, 1:1) ===');
const hexFamilies = (entries, re) => {
  const fams = {};
  for (const [k, hex] of entries) {
    const m = String(k).match(re);
    if (m && /^#[0-9a-f]{6}/i.test(hex)) (fams[m[1]] ??= {})[m[2]] = String(hex).toLowerCase().slice(0, 7);
  }
  return fams;
};
const exFamilies = hexFamilies(
  [...prim].map(([p, l]) => [p, typeof l.$value === 'string' ? l.$value : '']),
  /^([a-z-]+)\.(\d+)$/,
);
const dsFamilies = hexFamilies(
  [...primCssText.matchAll(/--sc-color-([a-z-]+)-(\d+)\s*:\s*(#[0-9a-f]{6})/gi)].map((m) => [`${m[1]}.${m[2]}`, m[3]]),
  /^([a-z-]+)\.(\d+)$/,
);
const drift = primitiveDrift(dsFamilies, exFamilies);
let primColorChecked = 0;
for (const [dsFam, steps] of Object.entries(dsFamilies))
  if (PRIMITIVE_SOURCE[dsFam]) for (const s of Object.keys(steps)) if (exFamilies[PRIMITIVE_SOURCE[dsFam]]?.[s] !== undefined) primColorChecked++;
for (const d of drift)
  fail(`[primitiva] --sc-color-${d.family}-${d.step} = ${d.dsHex} pero su fuente export ${d.src}.${d.step} = ${d.exHex} → DESFASE MUDO`);
log(`  ✓ ${primColorChecked - drift.length}/${primColorChecked} primitivas de color 1:1 con su fuente del export`);
log('  divergencias de primitiva conscientes (no fallan):');
for (const d of PRIMITIVE_DIVERGE) log(`    · ${d.match} ${d.reason}`);
const noSource = Object.keys(dsFamilies).filter((f) => !PRIMITIVE_SOURCE[f]);
if (noSource.length) log(`  ℹ familias del DS sin fuente directa en el export (curadas, revisar en auditoría): ${noSource.join(', ')}`);

// ── 7b. CENSO de cobertura del export (visibilidad: qué fluye, qué queda diferido) ──
log('\n=== 7b. CENSO de cobertura del export ===');
const census = [
  ['aura/primitive', 'cubierto', '§1·2·7'],
  ['aura/semantic/light', 'cubierto', '§6 + token-gen-color'],
  ['aura/semantic/dark', 'cubierto', '§6 + token-gen-color'],
  ['aura/component/common', 'cubierto', '§4 + token-gen-component'],
  ['aura/component/light', 'cubierto', 'token-gen-cmp-color'],
  ['aura/component/dark', 'cubierto', 'token-gen-cmp-color'],
  ['aura/semantic/common', 'cubierto', '§8 (censo + primary value-check)'],
  ['aura/app', 'cubierto', '§8 (no-consumido, documentado)'],
  ['aura/effects', 'cubierto', '§8 (foco=outline + sombras GENERADAS, rewire pend.)'],
  ['aura/custom', 'inverso', 'code→Figma (round-trip)'],
];
for (const [g, status, by] of census) log(`  ${g.padEnd(24)} ${String(kit.groups[g]?.size ?? 0).padStart(4)} leaves · ${status.padEnd(9)} · ${by}`);

// ── 8. COBERTURA de los grupos restantes (semantic/common · app · effects) ────
// La "garantía de completitud" del puente (Fase 1.3): cada hoja de estos 3 grupos cae en
// EXACTAMENTE un bucket (coverage-map.mjs). Una hoja NUEVA del Kit sin bucket → ROJO: no se
// cuela en silencio. + value-check fuerte de la rampa `primary` (lo único que el DS consume
// 1:1 aquí). El resto: ref que fluye (§1·2·7), cableado en base.ts, divergencia documentada o
// no-consumido — ver notas del mapa. Sombras: divergencia/hardcoded, decisión en NEXT-SESSION.
log('\n=== 8. COBERTURA · semantic/common · app · effects (completitud) ===');
for (const g of ['aura/semantic/common', 'aura/app', 'aura/effects']) {
  const paths = [...(kit.groups[g]?.keys() ?? [])];
  const { byKind, unmatched } = classify(g, paths);
  const kinds = Object.entries(byKind).map(([k, arr]) => `${k}:${arr.length}`).join(' · ');
  log(`  ${g.padEnd(24)} ${String(paths.length).padStart(4)} leaves → ${kinds}`);
  for (const p of unmatched)
    fail(`[cobertura] ${g} · '${p}' no encaja en ningún bucket de coverage-map → hoja del Kit sin clasificar (clasifícala o documenta su divergencia)`);
}
// Value-check: primary.N (export) == --sc-color-blue-N (código), 1:1 por hex. Caza un desfase
// MUDO de la marca primary (si el Kit mueve blue y la rampa primary no lo recoge).
let primaryOk = 0;
const scCommon = kit.groups['aura/semantic/common'];
for (const step of PRIMARY_STEPS) {
  const leaf = scCommon?.get(`primary.${step}`);
  const expected = leaf ? normHex(kit.resolve(leaf.$value)) : undefined;
  const got = tokenToHex(`sc-color-blue-${step}`, 'light');
  if (expected === undefined) log(`  ? primary.${step}: no está en el export`);
  else if (got === undefined) fail(`[primary] primary.${step} → --sc-color-blue-${step}: no resuelve a hex`);
  else if (got !== expected) fail(`[primary] primary.${step}: export=${expected} vs --sc-color-blue-${step}=${got} → la rampa primary se desfasó de blue`);
  else primaryOk++;
}
log(`  ✓ ${primaryOk}/${PRIMARY_STEPS.length} primary.N = --sc-color-blue-N (1:1 por valor)`);
log('  (sombras de effects → GENERADAS a --sc-cmp-*-shadow por token-gen-effects [@sc-gen:effects]; rewire del preset pendiente, Etapa 2)');

// ── Resumen ──────────────────────────────────────────────────────────────────
log('\n' + '─'.repeat(60));
if (problems === 0) {
  log('✓ PARIDAD OK — sin gaps detectados.');
  process.exit(0);
}
log(`✗ ${problems} gap(s) de paridad. Revisar arriba.`);
process.exit(1);

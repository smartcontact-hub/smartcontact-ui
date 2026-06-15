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

// ── Resumen ──────────────────────────────────────────────────────────────────
log('\n' + '─'.repeat(60));
if (problems === 0) {
  log('✓ PARIDAD OK — sin gaps detectados.');
  process.exit(0);
}
log(`✗ ${problems} gap(s) de paridad. Revisar arriba.`);
process.exit(1);

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
const CC = 'aura/component/common';
const SC = 'aura/semantic/common';

// ── 4. SIZING de componente (export ↔ preset evaluado, valor↔valor) ──────────
log('\n=== 4. SIZING de componente (export ↔ preset modular, valor↔valor) ===');
const tabPad = shorthand('components.tabs.tab.padding'); // [Y, X]
const tabpanelPad = shorthand('components.tabs.tabpanel.padding'); // [T, R(=B=L)] o [T,R,B,L]
const ttPad = shorthand('components.tooltip.root.padding'); // [Y, X]
const divH = shorthand('components.divider.horizontal.margin'); // [Y, X]
const divV = shorthand('components.divider.vertical.margin'); // [Y, X]
const divHC = shorthand('components.divider.horizontal.content.padding'); // [Y, X]
const divVC = shorthand('components.divider.vertical.content.padding'); // [Y, X]

const sizing = [
  ['button.root.paddingX', exp(CC, 'button.padding.x'), presetToPx(get('components.button.root.paddingX'))],
  ['button.root.paddingY', exp(CC, 'button.padding.y'), presetToPx(get('components.button.root.paddingY'))],
  ['button.root.borderRadius', exp(CC, 'button.border.radius'), presetToPx(get('components.button.root.borderRadius'))],
  ['button.root.gap', exp(CC, 'button.gap'), presetToPx(get('components.button.root.gap'))],
  ['button.root.iconOnlyWidth', exp(CC, 'button.icon.only.width'), presetToPx(get('components.button.root.iconOnlyWidth'))],
  ['button.root.roundedBorderRadius', exp(CC, 'button.rounded.border.radius'), presetToPx(get('components.button.root.roundedBorderRadius'))],
  ['button.root.sm.fontSize', exp(CC, 'button.sm.font.size'), presetToPx(get('components.button.root.sm.fontSize'))],
  ['button.root.sm.paddingX', exp(CC, 'button.sm.padding.x'), presetToPx(get('components.button.root.sm.paddingX'))],
  ['button.root.sm.paddingY', exp(CC, 'button.sm.padding.y'), presetToPx(get('components.button.root.sm.paddingY'))],
  ['button.root.sm.iconOnlyWidth', exp(CC, 'button.sm.icon.only.width'), presetToPx(get('components.button.root.sm.iconOnlyWidth'))],
  ['button.root.lg.fontSize', exp(CC, 'button.lg.font.size'), presetToPx(get('components.button.root.lg.fontSize'))],
  ['button.root.lg.paddingX', exp(CC, 'button.lg.padding.x'), presetToPx(get('components.button.root.lg.paddingX'))],
  ['button.root.lg.paddingY', exp(CC, 'button.lg.padding.y'), presetToPx(get('components.button.root.lg.paddingY'))],
  ['button.root.lg.iconOnlyWidth', exp(CC, 'button.lg.icon.only.width'), presetToPx(get('components.button.root.lg.iconOnlyWidth'))],
  ['formField.paddingX', exp(SC, 'form.field.padding.x'), presetToPx(get('semantic.formField.paddingX'))],
  ['formField.paddingY', exp(SC, 'form.field.padding.y'), presetToPx(get('semantic.formField.paddingY'))],
  ['formField.borderRadius', exp(SC, 'form.field.border.radius'), presetToPx(get('semantic.formField.borderRadius'))],
  ['formField.sm.fontSize', exp(SC, 'form.field.sm.font.size'), presetToPx(get('semantic.formField.sm.fontSize'))],
  ['formField.sm.paddingX', exp(SC, 'form.field.sm.padding.x'), presetToPx(get('semantic.formField.sm.paddingX'))],
  ['formField.sm.paddingY', exp(SC, 'form.field.sm.padding.y'), presetToPx(get('semantic.formField.sm.paddingY'))],
  ['formField.lg.fontSize', exp(SC, 'form.field.lg.font.size'), presetToPx(get('semantic.formField.lg.fontSize'))],
  ['formField.lg.paddingX', exp(SC, 'form.field.lg.padding.x'), presetToPx(get('semantic.formField.lg.paddingX'))],
  ['formField.lg.paddingY', exp(SC, 'form.field.lg.padding.y'), presetToPx(get('semantic.formField.lg.paddingY'))],
  ['iconSize', exp(SC, 'icon.size'), presetToPx(get('semantic.iconSize'))],
  ['overlay.modal.padding', exp(SC, 'overlay.modal.padding'), presetToPx(get('semantic.overlay.modal.padding'))],
  ['overlay.modal.borderRadius', exp(SC, 'overlay.modal.border.radius'), presetToPx(get('semantic.overlay.modal.borderRadius'))],
  ['overlay.popover.padding', exp(SC, 'overlay.popover.padding'), presetToPx(get('semantic.overlay.popover.padding'))],
  ['overlay.popover.borderRadius', exp(SC, 'overlay.popover.border.radius'), presetToPx(get('semantic.overlay.popover.borderRadius'))],
  ['overlay.select.borderRadius', exp(SC, 'overlay.select.border.radius'), presetToPx(get('semantic.overlay.select.borderRadius'))],
  ['tabs.tab.gap', exp(CC, 'tabs.tab.gap'), presetToPx(get('components.tabs.tab.gap'))],
  ['tabs.tab.paddingY', exp(CC, 'tabs.tab.padding.y'), tabPad?.[0]],
  ['tabs.tab.paddingX', exp(CC, 'tabs.tab.padding.x'), tabPad?.[1]],
  ['tabs.tabpanel.paddingTop', exp(CC, 'tabs.tabpanel.padding.top'), tabpanelPad?.[0]],
  ['tabs.tabpanel.paddingRight', exp(CC, 'tabs.tabpanel.padding.right'), tabpanelPad?.[1]],
  ['tabs.tabpanel.paddingBottom', exp(CC, 'tabs.tabpanel.padding.bottom'), tabpanelPad?.[2] ?? tabpanelPad?.[1]],
  ['tabs.tabpanel.paddingLeft', exp(CC, 'tabs.tabpanel.padding.left'), tabpanelPad?.[3] ?? tabpanelPad?.[1]],
  ['tooltip.maxWidth', exp(CC, 'tooltip.max.width'), presetToPx(get('components.tooltip.root.maxWidth'))],
  ['tooltip.gutter', exp(CC, 'tooltip.gutter'), presetToPx(get('components.tooltip.root.gutter'))],
  ['tooltip.paddingY', exp(CC, 'tooltip.padding.y'), ttPad?.[0]],
  ['tooltip.paddingX', exp(CC, 'tooltip.padding.x'), ttPad?.[1]],
  ['divider.horizontal.marginY', exp(CC, 'divider.horizontal.margin.y'), divH?.[0]],
  ['divider.horizontal.marginX', exp(CC, 'divider.horizontal.margin.x'), divH?.[1]],
  ['divider.horizontal.content.paddingY', exp(CC, 'divider.horizontal.content.padding.y'), divHC?.[0]],
  ['divider.horizontal.content.paddingX', exp(CC, 'divider.horizontal.content.padding.x'), divHC?.[1]],
  ['divider.vertical.marginY', exp(CC, 'divider.vertical.margin.y'), divV?.[0]],
  ['divider.vertical.marginX', exp(CC, 'divider.vertical.margin.x'), divV?.[1]],
  ['divider.vertical.content.paddingY', exp(CC, 'divider.vertical.content.padding.y'), divVC?.[0]],
  ['divider.vertical.content.paddingX', exp(CC, 'divider.vertical.content.padding.x'), divVC?.[1]],
  ['toggleswitch.width', exp(CC, 'toggleswitch.width'), presetToPx(get('components.toggleswitch.root.width'))],
  ['toggleswitch.height', exp(CC, 'toggleswitch.height'), presetToPx(get('components.toggleswitch.root.height'))],
  ['toggleswitch.gap', exp(CC, 'toggleswitch.gap'), presetToPx(get('components.toggleswitch.root.gap'))],
  ['toggleswitch.handle.size', exp(CC, 'toggleswitch.handle.size'), presetToPx(get('components.toggleswitch.handle.size'))],
  ['toggleswitch.handle.borderRadius', exp(CC, 'toggleswitch.handle.border.radius'), presetToPx(get('components.toggleswitch.handle.borderRadius'))],
];

let sizingOk = 0;
for (const [label, expected, got] of sizing) {
  if (expected == null) log(`  ? ${label}: la clave no está en el export (¿renombrada en el Kit?)`);
  else if (got === undefined) fail(`${label}: el export dice ${expected} pero el preset no lo fija`);
  else if (Number.isNaN(got)) fail(`${label}: el preset lo fija pero no resuelve a px`);
  else if (Math.abs(got - expected) > 1e-6) fail(`${label}: DRIFT — export=${expected} vs preset=${got}`);
  else sizingOk++;
}
log(`  ✓ ${sizingOk}/${sizing.length} valores de sizing fijados 1:1 con el export`);

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
const surfaceRows = ['0', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].map(
  (s) => ['light', `surface.${s}`, s === '0' ? 'sc-color-gray-0' : `sc-color-gray-${s}`],
);
const ENFORCE = [
  ...surfaceRows,
  ['light', 'primary.color', 'sc-bg-primary'],
  ['light', 'primary.hover.color', 'sc-bg-primary-hover'],
  ['light', 'primary.active.color', 'sc-bg-primary-active'],
  ['light', 'primary.contrast.color', 'sc-text-on-primary'],
  ['light', 'content.background', 'sc-bg-surface'],
  ['light', 'content.border.color', 'sc-border-default'],
  ['light', 'content.color', 'sc-text-primary'],
  ['light', 'content.hover.background', 'sc-bg-secondary-hover'],
  ['light', 'text.color', 'sc-text-primary'],
  ['light', 'text.muted.color', 'sc-text-secondary'],
  ['light', 'form.field.background', 'sc-bg-surface'],
  ['light', 'form.field.color', 'sc-text-primary'],
  ['light', 'form.field.focus.border.color', 'sc-bg-primary'],
  ['light', 'form.field.hover.border.color', 'sc-border-strong'],
  ['light', 'form.field.disabled.background', 'sc-bg-disabled'],
  ['light', 'form.field.invalid.border.color', 'sc-border-error'],
  ['light', 'form.field.icon.color', 'sc-icon-subtle'],
  ['light', 'navigation.item.color', 'sc-text-primary'],
  ['light', 'navigation.item.icon.color', 'sc-icon-subtle'],
  ['light', 'navigation.item.active.background', 'sc-bg-secondary-hover'],
  ['light', 'list.option.color', 'sc-text-primary'],
  ['light', 'list.option.focus.background', 'sc-bg-secondary-hover'],
  ['light', 'overlay.modal.background', 'sc-bg-surface'],
  ['light', 'overlay.modal.border.color', 'sc-border-default'],
  ['light', 'overlay.popover.background', 'sc-bg-surface'],
  ['light', 'overlay.popover.border.color', 'sc-border-default'],
  ['dark', 'primary.color', 'sc-bg-primary'],
  ['dark', 'primary.hover.color', 'sc-bg-primary-hover'],
  ['dark', 'primary.active.color', 'sc-bg-primary-active'],
];
const DIVERGE = [
  ['dark', 'surface.*', 'gray-* navy-tinted (el Kit usa zinc en dark) — paleta de marca SC'],
  ['dark', 'primary.contrast.color', 'texto sobre primario dark = gray-900 navy-tinted vs zinc-900 del Kit (misma divergencia que surface.*)'],
  ['light', 'form.field.border.color', 'borde de input gray-200 (=content/overlay) vs Kit surface-300 — 1 paso, jerarquía propia'],
  ['light', 'form.field.placeholder.color', 'placeholder gray-400 vs Kit surface-500 — un punto más tenue'],
  ['light', 'form.field.disabled.color', 'disabled gray-300 vs Kit surface-500 — más tenue a propósito'],
  ['light', 'overlay.select.background', '--sc-bg-elevated (elevación propia) vs Kit surface-0'],
  ['dark', 'overlay/content/form.field', 'resuelven vía capa 7 (.sc-dark, navy-tinted) — no se cruzan contra el zinc del Kit'],
];

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

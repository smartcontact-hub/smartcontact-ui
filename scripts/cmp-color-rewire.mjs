#!/usr/bin/env node
/**
 * GUARD anti-regresión del rewire de color de componente (Fase 1.1 · adelgazado 2026-06-19).
 *
 * El generador `token-gen-cmp-color.mjs` EMITE `--sc-cmp-<comp>-<parte>` de color; los presets
 * PrimeNG los LEEN vía `var(--sc-cmp-*)` en su `colorScheme`. Este guard (en `verify`) vela por que:
 *   - ningún preset vuelva a HARDCODEAR un hex en un slot que SÍ generamos (el "2º verde-mudo":
 *     emitido pero no leído), y
 *   - cada `var(--sc-cmp-*)` referencie EL token que corresponde a su slot.
 *
 * Historia (por qué es tan corto): la antigua value-equality vs `HEAD:` se RETIRÓ — era circular
 * (HEAD ya tiene el `var(--sc-cmp-*)` repuntado, así que comparaba el token consigo mismo). Un
 * cambio de color en Figma lo caza `tokens:gen-cmp-color` (drift del bloque `@sc-gen`), no esto.
 * Las herramientas de migración (report/excludes/rewire) se retiraron al cerrar el rewire (los 20
 * componentes ya están repuntados). Quedó SOLO la rama viva.
 *
 * Uso:  node scripts/cmp-color-rewire.mjs check   # GUARD en verify (≠0 si rompe)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const LAYERS = resolve(root, 'projects/design-tokens/src/lib/styles/tokens/layers');
const PRESET_REL = 'projects/ui-smartcontact/src/lib/theme/sc-preset';
const PRESET_DIR = resolve(root, PRESET_REL);
const CMP_LIGHT_CSS = resolve(LAYERS, '04-component.css');
const CMP_DARK_CSS = resolve(LAYERS, '07-dark.css');

const log = (s = '') => process.stdout.write(s + '\n');

/** Cuerpo entre dos marcadores @sc-gen (inclusive-exclusive). */
function sliceZone(txt, startMarker, endMarker) {
  const a = txt.indexOf(startMarker);
  const b = txt.indexOf(endMarker);
  if (a < 0 || b < 0) throw new Error(`Marcadores no encontrados: ${startMarker}`);
  return txt.slice(a, b);
}

/** Nombres declarados (`--name: …;`) en un texto CSS. */
function declNames(text) {
  const set = new Set();
  for (const m of text.matchAll(/--([a-z0-9-]+)\s*:\s*[^;]+;/g)) set.add(m[1]);
  return set;
}

const cmpLight = declNames(
  sliceZone(readFileSync(CMP_LIGHT_CSS, 'utf8'), '/* @sc-gen:cmp-color-light', '/* @sc-gen:cmp-color-light:end */'),
);
const cmpDark = declNames(
  sliceZone(readFileSync(CMP_DARK_CSS, 'utf8'), '/* @sc-gen:cmp-color-dark', '/* @sc-gen:cmp-color-dark:end */'),
);
/** ¿Es `name` un token de COLOR de componente generado? (≠ los --sc-cmp-* de sizing). */
export const isCmpColorToken = (name) => cmpLight.has(name) || cmpDark.has(name);

const looksColor = (v) =>
  typeof v === 'string' &&
  (v.startsWith('#') || v.startsWith('{') || v.startsWith('var(') || v.startsWith('color-mix(') || v === 'transparent');
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
export const tokenFor = (comp, path) => `sc-cmp-${comp}-${path.map(kebab).join('-')}`;

/** `export default { … } satisfies X` → objeto evaluable. */
function loadPreset(src) {
  const i = src.indexOf('export default');
  if (i < 0) throw new Error('preset sin export default');
  let literal = src.slice(i + 'export default'.length).trim();
  literal = literal
    .replace(/satisfies\s+[\w.]+\s*;?\s*$/, '')
    .trim()
    .replace(/;$/, '');
  return new Function('return (' + literal + ')')();
}

/** Recorre colorScheme.<mode>.<...> → hojas de color {mode, path[], raw}. */
function* colorLeaves(presetObj) {
  const cs = presetObj?.colorScheme;
  if (!cs) return;
  for (const mode of Object.keys(cs)) {
    yield* walk(cs[mode], []);
    function* walk(node, path) {
      for (const [k, v] of Object.entries(node)) {
        if (v && typeof v === 'object') yield* walk(v, [...path, k]);
        else if (looksColor(v)) yield { mode, path: [...path, k], raw: v };
      }
    }
  }
}

/**
 * PURA (testeable): problemas anti-regresión de color en un preset. `gen = { light, dark }` son
 * los Sets de tokens de color generados POR MODO (un slot puede generarse en light y estar
 * excluido en dark — divergencia de marca). Detecta:
 *   (a) hex hardcodeado en un slot generado EN ESE MODO (2º verde-mudo), y
 *   (b) un `var(--sc-cmp-*)` que no corresponde al token de su slot.
 * Devuelve líneas (vacío = OK). El chequeo por-modo es load-bearing: un hex en dark para un slot
 * solo-light (excluido en dark) es legítimo y NO debe romper.
 */
export function lintPreset(comp, src, gen) {
  const hasInMode = (token, mode) => (mode === 'dark' ? gen.dark : gen.light).has(token);
  const isCmpColor = (token) => gen.light.has(token) || gen.dark.has(token);
  const problems = [];
  for (const { mode, path, raw } of colorLeaves(loadPreset(src))) {
    const token = tokenFor(comp, path);
    const m = raw.match(/^var\(--(sc-cmp-[a-z0-9-]+)\)$/);
    if (m && isCmpColor(m[1])) {
      if (m[1] !== token)
        problems.push(`[${comp}] ${mode}.${path.join('.')} referencia --${m[1]} pero el slot mapea a --${token}.`);
    } else if (/^#[0-9a-fA-F]{6,8}$/.test(raw) && hasInMode(token, mode)) {
      problems.push(
        `[${comp}] ${mode}.${path.join('.')} = ${raw} es hex hardcodeado pero existe --${token}. Repunta o excluye en cmp-color-map.`,
      );
    }
  }
  return problems;
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2] !== 'check') {
    log('uso: cmp-color-rewire.mjs check');
    process.exit(2);
  }
  let fails = 0;
  let checked = 0;
  for (const file of readdirSync(PRESET_DIR).filter((f) => f.endsWith('.ts'))) {
    const comp = file.replace(/\.ts$/, '');
    const src = readFileSync(resolve(PRESET_DIR, file), 'utf8');
    // Solo presets que referencian algún token de COLOR de componente. Gate ANTES de evaluar:
    // presets no-literales (base.ts referencia consts) no se pueden evaluar como objeto suelto —
    // pero tampoco usan tokens de COLOR de componente.
    const refsColor = [...src.matchAll(/var\(--(sc-cmp-[a-z0-9-]+)\)/g)].some((m) => isCmpColorToken(m[1]));
    if (!refsColor) continue;
    const problems = lintPreset(comp, src, { light: cmpLight, dark: cmpDark });
    for (const p of problems) log('✗ ' + p);
    fails += problems.length;
    checked++;
  }
  if (fails) {
    log(`\n✗ cmp-color-rewire: ${fails} problema(s). Sin hex para slots generados; cada var(--sc-cmp-*) debe corresponder a su slot.`);
    process.exit(1);
  }
  log(`✓ cmp-color-rewire OK — ${checked} preset(s) con color de componente; sin hex en slots generados.`);
  process.exit(0);
}

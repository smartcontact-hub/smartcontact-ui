#!/usr/bin/env node
/**
 * VALUE-EQUALITY del rewire de color de componente (Fase 1.1).
 *
 * El generador `token-gen-cmp-color.mjs` EMITE `--sc-cmp-<comp>-<parte>` color, pero el
 * preset PrimeNG todavía tiene el color hardcodeado (hex) o vía refs de marca (`{blue.500}`
 * → navy, `{yellow.500}` → amber por la remapa de `base.ts`). Repuntar el `colorScheme` a
 * `var(--sc-cmp-*)` es lo que hace que un cambio de color en Figma SE VEA.
 *
 * Pero NO todo repunte es un no-op: el generador espeja el Kit LITERAL (azure/yellow/zinc)
 * mientras `base.ts` aplica divergencias de marca (`blue→blue`=navy, `yellow/orange→amber`,
 * `surface→gray`). Este verificador RESUELVE ambos lados a RGBA terminal y los compara:
 *   - `noop`     → el token generado == lo que renderiza HOY (repunte seguro).
 *   - `diverge`  → difieren → repuntar CAMBIARÍA el pixel (decisión de marca, NO repuntar a
 *                  ciegas; excluir en cmp-color-map o curar en Figma).
 *   - `no-token` → el preset tiene color pero el generador no emite ese slot (excluido) → se
 *                  deja a mano.
 *
 * El `e2e` del repo es de MÉTRICA (padding/radio) y NO caza color → ESTE es el verificador
 * fuerte del color, complementado por la revisión visual del toast/message.
 *
 * Uso:
 *   node scripts/cmp-color-rewire.mjs report toast message   # tabla noop/diverge/no-token
 *   node scripts/cmp-color-rewire.mjs check                  # GUARD (en verify): repuntes
 *       value-equal vs HEAD + sin hex hardcodeado para slots que SÍ generamos. ≠0 si rompe.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const LAYERS = resolve(root, 'projects/design-tokens/src/lib/styles/tokens/layers');
const PRESET_REL = 'projects/ui-smartcontact/src/lib/theme/sc-preset';
const PRESET_DIR = resolve(root, PRESET_REL);
const PRIMITIVE = resolve(LAYERS, '01-primitive.css');
const CMP_LIGHT_CSS = resolve(LAYERS, '04-component.css');
const CMP_DARK_CSS = resolve(LAYERS, '07-dark.css');

const log = (s = '') => process.stdout.write(s + '\n');

// ── parsing helpers ───────────────────────────────────────────────────────────
/** Extrae el cuerpo entre dos marcadores @sc-gen (inclusive-exclusive). */
function sliceZone(txt, startMarker, endMarker) {
  const a = txt.indexOf(startMarker);
  const b = txt.indexOf(endMarker);
  if (a < 0 || b < 0) throw new Error(`Marcadores no encontrados: ${startMarker}`);
  return txt.slice(a, b);
}

/** `--name: value;` → Map(name → rawValue). */
function declMap(text) {
  const map = new Map();
  for (const m of text.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) map.set(m[1], m[2].trim());
  return map;
}

const prim = declMap(readFileSync(PRIMITIVE, 'utf8')); // --sc-color-* (+ otras de capa 01)
const cmpLight = declMap(
  sliceZone(readFileSync(CMP_LIGHT_CSS, 'utf8'), '/* @sc-gen:cmp-color-light', '/* @sc-gen:cmp-color-light:end */'),
);
const cmpDark = declMap(
  sliceZone(readFileSync(CMP_DARK_CSS, 'utf8'), '/* @sc-gen:cmp-color-dark', '/* @sc-gen:cmp-color-dark:end */'),
);
const cmpFor = (mode) => (mode === 'dark' ? cmpDark : cmpLight);
/** ¿Es `name` un token de COLOR de componente? (≠ los --sc-cmp-* de sizing). */
const isCmpColorToken = (name) => cmpLight.has(name) || cmpDark.has(name);

/** Mapa de variables visible para resolver en un modo: color de componente (modo) + primitivas. */
function varValue(name, mode) {
  return cmpFor(mode).get(name) ?? prim.get(name);
}

// ── color resolution → {r,g,b,a} (a en 0..1) ──────────────────────────────────
function hexToRGBA(hex) {
  const s = hex.replace('#', '');
  const n = (i) => parseInt(s.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: s.length >= 8 ? n(6) / 255 : 1 };
}

/** Resuelve un valor CSS de color a RGBA terminal. `null` si no es color resoluble. */
export function toRGBA(value, mode, depth = 0) {
  if (value == null || depth > 12) return null;
  const v = value.trim();
  if (v === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(v)) return hexToRGBA(v);
  let m = v.match(/^var\(\s*--([a-z0-9-]+)\s*\)$/);
  if (m) return toRGBA(varValue(m[1], mode), mode, depth + 1);
  // color-mix(in srgb, <inner> N%, transparent)
  m = v.match(/^color-mix\(in srgb,\s*(.+?)\s+([\d.]+)%\s*,\s*transparent\s*\)$/);
  if (m) {
    const base = toRGBA(m[1], mode, depth + 1);
    if (!base) return null;
    return { r: base.r, g: base.g, b: base.b, a: (base.a * Number(m[2])) / 100 };
  }
  return null; // rgb()/otros: no aparece en colorScheme de toast/message
}

export const eqRGBA = (x, y, tol = 0.012) =>
  x && y && x.r === y.r && x.g === y.g && x.b === y.b && Math.abs(x.a - y.a) <= tol;
const fmt = (c) =>
  c ? `#${[c.r, c.g, c.b].map((n) => n.toString(16).padStart(2, '0')).join('')}${c.a < 1 ? `@${Math.round(c.a * 100)}%` : ''}` : '—';

// ── base.ts: familias de marca (para resolver {family.step} del preset) ────────
function loadFamilies() {
  const src = readFileSync(resolve(PRESET_DIR, 'base.ts'), 'utf8');
  const block = src.match(/const families = \{([\s\S]*?)\}\s*as const;/);
  const fam = {};
  if (block) for (const m of block[1].matchAll(/(\w+):\s*'([^']+)'/g)) fam[m[1]] = m[2];
  return fam;
}
const families = loadFamilies();

/** `{family.step}` / `{surface.step}` del preset → valor CSS (vía remapa de base.ts). */
export function presetRefToCss(ref) {
  const m = ref.match(/^\{([\w-]+)\.([\w-]+)\}$/);
  if (!m) return ref; // ya es hex/var/color-mix/transparent
  const [, fam, step] = m;
  if (fam === 'surface') return `var(--sc-color-gray-${step})`; // base.ts: surface = ramp('gray')
  if (families[fam]) return `var(--sc-color-${families[fam]}-${step})`;
  return null; // ref semántica fuera de alcance (no aparece en colorScheme de toast/message)
}

// ── preset object (.ts) → objeto evaluable ────────────────────────────────────
function loadPreset(src) {
  const i = src.indexOf('export default');
  if (i < 0) throw new Error('preset sin export default');
  let literal = src.slice(i + 'export default'.length).trim();
  literal = literal.replace(/satisfies\s+[\w.]+\s*;?\s*$/, '').trim().replace(/;$/, '');
  return new Function('return (' + literal + ')')();
}

const looksColor = (v) =>
  typeof v === 'string' &&
  (v.startsWith('#') || v.startsWith('{') || v.startsWith('var(') || v.startsWith('color-mix(') || v === 'transparent');

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

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

export const tokenFor = (comp, path) => `sc-cmp-${comp}-${path.map(kebab).join('-')}`;
const fileFor = (comp) => resolve(PRESET_DIR, `${comp}.ts`);
const relFor = (comp) => `${PRESET_REL}/${comp}.ts`;
const headSrc = (comp) => execFileSync('git', ['show', `HEAD:${relFor(comp)}`], { cwd: root, encoding: 'utf8' });

// ── análisis por componente (baseline = HEAD: lo que renderiza HOY) ────────────
export function analyze(comp) {
  const obj = loadPreset(headSrc(comp));
  const rows = [];
  for (const { mode, path, raw } of colorLeaves(obj)) {
    const token = tokenFor(comp, path);
    const exists = cmpFor(mode).has(token);
    const current = toRGBA(presetRefToCss(raw), mode);
    const next = exists ? toRGBA(`var(--${token})`, mode) : null;
    let status;
    if (!exists) status = 'no-token';
    else if (!current) status = 'unresolved';
    else if (eqRGBA(current, next)) status = 'noop';
    else status = 'diverge';
    rows.push({ mode, path: path.join('.'), raw, token, current, next, status });
  }
  return rows;
}

// ── CLI (solo al ejecutar directo; al importar desde un test NADA de esto corre) ──
const isCLI = import.meta.url === `file://${process.argv[1]}`;
const [cmd, ...args] = isCLI ? process.argv.slice(2) : [];

if (cmd === 'report') {
  const comps = args.length ? args : ['toast', 'message'];
  for (const comp of comps) {
    const rows = analyze(comp);
    const by = (s) => rows.filter((r) => r.status === s);
    log(`\n══ ${comp} ══  (${rows.length} slots de color · noop ${by('noop').length} · diverge ${by('diverge').length} · no-token ${by('no-token').length} · unresolved ${by('unresolved').length})`);
    for (const s of ['diverge', 'no-token', 'unresolved', 'noop']) {
      const set = by(s);
      if (!set.length) continue;
      log(`  ── ${s} ──`);
      for (const r of set)
        log(`    [${r.mode}] ${r.path.padEnd(38)} ${fmt(r.current).padEnd(12)} → ${fmt(r.next).padEnd(12)} ${s === 'noop' ? '' : `(${r.raw} → --${r.token})`}`);
    }
  }
  process.exit(0);
}

if (cmd === 'excludes') {
  // Emite las claves EXCLUDE (`<mode>:<exportPath>`) de los slots DIVERGE de cada
  // componente → para pegar en cmp-color-map.mjs (preservar la divergencia de marca).
  const comps = args.length ? args : ['toast', 'message'];
  for (const comp of comps) {
    const div = analyze(comp).filter((r) => r.status === 'diverge');
    log(`  // ${comp}: ${div.length} slots diverge`);
    for (const r of div) {
      const exportPath = r.token.replace(/^sc-cmp-/, '').replace(/-/g, '.');
      log(`  '${r.mode}:${exportPath}',`);
    }
  }
  process.exit(0);
}

if (cmd === 'rewire') {
  // Repunta SOLO los slots `noop` (value-equal vs HEAD) del colorScheme a var(--sc-cmp-*),
  // preservando formato exacto (swap del string entre comillas). Los `diverge`/`no-token`
  // y los leaves no-color se dejan intactos. Idempotente.
  const comps = args.length ? args : ['toast', 'message'];
  const OPEN = /^\s*([\w]+):\s*\{\s*$/;
  const CLOSE = /^\s*\}/;
  const LEAF = /^(\s*)([\w]+):\s*"([^"]*)"(,?)\s*$/;
  const ANON_OPEN = /^[^:]*\{\s*$/;
  for (const comp of comps) {
    const noop = new Map(
      analyze(comp).filter((r) => r.status === 'noop').map((r) => [`${r.mode}:${r.path}`, r.token]),
    );
    const file = fileFor(comp);
    const lines = readFileSync(file, 'utf8').split('\n');
    const stack = []; // claves de objetos abiertos (null = anónimo, p.ej. `export default {`)
    let changed = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let m;
      if ((m = line.match(OPEN))) { stack.push(m[1]); continue; }
      if ((m = line.match(LEAF))) {
        const cs = stack.indexOf('colorScheme');
        if (cs >= 0 && stack.length > cs + 1) {
          const mode = stack[cs + 1];
          const path = stack.slice(cs + 2).concat(m[2]).join('.');
          const token = noop.get(`${mode}:${path}`);
          if (token && m[3] !== `var(--${token})`) {
            lines[i] = `${m[1]}${m[2]}: "var(--${token})"${m[4]}`;
            changed++;
          }
        }
        continue;
      }
      if (CLOSE.test(line)) { stack.pop(); continue; }
      if (ANON_OPEN.test(line)) { stack.push(null); continue; }
    }
    writeFileSync(file, lines.join('\n'));
    log(`✓ ${comp}: ${changed} slots repuntados a var(--sc-cmp-*) (noop). diverge/no-token intactos.`);
  }
  process.exit(0);
}

if (cmd === 'check') {
  // GUARD: recorre el WORKING TREE de cada preset que YA referencia un token de color de
  // componente; asegura value-equality (vs HEAD) y que no quede hex para slots generados.
  const files = readdirSync(PRESET_DIR).filter((f) => f.endsWith('.ts'));
  let fails = 0;
  let checkedComps = 0;
  for (const file of files) {
    const comp = file.replace(/\.ts$/, '');
    const srcNow = readFileSync(fileFor(comp), 'utf8');
    // ¿Este preset referencia algún token de color de componente? Si no, nada que verificar.
    // (Gate ANTES de evaluar: presets no-literales como base.ts referencian consts y no se
    //  pueden evaluar como objeto suelto — pero tampoco usan tokens de COLOR de componente.)
    const refsColor = [...srcNow.matchAll(/var\(--(sc-cmp-[a-z0-9-]+)\)/g)].some((m) => isCmpColorToken(m[1]));
    if (!refsColor) continue;
    const objNow = loadPreset(srcNow);
    const leavesNow = [...colorLeaves(objNow)];
    // baseline HEAD para value-equality
    let baseRows = null;
    const baseOf = (mode, path) => {
      baseRows ??= analyze(comp);
      return baseRows.find((r) => r.mode === mode && r.path === path.join('.'));
    };
    let touched = false;
    for (const { mode, path, raw } of leavesNow) {
      const token = tokenFor(comp, path);
      const exists = cmpFor(mode).has(token);
      const m = raw.match(/^var\(--(sc-cmp-[a-z0-9-]+)\)$/);
      if (m && isCmpColorToken(m[1])) {
        // slot REPUNTADO → debe valer lo MISMO que HEAD (no-op demostrable)
        touched = true;
        const base = baseOf(mode, path);
        const tokRGBA = toRGBA(`var(--${m[1]})`, mode);
        if (!base) {
          log(`✗ [${comp}] ${mode}.${path.join('.')} → --${m[1]}: sin baseline en HEAD (¿slot nuevo?).`);
          fails++;
        } else if (!eqRGBA(tokRGBA, base.current)) {
          log(`✗ [${comp}] ${mode}.${path.join('.')} → --${m[1]} = ${fmt(tokRGBA)} ≠ HEAD ${fmt(base.current)} (NO es no-op).`);
          fails++;
        }
        if (m[1] !== token) {
          log(`✗ [${comp}] ${mode}.${path.join('.')} referencia --${m[1]} pero el slot mapea a --${token}.`);
          fails++;
        }
      } else if (/^#[0-9a-fA-F]{6,8}$/.test(raw) && exists) {
        // hex hardcodeado para un slot que SÍ generamos → 2º verde-mudo (emitido pero no leído)
        log(`✗ [${comp}] ${mode}.${path.join('.')} = ${raw} es hex hardcodeado pero existe --${token}. Repunta o excluye en cmp-color-map.`);
        fails++;
      }
    }
    if (touched) checkedComps++;
  }
  if (fails) {
    log(`\n✗ cmp-color-rewire: ${fails} problema(s). El repunte debe ser value-equal vs HEAD y sin hex para slots generados.`);
    process.exit(1);
  }
  log(`✓ cmp-color-rewire OK — ${checkedComps} componente(s) repuntado(s); todos value-equal vs HEAD, sin hex en slots generados.`);
  process.exit(0);
}

if (isCLI) {
  log('uso: cmp-color-rewire.mjs report [comp…]   |   cmp-color-rewire.mjs check');
  process.exit(2);
}

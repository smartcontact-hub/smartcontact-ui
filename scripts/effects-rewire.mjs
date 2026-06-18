#!/usr/bin/env node
/**
 * effects-rewire — repunta el `shadow:` HARDCODED de los presets de componente al token
 * generado `var(--sc-cmp-*-shadow)` (zona @sc-gen:effects). Etapa 2 del puente de sombras
 * (la Etapa 1, token-gen-effects, ya emite los tokens). Hermano de `cmp-color-rewire.mjs`.
 *
 * Las sombras hardcoded de los componentes son, tras normalizeDesignRem, EXACTAMENTE el valor
 * del Kit → repuntarlas a su token es un NO-OP value-equal (lo prueba este script). Las del
 * `base.ts` (var(--sc-shadow-*) tintadas de slate) NO las toca este script: son el delta de marca
 * y se editan a mano con preview (slate→Kit). Las `shadow: "none"` (foco por outline) se respetan.
 *
 * Subcomandos:
 *   report   — tabla: cada shadow hardcoded → token match · no-op/no-token (default)
 *   rewire   — aplica el repunte en los presets
 *   check    — GUARD (en verify): falla si queda un `shadow:` con hex hardcoded para un slot que
 *              SÍ generamos (mata el verde-mudo "emitido pero no leído" de las sombras).
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const PRESET_DIR = resolve(root, 'projects/ui-smartcontact/src/lib/theme/sc-preset');
const EXT_CSS = resolve(root, 'projects/design-tokens/src/lib/styles/tokens/layers/05-extensions.css');
const log = (s = '') => process.stdout.write(s + '\n');

const DESIGN_REM = 14; // normalizeDesignRem: design-rem N → N×(14/16) browser-rem → ×16 = N×14 px.

/** Una longitud CSS ('0' | 'Nrem' | 'Npx' | 'N') → px numérico canónico. */
function lenToPx(tok) {
  const t = tok.trim();
  if (t === '0') return 0;
  let m = t.match(/^(-?[\d.]+)rem$/);
  if (m) return +(parseFloat(m[1]) * DESIGN_REM).toFixed(4); // rem del preset = design-rem
  m = t.match(/^(-?[\d.]+)px$/);
  if (m) return +parseFloat(m[1]).toFixed(4);
  return NaN;
}

/** box-shadow (string) → forma canónica comparable (px + color en minúscula). 'none' → 'none'. */
export function canonShadow(value) {
  const v = String(value).trim();
  if (v === 'none' || v === '') return v;
  const layers = v.split(/,(?![^(]*\))/).map((l) => l.trim());
  const out = [];
  for (const layer of layers) {
    const parts = layer.split(/\s+/);
    const color = parts.pop(); // el color va al final
    const lens = parts.map(lenToPx);
    if (lens.some((n) => Number.isNaN(n))) return null; // no canonizable (var(), etc.)
    out.push(lens.join(' ') + ' ' + color.toLowerCase());
  }
  return out.join(', ');
}

/** Lee la zona @sc-gen:effects → Map<tokenName, canonShadow>. */
export function loadEffectTokens(css = readFileSync(EXT_CSS, 'utf8')) {
  const zone = css.slice(css.indexOf('@sc-gen:effects'), css.indexOf('@sc-gen:effects:end'));
  const map = new Map();
  for (const m of zone.matchAll(/--(sc-cmp-[a-z0-9-]+-shadow)\s*:\s*([^;]+);/g)) map.set(m[1], canonShadow(m[2]));
  return map;
}

/** Para un valor hardcoded en el fichero `comp`, elige el token: prioriza el de su componente. */
export function pickToken(comp, canon, tokens) {
  const byVal = [...tokens].filter(([, v]) => v === canon).map(([n]) => n);
  if (!byVal.length) return null;
  return byVal.find((n) => n.startsWith(`sc-cmp-${comp}-`)) ?? byVal[0];
}

/** Escanea los presets de componente → [{ file, comp, line, raw, canon, token }]. base.ts EXCLUIDO. */
export function scan(tokens) {
  const rows = [];
  for (const file of readdirSync(PRESET_DIR).filter((f) => f.endsWith('.ts') && f !== 'base.ts' && f !== 'index.ts')) {
    const comp = file.replace('.ts', '');
    const lines = readFileSync(resolve(PRESET_DIR, file), 'utf8').split('\n');
    lines.forEach((ln, i) => {
      const m = ln.match(/shadow:\s*"([^"]*#[^"]+)"/); // solo literales con hex (ignora 'none' y var())
      if (!m) return;
      const canon = canonShadow(m[1]);
      const token = canon ? pickToken(comp, canon, tokens) : null;
      rows.push({ file, comp, line: i + 1, raw: m[1], canon, token });
    });
  }
  return rows;
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2] || 'report';
  const tokens = loadEffectTokens();
  const rows = scan(tokens);
  const matched = rows.filter((r) => r.token);
  const orphan = rows.filter((r) => !r.token);

  if (cmd === 'report') {
    log(`\n=== effects-rewire · ${rows.length} shadow hardcoded en presets de componente ===`);
    for (const r of matched) log(`  ${(r.file + ':' + r.line).padEnd(26)} → var(--${r.token})   [no-op: ${r.canon}]`);
    if (orphan.length) {
      log('\n  ⚠ sin token (valor fuera del Kit / no canonizable):');
      for (const r of orphan) log(`    ${r.file}:${r.line} = ${r.raw}`);
    }
    log(`\n  ${matched.length} repuntables (no-op) · ${orphan.length} sin token. base.ts (slate→Kit) = aparte, a mano + preview.`);
    process.exit(0);
  }

  if (cmd === 'rewire') {
    const byFile = new Map();
    for (const r of matched) (byFile.get(r.file) ?? byFile.set(r.file, []).get(r.file)).push(r);
    let n = 0;
    for (const [file, frs] of byFile) {
      const p = resolve(PRESET_DIR, file);
      let txt = readFileSync(p, 'utf8');
      for (const r of frs) {
        txt = txt.replace(`shadow: "${r.raw}"`, `shadow: "var(--${r.token})"`);
        n++;
      }
      writeFileSync(p, txt);
    }
    log(`✓ effects-rewire: ${n} sombras repuntadas a var(--sc-cmp-*-shadow) en ${byFile.size} presets (no-op value-equal).`);
    if (orphan.length) log(`  ⚠ ${orphan.length} sin token, sin tocar (ver report).`);
    process.exit(0);
  }

  if (cmd === 'check') {
    // GUARD: ningún preset de componente debe dejar un shadow con hex hardcoded para un slot que
    // SÍ generamos (es decir, que tenga token match). Si lo hay → no se está leyendo el token.
    if (matched.length) {
      log(`✗ effects-rewire: ${matched.length} sombra(s) con hex hardcoded que YA tienen token generado (deberían leer var(--sc-cmp-*-shadow)):`);
      for (const r of matched.slice(0, 20)) log(`    ${r.file}:${r.line} → debería ser var(--${r.token})`);
      log('  Corre `node scripts/effects-rewire.mjs rewire`.');
      process.exit(1);
    }
    log(`✓ effects-rewire OK — ningún preset deja sombra hardcoded para un slot generado (${orphan.length} fuera del Kit, informadas).`);
    process.exit(0);
  }

  log(`uso: effects-rewire.mjs [report|rewire|check]`);
  process.exit(2);
}

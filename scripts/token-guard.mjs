#!/usr/bin/env node
/**
 * Guardarraíl de tokens — blindaje contra "un update de PrimeNG rompe todo"
 * y contra la reintroducción de la escala 8-point retirada.
 *
 * Reglas duras:
 *  1. El ÚNICO sitio que puede tocar `var(--p-*)` es el preset
 *     (`theme/sc-preset/`). Los componentes consumen SIEMPRE `--sc-*`.
 *  2. En componentes/app, las medidas van por el alias semántico
 *     `--sc-spacing-*`, no por la primitiva `--sc-scale-*` (layer-1). El
 *     preset y las capas de tokens sí referencian la primitiva.
 *  3. Nomenclatura 8-point prohibida: `--sc-space-*` y `--sc-spacing-<NNN>`
 *     (50/100/200…) no existen en este DS — la única tabla es la 14-base
 *     v/14. Cierra el barrido de convergencia por construcción.
 *  4. Campos de formulario PrimeNG crudos (`<p-select>`…) solo vía wrapper
 *     `sc-*`. Excepción: `sc-demo/…/pages/theme` (smoke deliberado del preset
 *     sobre primitivos sin wrapper).
 *  5. `font-size` literal px/rem en SCSS → token `--sc-font-size-*`
 *     (cinturón tipográfico migration-safe).
 *  6. `font-weight` literal en SCSS → token `--sc-font-weight-*`.
 *  7. stack monoespaciado a mano → `var(--sc-font-family-mono)`.
 *
 * Uso:  node scripts/token-guard.mjs   (CI/pre-commit; sale ≠0 si hay violación)
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const log = (s = '') => process.stdout.write(s + '\n');
const PRESET_DIR = 'projects/ui-smartcontact/src/lib/theme/';
const TOKENS_DIR = 'projects/design-tokens/src/lib/styles/';
const THEME_SMOKE = 'projects/sc-demo/src/app/pages/theme/';
const FONT_ALLOW = new Set([]);

const files = execSync('git ls-files projects', { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter((f) => /\.(scss|css|html|ts)$/.test(f) && !f.endsWith('.spec.ts'));

let problems = 0;
const fail = (s) => {
  problems++;
  log('  ✗ ' + s);
};

for (const f of files) {
  const lines = readFileSync(resolve(root, f), 'utf8').split('\n');
  const inPreset = f.startsWith(PRESET_DIR);
  const inTokens = f.startsWith(TOKENS_DIR);
  lines.forEach((line, i) => {
    const at = `${f}:${i + 1}`;
    // 1 — var(--p-*) fuera del preset (sufijo [a-z] = token real, no el
    // placeholder de documentación `var(--p-*)`).
    if (!inPreset && /var\(\s*--p-[a-z]/.test(line)) {
      fail(`${at} usa var(--p-*) directo → solo theme/sc-preset puede tocar --p-*. Usa el --sc-* equivalente.`);
      log(`      ${line.trim()}`);
    }
    // 2 — var(--sc-scale-*) fuera de tokens/preset (usar alias --sc-spacing-*).
    if (!inPreset && !inTokens && /var\(\s*--sc-scale-[a-z0-9]/.test(line)) {
      fail(`${at} usa var(--sc-scale-*) (primitiva layer-1) → en componentes usa el alias semántico --sc-spacing-*.`);
      log(`      ${line.trim()}`);
    }
    // 3 — nomenclatura 8-point (incluye las capas de tokens: no debe existir).
    if (/--sc-space-[a-z0-9]/.test(line) || /--sc-spacing-\d*(00|50)\b/.test(line)) {
      fail(`${at} usa nomenclatura 8-point (--sc-space-* / --sc-spacing-50/100/200…) → la única escala es la 14-base v/14 (--sc-spacing-0-5, -1, -1-5…).`);
      log(`      ${line.trim()}`);
    }
    // 4 — campo de formulario PrimeNG crudo fuera de wrappers y del smoke.
    if (
      f.endsWith('.html') &&
      !f.includes('ui-smartcontact/src/lib/') &&
      !f.startsWith(THEME_SMOKE) &&
      /<p-(select|multiSelect|multiselect|datePicker|datepicker|inputNumber|inputnumber|textarea|password|autoComplete|autocomplete|treeSelect|treeselect|cascadeSelect|cascadeselect)\b/i.test(line)
    ) {
      fail(`${at} usa un campo PrimeNG crudo → envuélvelo en su wrapper (<sc-select>…). Si no, se salta la chrome/densidad del DS.`);
      log(`      ${line.trim()}`);
    }
    // 5 — font-size literal en SCSS.
    if (
      /\.(scss|css)$/.test(f) &&
      !inTokens &&
      !FONT_ALLOW.has(f) &&
      /(?<![\w-])font-size:\s*[0-9.]+(px|rem)/.test(line) &&
      !/^\s*(\/\/|\*|\/\*)/.test(line) &&
      !/(\/\/|\/\*).*font-size/.test(line)
    ) {
      fail(`${at} usa font-size literal → usa un token --sc-font-size-*.`);
      log(`      ${line.trim()}`);
    }
    // 6 — font-weight literal en SCSS → token --sc-font-weight-*. El peso es el
    // eje tipográfico que más se descuadra al cambiar de fuente: con literales,
    // un "500" queda a merced de qué pesos traiga la familia nueva.
    if (
      /\.(scss|css)$/.test(f) &&
      !inTokens &&
      !inPreset &&
      /(?<![\w-])font-weight:\s*\d{3}\b/.test(line) &&
      !/^\s*(\/\/|\*|\/\*)/.test(line) &&
      !/(\/\/|\/\*).*font-weight/.test(line)
    ) {
      fail(`${at} usa font-weight literal → usa un token --sc-font-weight-*.`);
      log(`      ${line.trim()}`);
    }
    // 7 — stack mono literal → var(--sc-font-family-mono).
    if (
      /\.(scss|css)$/.test(f) &&
      !inTokens &&
      !inPreset &&
      /font-family:[^;]*\bmonospace\b/.test(line) &&
      !/var\(--sc-font-family-mono\)/.test(line) &&
      !/^\s*(\/\/|\*|\/\*)/.test(line)
    ) {
      fail(`${at} escribe el stack monoespaciado a mano → usa var(--sc-font-family-mono).`);
      log(`      ${line.trim()}`);
    }
  });
}

log('─'.repeat(60));
if (problems === 0) {
  log(`✓ GUARDARRAÍL OK — sin --p-* fuera del preset, sin primitivas de escala en componentes, sin 8-point, sin font-size/font-weight literal, sin stack mono a mano (${files.length} ficheros).`);
  process.exit(0);
}
log(`✗ ${problems} violación(es).`);
process.exit(1);

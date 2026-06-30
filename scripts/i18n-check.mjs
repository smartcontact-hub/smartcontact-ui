#!/usr/bin/env node
/**
 * i18n:check — paridad de CLAVES entre los locales del Supervisor (es = canónico).
 *
 * Garantiza que en/fr/pt tengan EXACTAMENTE las mismas claves que es: ni claves sin
 * traducir (faltan en un locale) ni huérfanas (sobran respecto a es). No juzga la
 * CALIDAD de la traducción — sólo la COBERTURA: es el guardarraíl que evita que una
 * clave nueva en es se quede sin versión en los demás idiomas y la UI muestre la clave
 * cruda (p. ej. `memory.rules.builder.cond.impact`) en vez del texto.
 *
 * Sólo el Supervisor está localizado (sc-demo/agent no consumen i18n). Si en el futuro
 * otra app añade `assets/i18n/`, amplía APPS.
 *
 * Uso: `node scripts/i18n-check.mjs` (en la cadena `verify`).
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Apps localizadas: dir de locales + referencia canónica + idiomas objetivo.
const APPS = [
  {
    name: 'supervisor',
    dir: 'projects/supervisor/src/assets/i18n',
    reference: 'es',
    targets: ['en', 'fr', 'pt'],
  },
];

const SEP = '─'.repeat(60);
const load = (dir, l) => JSON.parse(readFileSync(resolve(root, dir, `${l}.json`), 'utf8'));

/** Aplana a claves dot-path (las hojas string/number, no los objetos intermedios). */
const flat = (o, p = '', a = {}) => {
  for (const [k, v] of Object.entries(o)) {
    const kp = p ? `${p}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, kp, a);
    else a[kp] = v;
  }
  return a;
};

let problems = 0;
console.log('\n=== i18n:check · paridad de claves entre locales ===');

for (const app of APPS) {
  const refKeys = new Set(Object.keys(flat(load(app.dir, app.reference))));
  console.log(`\n${app.name} (referencia: ${app.reference} · ${refKeys.size} claves)`);
  for (const locale of app.targets) {
    const keys = new Set(Object.keys(flat(load(app.dir, locale))));
    const missing = [...refKeys].filter((k) => !keys.has(k));
    const orphan = [...keys].filter((k) => !refKeys.has(k));
    if (missing.length || orphan.length) {
      problems += missing.length + orphan.length;
      console.log(`  ✗ ${locale}: ${missing.length} sin traducir · ${orphan.length} huérfana(s)`);
      for (const k of missing.slice(0, 25)) console.log(`      falta: ${k}`);
      if (missing.length > 25) console.log(`      …y ${missing.length - 25} más`);
      for (const k of orphan.slice(0, 25)) console.log(`      sobra: ${k}`);
    } else {
      console.log(`  ✓ ${locale}: ${keys.size} claves, 1:1 con ${app.reference}`);
    }
  }
}

console.log(`\n${SEP}`);
if (problems) {
  console.log(`✗ i18n:check — ${problems} discrepancia(s) de claves. Cuadra cada locale con su referencia.`);
  process.exit(1);
}
console.log('✓ i18n:check OK — todos los locales 1:1 con su referencia.');

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * MINI-TEST de extremo a extremo — la PUERTA del puente (Fase 1.4).
 * Prueba que un cambio en el export del Kit FLUYE al CSS por CADA generador, sin tocar el
 * export ni las capas reales: monta un sandbox (copia de las capas + export mutado), corre el
 * generador apuntado ahí por env (SC_KIT_EXPORT / SC_LAYERS_DIR) y asserta que el cambio aparece.
 * Si un generador dejara de propagar un cambio del Kit, ESTE test salta. Regresión para siempre.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REAL_EXPORT = resolve(root, 'projects/design-tokens/scripts/kit-export-dtcg.json');
const REAL_LAYERS = resolve(root, 'projects/design-tokens/src/lib/styles/tokens/layers');
const LAYER_FILES = ['01-primitive.css', '02-semantic.css', '03-palette.css', '04-component.css', '05-extensions.css', '07-dark.css'];

const count = (txt, needle) => (txt.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

/** Carga el export real como objeto (puede venir como string JSON escapado). */
function loadRawKit() {
  let k = JSON.parse(readFileSync(REAL_EXPORT, 'utf8'));
  if (typeof k === 'string') k = JSON.parse(k);
  return k;
}

/** Encuentra (recursivamente) la primera hoja {$value,...} cuyo $value cumple el predicado.
 *  El predicado recibe (value, node, path) — el path permite excluir ramas (p.ej. surface). */
function findLeaf(node, pred, path = '') {
  if (!node || typeof node !== 'object') return null;
  if (node.$value !== undefined && pred(node.$value, node, path)) return node;
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$')) continue;
    const r = findLeaf(v, pred, path ? `${path}.${k}` : k);
    if (r) return r;
  }
  return null;
}

/** Monta un sandbox: copia de capas + export mutado. Devuelve { layers, env, cleanup }. */
function sandbox(mutate) {
  const dir = mkdtempSync(resolve(tmpdir(), 'sc-bridge-'));
  const layers = resolve(dir, 'layers');
  mkdirSync(layers);
  for (const f of LAYER_FILES) copyFileSync(resolve(REAL_LAYERS, f), resolve(layers, f));
  let kit = JSON.parse(readFileSync(REAL_EXPORT, 'utf8'));
  if (typeof kit === 'string') kit = JSON.parse(kit); // el export puede venir como string escapado
  mutate(kit);
  const exp = resolve(dir, 'export.json');
  writeFileSync(exp, JSON.stringify(kit));
  return {
    layers,
    env: { ...process.env, SC_KIT_EXPORT: exp, SC_LAYERS_DIR: layers },
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
const gen = (script, env) => execFileSync('node', [resolve(root, 'scripts', script), '--write'], { env, cwd: root, stdio: 'pipe' });
const layer = (layers, f) => readFileSync(resolve(layers, f), 'utf8');

test('PUERTA · primitivo (yellow.500 → #abcdef) fluye a 01-primitive.css', () => {
  const sb = sandbox((kit) => { kit['aura/primitive'].yellow['500'].$value = '#abcdefff'; });
  try {
    gen('token-gen.mjs', sb.env);
    assert.match(layer(sb.layers, '01-primitive.css'), /--sc-color-yellow-500:\s*#abcdef/i);
  } finally { sb.cleanup(); }
});

test('PUERTA · sizing de componente (button.padding.x → 999) fluye a 04-component.css', () => {
  const sb = sandbox((kit) => { kit['aura/component/common'].button.padding.x.$value = 999; });
  try {
    gen('token-gen-component.mjs', sb.env);
    const css = layer(sb.layers, '04-component.css');
    // El px va en el comentario tras el `;` (--sc-cmp-button-padding-x: 62.4375rem; /* 999px */).
    assert.match(css, /--sc-cmp-button-padding-x:[^\n]*999px/);
  } finally { sb.cleanup(); }
});

test('PUERTA · sombra/effect (card.shadow blur → 999) fluye a 05-extensions.css', () => {
  const sb = sandbox((kit) => { kit['aura/effects'].card.shadow.$value[0].blur = '999'; });
  try {
    gen('token-gen-effects.mjs', sb.env);
    assert.match(layer(sb.layers, '05-extensions.css'), /--sc-cmp-card-shadow:[^;]*999px/);
  } finally { sb.cleanup(); }
});

test('PUERTA · color semántico (ref primitiva directa → {red.700}) fluye a 02-semantic.css', () => {
  const base = count(layer(REAL_LAYERS, '02-semantic.css'), 'sc-color-red-700');
  // Candidatos: hojas que apuntan a una PRIMITIVA directa (p.ej. {red.400}) — son las asignaciones
  // semánticas 1:1 (las que pasan por {surface}/{text}/{primary} son alias multi-fuente). Iteramos
  // hasta una que propague limpio (el generador tiene un guard de consistencia que rechaza las multi).
  const paths = [];
  (function walk(n, p = '') {
    if (!n || typeof n !== 'object') return;
    if (n.$value !== undefined) {
      if (n.$type === 'color' && typeof n.$value === 'string' && /^\{(red|green|amber|sky|electric-blue|cyan|orange|purple|yellow|blue)\.\d/.test(n.$value) && n.$value !== '{red.700}') paths.push(p);
      return;
    }
    for (const [k, v] of Object.entries(n)) if (!k.startsWith('$')) walk(v, p ? `${p}.${k}` : k);
  })(loadRawKit()['aura/semantic/light']);
  assert.ok(paths.length, 'no hay hojas semánticas con ref primitiva directa');

  let flowed = false;
  for (const path of paths) {
    const sb = sandbox((kit) => {
      let n = kit['aura/semantic/light'];
      for (const seg of path.split('.')) n = n[seg];
      n.$value = '{red.700}';
    });
    try {
      gen('token-gen-color.mjs', sb.env);
      if (count(layer(sb.layers, '02-semantic.css'), 'sc-color-red-700') === base + 1) { flowed = true; break; }
    } catch { /* este slot choca con el guard de consistencia → prueba el siguiente */ } finally { sb.cleanup(); }
  }
  assert.ok(flowed, 'ningún cambio semántico de ref primitiva se propagó +1 a 02-semantic.css');
});

test('PUERTA · color de componente (ref primitiva → {red.700}) fluye a 04-component.css', () => {
  const base = count(layer(REAL_LAYERS, '04-component.css'), 'sc-color-red-700');
  const sb = sandbox((kit) => {
    const leaf = findLeaf(kit['aura/component/light'], (v) => typeof v === 'string' && /^\{(blue|sky|slate|gray|zinc|amber|green|red|yellow|orange|purple)\./.test(v) && v !== '{red.700}');
    assert.ok(leaf, 'no encontré una hoja de color de componente con ref primitiva para mutar');
    leaf.$value = '{red.700}';
  });
  try {
    gen('token-gen-cmp-color.mjs', sb.env);
    assert.equal(count(layer(sb.layers, '04-component.css'), 'sc-color-red-700'), base + 1);
  } finally { sb.cleanup(); }
});

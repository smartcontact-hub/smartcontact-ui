#!/usr/bin/env node
/**
 * «Qué cambia con este export», en llano, para la portada del PR del robot de tokens.
 *
 * Por qué existe (2026-09-14): el PR de `tokens-sync` solo decía «Sync del Theme Designer» y dos
 * SHA. Para fundirlo había que abrir el diff de un JSON de 3.000 hojas y adivinar qué pantallas
 * tocaba. La medición de la historia del robot dio 11 pasos a mano con el robot en verde; este es
 * el primero que desaparece: el PR cuenta qué tokens del Kit cambian, qué variables `--sc-*` se
 * mueven y qué componentes las leen.
 *
 * Qué compara: el árbol actual (el robot ya corrió `tokens:import`) contra un ref de git (por
 * defecto `origin/main`), en dos capas:
 *   1. el export del Kit, hoja a hoja y RESUELTO (una referencia que cambia de destino cuenta),
 *      en claro y en oscuro;
 *   2. las variables `--sc-*` de las seis capas de tokens, declaración a declaración.
 * Y quién lee cada variable que se mueve, siguiendo los alias entre variables: el preset
 * (`sc-preset/*.ts`, un fichero por componente de PrimeNG), los componentes del DS y las apps.
 *
 * No juzga ni falla: informa. El veredicto sigue siendo `verify` + e2e.
 *
 * Uso:
 *   node scripts/tokens-sync-cambios.mjs [--base origin/main] [--md salida.md] [--json salida.json]
 *   node scripts/tokens-sync-cambios.mjs --ceros    # sale 1 si un token que tenía medida pasa a 0
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

import { loadKitExport } from './dtcg-export.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const EXPORT_REL = 'projects/design-tokens/scripts/kit-export-dtcg.json';
const LAYERS_REL = 'projects/design-tokens/src/lib/styles/tokens/layers';
const LAYERS = ['01-primitive', '02-semantic', '03-palette', '04-component', '05-extensions', '07-dark'];
const PRESET_REL = 'projects/ui-smartcontact/src/lib/theme/sc-preset';
const CONSUMERS = [
  { rel: 'projects/ui-smartcontact/src/lib/components', kind: 'ds' },
  { rel: 'projects/supervisor/src', kind: 'supervisor' },
];

// ── Export ───────────────────────────────────────────────────────────────────────────────────

const modeOf = (group) => (/\/dark$/.test(group) ? 'dark' : 'light');

/** Valor final comparable de una hoja: número o texto, con la referencia resuelta. */
function leafValue(kit, group, path) {
  const leaf = kit.groups[group]?.get(path);
  if (!leaf) return undefined;
  try {
    const v = kit.resolve(leaf.$value, modeOf(group));
    return typeof v === 'object' ? JSON.stringify(v) : String(v).toLowerCase();
  } catch {
    return String(leaf.$value);
  }
}

/** Hojas del export que cambian de valor final (o aparecen / desaparecen). */
export function diffExports(before, after) {
  const out = [];
  const groups = new Set([...Object.keys(before.groups), ...Object.keys(after.groups)]);
  for (const group of [...groups].sort()) {
    const paths = new Set([...(before.groups[group]?.keys() ?? []), ...(after.groups[group]?.keys() ?? [])]);
    for (const path of [...paths].sort()) {
      const a = leafValue(before, group, path);
      const b = leafValue(after, group, path);
      if (a === b) continue;
      // Directo = se editó la hoja (su valor o su referencia); heredado = cambió lo que apunta.
      const raw = (kit) => JSON.stringify(kit.groups[group]?.get(path)?.$value ?? null);
      out.push({ group, path, antes: a ?? null, despues: b ?? null, directo: raw(before) !== raw(after) });
    }
  }
  return out;
}

/**
 * Tokens que tenían medida y pasan a 0. Un 0 no es «sin valor»: gana a cualquier respaldo de
 * `var()` y deja la pieza sin esa medida (un zip de septiembre dejó a 0 dos tallas de letra y los
 * títulos de card y diálogo se quedaron sin altura, `docs/conexion-variables.md` §La rutina por
 * tema). Y el repo NO lo corrige al importar: medido el 2026-09-14, `button.padding.x = 0` sale
 * como `--sc-cmp-button-padding-x: 0`. Por eso pone rojo al robot. Un 0 a propósito se apunta
 * aquí, con su motivo.
 */
export const CEROS_A_PROPOSITO = [
  // { group: 'aura/component/common', path: 'x.y', motivo: '…' },
];

export function newZeros(kitDiff, allow = CEROS_A_PROPOSITO) {
  const ok = new Set(allow.map((a) => `${a.group}|${a.path}`));
  return kitDiff.filter((r) => r.despues === '0' && r.antes != null && /^-?\d*\.?\d+$/.test(r.antes) && Number(r.antes) !== 0 && !ok.has(`${r.group}|${r.path}`));
}

// ── Capas CSS ────────────────────────────────────────────────────────────────────────────────

/** Declaraciones `--sc-*` de una capa, con su ámbito (claro u oscuro) por la regla que las contiene. */
export function parseLayer(css, file) {
  const out = new Map();
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = rule.exec(text))) {
    const scope = /\.sc-dark/.test(m[1]) ? 'oscuro' : 'claro';
    for (const d of m[2].matchAll(/(--sc-[\w-]+)\s*:\s*([^;]+);/g)) out.set(`${file}|${scope}|${d[1]}`, { file, scope, name: d[1], value: d[2].trim() });
  }
  return out;
}

export function diffLayers(beforeByFile, afterByFile) {
  const out = [];
  for (const file of LAYERS) {
    const a = parseLayer(beforeByFile[file] ?? '', file);
    const b = parseLayer(afterByFile[file] ?? '', file);
    for (const key of new Set([...a.keys(), ...b.keys()])) {
      const x = a.get(key);
      const y = b.get(key);
      if (x?.value !== y?.value) {
        const ref = x ?? y;
        out.push({ file, scope: ref.scope, name: ref.name, antes: x?.value ?? null, despues: y?.value ?? null });
      }
    }
  }
  return out;
}

// ── Quién lee cada variable ─────────────────────────────────────────────────────────────────

function walk(dir, exts, into = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, into);
    else if (exts.some((e) => name.endsWith(e)) && !name.endsWith('.spec.ts')) into.push(p);
  }
  return into;
}

/** Variables que dependen de las cambiadas por alias (`--x: var(--cambiada)`), hasta el cierre. */
export function withDependents(changed, layersByFile) {
  const decls = LAYERS.flatMap((f) => [...parseLayer(layersByFile[f] ?? '', f).values()]);
  const all = new Set(changed);
  let grew = true;
  while (grew) {
    grew = false;
    for (const d of decls) {
      if (all.has(d.name)) continue;
      if ([...d.value.matchAll(/var\((--sc-[\w-]+)/g)].some((m) => all.has(m[1]))) {
        all.add(d.name);
        grew = true;
      }
    }
  }
  return all;
}

export function readersOf(names, files) {
  const hits = new Map();
  const pattern = new RegExp(`var\\((${[...names].map((n) => n.replace(/[-]/g, '\\-')).join('|')})[,)]`);
  for (const { path, kind, text } of files) {
    if (!names.size || !pattern.test(text)) continue;
    const label = kind === 'preset'
      ? path.split('/').pop().replace(/\.ts$/, '').replace(/^base$/, 'todos (semántica común)')
      : kind === 'ds'
        ? `sc-${relative(join(ROOT, CONSUMERS[0].rel), path).split('/')[0]}`
        : relative(join(ROOT, CONSUMERS[1].rel), path).split('/').slice(0, 3).join('/');
    if (!hits.has(kind)) hits.set(kind, new Set());
    hits.get(kind).add(label);
  }
  return Object.fromEntries([...hits].map(([k, v]) => [k, [...v].sort()]));
}

// ── Texto ────────────────────────────────────────────────────────────────────────────────────

const KIND = { preset: 'Componentes de PrimeNG (tema)', ds: 'Componentes del DS', supervisor: 'Supervisor' };
const cap = (list, n) => (list.length > n ? `${list.slice(0, n).join(', ')} y ${list.length - n} más` : list.join(', '));
const cell = (v) => (v == null ? '—' : `\`${String(v).replace(/\|/g, '\\|')}\``);

export function renderMarkdown({ kit, css, readers, base }) {
  const L = [];
  const medidas = kit.filter((r) => /^\d/.test(r.antes ?? r.despues ?? '')).length;
  L.push('### Qué cambia');
  if (!kit.length && !css.length) {
    L.push('', `Nada: el export coincide con \`${base}\` hoja a hoja y las capas de tokens salen idénticas.`);
    return L.join('\n');
  }
  const directos = kit.filter((r) => r.directo).length;
  L.push('', `- **En Figma**: se editaron ${directos} tokens del Kit (${medidas} de los ${kit.length} que cambian de valor son medidas). Los otros ${kit.length - directos} cambian porque apuntan a uno editado.`);
  L.push(`- **En código**: se mueven ${css.length} variables \`--sc-*\`${readers.dependientes ? `, y ${readers.dependientes} más que dependen de ellas` : ''}.`);
  for (const kind of ['preset', 'ds', 'supervisor']) {
    if (readers.by[kind]?.length) L.push(`- **${KIND[kind]}**: ${cap(readers.by[kind], 12)}.`);
  }
  L.push('', '<details><summary>Tokens del Kit, uno a uno</summary>', '', '| Token | Antes | Después |', '|---|---|---|');
  for (const r of kit.slice(0, 200)) L.push(`| \`${r.group.replace('aura/', '')} · ${r.path}\` | ${cell(r.antes)} | ${cell(r.despues)} |`);
  if (kit.length > 200) L.push(`| … y ${kit.length - 200} más | | |`);
  L.push('', '</details>', '', '<details><summary>Variables de código, una a una</summary>', '', '| Variable | Tema | Antes | Después |', '|---|---|---|---|');
  for (const r of css.slice(0, 200)) L.push(`| \`${r.name}\` | ${r.scope} | ${cell(r.antes)} | ${cell(r.despues)} |`);
  L.push('', '</details>');
  return L.join('\n');
}

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (flag, def) => {
    const i = process.argv.indexOf(flag);
    return i === -1 ? def : process.argv[i + 1];
  };
  const base = arg('--base', 'origin/main');
  const show = (rel) => execFileSync('git', ['show', `${base}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const tmp = mkdtempSync(join(tmpdir(), 'tokens-cambios-'));
  writeFileSync(join(tmp, 'antes.json'), show(EXPORT_REL));
  const kit = diffExports(loadKitExport(join(tmp, 'antes.json')), loadKitExport(join(ROOT, EXPORT_REL)));
  const before = Object.fromEntries(LAYERS.map((f) => [f, show(`${LAYERS_REL}/${f}.css`)]));
  const after = Object.fromEntries(LAYERS.map((f) => [f, readFileSync(join(ROOT, LAYERS_REL, `${f}.css`), 'utf8')]));
  const css = diffLayers(before, after);
  const changedNames = new Set(css.map((r) => r.name));
  const names = withDependents(changedNames, after);
  const files = [
    ...walk(join(ROOT, PRESET_REL), ['.ts']).map((path) => ({ path, kind: 'preset' })),
    ...CONSUMERS.flatMap((c) => walk(join(ROOT, c.rel), ['.ts', '.scss', '.html']).map((path) => ({ path, kind: c.kind }))),
  ].map((f) => ({ ...f, text: readFileSync(f.path, 'utf8') }));
  const readers = { by: readersOf(names, files), dependientes: names.size - changedNames.size };
  if (process.argv.includes('--ceros')) {
    const zeros = newZeros(kit);
    for (const z of zeros) process.stdout.write(`✗ cero nuevo: ${z.group} · ${z.path} (antes ${z.antes})\n`);
    if (!zeros.length) process.stdout.write('✓ ningún token del Kit pasa a 0\n');
    process.exit(zeros.length ? 1 : 0);
  }
  const md = renderMarkdown({ kit, css, readers, base });
  const mdOut = arg('--md', null);
  if (mdOut) writeFileSync(mdOut, `${md}\n`);
  else process.stdout.write(`${md}\n`);
  const jsonOut = arg('--json', null);
  if (jsonOut) writeFileSync(jsonOut, `${JSON.stringify({ base, kit, css, readers }, null, 2)}\n`);
}

#!/usr/bin/env node
/**
 * ¿Qué suites e2e necesita ESTE cambio? Lo usa el job `changes` de `ci.yml` (DD-117).
 *
 * Un PR que solo toca el Supervisor no puede romper CusCare ni el catálogo de sc-docs: correr sus
 * suites es trabajo tirado. Pero el filtro es por rutas, y una ruta que no se ha previsto puede
 * esconder una dependencia. Por eso la regla es al revés de un allowlist: **todo lo que no sepamos
 * clasificar corre TODO**. Solo se ahorra lo que se sabe seguro:
 *
 *   · un fichero de UNA app (su carpeta, su suite, su config de Playwright) → solo esa suite;
 *   · documentación que ningún runtime lee → ninguna suite;
 *   · un script de `scripts/` que ninguna e2e alcanza (los gates de `verify`) → ninguna suite;
 *   · lo demás (el DS, la raíz, lo que las e2e importan de `scripts/`, `e2e/shared/`…) → todas.
 *
 * Qué scripts alcanzan las e2e no se apunta a mano (se pudriría): se siguen los `import` desde
 * `e2e/` y las configs de Playwright, y las rutas `scripts/…` que citen.
 *
 * `verify` y `build` no pasan por aquí: corren siempre. Y en `main` (push) corre todo siempre: es la
 * red para cuando esta tabla se equivoque.
 *
 * Uso (CI):  node scripts/ci-cambios.mjs <base-sha> <head-sha>   → escribe en $GITHUB_OUTPUT
 *            node scripts/ci-cambios.mjs --todo                  → todo a true (push a main)
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Las suites e2e del CI, por el nombre del output que lee cada job. */
export const SUITES = ['smoke', 'supervisor', 'cuscare'];

/**
 * Cada app de `angular.json` tiene que estar aquí, con su suite o con `null` si no tiene. Un test lo
 * exige: una app nueva que nadie clasifique haría que sus cambios no corrieran nada.
 */
export const APPS = {
  'sc-docs': 'smoke',
  supervisor: 'supervisor',
  cuscare: 'cuscare',
  agent: null,
  'agent-mini': null,
};

const PROPIOS = [
  [/^projects\/sc-docs\//, 'smoke'],
  [/^projects\/supervisor\//, 'supervisor'],
  [/^projects\/cuscare\//, 'cuscare'],
  [/^projects\/(agent|agent-mini)\//, null],
  [/^e2e\/supervisor\//, 'supervisor'],
  [/^e2e\/cuscare\//, 'cuscare'],
  [/^e2e\/(baselines|components\.spec\.ts-snapshots)\//, 'smoke'],
  [/^e2e\/[^/]+\.(spec\.)?ts$/, 'smoke'],
  [/^playwright\.config\.ts$/, 'smoke'],
  [/^playwright\.supervisor\.config\.ts$/, 'supervisor'],
  [/^playwright\.cuscare\.config\.ts$/, 'cuscare'],
];

/** Lo que ningún runtime ni ninguna suite lee. */
const DOCUMENTACION = [/^docs\//, /^findings\//, /^\.claude\//, /^[^/]+\.md$/];

/**
 * @param {string[]} ficheros rutas cambiadas, relativas a la raíz del repo
 * @param {ReadonlySet<string>} scriptsDeE2e los `scripts/…` que alcanza alguna e2e
 * @returns {Record<string, boolean>} una entrada por suite
 */
export function suitesPara(ficheros, scriptsDeE2e) {
  const out = Object.fromEntries(SUITES.map((s) => [s, false]));
  for (const f of ficheros) {
    if (DOCUMENTACION.some((re) => re.test(f))) continue;
    if (/^scripts\//.test(f) && !scriptsDeE2e.has(f)) continue;
    const propio = PROPIOS.find(([re]) => re.test(f));
    if (!propio) return Object.fromEntries(SUITES.map((s) => [s, true]));
    if (propio[1]) out[propio[1]] = true;
  }
  return out;
}

const IMPORT = /(?:from\s*|import\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g;
const CITA = /\bscripts\/[\w./-]+\.(?:mjs|cjs|js|ts)\b/g;

function* ficherosDe(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* ficherosDe(p);
    else if (/\.(m?[jt]s)$/.test(e)) yield p;
  }
}

/**
 * Los ficheros de `scripts/` que alcanza alguna e2e: importados desde `e2e/` o una config de
 * Playwright, o citados por ruta, y lo que esos importan a su vez.
 * @param {string} raiz
 * @returns {Set<string>} rutas relativas a la raíz
 */
export function scriptsAlcanzadosPorE2e(raiz) {
  const origenes = [
    ...ficherosDe(join(raiz, 'e2e')),
    ...readdirSync(raiz).filter((f) => /^playwright.*\.ts$/.test(f)).map((f) => join(raiz, f)),
  ];
  const vistos = new Set();
  const pendientes = [];
  const anota = (abs) => {
    const rel = relative(raiz, abs);
    if (!rel.startsWith('scripts/') || vistos.has(rel) || !existsSync(abs)) return;
    vistos.add(rel);
    pendientes.push(abs);
  };
  const leer = (abs) => {
    const texto = readFileSync(abs, 'utf8');
    for (const [, spec] of texto.matchAll(IMPORT)) anota(normalize(join(dirname(abs), spec)));
    for (const [cita] of texto.matchAll(CITA)) anota(join(raiz, cita));
  };
  origenes.forEach(leer);
  while (pendientes.length) leer(pendientes.pop());
  return vistos;
}

/** Apps de `angular.json` (`projectType: application`). */
export function appsDeAngular(angularJson) {
  return Object.entries(JSON.parse(angularJson).projects)
    .filter(([, p]) => p.projectType === 'application')
    .map(([nombre]) => nombre);
}

function escribir(suites, motivo) {
  const lineas = Object.entries(suites).map(([s, v]) => `${s}=${v}`);
  console.log(`${motivo}\n${lineas.join('\n')}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, lineas.join('\n') + '\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [a, b] = process.argv.slice(2);
  if (a === '--todo') {
    escribir(Object.fromEntries(SUITES.map((s) => [s, true])), 'push a main: todo.');
  } else if (a && b) {
    const base = execFileSync('git', ['merge-base', a, b], { encoding: 'utf8' }).trim();
    const ficheros = execFileSync('git', ['diff', '--name-only', base, b], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    const sinClasificar = appsDeAngular(readFileSync('angular.json', 'utf8')).filter((x) => !(x in APPS));
    if (sinClasificar.length) {
      escribir(Object.fromEntries(SUITES.map((s) => [s, true])), `apps sin clasificar (${sinClasificar.join(', ')}): todo.`);
    } else {
      const alcanzados = scriptsAlcanzadosPorE2e(process.cwd());
      escribir(suitesPara(ficheros, alcanzados), `${ficheros.length} fichero(s) cambiado(s) desde ${base.slice(0, 8)}.`);
    }
  } else {
    console.error('Uso: node scripts/ci-cambios.mjs <base-sha> <head-sha> | --todo');
    process.exit(2);
  }
}

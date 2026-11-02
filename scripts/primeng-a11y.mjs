#!/usr/bin/env node
/**
 * primeng:a11y · LA ACCESIBILIDAD QUE PRIMENG DOCUMENTA, para la pestaña «Accesibilidad» de cada ficha de sc-docs.
 *
 * Por qué existe: un wrapper `sc-*` hereda el teclado y los roles ARIA del componente de PrimeNG que envuelve, y eso
 * PrimeNG lo documenta entero (lector de pantalla y una tabla de teclas por estado). La ficha no lo contaba, así que
 * quien quería saber qué hace Tab en un Select tenía que ir a primeng.dev y adivinar que el nuestro se porta igual.
 *
 * De dónde sale: `apps/showcase/doc/<módulo>/accessibility-doc.ts` del repo de PrimeNG (rama principal, por `gh`). El
 * Markdown para agentes de primeng.dev trae el texto del lector de pantalla pero NO las tablas de teclas (medido el
 * 2026-11-03 en `select.md`), por eso se lee la plantilla. Va en inglés, tal cual: es texto de PrimeNG (licencia MIT) y
 * la ficha lo atribuye.
 *
 * Qué escribe: `projects/sc-docs/public/components/_a11y-primeng.json`, que SÍ se commitea: pide red y `gh`, así que no
 * corre en el build ni en el CI. Se regenera a mano al subir de versión de PrimeNG:
 *   node scripts/primeng-a11y.mjs
 *
 * `seccionesDeA11y` es PURA (texto de la plantilla → secciones): su test, en `scripts/__tests__/primeng-a11y.test.mjs`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'primefaces/primeng';
const API = resolve(ROOT, 'projects/sc-docs/public/components/_component-api.json');
const SALIDA = resolve(ROOT, 'projects/sc-docs/public/components/_a11y-primeng.json');

/** Texto plano de un trozo de HTML: sin etiquetas y con los espacios juntos. */
const plano = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+([.,;:)])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Las secciones de un `accessibility-doc.ts`: cada `<h3>` con sus párrafos y, si la lleva, su tabla de teclas
 * (`<td>` de la tecla y `<td>` de lo que hace). Lo que va antes del primer `<h3>` no es una sección.
 */
export function seccionesDeA11y(ts) {
  return ts
    .split(/<h3>/)
    .slice(1)
    .map((trozo) => {
      const titulo = plano(trozo.split('</h3>')[0]);
      const cuerpo = trozo.split('</h3>').slice(1).join('</h3>');
      const parrafos = [...cuerpo.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => plano(m[1])).filter(Boolean);
      const teclas = [...cuerpo.matchAll(/<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g)].map((m) => ({
        tecla: plano(m[1]),
        funcion: plano(m[2]),
      }));
      return { titulo, parrafos, teclas };
    })
    .filter((s) => s.titulo && (s.parrafos.length || s.teclas.length));
}

/** Los módulos que envuelven de verdad los componentes del contrato (`primengPrincipal`, de `audit:components`). */
export function modulosPrincipales(componentes) {
  return [...new Set(componentes.map((c) => c.primengPrincipal).filter(Boolean))].sort();
}

/** Dónde busca su página el showcase: el módulo, y si no está, sin el «input» de delante (`inputpassword` → `password`). */
export const carpetasDe = (m) => [m, ...(m.startsWith('input') ? [m.slice(5)] : [])];

const gh = (ruta) => JSON.parse(execFileSync('gh', ['api', ruta], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }));

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const api = JSON.parse(readFileSync(API, 'utf8'));
  const sha = gh(`repos/${REPO}/commits/master`).sha.slice(0, 7);
  const modulos = {};
  const sinDoc = [];
  for (const m of modulosPrincipales(api.components)) {
    let secciones = [];
    for (const carpeta of carpetasDe(m)) {
      try {
        const ts = Buffer.from(gh(`repos/${REPO}/contents/apps/showcase/doc/${carpeta}/accessibility-doc.ts`).content, 'base64').toString('utf8');
        secciones = seccionesDeA11y(ts);
        break;
      } catch {
        // Sin esa carpeta: se prueba la siguiente.
      }
    }
    if (secciones.length) modulos[m] = secciones;
    else sinDoc.push(m);
  }
  const salida = {
    generado: 'scripts/primeng-a11y.mjs',
    fuente: `${REPO}@${sha}, apps/showcase/doc/<módulo>/accessibility-doc.ts`,
    licencia: 'MIT',
    fecha: new Date().toISOString().slice(0, 10),
    sinDoc,
    modulos,
  };
  writeFileSync(SALIDA, JSON.stringify(salida, null, 1) + '\n');
  console.log(`✔ primeng:a11y — ${Object.keys(modulos).length} módulos con accesibilidad documentada; sin ella: ${sinDoc.join(', ') || 'ninguno'}.`);
}

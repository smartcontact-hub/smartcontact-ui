#!/usr/bin/env node
/**
 * AUDIT · las leyes de los tooltips (DD-254).
 *
 * Lo que ya vigilan otros gates no se repite aquí: solo `pTooltip` y nunca `title` (DD-212, `audit:screen-hygiene`), el
 * de un botón de solo icono lo pone `sc-button` y en lo enfocable sale también con teclado (DD-200, `audit:icons`).
 * Este mira lo que decía DD-254 y nada medía:
 *   T1. Todo `pTooltip` declara `tooltipPosition`: el de PrimeNG por defecto es `right`, que casi nunca es lo buscado.
 *   T2. Nunca `left`: tapa lo que hay antes del elemento, que es lo que se acaba de leer.
 *   T3. En la barra superior, `bottom`: arriba no cabe y PrimeNG ya lo bajaba solo (medido en «Crear grupo»), así que
 *       el código dice dónde sale. La barra es `core/layout/top-bar/`, lo que se proyecta en ella
 *       (`<ng-template #topbarActions>`) y `mock-sample-switcher`. Y dentro de `#topbarActions` ningún `sc-button` de
 *       solo icono sin su `pTooltip`: el automático va arriba.
 *   T4. El texto que se lee sin ejecutar nada (literal, o `'clave' | translate` resuelta en el `es.json` de su app) es
 *       una frase sin punto final, como todo lo que nombra (DD-217).
 *
 * Sin trinquete: el tope es 0.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { elementos } from './audit-icons.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

const ALCANCE = ['projects/supervisor/src', 'projects/ui-smartcontact/src/lib', 'projects/sc-docs/src', 'projects/cuscare-ds/src'];

/** La barra superior del Supervisor: su componente y el selector de datos de demo que se pinta en ella. */
const EN_LA_BARRA = /\/core\/layout\/top-bar\/|\/mock-sample-switcher\//;

/** La plantilla en línea de un componente, con sus comillas invertidas escapadas (`\`filas\``) dentro. */
export const PLANTILLA_EN_LINEA = /template\s*:\s*`((?:\\[\s\S]|[^`\\])*)`/g;

const tieneTooltip = (a) => 'pTooltip' in a || '[pTooltip]' in a;

/** El texto del tooltip si se puede leer sin ejecutar nada; `null` si depende de una expresión. */
export function textoDelTooltip(a, tr) {
  if ('pTooltip' in a) return a.pTooltip;
  const clave = (a['[pTooltip]'] ?? '').match(/^\s*'([\w.-]+)'\s*\|\s*translate\s*$/);
  if (!clave) return null;
  const texto = tr(clave[1]);
  return texto === clave[1] ? null : texto;
}

/** Acaba en un punto que no es de unos puntos suspensivos. */
const conPuntoFinal = (texto) => /[^.]\.$/.test(texto.trim());

/**
 * Las leyes sobre una plantilla: `[línea, regla, mensaje]`. `ruta` es relativa a la raíz del repo; `tr` traduce una
 * clave de i18n (devuelve la misma clave si no la conoce).
 */
export function revisarTooltips(plantilla, { ruta, tr = (c) => c, desplazamiento = 0, fuenteEntera = plantilla }) {
  const salida = [];
  const barraEntera = EN_LA_BARRA.test(ruta);
  for (const el of elementos(plantilla, desplazamiento, fuenteEntera)) {
    const enLaBarra = barraEntera || el.antepasados.some((x) => x.tag === 'ng-template' && '#topbarActions' in x.a);
    if (!tieneTooltip(el.a)) {
      const soloIcono = el.tag === 'sc-button' && ('icon' in el.a || '[icon]' in el.a) && !('label' in el.a || '[label]' in el.a);
      if (enLaBarra && soloIcono) salida.push([el.linea, 'T3', 'sc-button de solo icono en la barra superior sin su pTooltip: el automático sale arriba, y aquí va abajo']);
      continue;
    }
    const ligada = '[tooltipPosition]' in el.a;
    const posicion = el.a.tooltipPosition;
    if (posicion === undefined && !ligada) salida.push([el.linea, 'T1', 'pTooltip sin tooltipPosition: decláralo (top; bottom en la barra superior)']);
    if (posicion === 'left') salida.push([el.linea, 'T2', 'tooltipPosition="left": tapa lo que se acaba de leer; usa top']);
    if (enLaBarra && posicion !== undefined && posicion !== 'bottom') salida.push([el.linea, 'T3', `tooltipPosition="${posicion}" en la barra superior: va en bottom`]);
    const texto = textoDelTooltip(el.a, tr);
    if (texto && conPuntoFinal(texto)) salida.push([el.linea, 'T4', `«${texto}»: una frase sin punto final`]);
  }
  return salida;
}

/* ── main ──────────────────────────────────────────────────────────────────── */

function* ficheros(dir) {
  for (const nombre of readdirSync(dir)) {
    if (nombre === 'node_modules' || nombre === 'dist' || nombre.startsWith('.')) continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) yield* ficheros(ruta);
    else yield ruta;
  }
}

function aplanar(o, p = '', acc = {}) {
  for (const [k, v] of Object.entries(o)) {
    const clave = p ? `${p}.${k}` : k;
    if (v && typeof v === 'object') aplanar(v, clave, acc);
    else acc[clave] = String(v);
  }
  return acc;
}

/** El `es.json` de cada app; la librería no traduce con claves de app. */
function traductorDe(rel) {
  const json = rel.startsWith('projects/sc-docs/')
    ? 'projects/sc-docs/public/assets/i18n/es.json'
    : rel.startsWith('projects/supervisor/')
      ? 'projects/supervisor/src/assets/i18n/es.json'
      : null;
  if (!json || !existsSync(join(RAIZ, json))) return (c) => c;
  traductorDe.cache ??= {};
  const dic = (traductorDe.cache[json] ??= aplanar(JSON.parse(readFileSync(join(RAIZ, json), 'utf8'))));
  return (c) => dic[c] ?? c;
}

function main() {
  const fallos = [];
  let tooltips = 0;
  for (const ruta of ALCANCE.flatMap((d) => (existsSync(join(RAIZ, d)) ? [...ficheros(join(RAIZ, d))] : []))) {
    const rel = relative(RAIZ, ruta);
    if (!/\.(html|ts)$/.test(rel) || /\.spec\.ts$/.test(rel)) continue;
    const fuente = readFileSync(ruta, 'utf8');
    const ctx = { ruta: rel, tr: traductorDe(rel) };
    const plantillas = rel.endsWith('.html')
      ? [{ texto: fuente, desplazamiento: 0 }]
      : [...fuente.matchAll(PLANTILLA_EN_LINEA)].map((t) => ({ texto: t[1], desplazamiento: t.index + t[0].indexOf('`') + 1 }));
    for (const { texto, desplazamiento } of plantillas) {
      tooltips += elementos(texto).filter((el) => tieneTooltip(el.a)).length;
      for (const [n, regla, mensaje] of revisarTooltips(texto, { ...ctx, desplazamiento, fuenteEntera: fuente })) fallos.push(`${rel}:${n} [${regla}] ${mensaje}`);
    }
  }
  if (fallos.length) {
    console.error(`✗ audit:tooltips: ${fallos.length} tooltip(s) fuera de las leyes de DD-254 (el tope es 0):`);
    for (const f of fallos) console.error(`   ${f}`);
    console.error('\nPosición declarada (top; bottom en la barra superior; nunca left) y una frase sin punto final. AGENTS.md y DD-254.');
    process.exit(1);
  }
  console.log(`✓ audit:tooltips OK: ${tooltips} tooltips con su posición declarada, abajo en la barra superior y sin punto final (DD-254).`);
}

if (process.argv[1] && process.argv[1].endsWith('audit-tooltips.mjs')) main();

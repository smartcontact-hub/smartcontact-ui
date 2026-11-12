#!/usr/bin/env node
/**
 * INVENTARIO DE PIEZAS DE UNA PANTALLA DEL SUPERVISOR (DD-252) — que ninguna pieza entre sin precedente.
 *
 *   node scripts/piezas-pantalla.mjs                 las plantillas del Supervisor nuevas o cambiadas frente a origin/main
 *   node scripts/piezas-pantalla.mjs <a.html> [<b.html>…]   esas
 *
 * Por qué existe: la primera versión de Horarios pintó tres sublistas a mano con un lápiz por fila. Ningún gate lo vio
 * (tokens, espaciado e iconos estaban en regla) y lo tuvo que señalar el usuario: el lápiz no existía en ninguna otra
 * ficha. Faltaba la pregunta de LEARNINGS #10 —¿qué te sirve ya el sistema?— hecha por una máquina.
 *
 * Qué hace: saca las PIEZAS que el cambio AÑADE a cada plantilla (las que su versión de origin/main ya tenía no se
 * juzgan) y busca cada una en el resto del Supervisor, contando como precedente lo que había en origin/main. Una pieza es:
 *   · cada componente del DS (`sc-*` que declara `projects/ui-smartcontact`) o nativo de PrimeNG (`p-*`); en `sc-button`,
 *     además, si es de solo icono y cuál (el icono es todo lo que dice);
 *   · lo hecho a mano que suele esconder una pieza que ya existe: `<ul>`/`<ol>`, `<table>`, `<button>` nativo y
 *     cualquier elemento con `role`;
 *   · y su CONTEXTO: dentro de una `sc-datatable` («tabla»), dentro de un `@for` fuera de ella («repetida») o suelta.
 * Los componentes propios de la app (`sc-horario-semana`) no son piezas: se miran sus plantillas.
 *
 * Una pieza sin ningún uso en otra plantilla del Supervisor (fuera de `features/lab`) sale con 1, salvo que la
 * plantilla la declare (una vez, en las tres líneas anteriores) con `<!-- pieza nueva: DD-NNN, motivo -->`. Declararla
 * no la aprueba: la pone a la vista, con su DD, para quien revisa. Lo llama `npm run revision` (que el hook de cierre
 * exige tras tocar una pantalla), así que no hay un paso más que recordar.
 *
 * Hueco conocido y aceptado: una pieza con precedente pero mal elegida para su sitio no la ve; para eso queda mirar.
 * Las funciones puras se exportan para su test: `scripts/__tests__/piezas-pantalla.test.mjs`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { soloPlantillas } from './audit-screen-hygiene.mjs';

const SUPERVISOR = 'projects/supervisor/src/app/';
const LAB = /\/features\/lab\//;

const git = (...args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

/** El texto con los comentarios HTML en blanco: no cuentan y no mueven las líneas. */
const sinComentarios = (html) => html.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));

/** Los tramos `[inicio, fin)` de cada `<tag …>…</tag>` del texto. */
function tramos(texto, tag) {
  const out = [];
  for (const m of texto.matchAll(new RegExp(`<${tag}\\b`, 'g'))) {
    const fin = texto.indexOf(`</${tag}>`, m.index);
    out.push([m.index, fin < 0 ? texto.length : fin]);
  }
  return out;
}

/** Los tramos de cada bloque `@for (…) { … }`, contando paréntesis (la expresión lleva `filas()`) y llaves. */
function bloquesFor(texto) {
  const out = [];
  for (const m of texto.matchAll(/@for\s*\(/g)) {
    let i = m.index + m[0].length;
    for (let nivel = 1; i < texto.length && nivel > 0; i++) nivel += texto[i] === '(' ? 1 : texto[i] === ')' ? -1 : 0;
    const abre = texto.indexOf('{', i);
    if (abre < 0) continue;
    let nivel = 0;
    let j = abre;
    for (; j < texto.length; j++) {
      if (texto[j] === '{') nivel++;
      else if (texto[j] === '}' && --nivel === 0) break;
    }
    out.push([abre, j]);
  }
  return out;
}

const dentro = (i, lista) => lista.some(([a, b]) => i > a && i < b);

/**
 * Las piezas de una plantilla: `[{ firma, linea, declarada }]`. `propios` son los selectores de la app que no cuentan
 * como pieza (se miran sus plantillas); `ds` los del Design System, que sí.
 */
export function piezasDe(html, { ds, propios = new Set() }) {
  const original = html.split('\n');
  const texto = sinComentarios(html);
  const tablas = tramos(texto, 'sc-datatable');
  const fors = bloquesFor(texto);
  const piezas = [];
  for (const m of texto.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/g)) {
    const [etiqueta, tag, attrs] = m;
    let base = null;
    if (tag === 'sc-button') {
      // Un icono enlazado (`[icon]="deleteIcon"`) no se resuelve aquí: cuenta como «enlazado».
      const icono = /(?:^|\s)icon="([^"]+)"/.exec(attrs)?.[1] ?? (/(?:^|\s)\[icon\]\s*=/.test(attrs) ? 'enlazado' : undefined);
      const soloIcono = /(?:^|\s)iconOnly\b/.test(attrs) || !/(?:^|\s)\[?label\]?\s*=/.test(attrs);
      base = soloIcono && icono ? `sc-button solo icono «${icono}»` : 'sc-button con texto';
    } else if (tag.startsWith('sc-')) {
      if (propios.has(tag) || !ds.has(tag)) continue;
      base = tag;
    } else if (tag.startsWith('p-')) base = tag;
    else if (['ul', 'ol', 'table', 'button'].includes(tag)) base = `<${tag}> a mano`;
    const rol = /(?:^|\s)role="([^"]+)"/.exec(attrs)?.[1];
    if (!base && rol && !['list', 'listitem', 'status', 'alert', 'presentation', 'none'].includes(rol)) base = `role="${rol}" a mano`;
    if (!base) continue;
    const contexto = dentro(m.index, tablas) ? 'en tabla' : dentro(m.index, fors) ? 'repetida' : 'suelta';
    const linea = texto.slice(0, m.index).split('\n').length;
    const previas = original.slice(Math.max(0, linea - 4), linea - 1).join('\n');
    const declarada = /<!--\s*pieza nueva:\s*DD-\d+/.test(previas) || /<!--\s*pieza nueva:\s*DD-\d+/.test(etiqueta);
    piezas.push({ firma: `${base} · ${contexto}`, linea, declarada });
  }
  return piezas;
}

/** Cuántas veces sale cada firma en las plantillas dadas, con el primer sitio: `Map<firma, {n, ejemplo}>`. */
export function indiceDePrecedentes(plantillas, opciones) {
  const indice = new Map();
  for (const [ruta, html] of plantillas) {
    for (const p of piezasDe(html, opciones)) {
      const e = indice.get(p.firma);
      if (e) e.n++;
      else indice.set(p.firma, { n: 1, ejemplo: `${ruta}:${p.linea}` });
    }
  }
  return indice;
}

/** El veredicto de una plantilla: cada firma con sus usos fuera y si falla (sin precedente ni declaración). */
export function revisarPlantilla(html, indice, opciones) {
  const porFirma = new Map();
  for (const p of piezasDe(html, opciones)) {
    // Basta declararla una vez por plantilla: la misma pieza repetida (las dos horas de una franja) es una decisión.
    const e = porFirma.get(p.firma) ?? { firma: p.firma, lineas: [], declarada: false };
    e.lineas.push(p.linea);
    e.declarada ||= p.declarada;
    porFirma.set(p.firma, e);
  }
  return [...porFirma.values()].map((e) => {
    const fuera = indice.get(e.firma);
    return { ...e, usos: fuera?.n ?? 0, ejemplo: fuera?.ejemplo ?? null, falla: !fuera && !e.declarada };
  });
}

/**
 * Solo lo que la rama AÑADE: las firmas que la versión de origin/main de la misma plantilla ya tenía no se juzgan (no
 * son de este cambio; tocar una ficha no obliga a declarar lo que ya llevaba).
 */
export function soloNuevas(filas, html0, opciones) {
  if (!html0) return filas;
  const antes = new Set(piezasDe(html0, opciones).map((p) => p.firma));
  return filas.filter((f) => !antes.has(f.firma));
}

/** Los selectores que declara un conjunto de ficheros `.ts`. */
export function selectoresDe(fuentes) {
  const out = new Set();
  for (const src of fuentes) for (const m of src.matchAll(/selector:\s*'([a-z][a-z0-9-]*)'/g)) out.add(m[1]);
  return out;
}

const lista = (salida) => salida.split('\n').map((s) => s.trim()).filter(Boolean);

/** La plantilla de un fichero: el `.html` entero, o lo de dentro de `template:` en un `.ts` (con sus líneas). */
const plantillaDe = (ruta) => {
  const src = readFileSync(ruta, 'utf8');
  return ruta.endsWith('.ts') ? soloPlantillas(src) : src;
};
const conPlantilla = (ruta) => ruta.endsWith('.html') || (ruta.endsWith('.ts') && !ruta.endsWith('.spec.ts') && /\btemplate:\s*`/.test(readFileSync(ruta, 'utf8')));

/** Las plantillas del Supervisor (`.html` y `.ts` con `template:`) nuevas o cambiadas frente a origin/main. */
export function plantillasCambiadas() {
  const base = git('merge-base', 'HEAD', 'origin/main').trim() || 'origin/main';
  const rutas = new Set([
    ...lista(git('diff', '--name-only', base, '--', `${SUPERVISOR}*.html`, `${SUPERVISOR}*.ts`)),
    ...lista(git('ls-files', '--others', '--exclude-standard', '--', `${SUPERVISOR}*.html`, `${SUPERVISOR}*.ts`)),
  ]);
  return [...rutas].filter((r) => existsSync(r) && !LAB.test(r) && conPlantilla(r)).sort();
}

/**
 * Corre el inventario y lo imprime. Devuelve cuántas piezas fallan. `log` permite a `npm run revision` meterlo en su
 * salida.
 */
export function inventario(rutas = plantillasCambiadas(), log = (s) => console.log(s)) {
  if (!rutas.length) {
    log('Piezas: ninguna plantilla del Supervisor cambiada frente a origin/main.');
    return 0;
  }
  const ds = selectoresDe(lista(git('ls-files', 'projects/ui-smartcontact/src/lib/*.ts')).map((f) => readFileSync(f, 'utf8')));
  const nuevosTs = lista(git('diff', '--name-only', '--diff-filter=A', git('merge-base', 'HEAD', 'origin/main').trim() || 'origin/main', '--', `${SUPERVISOR}*.ts`));
  const sinSeguir = lista(git('ls-files', '--others', '--exclude-standard', '--', `${SUPERVISOR}*.ts`));
  const propios = selectoresDe([...nuevosTs, ...sinSeguir].filter(existsSync).map((f) => readFileSync(f, 'utf8')));
  const opciones = { ds, propios };
  const revisadas = new Set(rutas);
  const base = git('merge-base', 'HEAD', 'origin/main').trim() || 'origin/main';
  /** La plantilla como está en origin/main (vacía si es nueva). */
  const deBase = (ruta) => {
    const src = git('show', `${base}:${ruta}`);
    return ruta.endsWith('.ts') ? soloPlantillas(src) : src;
  };
  const otras = [
    ...lista(git('ls-files', `${SUPERVISOR}*.html`, `${SUPERVISOR}*.ts`))
      .filter((r) => !revisadas.has(r) && !LAB.test(r) && conPlantilla(r))
      .map((r) => [r, plantillaDe(r)]),
    // Lo que las plantillas revisadas ya tenían en origin/main también es el sistema: es precedente.
    ...rutas.map((r) => [`${r} (origin/main)`, deBase(r)]).filter(([, html]) => html),
  ];
  const indice = indiceDePrecedentes(otras, opciones);
  let fallos = 0;
  log(`\nPiezas de ${rutas.length} plantilla(s), contra ${otras.length} del resto del Supervisor (DD-252):`);
  for (const ruta of rutas) {
    const filas = soloNuevas(revisarPlantilla(plantillaDe(ruta), indice, opciones), deBase(ruta), opciones);
    const malas = filas.filter((f) => f.falla);
    fallos += malas.length;
    const declaradas = filas.filter((f) => !f.ejemplo && f.declarada);
    log(`${malas.length ? '✗' : '✓'} ${ruta} · ${filas.length} pieza(s) nueva(s) en este cambio${declaradas.length ? `, ${declaradas.length} declarada(s)` : ''}`);
    for (const f of filas.filter((x) => x.falla || !x.ejemplo)) {
      const donde = f.lineas.slice(0, 4).join(', ');
      log(`    ${f.falla ? 'SIN PRECEDENTE' : 'declarada'} · ${f.firma} · línea ${donde}`);
    }
  }
  if (fallos) {
    log(
      `\n${fallos} pieza(s) sin precedente en el Supervisor. Antes de inventar una, busca la que ya resuelve lo mismo` +
        ' (otra pantalla, sc-docs, `docs/AUDIT-PRIMENG-CATALOGO.md` §6) y úsala. Si de verdad no la hay, decláralo encima' +
        ' con `<!-- pieza nueva: DD-NNN, motivo -->` y cuéntalo en el parte: es una decisión, no un detalle.',
    );
  }
  return fallos;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  process.exit(inventario(args.length ? args : undefined) ? 1 : 0);
}

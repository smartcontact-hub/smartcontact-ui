#!/usr/bin/env node
/**
 * AUDIT · sin punto medio («·») entre datos de la interfaz (DD-183).
 *
 * El punto entre dos datos («918371548 · Prioridad: Media») se lee como relleno y
 * quita sitio sin decir qué une. Se escribe con lo que ya hay: coma, «y», dos
 * puntos, dos líneas o el hueco del `gap`. Este gate mira lo que SALE en pantalla:
 *   · los textos de los JSON de i18n del Supervisor;
 *   · las plantillas, el TypeScript y el SCSS del Supervisor y de la librería del DS, sin sus comentarios.
 * Quedan fuera sc-docs (el showcase), las réplicas de `agent`, `agent-mini` y `cuscare` (DD-35: calcan la app
 * viva) y los comentarios, los `.spec.ts` y las claves internas (`a·b`, sin
 * espacios), que no se ven.
 *
 * Sin trinquete: el tope es 0. Si sale rojo, quita el punto: no lo añadas a nada.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUNTO = '·';

function* ficheros(dir) {
  for (const nombre of readdirSync(dir)) {
    if (nombre === 'node_modules' || nombre === 'dist' || nombre.startsWith('.')) continue;
    const ruta = join(dir, nombre);
    const st = statSync(ruta);
    if (st.isDirectory()) yield* ficheros(ruta);
    else yield ruta;
  }
}

export const sinComentarios = (texto, ruta) => {
  let t = texto.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  if (/\.html$/.test(ruta)) t = t.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  if (!/\.html$/.test(ruta)) t = t.replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
  return t;
};

/** Las líneas (1..n) de un fichero de código que pintan un punto medio entre datos. */
export function lineasConPunto(texto, ruta) {
  const salida = [];
  sinComentarios(texto, ruta)
    .split('\n')
    .forEach((linea, i) => {
      if (!linea.includes(PUNTO)) return;
      // clave interna: sin espacio a ningún lado, nunca se pinta
      if (!new RegExp(`\\s${PUNTO}|${PUNTO}\\s|${PUNTO}$`).test(linea)) return;
      salida.push([i + 1, linea.trim().slice(0, 90)]);
    });
  return salida;
}

/** Las claves de un JSON de i18n cuyo texto lleva punto medio. */
export function clavesConPunto(json) {
  const claves = [];
  const recorre = (valor, ruta) => {
    if (typeof valor === 'string') {
      if (valor.includes(PUNTO)) claves.push(ruta);
    } else if (valor && typeof valor === 'object') {
      for (const [k, v] of Object.entries(valor)) recorre(v, ruta ? `${ruta}.${k}` : k);
    }
  };
  recorre(json, '');
  return claves;
}

function main() {
  const fallos = [];
  const ALCANCE = ['projects/supervisor', 'projects/ui-smartcontact/src'];
  for (const ruta of ALCANCE.flatMap((d) => [...ficheros(join(RAIZ, d))])) {
    const rel = relative(RAIZ, ruta);
    if (/\.spec\.ts$/.test(rel)) continue;
    if (/\/assets\/i18n\/[a-z]{2}\.json$/.test(rel)) {
      for (const clave of clavesConPunto(JSON.parse(readFileSync(ruta, 'utf8')))) fallos.push(`${rel} · ${clave}`);
      continue;
    }
    if (!/\.(html|ts|scss)$/.test(rel)) continue;
    for (const [n, linea] of lineasConPunto(readFileSync(ruta, 'utf8'), rel)) fallos.push(`${rel}:${n} · ${linea}`);
  }
  if (fallos.length) {
    console.error(`✗ audit:interpunct: ${fallos.length} punto(s) medio(s) en la interfaz (el tope es 0):`);
    for (const f of fallos) console.error(`   ${f}`);
    console.error('\nEscríbelo con coma, «y», dos puntos, dos líneas o el gap del contenedor (DD-183).');
    process.exit(1);
  }
  console.log('✓ audit:interpunct OK: ningún punto medio entre datos de la interfaz.');
}

if (process.argv[1] && process.argv[1].endsWith('audit-interpunct.mjs')) main();

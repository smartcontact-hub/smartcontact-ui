#!/usr/bin/env node
/**
 * AUDIT · los modales del Supervisor son los de ui.smart-contact.com (DD-240).
 *
 * Desde DD-240 hay dos piezas y una sola forma de usar cada una, las mismas que en el DS de los devs:
 *   · un aviso o una confirmación → `sc-alert-modal` con su `variant` (borrar `error`, descartar `warning`,
 *     informar `info`, neutro `default`), abierto con `injectAlertModal()` o con `ScDynamicDialogService`;
 *   · un modal con contenido propio (formulario, tabla, reproductor) → `sc-custom-modal`;
 *   · una frase pegada a lo que se pulsó → el globo de `ScConfirmService` con `target`.
 * Este gate impide volver atrás sin que nadie lo decida:
 *   1. `sc-dialog` (retirado) no se usa fuera de su carpeta y de su página de sc-docs, ni en la librería ni en el Supervisor.
 *   2. El Supervisor no abre modales de PrimeNG a pelo (`p-dialog`, `p-confirmdialog`, `ConfirmationService`…).
 *   3. `<sc-confirmdialog>` solo vive en `app.component.html`: es el anfitrión del globo, no un modal de pantalla.
 *   4. `ScConfirmService.request()` y `choose()` llevan `target`: sin él sale el confirm centrado, que se retiró.
 *
 * Sin trinquete: el tope es 0.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

function* ficheros(dir) {
  for (const nombre of readdirSync(dir)) {
    if (nombre === 'node_modules' || nombre === 'dist' || nombre.startsWith('.')) continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) yield* ficheros(ruta);
    else yield ruta;
  }
}

/** El texto sin comentarios, con los saltos de línea en su sitio (para dar el número de línea bueno). */
export const sinComentarios = (texto, ruta) => {
  const blanco = (m) => m.replace(/[^\n]/g, ' ');
  let t = texto.replace(/\/\*[\s\S]*?\*\//g, blanco);
  if (/\.html$/.test(ruta)) return t.replace(/<!--[\s\S]*?-->/g, blanco);
  return t.replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
};

const SC_DIALOG = /<sc-dialog\b|\bScDialogComponent\b/;
const PRIMENG_MODAL =
  /<p-(dialog|confirmdialog|confirmpopup|dynamicdialog)\b|\bConfirmationService\b|from\s+'primeng\/(dialog|dynamicdialog|confirmdialog|confirmpopup)'/;

/** Las reglas 1 a 3 sobre un fichero: `[línea, regla, texto]`. `ruta` es relativa a la raíz del repo. */
export function usosProhibidos(texto, ruta) {
  const enSupervisor = ruta.startsWith('projects/supervisor/');
  const casaSuya = /\/components\/dialog\//.test(ruta) || ruta.endsWith('/public-api.ts');
  const salida = [];
  sinComentarios(texto, ruta)
    .split('\n')
    .forEach((linea, i) => {
      if (!casaSuya && SC_DIALOG.test(linea)) salida.push([i + 1, 'sc-dialog se retiró: usa sc-custom-modal', linea.trim()]);
      if (enSupervisor && PRIMENG_MODAL.test(linea)) {
        salida.push([i + 1, 'modal de PrimeNG a pelo: usa sc-alert-modal o sc-custom-modal', linea.trim()]);
      }
      if (enSupervisor && /<sc-confirmdialog\b/.test(linea) && !ruta.endsWith('/app.component.html')) {
        salida.push([i + 1, '<sc-confirmdialog> solo va en app.component.html (anfitrión del globo)', linea.trim()]);
      }
    });
  return salida;
}

/** Regla 4: las llamadas `.request({…})` y `.choose({…})` de un fichero que inyecta `ScConfirmService` sin `target`. */
export function confirmsSinTarget(texto) {
  if (!/\bScConfirmService\b/.test(texto)) return [];
  const limpio = sinComentarios(texto, 'x.ts');
  const salida = [];
  for (const m of limpio.matchAll(/\.(request|choose)\s*\(\s*\{/g)) {
    let prof = 1;
    let j = m.index + m[0].length;
    for (; j < limpio.length && prof > 0; j += 1) {
      if (limpio[j] === '{') prof += 1;
      else if (limpio[j] === '}') prof -= 1;
    }
    const cuerpo = limpio.slice(m.index + m[0].length, j - 1);
    if (!/(^|[\s,{])target\s*[:,}]|(^|[\s,{])target\s*$/m.test(cuerpo)) {
      salida.push([limpio.slice(0, m.index).split('\n').length, `${m[1]}() sin target: es el confirm centrado retirado`]);
    }
  }
  return salida;
}

function main() {
  const fallos = [];
  const ALCANCE = ['projects/supervisor/src', 'projects/ui-smartcontact/src/lib'];
  for (const ruta of ALCANCE.flatMap((d) => [...ficheros(join(RAIZ, d))])) {
    const rel = relative(RAIZ, ruta);
    if (!/\.(html|ts)$/.test(rel) || /\.spec\.ts$/.test(rel)) continue;
    const texto = readFileSync(ruta, 'utf8');
    for (const [n, regla, linea] of usosProhibidos(texto, rel)) fallos.push(`${rel}:${n} · ${regla}\n      ${linea.slice(0, 100)}`);
    if (rel.startsWith('projects/supervisor/')) for (const [n, regla] of confirmsSinTarget(texto)) fallos.push(`${rel}:${n} · ${regla}`);
  }
  if (fallos.length) {
    console.error(`✗ audit:modales: ${fallos.length} modal(es) fuera de DD-240 (el tope es 0):`);
    for (const f of fallos) console.error(`   ${f}`);
    console.error(
      '\nAviso o confirmación: sc-alert-modal con su variant (injectAlertModal). Contenido propio: sc-custom-modal.\n' +
        'Junto a lo pulsado: ScConfirmService con target. AGENTS.md §«Modales» y DD-240.',
    );
    process.exit(1);
  }
  console.log('✓ audit:modales OK: avisos en sc-alert-modal, contenido en sc-custom-modal y el globo con target (DD-240).');
}

if (process.argv[1] && process.argv[1].endsWith('audit-modales.mjs')) main();

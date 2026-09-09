/*
 * GUARDIÁN · en una pantalla con índice lateral, el título va DENTRO de su sección.
 * ================================================================================
 *
 * El patrón (Figma Supervisor 393:12588, DD-57). Cuando una pantalla tiene un rail a la
 * izquierda, su título no puede flotar suelto encima de las tarjetas: dice el nombre de la página
 * sin que nada diga hasta dónde llega lo que es de esa página, y encima repite la palabra que la
 * miga de arriba ya da. Contenido en la sección, el título ACOTA su caja, que es lo que hace un
 * título. Y así arranca en la misma línea que el rail, en vez de 16px más abajo.
 *
 * Qué afirma, y nada más: en cada plantilla de una pantalla con rail, el `<h1>` VISIBLE lo pinta
 * un `<sc-section-card [headingLevel]="1">`, y no una etiqueta suelta con `.page__heading`. No
 * opina sobre el resto de la pantalla ni sobre las que no tienen rail (ahí el título suelto es lo
 * correcto: no hay caja que acotar).
 *
 * Los FORMULARIOS quedan fuera, y no por descuido: su `<h1>` está oculto a propósito porque su
 * identidad la pinta la ficha del propio rail (`e2e/supervisor/page-identity.spec.ts`, punto 4).
 * Añadirles un título visible sería el duplicado de siempre por otra puerta.
 *
 * Por qué un guardián y no una nota: esto ya se hizo a mano en una pantalla y las otras dos se
 * quedaron atrás durante un día. Con tres pantallas se ve; con diecisiete, no.
 *
 * Lee el FUENTE, no un `dist/`.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const SUPERVISOR = resolve(root, 'projects/supervisor/src/app');
const log = (s = '') => process.stdout.write(s + '\n');

/*
 * Las pantallas CON RAIL, por el shell o el molde que las envuelve. Se enumeran porque tenerlo
 * escrito es lo que hace que añadir una pantalla con rail sea una decisión y no un descuido: si
 * mañana entra otra y no aparece aquí, este guardián no la ve — pero la lista está en un sitio
 * donde se lee, y `page-identity.spec.ts` la cruza por su lado.
 */
export const CON_RAIL = [
  'features/config/aed/aed-servicio-page.component.html',
  'features/config/aed/aed-agentes-page.component.html',
  'features/config/aed/aed-grupos-page.component.html',
];

/** ¿Esta plantilla pinta su `<h1>` visible suelto, fuera de una sección? */
export function tituloSuelto(html) {
  const sinComentarios = html.replace(/<!--[\s\S]*?-->/g, '');
  const h1s = [...sinComentarios.matchAll(/<h1\b([^>]*)>/gi)];
  const sueltos = h1s
    .map((m) => m[1])
    .filter((attrs) => !/\bclass\s*=\s*["'][^"']*\bvisually-hidden\b/.test(attrs));
  return sueltos.length ? sueltos.map((a) => `<h1${a.slice(0, 60)}>`) : [];
}

/** ¿Y lo pinta el componente, con el nivel de página? */
export function tituloEnSeccion(html) {
  const sinComentarios = html.replace(/<!--[\s\S]*?-->/g, '');
  return [...sinComentarios.matchAll(/<sc-section-card\b([^>]*)>/gi)].some((m) =>
    /\[headingLevel\]\s*=\s*["']1["']/.test(m[1]),
  );
}

const fallos = [];
log('TÍTULO CONTENIDO · las pantallas con rail lo llevan dentro de su sección');
log('='.repeat(74));

for (const rel of CON_RAIL) {
  const ruta = resolve(SUPERVISOR, rel);
  if (!existsSync(ruta)) {
    fallos.push({ rel, motivo: 'la plantilla no existe (¿se renombró? actualiza CON_RAIL)' });
    log(`  ✘ ${rel}  (no existe)`);
    continue;
  }
  const html = readFileSync(ruta, 'utf8');
  const sueltos = tituloSuelto(html);
  const dentro = tituloEnSeccion(html);
  const ok = dentro && sueltos.length === 0;
  log(`  ${ok ? '✔' : '✘'} ${rel.split('/').pop()}`);
  if (!dentro) fallos.push({ rel, motivo: 'ningún <sc-section-card [headingLevel]="1"> pinta el título' });
  if (sueltos.length) fallos.push({ rel, motivo: `título suelto fuera de la sección: ${sueltos.join(' · ')}` });
}
log('='.repeat(74));

if (fallos.length) {
  log('');
  log(`✘ ${fallos.length} pantalla(s) con rail y el título fuera de su sección.`);
  for (const f of fallos) log(`    ${f.rel}\n      ${f.motivo}`);
  log('');
  log('  El patrón:');
  log('    <sc-section-card icon="…" [headingLevel]="1" surface="card" titleKey="…">');
  log('');
  log('  `headingLevel="1"` pinta el <h1> (uno por documento) al tamaño de página, y');
  log('  `surface="card"` es la piel blanca con borde de una sección sobre el lienzo.');
  process.exit(1);
}

log('');
log(`✔ Las ${CON_RAIL.length} pantallas con rail llevan su título dentro de la sección.`);

/*
 * Y AL REVÉS: nadie más se pone `headingLevel="1"`. Un documento tiene UN `<h1>`, así que dos
 * cards de página en la misma pantalla son dos, y en una pantalla SIN rail el título suelto es
 * lo correcto. El barrido es de todo el supervisor, no solo de la lista de arriba: el modo de
 * fallo que ataja es copiar el patrón donde no toca.
 */
const plantillas = [];
const anda = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, e.name);
    if (e.isDirectory()) anda(full);
    else if (e.name.endsWith('.html')) plantillas.push(full);
  }
};
anda(SUPERVISOR);

const intrusos = [];
for (const ruta of plantillas) {
  const rel = ruta.replace(SUPERVISOR + '/', '');
  if (CON_RAIL.includes(rel)) continue;
  if (tituloEnSeccion(readFileSync(ruta, 'utf8'))) intrusos.push(rel);
}

if (intrusos.length) {
  log('');
  log(`✘ ${intrusos.length} plantilla(s) usan \`headingLevel="1"\` sin estar en la lista con rail.`);
  for (const i of intrusos) log(`    ${i}`);
  log('');
  log('  O la pantalla tiene rail y le falta su fila en CON_RAIL (scripts/audit-titulo-contenido.mjs),');
  log('  o no lo tiene y su título va suelto: sin caja alrededor, no hay nada que acotar.');
  process.exit(1);
}

log(`✔ Y ninguna otra plantilla se pone el nivel de página.`);

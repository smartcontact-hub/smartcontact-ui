/*
 * EXPLORACIONES · cada punto de control tiene su tarjeta en el Lab.
 * ==================================================================
 *
 * Una rama de comparación no se funde, así que sus versiones solo se encuentran si alguien las apunta. Se apuntan
 * en `projects/sc-docs/src/app/pages/lab/explorations.data.ts`, que se sirve desde `main` en sc-doc.pages.dev/lab.
 * Este vigilante falla si una etiqueta `archive/comparar-*` o `archive/lab-*` no sale en ese fichero: una versión
 * guardada que nadie puede encontrar es como no haberla guardado.
 *
 * Y al revés: si el fichero nombra una etiqueta que no existe en el repo, también falla. Solo cuando hay etiquetas
 * que comparar: el checkout del CI no las trae, y ahí no hay nada que medir.
 *
 * USO   npm run explorations:check
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const DATA = resolve(root, 'projects/sc-docs/src/app/pages/lab/explorations.data.ts');
const log = (s = '') => process.stdout.write(s + '\n');

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

export function etiquetas() {
  const salida = git('tag', '--list', 'archive/comparar-*', 'archive/lab-*');
  return salida ? salida.split('\n').map((t) => t.trim()).filter(Boolean) : [];
}

/** Etiquetas que nombra el fichero de datos (`tag: '…'`). */
export function etiquetasDelIndice(texto) {
  return [...texto.matchAll(/\btag:\s*'([^']+)'/g)].map((m) => m[1]);
}

const texto = readFileSync(DATA, 'utf8');
const tags = etiquetas();
const nombradas = etiquetasDelIndice(texto);

log('EXPLORACIONES · cada punto de control tiene su tarjeta en el Lab');
log('='.repeat(64));

if (tags.length === 0) {
  log('  (no hay etiquetas archive/comparar-* ni archive/lab-* en este checkout: nada que comparar)');
  log('');
  log('✔ explorations:check sin etiquetas que vigilar.');
  process.exit(0);
}

const problemas = [];
for (const t of tags) {
  const ok = nombradas.includes(t);
  log(`  ${ok ? '✔' : '✘'} ${t}`);
  if (!ok) problemas.push(`${t}: la etiqueta existe y no sale en explorations.data.ts`);
}
for (const t of nombradas) {
  if (!tags.includes(t)) problemas.push(`${t}: el índice la nombra y esa etiqueta no existe`);
}
log('='.repeat(64));

if (problemas.length) {
  log('');
  log(`✘ ${problemas.length} desajuste(s) entre el índice del Lab y las etiquetas.`);
  for (const p of problemas) log(`    ${p}`);
  log('');
  log('  Apúntala en projects/sc-docs/src/app/pages/lab/explorations.data.ts con su fecha, su comportamiento');
  log('  en una línea y su enlace fijo.');
  process.exit(1);
}
log('');
log(`✔ explorations:check ${tags.length} punto(s) de control, todos con tarjeta en el Lab.`);

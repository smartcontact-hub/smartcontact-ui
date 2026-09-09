#!/usr/bin/env node
/**
 * Deja en la raíz del sitio construido un `build.json` con el commit que lo generó.
 *
 * Es lo que permite comprobar QUÉ está sirviendo una web sin preguntarle a nadie: sin esta
 * marca, un registro de despliegues solo podría afirmar "se ha desplegado" por haber empujado
 * a `main`, que es exactamente el tipo de pantalla que miente (la de GitHub Pages llevaba tres
 * meses diciéndolo). Con ella, `record-deploy.mjs` espera hasta VERLO.
 *
 * El commit sale de `CF_PAGES_COMMIT_SHA` cuando lo construye Cloudflare, y de git en local o
 * en CI. Si no hay ninguno de los dos, la marca no se escribe y se avisa: mejor sin marca que
 * con una inventada.
 *
 * Uso: node scripts/stamp-build.mjs <app>     (app = carpeta bajo dist/)
 */
import { writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const app = process.argv[2];
if (!app) {
  console.error('Uso: node scripts/stamp-build.mjs <app>');
  process.exit(2);
}

const dir = resolve(root, 'dist', app, 'browser');
if (!existsSync(dir)) {
  console.error(`✗ No existe ${dir} — construye la app antes de sellarla.`);
  process.exit(1);
}

let commit = process.env.CF_PAGES_COMMIT_SHA ?? '';
if (!commit) {
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    commit = '';
  }
}
if (!commit) {
  console.warn(`⚠ ${app}: sin commit (ni CF_PAGES_COMMIT_SHA ni git) — no se sella.`);
  process.exit(0);
}

writeFileSync(
  resolve(dir, 'build.json'),
  JSON.stringify({ app, commit, construido: new Date().toISOString() }, null, 2) + '\n',
);
console.log(`✓ ${app} sellada con ${commit.slice(0, 7)}`);

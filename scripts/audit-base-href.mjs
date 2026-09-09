/*
 * GUARDIÁN · la base de una SPA es `/`, y nada más.
 * ================================================
 *
 * Por qué existe. `projects/sc-docs/src/index.html` llevaba `<base href="">`
 * desde el PRIMER commit (venía del molde `sc-demo`). Con la base vacía, el
 * navegador resuelve `styles-*.css`, `main-*.js`, los `modulepreload` y las
 * fuentes contra la URL ACTUAL, no contra la raíz. En `/` funciona; en cuanto
 * la ruta tiene DOS segmentos, deja de funcionar:
 *
 *   /componentes/button  →  pide /componentes/main-2TYI7K57.js
 *                        →  el SPA fallback devuelve index.html (text/html)
 *                        →  Chrome lo rechaza por MIME
 *                        →  <app-root> vacío: PANTALLA EN BLANCO.
 *
 * Comprobado forzando esa URL el 2026-09-09. **En sc-docs hoy no pasa**, y
 * conviene decirlo con precisión: enruta con `withHashLocation()`, así que sus
 * URLs reales son `/#/componentes/button`, el path siempre es `/` y una base
 * vacía resuelve al mismo sitio. Es una trampa ARMADA, no un incendio: se
 * dispara el día que se quite el hash — que es a donde va esto, porque las URLs
 * con `#` no se comparten ni se indexan bien— y ese día el síntoma (pantalla en
 * blanco solo al entrar por enlace o recargar, nunca navegando) no señala en
 * absoluto al `index.html`.
 *
 * En las otras cuatro apps no es latente: `agent`, `agent-mini`, `cuscare` y
 * `supervisor` enrutan por path, y ahí una base vacía rompe hoy mismo. Las
 * cuatro llevan `/` desde siempre; esto es lo que impide que una se descuelgue.
 *
 * Qué afirma, y nada más: cada `projects/<app>/src/index.html` declara
 * exactamente una `<base href="/">`. No opina sobre despliegues en subcarpeta
 * (ninguno de los cinco sitios lo hace: los cinco sirven en la raíz de su
 * dominio). Si algún día uno se sirve bajo `/algo/`, esa app necesita
 * `--base-href` en su build y ESTE guardián hay que cambiarlo a propósito, que
 * es justo lo que se quiere: que el cambio sea deliberado y no un resto de
 * molde.
 *
 * Lee el FUENTE, no un `dist/`.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const PROJECTS = resolve(root, 'projects');
const log = (s = '') => process.stdout.write(s + '\n');

/** Apps = proyectos con `src/index.html` (las librerías no tienen). */
export function appsConIndex(base = PROJECTS) {
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ app: d.name, html: resolve(base, d.name, 'src/index.html') }))
    .filter(({ html }) => existsSync(html))
    .sort((a, b) => a.app.localeCompare(b.app));
}

/**
 * Veredicto de un index.html: `{ ok, base }`.
 * `base` es null si no hay etiqueta, el valor del atributo si lo hay, y
 * `'(sin atributo)'` si la etiqueta existe pero desnuda (`<base>`), que es
 * equivalente a la vacía a efectos de resolución.
 */
export function baseDe(html) {
  const etiquetas = [...html.matchAll(/<base\b[^>]*>/gi)];
  if (etiquetas.length === 0) return { ok: false, base: null, motivo: 'no hay <base>' };
  if (etiquetas.length > 1) return { ok: false, base: null, motivo: `${etiquetas.length} etiquetas <base>` };
  const attr = etiquetas[0][0].match(/href\s*=\s*["']([^"']*)["']/i);
  if (!attr) return { ok: false, base: '(sin atributo)', motivo: 'la etiqueta no lleva href' };
  const valor = attr[1];
  if (valor !== '/') return { ok: false, base: valor === '' ? '(vacía)' : valor, motivo: 'no es "/"' };
  return { ok: true, base: '/' };
}

const apps = appsConIndex();
const malas = [];

log('BASE HREF · una SPA servida en la raíz declara <base href="/">');
log('='.repeat(62));
for (const { app, html } of apps) {
  const v = baseDe(readFileSync(html, 'utf8'));
  log(`  ${v.ok ? '✔' : '✘'} ${app.padEnd(12)} ${v.ok ? '/' : `${v.base ?? '—'}  (${v.motivo})`}`);
  if (!v.ok) malas.push({ app, ...v });
}
log('='.repeat(62));

if (malas.length) {
  log('');
  log(`✘ ${malas.length} app(s) con base incorrecta.`);
  log('');
  log('  Una base que no es "/" hace que los assets se pidan RELATIVOS a la URL:');
  log('  cualquier ruta de dos segmentos (p. ej. /componentes/button) pedirá');
  log('  /componentes/main-*.js, recibirá el index.html del SPA fallback y dejará');
  log('  la página EN BLANCO al entrar por URL directa o al recargar.');
  log('');
  log('  Arreglo: <base href="/"> en projects/<app>/src/index.html.');
  process.exit(1);
}

log('');
log(`✔ Las ${apps.length} apps declaran <base href="/">.`);

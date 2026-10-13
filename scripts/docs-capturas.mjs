#!/usr/bin/env node
/**
 * docs:capturas · UNA CAPTURA POR STORY de sc-docs, y la anatomía de cada componente, para la ficha en texto.
 *
 * Por qué existe: la ficha que lee un agente (`docs:ia`, `public/ia/<componente>.md`) cuenta cada story con su código,
 * pero un agente que ve imágenes entiende «Variantes» de un vistazo, y uno que no las ve tiene el enlace. Y la ANATOMÍA
 * (`sc-button > p-button > button.p-button`) solo existe en el DOM pintado: la lee el navegador, no un parser.
 *
 * Qué hace: abre cada ficha de `component-pages.ts`, apunta sus stories y su anatomía, y captura cada story SUELTA
 * (`?historia=<nombre>&solo=1`, sin barra lateral) por su lienzo. Escribe:
 *   projects/sc-docs/public/ia/capturas/<ficha>/<story>.png
 *   projects/sc-docs/public/ia/capturas/_indice.json   (fecha, viewport, stories y anatomía por ficha)
 *
 * Dónde se corre: en el workflow `docs-capturas` (Actions), en Linux, que es donde se publican. En un Mac también
 * funciona, para mirar; las fuentes del DS van autohospedadas, así que se parecen, pero no se commitean desde aquí.
 *
 *   node scripts/docs-capturas.mjs                         # sirve dist/sc-docs/browser él mismo (npm run build:docs:app antes)
 *   node scripts/docs-capturas.mjs --url http://localhost:4317    # contra un servidor ya levantado
 *   node scripts/docs-capturas.mjs --solo button,badge             # solo esas fichas (para probar)
 */
/* global document, localStorage -- lo que va dentro de `page.evaluate` corre en el navegador */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

import { chromium } from '@playwright/test';

import { navegadorPropio } from './playwright-navegador.mjs';

const root = resolve(import.meta.dirname, '..');
const SALIDA = join(root, 'projects/sc-docs/public/ia/capturas');
const ESTATICO = join(root, 'dist/sc-docs/browser');
const VIEWPORT = { width: 1280, height: 900 };

const arg = (nombre) => {
  const i = process.argv.indexOf(nombre);
  return i > 0 ? process.argv[i + 1] : null;
};

/** Las fichas, por su `path`, en el orden de `component-pages.ts`: lo mismo que lee `docs:ia`. */
export function fichasDe(componentPagesTs) {
  return [...componentPagesTs.matchAll(/path:\s*'([\w-]+)'/g)].map((m) => m[1]);
}

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.webp': 'image/webp', '.txt': 'text/plain', '.md': 'text/markdown' };

/** Un servidor estático mínimo: sc-docs enruta por `#`, así que todo lo que no es un fichero es `index.html`. */
function servir(dir) {
  return new Promise((ok) => {
    const server = createServer((req, res) => {
      const ruta = decodeURIComponent((req.url ?? '/').split('?')[0]);
      let fichero = join(dir, ruta);
      if (!fichero.startsWith(dir) || !existsSync(fichero) || statSync(fichero).isDirectory()) fichero = join(dir, 'index.html');
      res.writeHead(200, { 'content-type': TIPOS[extname(fichero)] ?? 'application/octet-stream' });
      res.end(readFileSync(fichero));
    });
    server.listen(0, '127.0.0.1', () => ok(server));
  });
}

async function main() {
  const solo = arg('--solo')?.split(',').filter(Boolean) ?? null;
  let url = arg('--url') ?? process.env['SC_DOCS_URL'] ?? null;
  let server = null;
  if (!url) {
    if (!existsSync(join(ESTATICO, 'index.html'))) {
      console.error(`✘ No hay build de sc-docs en ${ESTATICO}. Corre antes: npm run build:docs:app (o pasa --url).`);
      process.exit(1);
    }
    server = await servir(ESTATICO);
    url = `http://127.0.0.1:${server.address().port}`;
  }
  url = url.replace(/\/$/, '');

  const fichas = fichasDe(readFileSync(join(root, 'projects/sc-docs/src/app/pages/components/component-pages.ts'), 'utf8'))
    .filter((f) => !solo || solo.includes(f));

  // Todo o nada por ficha: se rehace su carpeta entera, así una story que desaparece se lleva su captura.
  const indicePrevio = existsSync(join(SALIDA, '_indice.json')) ? JSON.parse(readFileSync(join(SALIDA, '_indice.json'), 'utf8')) : null;
  const indice = {
    generado: 'scripts/docs-capturas.mjs',
    fecha: new Date().toISOString().slice(0, 10),
    viewport: `${VIEWPORT.width}x${VIEWPORT.height}`,
    tema: 'claro',
    fichas: solo && indicePrevio ? { ...indicePrevio.fichas } : {},
  };

  const browser = await chromium.launch(navegadorPropio().launchOptions ?? {});
  const page = await browser.newPage({ viewport: VIEWPORT, reducedMotion: 'reduce' });
  // Tema claro siempre, sea cual sea el del último que abrió sc-docs en este perfil.
  await page.addInitScript(() => {
    try {
      localStorage.setItem('sc-theme', 'light');
    } catch {
      /* sin almacenamiento: claro por defecto */
    }
  });

  let total = 0;
  for (const ficha of fichas) {
    await page.goto(`${url}/#/components/${ficha}`);
    await page.locator('section.sb-host__story[id^="historia-"] .sb-canvas__stage').first().waitFor({ timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
    await page.evaluate(() => document.fonts.ready);

    const leido = await page.evaluate(() => ({
      historias: [...document.querySelectorAll('section.sb-host__story[id^="historia-"]')]
        .filter((s) => s.id !== 'historia-combinaciones' && s.querySelector('.sb-canvas__stage'))
        .map((s) => ({
          slug: s.id.replace(/^historia-/, ''),
          nombre: (s.querySelector('.sb-host__section-title')?.textContent ?? '').replace(/^✦\s*/, '').trim(),
        })),
      anatomia: (document.querySelector('[data-testid="sb-anatomy"] pre')?.textContent ?? '').split('\n').filter(Boolean),
    }));

    const dir = join(SALIDA, ficha);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const historias = {};
    for (const h of leido.historias) {
      await page.goto(`${url}/#/components/${ficha}?historia=${h.slug}&solo=1`);
      const lienzo = page.locator('[data-testid="sb-solo"] .sb-canvas__stage');
      await lienzo.waitFor({ timeout: 30_000 });
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
      await page.evaluate(() => document.fonts.ready);
      // La fuente de iconos va por ligaduras: hasta que carga, un icono es su nombre en texto (AGENTS, «ligaduras»).
      await page.evaluate(() => document.fonts.load('24px "Material Symbols Outlined Variable"')).catch(() => undefined);
      await lienzo.screenshot({ path: join(dir, `${h.slug}.png`), animations: 'disabled' });
      historias[h.slug] = { nombre: h.nombre, png: `${ficha}/${h.slug}.png` };
      total += 1;
    }
    indice.fichas[ficha] = { anatomia: leido.anatomia, historias };
    process.stdout.write(`  ${ficha}: ${leido.historias.length} capturas\n`);
  }

  await browser.close();
  server?.close();
  mkdirSync(SALIDA, { recursive: true });
  writeFileSync(join(SALIDA, '_indice.json'), JSON.stringify(indice, null, 2) + '\n');
  console.log(`✔ docs:capturas — ${total} capturas de ${fichas.length} fichas en projects/sc-docs/public/ia/capturas/`);
}

if (process.argv[1] && process.argv[1].endsWith('docs-capturas.mjs')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

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
/* global document, localStorage, getComputedStyle, NodeFilter, scrollY -- lo que va dentro de `page.evaluate` corre en el navegador */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

import { chromium } from '@playwright/test';

import { navegadorPropio } from './playwright-navegador.mjs';

const root = resolve(import.meta.dirname, '..');
const SALIDA = join(root, 'projects/sc-docs/public/ia/capturas');
const ESTATICO = join(root, 'dist/sc-docs/browser');
const VIEWPORT = { width: 1280, height: 900 };
/** La miniatura del índice de Componentes: a qué ancho se pinta, cuánto aire lleva y hasta dónde llega (px CSS). */
const MINIATURA = { viewport: { width: 720, height: 900 }, aire: 20, maxAlto: 360 };

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

  // La página de las miniaturas: más estrecha, para que lo que ocupa todo el ancho se pinte a un ancho de tarjeta, y a
  // 2x, porque la tarjeta la enseña reducida.
  const paginaMini = await browser.newPage({ viewport: MINIATURA.viewport, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await paginaMini.addInitScript(() => {
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
    const primera = leido.historias[0];
    const miniatura = primera ? await capturarMiniatura(paginaMini, url, ficha, primera.slug, dir) : null;
    indice.fichas[ficha] = { anatomia: leido.anatomia, historias, ...(miniatura ? { miniatura } : {}) };
    process.stdout.write(`  ${ficha}: ${leido.historias.length} capturas${miniatura ? ' y su miniatura' : ''}\n`);
  }

  await browser.close();
  server?.close();
  mkdirSync(SALIDA, { recursive: true });
  writeFileSync(join(SALIDA, '_indice.json'), JSON.stringify(indice, null, 2) + '\n');
  console.log(`✔ docs:capturas — ${total} capturas de ${fichas.length} fichas en projects/sc-docs/public/ia/capturas/`);
}

/**
 * La miniatura de una ficha para su tarjeta del índice: la story suelta, en claro y en oscuro, recortada a lo que PINTA
 * (no al lienzo entero, que en un botón son 600 px de blanco) con un margen de aire. Escribe `_miniatura.png` y
 * `_miniatura-oscuro.png` y devuelve sus rutas y su tamaño en px CSS; las dos van al mismo recorte, el del claro.
 *
 * Qué cuenta como «lo que pinta»: lo que se ve de cada elemento (texto, imagen, control, o una caja con fondo, borde o
 * sombra), no su caja. Una fila contenedora a todo el ancho con un botón dentro mide 680 px; su botón, 140.
 */
async function capturarMiniatura(page, url, ficha, slug, dir) {
  let recorte = null;
  const salida = {};
  for (const tema of ['claro', 'oscuro']) {
    // El oscuro, en la página ENTERA y no con `&tema=oscuro`: el oscuro local del lienzo (`.sc-dark` en el panel) no
    // voltea los `--p-*` de PrimeNG, que se resuelven en la raíz. Medido el 2026-10-30: con él, el campo de `sc-select`
    // salía blanco (rgb 255) sobre el panel oscuro, y así 19 de las 58 miniaturas; con `.sc-dark` en `<html>`, rgb 9.
    await page.goto(`${url}/#/components/${ficha}?historia=${slug}&solo=1`);
    await page.evaluate((oscuro) => document.documentElement.classList.toggle('sc-dark', oscuro), tema === 'oscuro');
    const panel = page.locator('[data-testid="sb-solo"] .sb-canvas__pane').first();
    await panel.waitFor({ timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => document.fonts.load('24px "Material Symbols Outlined Variable"')).catch(() => undefined);
    recorte ??= await panel.evaluate((raiz, { aire, maxAlto }) => {
      const visible = (el) => {
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
        if (/^(IMG|SVG|CANVAS|INPUT|TEXTAREA|SELECT|BUTTON|VIDEO)$/i.test(el.tagName)) return true;
        const fondo = s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backgroundImage !== 'none';
        const borde = ['Top', 'Right', 'Bottom', 'Left'].some((l) => parseFloat(s[`border${l}Width`]) > 0);
        return fondo || borde || s.boxShadow !== 'none';
      };
      const cajas = [];
      for (const el of raiz.querySelectorAll('*')) if (visible(el)) cajas.push(el.getBoundingClientRect());
      const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent.trim()) continue;
        const r = document.createRange();
        r.selectNodeContents(n);
        cajas.push(r.getBoundingClientRect());
      }
      // Solo lo que cae DENTRO del lienzo: una barra fija al pie de la ventana (`sc-bulk-action-bar`) vive fuera, y con
      // ella el recorte salía de alto 0. Si no queda nada, la ficha va sin miniatura y la tarjeta enseña su selector.
      const marco = raiz.getBoundingClientRect();
      const utiles = cajas.filter(
        (c) => c.width > 0 && c.height > 0 && c.right > marco.left && c.left < marco.right && c.bottom > marco.top && c.top < marco.bottom,
      );
      if (!utiles.length) return null;
      const x0 = Math.max(marco.left, Math.min(...utiles.map((c) => c.left)) - aire);
      const y0 = Math.max(marco.top, Math.min(...utiles.map((c) => c.top)) - aire);
      const x1 = Math.min(marco.right, Math.max(...utiles.map((c) => c.right)) + aire);
      const y1 = Math.min(marco.bottom, Math.max(...utiles.map((c) => c.bottom)) + aire, y0 + maxAlto);
      if (x1 - x0 < 1 || y1 - y0 < 1) return null;
      return { x: Math.round(x0), y: Math.round(y0 + scrollY), width: Math.round(x1 - x0), height: Math.round(y1 - y0) };
    }, MINIATURA);
    if (!recorte) return null;
    const nombre = tema === 'claro' ? '_miniatura.png' : '_miniatura-oscuro.png';
    await page.screenshot({ path: join(dir, nombre), clip: recorte, fullPage: true, animations: 'disabled' });
    salida[tema] = `${ficha}/${nombre}`;
  }
  return { ...salida, ancho: recorte.width, alto: recorte.height };
}

if (process.argv[1] && process.argv[1].endsWith('docs-capturas.mjs')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

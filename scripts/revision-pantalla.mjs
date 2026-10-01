#!/usr/bin/env node
/**
 * REVISIÓN PREVIA A ENSEÑAR UNA PANTALLA DEL SUPERVISOR.
 *
 *   npm run revision -- <ruta> [<ruta>…]        p. ej. `npm run revision -- admin/grupos/editar/11 login`
 *   npm run revision -- --datos tortura <ruta>   la misma pantalla con los textos al límite (DD-124)
 *   npm run revision -- --datos editorial <ruta> con los grupos de nombre de negocio, para juzgar cómo luce
 *
 * Por qué existe: el primer filtro visual de una pantalla no puede ser el usuario. Una lista de
 * consejos de UI que se contrastó con el repo el 2026-09-27 lo decía así: pide a la IA que CRITIQUE
 * lo que diseñaste, no que lo diseñe. Aquí la IA construye; esto es la pasada que critica antes de
 * enseñar (DD-123 para la parte medible).
 *
 * Qué hace, por ruta: la abre a 1440×900 en claro, recorre sus pestañas o las secciones de su índice,
 * guarda una captura de cada vista en `.cache/revision/` y mide la agrupación con la MISMA medida que
 * `e2e/supervisor/agrupacion.spec.ts` (etiqueta→control contra campo→campo, opciones en fila, botón
 * que envía). Sale con 1 si una vista incumple la regla: lo medible se arregla antes de enseñar.
 *
 * Qué NO hace: juzgar. Las capturas se miran con la skill `better-layout` (agrupación, alineación,
 * orden de lectura) y lo que sea gusto se le lista al usuario, no se decide solo.
 *
 * Necesita el Supervisor sirviendo: `SC_SUPERVISOR_URL`, o el de los e2e en http://localhost:4405
 * (`npm run ng -- serve supervisor --port 4405`). Con un Chromium distinto del de Playwright (una
 * sesión en la nube), `SC_CHROMIUM=/ruta/al/chrome`.
 */
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const BASE = (process.env.SC_SUPERVISOR_URL || 'http://localhost:4405').replace(/\/$/, '');
const MEDIDA = resolve('e2e/supervisor/agrupacion-medida.js');
const SALIDA = resolve('.cache/revision');

/** Nombre de fichero legible a partir de la vista: `admin/grupos/editar/11 · Recursos` → `admin-grupos-editar-11--recursos`. */
export const nombreCaptura = (vista) =>
  vista
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ · /g, '--')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Quita lo que va delante del texto de una pestaña o sección: la ligadura de su icono de Material, o el número de
 *  un paso del alta (DD-138: el nativo lo pinta delante del título). */
export const nombreDe = (txt) => txt.replace(/^\s*(?:[a-z_]+|\d+)\s*\n/, '').replace(/\s+/g, ' ').trim();

/**
 * Lo mínimo que abre los pasos apagados de un alta: la de grupo no deja pasar de General sin nombre (DD-121). Se
 * rellena al encontrar el primer paso apagado, así que la primera vista se captura como la ve quien llega. Un alta
 * nueva con puerta entra aquí; si no, sus pasos se saltan con un aviso en vez de esperar 30 s a un clic imposible.
 */
export const PREPARAR = { 'admin/grupos/crear': { '#group-name': 'Revisión' } };

/** Espera hasta `ms` a que la pestaña se encienda: el paso se abre en el siguiente ciclo de la app, no al teclear. */
const encendida = async (item, ms = 3000) => {
  for (const hasta = Date.now() + ms; Date.now() < hasta; ) {
    if (await item.isEnabled()) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return item.isEnabled();
};

/**
 * Lo que queda por debajo del pliegue. La app no se desplaza en la ventana sino dentro de su zona de
 * contenido, así que `fullPage` no ve nada más allá de los 900: se mide el desplazable más largo.
 */
const OCULTO = `(() => {
  let extra = 0;
  for (const e of document.querySelectorAll('main, main *')) {
    const oy = getComputedStyle(e).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && e.scrollHeight > e.clientHeight + 1) extra = Math.max(extra, e.scrollHeight - e.clientHeight);
  }
  return Math.ceil(extra);
})()`;

/* Espera a que acaben las animaciones con final (las infinitas, como el punto de «En directo», no), con tope de
 * 3 s. Por qué (2026-09-27): la entrada escalonada del Dashboard dura hasta un segundo, y la última tarjeta de
 * «Colas y agentes» salía en la captura a opacidad 0 y desenfocada, como si estuviera rota. Vuelve a mirar hasta
 * dos comprobaciones seguidas sin ninguna viva: la entrada arranca unos cuadros DESPUÉS del clic, y esperar solo a
 * las que había al preguntar dejaba fuera el hueco vacío, que acaba de entrar a los ~800 ms (medido). */
const ANIMACIONES = `(async () => {
  const hasta = performance.now() + 3000;
  const vivas = () => document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().endTime !== Infinity && a.playState !== 'finished');
  const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
  let quietas = 0;
  while (quietas < 2 && performance.now() < hasta) {
    const a = vivas();
    if (a.length) {
      quietas = 0;
      await Promise.race([Promise.all(a.map((x) => x.finished.catch(() => null))), pausa(hasta - performance.now())]);
    } else {
      quietas++;
      await pausa(100);
    }
  }
})()`;

async function revisarVista(page, vista) {
  await page.evaluate('document.fonts.ready');
  await page.evaluate(ANIMACIONES);
  await page.waitForTimeout(500);
  // La medida, a la ventana de siempre (1440×900): las cajas de debajo del pliegue también cuentan.
  const pares = await page.evaluate('window.__medirAgrupacion()');
  const archivo = join(SALIDA, `${nombreCaptura(vista)}.png`);
  // Tope de tres ventanas: una lista de 500 filas daría una captura que nadie puede leer.
  const alto = Math.min(900 + (await page.evaluate(OCULTO)), 2700);
  if (alto > 900) {
    await page.setViewportSize({ width: 1440, height: alto });
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: archivo });
  if (alto > 900) await page.setViewportSize({ width: 1440, height: 900 });
  return { vista, archivo, pares };
}

async function revisarRuta(page, ruta, datos) {
  const destino = `${BASE}/${ruta.replace(/^\//, '')}${datos ? `${ruta.includes('?') ? '&' : '?'}datos=${datos}` : ''}`;
  const r = await page.goto(destino, { waitUntil: 'networkidle' }).catch((e) => ({ error: e }));
  if (!r || r.error) throw new Error(`no se puede abrir ${destino}: ¿está el Supervisor sirviendo? (${r?.error?.message ?? 'sin respuesta'})`);
  await page.mouse.move(720, 8); // fuera de la barra lateral, que se despliega al pasar el ratón
  const pestanas = page.locator('main [role="tab"]');
  const secciones = page.locator('sc-form-section-nav .form-nav__item');
  const nP = await pestanas.count();
  const nS = await secciones.count();
  const tira = nP > 1 ? pestanas : nS > 1 ? secciones : null;
  if (!tira) return [await revisarVista(page, ruta)];
  const vistas = [];
  for (let i = 0; i < (nP > 1 ? nP : nS); i++) {
    const item = tira.nth(i);
    const nombre = nombreDe(await item.innerText());
    if (!(await item.isEnabled())) {
      for (const [campo, valor] of Object.entries(PREPARAR[ruta.split('?')[0]] ?? {})) await page.locator(campo).fill(valor);
      if (!(await encendida(item))) {
        console.warn(`⚠ ${ruta} · ${nombre}: el paso está apagado y no se revisa. Lo que lo abre va en PREPARAR.`);
        continue;
      }
    }
    await item.click();
    vistas.push(await revisarVista(page, `${ruta} · ${nombre}`));
  }
  return vistas;
}

async function main() {
  const args = process.argv.slice(2);
  const iDatos = args.indexOf('--datos');
  const datos = iDatos >= 0 ? args[iDatos + 1] : undefined;
  const rutas = args.filter((a, i) => !a.startsWith('-') && (iDatos < 0 || i !== iDatos + 1));
  if (!rutas.length) {
    console.error('Uso: npm run revision -- <ruta> [<ruta>…]   (p. ej. admin/grupos/editar/11)');
    process.exit(2);
  }
  mkdirSync(SALIDA, { recursive: true });
  const browser = await chromium.launch(process.env.SC_CHROMIUM ? { executablePath: process.env.SC_CHROMIUM } : {});
  const contexto = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  await contexto.addInitScript({ path: MEDIDA });
  const page = await contexto.newPage();
  let rojas = 0;
  try {
    for (const ruta of rutas) {
      for (const { vista, archivo, pares } of await revisarRuta(page, ruta, datos)) {
        const mal = pares.filter((p) => !p.ok);
        if (mal.length) rojas++;
        console.log(`${mal.length ? '✗' : '✓'} ${vista} · ${pares.length} relaciones medidas · ${archivo}`);
        for (const p of mal)
          console.log(
            p.regla === 'R4'
              ? `    R4 · ${p.etiqueta}: ${p.entre} px de aire que se suma (${p.vecino}); pide menos de 7`
              : `    ${p.regla} · ${p.etiqueta} → ${p.vecino}: dentro ${p.dentro}, entre ${p.entre} (pide ≥ ${2 * p.dentro})`,
          );
      }
    }
  } finally {
    await browser.close();
  }
  console.log(
    rojas
      ? `\n${rojas} vista(s) en rojo. Por debajo del doble (DD-123): sube el hueco ENTRE al peldaño siguiente de 7 · 14 · 28, o baja el de DENTRO. Aire que se suma (R4, DD-125): quita el margen o el relleno de la cadena que imprime.`
      : '\nAgrupación medida: en regla.',
  );
  console.log('Ahora MIRA las capturas con la skill better-layout; arregla lo medible y lista al usuario lo que sea de gusto.');
  process.exit(rojas ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(`revision: ${e.message}`);
    process.exit(2);
  });
}

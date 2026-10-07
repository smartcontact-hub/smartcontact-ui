import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL RESUMEN DE AGENTE Y USUARIO CABE EN SU COLUMNA DE 240 (DD-144, actualización del 2026-10-05).
 *
 * La columna mide 240 por encima de 1340, a 1366 igual que a 1440, y a sus textos les quedan 217 (240 menos el
 * relleno y el borde de la tarjeta). Nada se corta con «…»: los valores llevan `overflow-wrap: anywhere`, así que un
 * texto largo baja de línea, incluso a mitad de palabra, y la cifra (48) y el anillo (42) son fijos, así que una cifra
 * que no cupiera pisaría el anillo. Ninguno de los dos fallos lo ve `scrollWidth`: por eso se mide cada texto y cada
 * cifra, no la columna.
 *
 * Medido el 2026-10-05 con una sonda a 1366 × 768, a 1440 × 900 y a 1366 × 660, en los cuatro idiomas y en las ocho
 * fichas de abajo: nada falta. La guarda mira 1366 × 768: la columna mide lo mismo que a 1440, y es el alto más justo
 * en el que el resumen tiene que verse sin desplazarse (a 660 el diseño admite el scroll, `_page.scss`).
 *
 * Instrumento validado con el fallo puesto (LEARNINGS #2), cada comprobación con el suyo: con la columna a 150, la
 * cifra pisa el anillo 9 px en los cuatro idiomas; con los textos sin partir, «Superviseur hors ligne» se sale 21 de su
 * tarjeta y la columna desborda; con la columna corta, hay que desplazarse; a 90, «Superviseur» y «Téléphone» se
 * parten. Con la columna de verdad, en verde.
 *
 * Los idiomas se recorren por `sc-language`, el canal que escribe Configuración › Sistema (LEARNINGS #1).
 */

const IDIOMAS = ['es', 'en', 'fr', 'pt'] as const;

/** Las fichas que más enseñan, y cuántos textos y cifras con anillo pinta cada una (lo que la red tiene que medir). */
const FICHAS = [
  { ruta: 'admin/agentes/editar/7', textos: 5, cifras: 1 },
  { ruta: 'admin/agentes/editar/12', textos: 5, cifras: 1 },
  { ruta: 'admin/agentes/crear', textos: 7, cifras: 0 },
  { ruta: 'admin/agentes/crear?seedFromId=7', textos: 6, cifras: 1 },
  { ruta: 'admin/usuarios/editar/1', textos: 4, cifras: 2 },
  { ruta: 'admin/usuarios/editar/3', textos: 4, cifras: 2 },
  { ruta: 'admin/usuarios/crear', textos: 5, cifras: 2 },
  { ruta: 'admin/usuarios/crear?seedFromId=3', textos: 5, cifras: 2 },
] as const;

/**
 * Lo que no cabe en la columna, en palabras. Dos rectángulos de texto en la misma línea difieren en subpíxeles, no
 * en una línea: por eso las líneas se cuentan con 4 px de tolerancia. No se mide lo oculto al lector
 * (`.visually-hidden`, que mide 1 px siempre) ni el nombre de los iconos, que se pinta como un solo glifo.
 */
const loQueNoCabe = (page: Page) =>
  page.locator('.ficha-summary').evaluate((columna) => {
    const TOLERANCIA = 4;
    const fuera = (el: Element | null) => !!el?.closest('.visually-hidden, sc-icon');
    const lineas = (rects: DOMRect[]) => {
      const tops: number[] = [];
      for (const r of rects) if (!tops.some((t) => Math.abs(t - r.top) < TOLERANCIA)) tops.push(r.top);
      return tops.length;
    };
    const textosDe = (el: Element) => {
      const nodos: Text[] = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if ((n as Text).data.trim() && !fuera(n.parentElement)) nodos.push(n as Text);
      }
      return nodos;
    };
    const rectsDe = (nodo: Text, desde = 0, hasta = nodo.data.length) => {
      const r = document.createRange();
      r.setStart(nodo, desde);
      r.setEnd(nodo, hasta);
      return [...r.getClientRects()].filter((x) => x.width > 0);
    };

    const fallos: string[] = [];
    if (columna.scrollWidth > columna.clientWidth) fallos.push(`la columna desborda ${columna.scrollWidth - columna.clientWidth} en ancho`);
    if (columna.scrollHeight > columna.clientHeight) fallos.push(`hay que desplazarse ${columna.scrollHeight - columna.clientHeight} dentro de la columna`);

    const textos = [...columna.querySelectorAll('.resumen__label, .resumen__value, .resumen__status, .resumen__note, .sc-fact-row__key, .sc-fact-row__value')].filter(
      (el) => !fuera(el) && el.getClientRects().length > 0,
    );
    for (const el of textos) {
      const nodos = textosDe(el);
      const dice = nodos.map((nodo) => nodo.data.trim()).join(' ');
      for (const nodo of nodos) {
        // Tras un guion se puede cortar («e-mail», en francés): lo que se busca es una palabra partida en cualquier letra.
        for (const palabra of nodo.data.matchAll(/[^\s-]+/g)) {
          if (lineas(rectsDe(nodo, palabra.index, palabra.index + palabra[0].length)) > 1) {
            fallos.push(`«${dice}» parte «${palabra[0]}» entre dos líneas`);
          }
        }
      }
      const tarjeta = el.closest('.resumen__kpi') ?? el;
      const borde = tarjeta.getBoundingClientRect().right - parseFloat(getComputedStyle(tarjeta).borderRightWidth);
      const derecha = Math.max(...nodos.flatMap((nodo) => rectsDe(nodo)).map((r) => r.right));
      if (derecha > borde + 0.5) fallos.push(`«${dice}» se sale ${Math.round(derecha - borde)} de su tarjeta`);
    }

    const widgets = [...columna.querySelectorAll('.resumen__widget')].filter((w) => w.querySelector('.resumen__ring'));
    for (const widget of widgets) {
      const anillo = widget.querySelector('.resumen__ring')!.getBoundingClientRect();
      const piezas = [...widget.querySelectorAll('.resumen__count, .resumen__of')];
      const cifra = piezas.map((p) => p.textContent?.trim()).join('');
      const derecha = Math.max(...piezas.map((p) => p.getBoundingClientRect().right));
      if (derecha > anillo.left) fallos.push(`la cifra ${cifra} pisa el anillo ${Math.round(derecha - anillo.left)}`);
      if (anillo.right > widget.getBoundingClientRect().right + 0.5) fallos.push(`el anillo de ${cifra} se sale de su tarjeta`);
    }

    return { fallos, textos: textos.length, cifras: widgets.length };
  });

test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 1366, height: 768 } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

for (const idioma of IDIOMAS) {
  test(`el resumen de agente y usuario cabe en su columna, a 1366 × 768 (${idioma})`, async ({ page }) => {
    await page.addInitScript((lang) => {
      try {
        localStorage.setItem('sc-language', lang);
      } catch {
        /* contexto sin storage — ignorar */
      }
    }, idioma);

    const noCabe: string[] = [];
    for (const { ruta, textos, cifras } of FICHAS) {
      await goto(page, ruta);
      await expect(page.locator('.ficha-summary')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);

      const medida = await loQueNoCabe(page);
      // Lo medido va aseverado: un verde sin textos sería un selector que dejó de casar (LEARNINGS #2).
      expect({ textos: medida.textos, cifras: medida.cifras }, `${ruta}: no midió lo que pinta`).toEqual({ textos, cifras });
      noCabe.push(...medida.fallos.map((fallo) => `${ruta} · ${fallo}`));
    }

    expect(noCabe, `lo que no cabe en ${idioma}:\n  ${noCabe.join('\n  ')}`).toEqual([]);
  });
}

import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * El índice del rail (`sc-form-section-nav`) NO esconde el nombre de una sección.
 *
 * Por qué existe esta red. Hasta el 2026-09-06 el label del índice era
 * `white-space: nowrap` + `text-overflow: ellipsis`, con la idea declarada en su
 * propio SCSS de que «el ancho del rail define la truncación, no la longitud del
 * copy». Medido en el Supervisor a 1440×900 con el rail de 240px, esa idea le
 * dejaba al texto 99px, y **13 de las 48 etiquetas** de los tres formularios en
 * los cuatro idiomas no cabían: «Servicios asignados» pedía 114px, «Agentes
 * asignados» 108, «Grupos asignados» 103. Se leía «Servicios asign…».
 *
 * El defecto se venía esquivando POR PÁGINA, acortando el copy hasta que cupiera.
 * Eso no se sostiene: la restricción es del componente, es invisible para quien
 * redacta, y se rompe sola en cuanto alguien traduce — de las 13, solo 5 eran del
 * español.
 *
 * Lo que este spec fija es la REGLA, no los píxeles: ninguna etiqueta puede
 * quedar recortada y ningún item puede desbordar su panel. Así el arreglo no
 * depende de que nadie vuelva a escribir un rótulo largo.
 *
 * Instrumento validado con el fallo puesto (LEARNINGS #2): contra el `nowrap` +
 * elipsis anterior este mismo assert enrojece y lista las 13 por nombre; con el
 * label envolviendo, 48/48 en verde.
 *
 * Los cuatro idiomas se recorren de verdad, vía `sc-language` en localStorage —
 * el mismo canal que escribe el selector de Configuración → Sistema, no un
 * estímulo inventado (LEARNINGS #1).
 */

const FORMULARIOS = [
  { nombre: 'usuarios', ruta: 'admin/usuarios/crear' },
  { nombre: 'agentes', ruta: 'admin/agentes/crear' },
  { nombre: 'grupos', ruta: 'admin/grupos/crear' },
] as const;

const IDIOMAS = ['es', 'en', 'fr', 'pt'] as const;

/** Los tres formularios declaran cuatro secciones cada uno. */
const SECCIONES_POR_FORMULARIO = 4;

/**
 * Lee cada item del índice: qué dice, cuánto sitio tiene y cuánto pide.
 *
 * `scrollWidth > clientWidth` sobre el LABEL es la definición operativa de «está
 * recortado». La misma comparación sobre el ITEM caza el fallo contrario —que el
 * texto se salga del panel en vez de partirse—, que es en lo que degeneraría
 * quitar la elipsis sin dejar que el label envuelva.
 */
const medirIndice = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('.form-nav__item')].map((item) => {
      const label = item.querySelector('.form-nav__label') as HTMLElement;
      return {
        texto: label.textContent?.trim().replace(/\s+/g, ' ') ?? '',
        tieneHueco: label.clientWidth,
        pide: label.scrollWidth,
        itemHueco: item.clientWidth,
        itemPide: item.scrollWidth,
      };
    }),
  );

/** Recorre los tres formularios y devuelve las etiquetas que no caben. */
const recortesEnLosTresFormularios = async (page: Page) => {
  const recortadas: string[] = [];
  let medidas = 0;

  for (const { nombre, ruta } of FORMULARIOS) {
    await goto(page, ruta);
    await expect(page.locator('.form-nav__item').first()).toBeVisible();

    const items = await medirIndice(page);
    expect(items.length, `${nombre}: el índice no pintó ningún item`).toBe(
      SECCIONES_POR_FORMULARIO,
    );

    for (const item of items) {
      medidas += 1;
      if (item.pide > item.tieneHueco) {
        recortadas.push(
          `${nombre} · "${item.texto}" — caja ${item.tieneHueco}px, pide ${item.pide}px`,
        );
      }
      if (item.itemPide > item.itemHueco) {
        recortadas.push(
          `${nombre} · "${item.texto}" — el item DESBORDA su panel (${item.itemHueco}px vs ${item.itemPide}px)`,
        );
      }
    }
  }

  return { recortadas, medidas };
};

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

for (const idioma of IDIOMAS) {
  test(`índice del rail · ninguna etiqueta se recorta (${idioma})`, async ({ page }) => {
    await page.addInitScript((lang) => {
      try {
        localStorage.setItem('sc-language', lang);
      } catch {
        /* contexto sin storage — ignorar */
      }
    }, idioma);

    const { recortadas, medidas } = await recortesEnLosTresFormularios(page);

    // El conteo va aseverado a propósito: un verde con 0 medidas sería un
    // selector que dejó de casar, no un índice sano (LEARNINGS #2, leer el
    // control antes que el resultado).
    expect(medidas, 'el instrumento no midió las 12 etiquetas esperadas').toBe(
      FORMULARIOS.length * SECCIONES_POR_FORMULARIO,
    );
    expect(recortadas, `etiquetas recortadas en ${idioma}:\n  ${recortadas.join('\n  ')}`).toEqual(
      [],
    );
  });
}

/*
 * A 1024 el rail deja de ser columna (`@media (max-width: 1024px)` en los tres
 * form-pages pasa la rejilla a `1fr`) y el índice ocupa el ancho de la página.
 * Ahí sobra sitio, pero es justo el ancho en el que el molde cambia de forma, así
 * que se mide en vez de suponerse.
 */
test('índice del rail · a 1024 (rail colapsado) tampoco se recorta', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });

  const { recortadas, medidas } = await recortesEnLosTresFormularios(page);

  expect(medidas).toBe(FORMULARIOS.length * SECCIONES_POR_FORMULARIO);
  expect(recortadas, `etiquetas recortadas a 1024:\n  ${recortadas.join('\n  ')}`).toEqual([]);
});

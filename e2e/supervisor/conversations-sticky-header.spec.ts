import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA CABECERA FIJA DE CONVERSACIONES Y SUS ETIQUETAS, FIJADAS EN GEOMETRÍA.
 *
 * Por qué existe (2026-09-13): la cabecera llevaba `position: sticky` desde S37 y
 * nunca fijó. Nadie lo vio porque el CSS estaba escrito y ningún test medía dónde
 * acaba la cabecera tras hacer scroll. Tres causas, las tres medidas:
 *
 *   1. `p-table` pone `overflow: auto` EN LÍNEA a su contenedor, que así hace
 *      scroll propio y la cabecera se fija a él (acababa en -284 tras 600px).
 *   2. `.table-card` llevaba `overflow: hidden`: otro contenedor de scroll.
 *   3. Arreglados los dos, las filas pintaban ENCIMA de la cabecera: el `<thead>`
 *      fijo crea contexto de apilamiento y las celdas van con `position: relative`.
 *
 * El arreglo es del DS (`<sc-datatable stickyHeader>`, que publica el tema) y de
 * la caja compartida (`overflow: clip`). Este spec se vio ROJO con cada causa
 * puesta por separado antes de darlo por bueno.
 *
 * Y las etiquetas: a 1280 no caben las diez columnas (piden 1203px, hay 1153), y
 * 31 de 68 etiquetas se partían en dos líneas. Una etiqueta del Kit es una línea:
 * si no cabe, recorta y enseña el valor entero al pasar el ratón.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const TABLE = '[data-testid="conversations-table"]';
const MAIN = 'main.app-shell__content';

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/**
 * Desplaza la página con la RUEDA, que es el estímulo real, y comprueba que llegó.
 * Reintenta la rueda solo si no llegó: medido el 2026-09-13, un giro lanzado
 * nada más pintarse la tabla se puede perder y `scrollTop` se queda en 0.
 */
const scrollPage = async (page: Page, dy: number): Promise<void> => {
  const box = await page.locator(`${TABLE} tbody`).boundingBox();
  if (!box) throw new Error('La tabla no tiene caja: no se puede apuntar la rueda.');
  await page.mouse.move(box.x + box.width / 2, box.y + 40);
  const scrollTop = (): Promise<number> => page.locator(MAIN).evaluate((el) => el.scrollTop);
  await expect(async () => {
    if ((await scrollTop()) < dy / 2) await page.mouse.wheel(0, dy);
    expect(await scrollTop()).toBeGreaterThan(dy / 2);
  }).toPass({ timeout: 10_000 });
};

test('la cabecera se queda arriba al hacer scroll y pinta encima de las filas', async ({ page }) => {
  await goto(page, 'conversaciones');
  const firstTh = page.locator(`${TABLE} thead th`).nth(1);
  await expect(firstTh).toBeVisible();

  const mainTop = await page.locator(MAIN).evaluate((el) => el.getBoundingClientRect().top);
  const thTopAntes = await firstTh.evaluate((el) => el.getBoundingClientRect().top);
  // Control: sin scroll, la cabecera arranca BAJO los filtros. Si ya empezara en
  // el borde, el test pasaría aunque no fijara.
  expect(thTopAntes).toBeGreaterThan(mainTop + 100);

  await scrollPage(page, 600);

  await expect
    .poll(() => firstTh.evaluate((el) => el.getBoundingClientRect().top))
    .toBeCloseTo(mainTop, 0);

  // Que esté en su sitio no basta: tiene que VERSE. Lo que hay en el centro de
  // la celda de cabecera tiene que ser la cabecera, no una fila que pasa por debajo.
  const loQueSeVe = await firstTh.evaluate((th) => {
    const r = th.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return hit?.closest('thead, tbody')?.tagName.toLowerCase() ?? 'nada';
  });
  expect(loQueSeVe).toBe('thead');
});

test.describe('a 1280, donde no caben las diez columnas', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('ninguna etiqueta se parte ni se sale de su celda, y el ID cabe', async ({ page }) => {
    await goto(page, 'conversaciones');
    await expect(page.locator(`${TABLE} tbody .p-tag`).first()).toBeVisible();

    const medidas = await page.locator(TABLE).evaluate((table) => {
      const dentro = (el: Element): boolean => {
        const td = el.closest('td')!;
        const cs = getComputedStyle(td);
        return el.getBoundingClientRect().right <= td.getBoundingClientRect().right - parseFloat(cs.paddingRight) + 0.5;
      };
      const tags = [...table.querySelectorAll('tbody .p-tag')];
      const idCol = [...table.querySelectorAll('thead th')].findIndex((th) => th.textContent?.trim() === 'ID');
      const ids = [...table.querySelectorAll('tbody tr')].map((tr) => tr.children[idCol]?.querySelector('span')).filter(Boolean) as Element[];
      return {
        tags: tags.length,
        altas: tags.filter((t) => t.getBoundingClientRect().height > 22.5).map((t) => t.textContent?.trim()),
        fuera: tags.filter((t) => !dentro(t)).map((t) => t.textContent?.trim()),
        recortadas: tags.filter((t) => { const l = t.querySelector('.p-tag-label')!; return l.scrollWidth > l.clientWidth; }).length,
        ids: ids.length,
        idsFuera: ids.filter((s) => !dentro(s)).map((s) => s.textContent?.trim()),
      };
    });

    expect(medidas.tags).toBeGreaterThan(20);
    expect(medidas.altas).toEqual([]);
    expect(medidas.fuera).toEqual([]);
    expect(medidas.ids).toBeGreaterThan(20);
    expect(medidas.idsFuera).toEqual([]);
    // Control: a este ancho TIENE que haber recortadas. Si no hay ninguna, el
    // test no está mirando el caso que lo justifica (otros datos, otro ancho).
    expect(medidas.recortadas).toBeGreaterThan(0);
  });

  test('una etiqueta recortada enseña su valor entero al pasar el ratón', async ({ page }) => {
    await goto(page, 'conversaciones');
    const tags = page.locator(`${TABLE} tbody sc-tag`);
    await expect(tags.first()).toBeVisible();

    const indice = await tags.evaluateAll((els) =>
      els.findIndex((el) => { const l = el.querySelector('.p-tag-label')!; return l.scrollWidth > l.clientWidth; }),
    );
    expect(indice).toBeGreaterThanOrEqual(0);
    const recortada = tags.nth(indice);
    const valor = (await recortada.locator('.p-tag-label').textContent())?.trim();

    await recortada.hover();
    await expect(recortada.locator('.p-tag')).toHaveAttribute('title', valor!);

    // Y una que cabe no lleva tooltip: repetiría lo que ya se lee.
    const entera = await tags.evaluateAll((els) =>
      els.findIndex((el) => { const l = el.querySelector('.p-tag-label')!; return l.scrollWidth <= l.clientWidth; }),
    );
    expect(entera).toBeGreaterThanOrEqual(0);
    await tags.nth(entera).hover();
    await expect(tags.nth(entera).locator('.p-tag')).not.toHaveAttribute('title', /.*/);
  });
});

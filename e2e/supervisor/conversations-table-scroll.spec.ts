import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * CONVERSACIONES HACE SCROLL DENTRO DE LA TABLA, COMO EL RESTO DE LISTAS, Y SUS ETIQUETAS.
 *
 * Por qué existe (2026-09-15): Conversaciones se quedó fuera de `.page--tabla` (DD-95) y de
 * `sc-list-page` (DD-98). Movía la página entera con la cabecera de columnas fija, sin caja, mientras
 * las demás listas dejan quietos título, barra y cabecera y hacen scroll en la tabla. Al pasarla al
 * molde, lo que es SOLO suyo es la cadena de altos: su `.table-card` vive dentro del host
 * `<sc-memory-conversation-table>`, que se interpone entre `.page__inner` y la tarjeta, así que las
 * reglas globales de `.page--tabla` no llegan solas. Este spec fija las tres cosas que dependen de
 * ese eslabón: la página no se mueve, la tarjeta se ajusta a pocas filas y deja sitio a la barra de
 * selección.
 *
 * (Antes, 2026-09-13, este fichero fijaba la cabecera fija con scroll de página. Ese diseño lo
 * sustituyó DD-95: con scroll dentro, PrimeNG ya fija el `<thead>` a su contenedor.)
 *
 * Y las etiquetas: a 1280 no caben las diez columnas (piden 1203px, hay 1153), y
 * 31 de 68 etiquetas se partían en dos líneas. Una etiqueta del Kit es una línea:
 * si no cabe, recorta y enseña el valor entero al pasar el ratón.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const TABLE = '[data-testid="conversations-table"]';
const MAIN = 'main.app-shell__content';
/** Contenedor de scroll de `p-table` sin lista virtual (Conversaciones tiene menos de 100 filas). */
const SCROLLER = `${TABLE} .p-datatable-table-container`;

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const top = (page: Page, selector: string): Promise<number> =>
  page.locator(selector).first().evaluate((el) => Math.round(el.getBoundingClientRect().top));

test('la página no se mueve: la tabla hace scroll dentro y título, filtros y cabecera se quedan', async ({ page }) => {
  await goto(page, 'conversaciones');
  const firstTh = page.locator(`${TABLE} thead th`).nth(1);
  await expect(firstTh).toBeVisible();

  // Control: tiene que haber filas de sobra para desplazar. Si la tabla cupiera entera, el test
  // pasaría sin mirar nada.
  const sobra = await page.locator(SCROLLER).evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(sobra).toBeGreaterThan(300);

  const antes = {
    h1: await top(page, 'h1.page__heading'),
    filtros: await top(page, 'sc-memory-conversation-filters'),
    th: await firstTh.evaluate((el) => Math.round(el.getBoundingClientRect().top)),
  };

  // La RUEDA sobre las filas, que es el estímulo real, y comprobando que llegó: medido el
  // 2026-09-13, un giro lanzado nada más pintarse la tabla se puede perder.
  const box = await page.locator(`${TABLE} tbody`).first().boundingBox();
  if (!box) throw new Error('La tabla no tiene caja: no se puede apuntar la rueda.');
  await page.mouse.move(box.x + box.width / 2, box.y + 40);
  const scrollTabla = (): Promise<number> => page.locator(SCROLLER).evaluate((el) => el.scrollTop);
  await expect(async () => {
    if ((await scrollTabla()) < 300) await page.mouse.wheel(0, 600);
    expect(await scrollTabla()).toBeGreaterThan(300);
  }).toPass({ timeout: 10_000 });

  expect(await page.locator(MAIN).evaluate((el) => el.scrollTop)).toBe(0);
  expect(await top(page, 'h1.page__heading')).toBe(antes.h1);
  expect(await top(page, 'sc-memory-conversation-filters')).toBe(antes.filtros);
  expect(await firstTh.evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBe(antes.th);

  // Que esté en su sitio no basta: tiene que VERSE. Lo que hay en el centro de
  // la celda de cabecera tiene que ser la cabecera, no una fila que pasa por debajo.
  const loQueSeVe = await firstTh.evaluate((th) => {
    const r = th.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return hit?.closest('thead, tbody')?.tagName.toLowerCase() ?? 'nada';
  });
  expect(loQueSeVe).toBe('thead');
});

test('con pocas filas la tarjeta acaba en la última, sin hueco vacío hasta abajo', async ({ page }) => {
  await goto(page, 'conversaciones');
  await expect(page.locator(`${TABLE} tbody tr`).first()).toBeVisible();
  const total = await page.locator(`${TABLE} tbody tr`).count();

  await page.locator('.memory-conversation-filters__views').getByText('Fallidas', { exact: true }).click();
  await expect.poll(() => page.locator(`${TABLE} tbody tr`).count()).toBeLessThan(total);

  const medida = await page.locator('.table-card').evaluate((card) => {
    const filas = card.querySelectorAll('tbody tr');
    return {
      filas: filas.length,
      hueco: card.getBoundingClientRect().bottom - filas[filas.length - 1]!.getBoundingClientRect().bottom,
      alto: innerHeight,
      fondo: card.getBoundingClientRect().bottom,
    };
  });
  // Control: pocas filas de verdad, que quedan muy por encima del fondo de la ventana.
  expect(medida.filas).toBeGreaterThan(0);
  expect(medida.fondo).toBeLessThan(medida.alto / 2);
  // Solo el borde de la tarjeta bajo la última fila.
  expect(medida.hueco).toBeLessThan(3);
});

/* El color de estado de una fila (rojo de fallida, amarillo en proceso) cubre la fila ENTERA, de borde a
 * borde de la tarjeta (2026-09-15). Hasta ese día la tabla reservaba el hueco de la barra de scroll a
 * los dos lados y el color se cortaba 10 px antes de cada borde: en ese hueco una fila no puede pintar. */
test('el rojo de una fila fallida llega a los dos bordes de la tarjeta', async ({ page }) => {
  await goto(page, 'conversaciones');
  await expect(page.locator(`${TABLE} tbody tr`).first()).toBeVisible();
  // «Fallidas»: pocas filas, sin barra de scroll, así que no hay nada que se interponga a ningún lado.
  await page.locator('.memory-conversation-filters__views').getByText('Fallidas', { exact: true }).click();
  const fila = page.locator(`${TABLE} tbody tr.is-failed`).first();
  await expect(fila).toBeVisible();

  const m = await fila.evaluate((tr) => {
    const card = tr.closest('.table-card')!;
    const c = card.getBoundingClientRect();
    const r = tr.getBoundingClientRect();
    const borde = parseFloat(getComputedStyle(card).borderLeftWidth);
    return { izquierda: r.left - (c.left + borde), derecha: c.right - borde - r.right, fondo: getComputedStyle(tr).backgroundColor };
  });
  // Control: la fila está pintada. Si no tuviera color, llegar al borde no demostraría nada.
  expect(m.fondo).not.toBe('rgba(0, 0, 0, 0)');
  expect(Math.abs(m.izquierda)).toBeLessThan(1);
  expect(Math.abs(m.derecha)).toBeLessThan(1);
});

test('con una fila marcada, la tarjeta acaba antes que la barra de selección', async ({ page }) => {
  await goto(page, 'conversaciones');
  const fila = page.locator(`${TABLE} tbody tr`).first();
  await expect(fila).toBeVisible();

  const card = page.locator('.table-card');
  const fondoAntes = await card.evaluate((el) => el.getBoundingClientRect().bottom);
  // Control: sin selección, la tarjeta llega más abajo de donde luego sale la barra.
  await fila.locator('td').first().click();
  const barra = page.locator('.bulk-bar');
  await expect(barra).toBeVisible();

  const barraTop = await barra.evaluate((el) => el.getBoundingClientRect().top);
  expect(fondoAntes).toBeGreaterThan(barraTop);
  await expect
    .poll(() => card.evaluate((el) => el.getBoundingClientRect().bottom))
    .toBeLessThanOrEqual(barraTop);
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

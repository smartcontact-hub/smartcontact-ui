import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * ENTIDADES HACE SCROLL DENTRO DE SUS DOS TABLAS, COMO EL RESTO DE LISTAS (DD-95).
 *
 * Era la última lista que movía la página entera: medido el 2026-10-05 a 1366 × 768, 1019 px de contenido en 712 de
 * ventana, y al bajar se iban el título y las cabeceras de columnas. Lleva DOS tablas en una pantalla, así que el alto
 * se reparte: las entidades del usuario miden sus filas, y las del sistema se quedan con lo que queda hasta abajo,
 * nunca menos que su cabecera y un par de filas. Las filas son las del mock: 4 del usuario y 11 del sistema.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const MAIN = 'main.app-shell__content';
const USUARIO = '[data-testid="entities-table"]';
const SISTEMA = '[data-testid="entities-system-table"]';
/** Contenedor de scroll de `p-table` sin lista virtual. */
const scroller = (tabla: string): string => `${tabla} .p-datatable-table-container`;

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const abrir = async (page: Page): Promise<void> => {
  await goto(page, 'conversaciones/entidades');
  await expect(page.locator(`${SISTEMA} tbody tr`).first()).toBeVisible();
};

/** Lo que una tabla tiene por debajo de lo que enseña (0 si cabe entera). */
const sobra = (page: Page, tabla: string): Promise<number> =>
  page.locator(scroller(tabla)).evaluate((el) => el.scrollHeight - el.clientHeight);

const top = (page: Page, selector: string): Promise<number> =>
  page.locator(selector).first().evaluate((el) => Math.round(el.getBoundingClientRect().top));

test.describe('a 1366 × 768', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('la página no se mueve: la tabla del sistema hace scroll dentro y título y cabeceras se quedan', async ({ page }) => {
    await abrir(page);

    // Control: la tabla del sistema no cabe. Si cupiera, el resto no miraría nada.
    expect(await sobra(page, SISTEMA)).toBeGreaterThan(100);
    expect(await page.locator(MAIN).evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(0);
    // Las cuatro del usuario, enteras: el alto que falta lo pone la del sistema.
    expect(await sobra(page, USUARIO)).toBeLessThanOrEqual(0);

    const antes = {
      h1: await top(page, 'h1.page__heading'),
      thUsuario: await top(page, `${USUARIO} thead th`),
      thSistema: await top(page, `${SISTEMA} thead th`),
    };

    // La RUEDA sobre las filas, que es el estímulo real, y comprobando que llegó (como en Conversaciones).
    const box = await page.locator(`${SISTEMA} tbody`).boundingBox();
    if (!box) throw new Error('La tabla del sistema no tiene caja: no se puede apuntar la rueda.');
    await page.mouse.move(box.x + box.width / 2, box.y + 20);
    const scrollTabla = (): Promise<number> => page.locator(scroller(SISTEMA)).evaluate((el) => el.scrollTop);
    await expect(async () => {
      if ((await scrollTabla()) < 100) await page.mouse.wheel(0, 400);
      expect(await scrollTabla()).toBeGreaterThan(100);
    }).toPass({ timeout: 10_000 });

    expect(await page.locator(MAIN).evaluate((el) => el.scrollTop)).toBe(0);
    expect(await top(page, 'h1.page__heading')).toBe(antes.h1);
    expect(await top(page, `${USUARIO} thead th`)).toBe(antes.thUsuario);
    expect(await top(page, `${SISTEMA} thead th`)).toBe(antes.thSistema);
  });
});

test.describe('a 1366 × 600, donde no caben ni las cuatro del usuario', () => {
  test.use({ viewport: { width: 1366, height: 600 } });

  test('la del sistema se queda en su mínimo y la del usuario hace scroll con el resto', async ({ page }) => {
    await abrir(page);

    // Control: las dos tablas tienen filas por debajo.
    expect(await sobra(page, USUARIO)).toBeGreaterThan(20);
    expect(await sobra(page, SISTEMA)).toBeGreaterThan(20);

    const sistema = await page
      .locator('.entities-section--system')
      .evaluate((el) => ({ alto: el.getBoundingClientRect().height, minimo: parseFloat(getComputedStyle(el).minHeight) }));
    // Control: el mínimo existe. Sin él, la sección podría quedarse en nada y el «igual que su mínimo» no diría nada.
    expect(sistema.minimo).toBeGreaterThan(100);
    expect(Math.abs(sistema.alto - sistema.minimo)).toBeLessThan(1);
    expect(await page.locator(MAIN).evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(0);
  });
});

test.describe('a 1440 × 1300, donde caben las dos', () => {
  test.use({ viewport: { width: 1440, height: 1300 } });

  test('cada tarjeta acaba en su última fila, sin hueco ni scroll', async ({ page }) => {
    await abrir(page);

    for (const tabla of [USUARIO, SISTEMA]) {
      expect(await sobra(page, tabla)).toBeLessThanOrEqual(0);
      const hueco = await page.locator(tabla).evaluate((t) => {
        const card = t.closest('.table-card')!;
        const filas = t.querySelectorAll('tbody tr');
        return card.getBoundingClientRect().bottom - filas[filas.length - 1]!.getBoundingClientRect().bottom;
      });
      // Solo el borde de la tarjeta bajo la última fila.
      expect(hueco).toBeLessThan(3);
    }
  });
});

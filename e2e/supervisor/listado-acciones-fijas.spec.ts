import { expect, test, type Locator, type Page } from '@playwright/test';
import { disableAnimations, forceDarkTheme, forceLightTheme, goto } from './helpers';

/** F: las acciones siguen alcanzables aunque se ensanche una columna o cambie el scroll. */
test.use({ storageState: { cookies: [], origins: [] } });
const selector = (page: Page) => page.locator('.page__columns');
const primeraFila = (page: Page) => page.getByTestId('groups-table').locator('tbody tr').first();

async function cabeEnTabla(control: Locator) {
  return control.evaluate((el) => {
    const tabla = el.closest('sc-datatable')!.getBoundingClientRect();
    const caja = el.getBoundingClientRect();
    const centro = document.elementFromPoint(caja.x + caja.width / 2, caja.y + caja.height / 2);
    return caja.left >= tabla.left && caja.right <= tabla.right + 1 && !!centro && el.contains(centro);
  });
}

test('Columnas es un icono con conteo accesible, conserva selección y teclado', async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
  await goto(page, 'admin/grupos');
  const control = selector(page).getByRole('combobox');
  await expect(control).toHaveAccessibleName('Columnas, 8 de 10');
  await expect(selector(page).locator('sc-icon')).toHaveText('view_column');
  expect(await selector(page).evaluate(el => el.getBoundingClientRect().width)).toBeLessThan(45);
  await control.press('ArrowDown');
  await page.getByRole('option', { name: 'ID', exact: true }).click();
  await expect(control).toHaveAccessibleName('Columnas, 9 de 10');
  await control.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await page.reload();
  await expect(selector(page).getByRole('combobox')).toHaveAccessibleName('Columnas, 9 de 10');
  await expect(page.locator('thead th[data-field="code"]')).toBeVisible();
});

for (const oscuro of [false, true]) {
  test(`Asignar y menú fijos con ID, ancho arrastrado y fondos opacos · ${oscuro ? 'oscuro' : 'claro'}`, async ({ page }) => {
    await (oscuro ? forceDarkTheme : forceLightTheme)(page);
    await disableAnimations(page);
    await page.setViewportSize({ width: 1366, height: 768 });
    await goto(page, 'admin/grupos');
    await selector(page).locator('.p-multiselect').click();
    await page.getByRole('option', { name: 'ID', exact: true }).click();
    await page.keyboard.press('Escape');
    const cabecera = page.locator('th[data-field="code"]');
    const tirador = await cabecera.locator('.p-datatable-column-resizer').boundingBox();
    expect(tirador).not.toBeNull();
    await page.mouse.move(tirador!.x + tirador!.width / 2, tirador!.y + tirador!.height / 2);
    await page.mouse.down();
    await page.mouse.move(tirador!.x + 45, tirador!.y + tirador!.height / 2, { steps: 12 });
    await page.mouse.up();
    expect(await cabecera.evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(125);
    await page.evaluate(() => document.fonts.ready);
    const fila = primeraFila(page);
    const asignar = fila.getByRole('button', { name: /^Asignar/ });
    const menu = fila.locator('.rules-kebab-btn button');
    await expect.poll(() => cabeEnTabla(asignar)).toBe(true);
    await expect.poll(() => cabeEnTabla(menu)).toBe(true);
    const celda = asignar.locator('xpath=ancestor::td');
    await expect(celda).toHaveCSS('position', 'sticky');
    await expect(celda).not.toHaveCSS('box-shadow', 'none');
    for (const estado of ['normal', 'hover', 'seleccionada']) {
      if (estado === 'hover') await asignar.hover();
      if (estado === 'seleccionada') await fila.locator('p-table-checkbox').click();
      const fondos = await celda.evaluate(el => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const css = getComputedStyle(el).backgroundColor;
        ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1);
        return { alpha: ctx.getImageData(0, 0, 1, 1).data[3], celda: css, fila: getComputedStyle(el.parentElement!).backgroundColor };
      });
      expect(fondos.alpha, estado).toBe(255);
      expect(fondos.celda, estado).toBe(fondos.fila);
    }
    await asignar.click();
    await expect(page.locator('.agents-panel')).toBeVisible();
    await page.locator('.agents-panel').getByRole('button', { name: 'Cancelar', exact: true }).click();
    await menu.click();
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByTestId('groups-table').evaluate(host => {
      const scroll = [...host.querySelectorAll<HTMLElement>('*')].find(el => el.scrollWidth > el.clientWidth + 20 && ['auto', 'scroll'].includes(getComputedStyle(el).overflowX))!;
      scroll.scrollLeft = scroll.scrollWidth;
    });
    await expect(celda).toHaveCSS('box-shadow', 'none');
    await expect.poll(() => cabeEnTabla(menu)).toBe(true);
  });
}

test('el menú también queda fijo en Agentes, con lista virtual', async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
  await page.setViewportSize({ width: 1024, height: 900 });
  await goto(page, 'admin/agentes');
  const menu = page.locator('tbody tr').first().locator('.rules-kebab-btn button');
  await expect.poll(() => cabeEnTabla(menu)).toBe(true);
  await expect(menu.locator('xpath=ancestor::td')).toHaveCSS('position', 'sticky');
  await menu.click();
  await expect(page.getByRole('menu')).toBeVisible();
});

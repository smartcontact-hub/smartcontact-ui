import { expect, test, type Page } from '@playwright/test';

/**
 * CusCare · navegación y gestos.
 *
 * Estos tests CONDUCEN la app (clics reales con hit-testing), no consultan el
 * DOM: comprueban que cada ruta del sidebar y del engranaje llega a su vista,
 * que el item activo se marca, y que las pestañas del detalle conmutan.
 *
 * Además fijan tres cosas MEDIDAS del sitio real que son fáciles de romper sin
 * darse cuenta al tocar CSS (alto de fila, alto de cabecera, ruta de "Groups").
 */

const HOME = '/#/private/cuscare/tickets';

/** Espera a que el shell esté pintado antes de tocar nada. */
async function goto(page: Page, hash: string) {
  await page.goto(hash);
  await expect(page.locator('.nav__item').first()).toBeVisible();
}

test.describe('sidebar', () => {
  test('los 4 items navegan a su vista', async ({ page }) => {
    await goto(page, HOME);

    const cases = [
      { label: 'Dashboard', url: /#\/private\/cuscare\/dashboard/, marker: 'Workload' },
      { label: 'Search', url: /#\/private\/cuscare\/customer/, marker: 'Select country' },
      { label: 'Manage MO in error', url: /#\/private\/cuscare\/mo-management/, marker: 'No data to show' },
      { label: 'Tickets', url: /#\/private\/cuscare\/tickets/, marker: 'New ticket' },
    ];

    for (const c of cases) {
      await page.getByRole('link', { name: c.label, exact: true }).click();
      await expect(page).toHaveURL(c.url);
      await expect(page.getByText(c.marker, { exact: false }).first()).toBeVisible();
    }
  });

  test('el item activo se marca y los demás no', async ({ page }) => {
    await goto(page, '/#/private/cuscare/dashboard');

    const active = page.locator('.nav__item.is-active');
    await expect(active).toHaveCount(1);
    await expect(active).toContainText('Dashboard');
  });

  test('el detalle de un ticket mantiene "Tickets" marcado en el nav', async ({ page }) => {
    // Regla del shell: /tickets/ticket/:id normaliza a /tickets. Si alguien
    // toca `normalize()`, esto lo caza.
    await goto(page, '/#/private/cuscare/tickets/ticket/2050567');

    await expect(page.locator('.nav__item.is-active')).toContainText('Tickets');
  });
});

test.describe('menú del engranaje', () => {
  test('se despliega, navega y se cierra al elegir', async ({ page }) => {
    await goto(page, HOME);

    // Cerrado de inicio.
    await expect(page.locator('.settingsmenu')).toHaveCount(0);

    await page.locator('.nav__gear').click();
    await expect(page.locator('.settingsmenu')).toBeVisible();
    await expect(page.locator('.settingsmenu__item')).toHaveCount(4);

    await page.getByRole('menuitem', { name: 'Users' }).click();
    await expect(page).toHaveURL(/#\/private\/cuscare\/settings\/users/);
    // Elegir cierra el menú.
    await expect(page.locator('.settingsmenu')).toHaveCount(0);
  });

  test('"Groups" va a /settings/entities, no a /settings/groups', async ({ page }) => {
    // Comprobado en la app REAL: el rótulo y la ruta no coinciden. Este test
    // existe para que nadie lo "corrija" a groups por parecer más lógico.
    await goto(page, HOME);

    await page.locator('.nav__gear').click();
    await page.getByRole('menuitem', { name: 'Groups' }).click();

    await expect(page).toHaveURL(/#\/private\/cuscare\/settings\/entities/);
    await expect(page.getByRole('columnheader', { name: 'Group Name' })).toBeVisible();
  });

  test('las 4 vistas de ajustes cargan', async ({ page }) => {
    const cases = [
      { item: 'Users', header: 'User Name' },
      { item: 'Roles', header: 'Role Name' },
      { item: 'Groups', header: 'Group Name' },
    ];

    for (const c of cases) {
      await goto(page, HOME);
      await page.locator('.nav__gear').click();
      await page.getByRole('menuitem', { name: c.item }).click();
      await expect(page.getByRole('columnheader', { name: c.header })).toBeVisible();
    }

    // Templates no es una tabla: es una lista de carpetas.
    await goto(page, HOME);
    await page.locator('.nav__gear').click();
    await page.getByRole('menuitem', { name: 'Templates' }).click();
    await expect(page.getByRole('button', { name: /Add template/ })).toBeVisible();
    await expect(page.locator('.folder')).toHaveCount(4);
  });
});

test.describe('detalle de ticket', () => {
  test('las pestañas conmutan el contenido', async ({ page }) => {
    await goto(page, '/#/private/cuscare/tickets/ticket/2050567');

    // History es la de inicio y trae el timeline.
    await expect(page.locator('.timeline__row')).toHaveCount(5);

    await page.getByRole('tab', { name: /Notes/ }).click();
    await expect(page.locator('.timeline__row')).toHaveCount(0);
    await expect(page.getByText('Sin notas.')).toBeVisible();

    await page.getByRole('tab', { name: /Attached files/ }).click();
    await expect(page.getByText('Sin ficheros adjuntos.')).toBeVisible();

    await page.getByRole('tab', { name: /History ticket/ }).click();
    await expect(page.locator('.timeline__row')).toHaveCount(5);
  });

  test('se llega al detalle clicando el ID en la lista', async ({ page }) => {
    await goto(page, HOME);

    await page.getByRole('link', { name: '2050567' }).click();
    await expect(page).toHaveURL(/tickets\/ticket\/2050567/);
    await expect(page.getByText('#2050567').first()).toBeVisible();
  });
});

test.describe('métrica medida del sitio real', () => {
  // Estas tres cifras salen de medir el original con getComputedStyle. Van aquí
  // porque un retoque de CSS las rompe en silencio y el ojo no lo cazaría.

  test('la fila de Tickets mide 47.5px y la cabecera 41.5px', async ({ page }) => {
    await goto(page, HOME);

    const head = await page.locator('.cc-table thead tr').first().locator('th').nth(1).boundingBox();
    const row = await page.locator('.cc-table tbody tr').nth(1).boundingBox();

    expect(head?.height).toBeCloseTo(41.5, 0);
    expect(row?.height).toBeCloseTo(47.5, 0);
  });

  test('las tablas de ajustes miden 32.7px de fila (Material, no PrimeNG)', async ({ page }) => {
    await goto(page, '/#/private/cuscare/settings/users');

    const row = await page.locator('.mattable tbody tr').first().boundingBox();
    expect(row?.height).toBeCloseTo(32.7, 0);
  });

  test('el sidebar mide 90.3px y el lienzo es #f4f6fc', async ({ page }) => {
    await goto(page, HOME);

    const nav = await page.locator('.nav').boundingBox();
    expect(nav?.width).toBeCloseTo(90.3, 0);

    const canvasBg = await page
      .locator('.content-main')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(canvasBg).toBe('rgb(244, 246, 252)');
  });
});

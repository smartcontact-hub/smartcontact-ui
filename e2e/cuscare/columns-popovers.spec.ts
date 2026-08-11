import { expect, test, type Page } from '@playwright/test';

/**
 * CusCare · "Manage columns" y popovers de filtro.
 *
 * Los dos se capturaron abriéndolos en la app real, y los dos resultaron ser
 * más de lo que aparentaban:
 *   · el icono de la izquierda abre un panel con las 18 columnas, cada una con
 *     casilla y asa de arrastre, más "Reset to default"
 *   · el botón "Filter" NO abre un simple campo: trae tres modos apilados
 *     (All / New / Update) y debajo el input
 */

const TICKETS = '/#/private/cuscare/tickets';

async function goto(page: Page) {
  await page.goto(TICKETS);
  await expect(page.locator('.cc-table tbody tr').first()).toBeVisible();
}

test.describe('Manage columns', () => {
  test('abre con las 18 columnas, todas marcadas', async ({ page }) => {
    await goto(page);

    await page.getByRole('button', { name: 'Manage columns' }).click();
    const panel = page.getByRole('dialog', { name: 'Manage columns' });

    await expect(panel).toBeVisible();
    await expect(panel.getByRole('checkbox')).toHaveCount(18);
    for (const cb of await panel.getByRole('checkbox').all()) {
      await expect(cb).toBeChecked();
    }
    await expect(panel.getByRole('button', { name: 'Reset to default' })).toBeVisible();
  });

  test('desmarcar una columna la quita de la tabla', async ({ page }) => {
    await goto(page);
    await expect(page.getByRole('columnheader', { name: 'Carrier', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Manage columns' }).click();
    await page.getByLabel('Mostrar columna Carrier').uncheck();

    await expect(page.getByRole('columnheader', { name: 'Carrier', exact: true })).toHaveCount(0);
    // Las demás siguen.
    await expect(page.getByRole('columnheader', { name: 'Status', exact: true })).toBeVisible();
  });

  test('"Reset to default" devuelve todas las columnas', async ({ page }) => {
    await goto(page);

    await page.getByRole('button', { name: 'Manage columns' }).click();
    await page.getByLabel('Mostrar columna Carrier').uncheck();
    await page.getByLabel('Mostrar columna Email').uncheck();
    await expect(page.getByRole('columnheader', { name: 'Carrier', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Reset to default' }).click();

    await expect(page.getByRole('columnheader', { name: 'Carrier', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email', exact: true })).toBeVisible();
  });

  test('cada columna trae su asa de arrastre (reordenable en el original)', async ({ page }) => {
    await goto(page);
    await page.getByRole('button', { name: 'Manage columns' }).click();

    const panel = page.getByRole('dialog', { name: 'Manage columns' });
    await expect(panel.locator('.colitem__drag')).toHaveCount(18);
  });
});

test.describe('popover de filtro', () => {
  test('trae los tres modos con "All" activo, y el campo', async ({ page }) => {
    await goto(page);

    // El primer "Filter" es el de la columna ID.
    await page.getByRole('button', { name: 'Filter', exact: true }).first().click();

    const pop = page.locator('.popfilter');
    await expect(pop).toBeVisible();
    await expect(pop.getByRole('button')).toHaveCount(3);
    await expect(pop.getByRole('button', { name: 'All' })).toHaveClass(/is-active/);
    await expect(pop.getByRole('button', { name: 'New' })).not.toHaveClass(/is-active/);
    await expect(pop.getByLabel('Filtrar por ID')).toBeVisible();
  });

  test('cambiar de modo mueve el resaltado', async ({ page }) => {
    await goto(page);
    await page.getByRole('button', { name: 'Filter', exact: true }).first().click();

    const pop = page.locator('.popfilter');
    await pop.getByRole('button', { name: 'Update' }).click();

    await expect(pop.getByRole('button', { name: 'Update' })).toHaveClass(/is-active/);
    await expect(pop.getByRole('button', { name: 'All' })).not.toHaveClass(/is-active/);
  });

  test('el campo del popover filtra la tabla', async ({ page }) => {
    await goto(page);
    const antes = await page.locator('.tickets__count').innerText();

    await page.getByRole('button', { name: 'Filter', exact: true }).first().click();
    await page.locator('.popfilter').getByLabel('Filtrar por ID').fill('2050');

    await expect(page.locator('.tickets__count')).not.toHaveText(antes);
    await expect(page.getByRole('button', { name: /Delete filters/ })).toBeEnabled();
  });
});

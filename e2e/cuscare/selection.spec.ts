import { expect, test, type Page } from '@playwright/test';

/**
 * CusCare · selección de filas y acciones en bloque.
 *
 * Comportamiento MEDIDO en la app real y que no estaba replicado: la selección
 * cambia la barra de herramientas. Sin filas marcadas las 4 acciones están
 * deshabilitadas; al marcar, se habilitan y aparecen "Clear selection" y
 * "Download (N)" con el contador. La fila marcada se pinta de #eef1f6.
 */

const TICKETS = '/#/private/cuscare/tickets';

async function goto(page: Page) {
  await page.goto(TICKETS);
  await expect(page.locator('.cc-table tbody tr').first()).toBeVisible();
}

/** Checkbox de una fila NO bloqueada (la bloqueada muestra candado, no check). */
const rowChecks = (page: Page) => page.locator('.cc-table tbody .cc-check');

test('sin selección: las 4 acciones están deshabilitadas', async ({ page }) => {
  await goto(page);

  for (const a of ['Assign', 'Change status', 'Unsubscribe', 'Archive']) {
    await expect(page.getByRole('button', { name: a, exact: true })).toBeDisabled();
  }
  await expect(page.getByRole('button', { name: /Clear selection/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Download/ })).toHaveCount(0);
});

test('marcar una fila habilita las acciones y saca Clear selection + Download (1)', async ({
  page,
}) => {
  await goto(page);

  await rowChecks(page).first().check();

  for (const a of ['Assign', 'Change status', 'Unsubscribe', 'Archive']) {
    await expect(page.getByRole('button', { name: a, exact: true })).toBeEnabled();
  }
  await expect(page.getByRole('button', { name: /Clear selection/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download (1)' })).toBeVisible();
});

test('el contador de Download sigue a la selección', async ({ page }) => {
  await goto(page);

  await rowChecks(page).nth(0).check();
  await expect(page.getByRole('button', { name: 'Download (1)' })).toBeVisible();

  await rowChecks(page).nth(1).check();
  await expect(page.getByRole('button', { name: 'Download (2)' })).toBeVisible();

  // Desmarcar vuelve a bajar.
  await rowChecks(page).nth(1).uncheck();
  await expect(page.getByRole('button', { name: 'Download (1)' })).toBeVisible();
});

test('la fila marcada se resalta', async ({ page }) => {
  await goto(page);

  const firstRow = page.locator('.cc-table tbody tr').first();
  await expect(firstRow).not.toHaveClass(/row-selected/);

  await rowChecks(page).first().check();
  await expect(page.locator('.cc-table tbody tr.row-selected')).toHaveCount(1);
});

test('el checkbox de cabecera marca y desmarca la página visible', async ({ page }) => {
  await goto(page);

  const total = await rowChecks(page).count();
  await page.getByLabel('Seleccionar todo').check();
  await expect(page.getByRole('button', { name: `Download (${total})` })).toBeVisible();

  await page.getByLabel('Seleccionar todo').uncheck();
  await expect(page.getByRole('button', { name: /Download/ })).toHaveCount(0);
});

test('"Clear selection" limpia y devuelve la barra a su estado inicial', async ({ page }) => {
  await goto(page);

  await rowChecks(page).first().check();
  await expect(page.getByRole('button', { name: /Clear selection/ })).toBeVisible();

  await page.getByRole('button', { name: /Clear selection/ }).click();

  await expect(page.getByRole('button', { name: /Clear selection/ })).toHaveCount(0);
  await expect(page.locator('.cc-table tbody tr.row-selected')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Assign', exact: true })).toBeDisabled();
});

test('la selección sobrevive al cambio de página', async ({ page }) => {
  await goto(page);

  await rowChecks(page).first().check();
  await page.getByRole('button', { name: 'Página 2', exact: true }).click();
  await expect(page.locator('.tickets__count')).toContainText('11–20');

  // Sigue contando la de la página 1: se selecciona el TICKET, no la casilla.
  await expect(page.getByRole('button', { name: 'Download (1)' })).toBeVisible();
});

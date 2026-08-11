import { expect, test, type Page } from '@playwright/test';

/**
 * CusCare · modal de "+ New ticket".
 *
 * Ojo con lo que este modal ES: abrirlo en la app real destapó que **no** es un
 * formulario de ticket, sino un selector de GRUPO ("Select a group for this
 * ticket" + buscador + radios + Cancel/Save). Se replica eso; el formulario del
 * paso siguiente no se capturó porque llegar a él exige pulsar Save, y eso crea
 * un ticket de verdad en su sistema.
 */

const TICKETS = '/#/private/cuscare/tickets';

async function openModal(page: Page) {
  await page.goto(TICKETS);
  await page.getByRole('button', { name: '+ New ticket' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('abre con el título y los grupos del original', async ({ page }) => {
  await openModal(page);
  // Se acota al diálogo: los nombres de grupo salen TAMBIÉN en la tabla de
  // detrás (10 coincidencias sin acotar), así que sin esto el selector es
  // ambiguo y el test falla por su propia imprecisión.
  const dialog = page.getByRole('dialog');

  await expect(dialog.getByText('Select a group for this ticket')).toBeVisible();
  await expect(dialog.getByPlaceholder('Search...')).toBeVisible();
  await expect(dialog.getByRole('radio')).toHaveCount(2);
  await expect(dialog.getByText('ES - DOD')).toBeVisible();
  await expect(dialog.getByText('SK - Cuscare')).toBeVisible();
});

test('Save arranca deshabilitado y se habilita al elegir grupo', async ({ page }) => {
  await openModal(page);

  const save = page.getByRole('button', { name: 'Save' });
  await expect(save).toBeDisabled();

  await page.getByRole('radio').first().check();
  await expect(save).toBeEnabled();
});

test('el buscador del modal filtra los grupos', async ({ page }) => {
  await openModal(page);
  const dialog = page.getByRole('dialog');

  await dialog.getByPlaceholder('Search...').fill('SK');
  await expect(dialog.getByRole('radio')).toHaveCount(1);
  await expect(dialog.getByText('SK - Cuscare')).toBeVisible();

  await dialog.getByPlaceholder('Search...').fill('zzz');
  await expect(dialog.getByRole('radio')).toHaveCount(0);
  await expect(dialog.getByText(/Sin grupos/)).toBeVisible();
});

test('Cancel cierra sin dejar rastro', async ({ page }) => {
  await openModal(page);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('clicar el fondo cierra, clicar el diálogo no', async ({ page }) => {
  await openModal(page);

  // Dentro del diálogo: NO debe cerrar.
  await page.getByText('Select a group for this ticket').click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // En el fondo (esquina superior izquierda, fuera del diálogo): cierra.
  await page.locator('.modal').click({ position: { x: 5, y: 5 } });
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('elegir grupo y guardar cierra el modal', async ({ page }) => {
  await openModal(page);

  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

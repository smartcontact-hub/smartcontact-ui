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

/**
 * El PASO 2, que estuvo bloqueado hasta que Rafa pulsó Save él mismo.
 *
 * Y confirmó lo que se temía: **Save crea un ticket de verdad**. La app real
 * saltó a `…/tickets/ticket/2051827/pre-ticket` con el ticket ya existiendo.
 * Lo que sale NO es un formulario: es la pantalla de detalle en vacío (#0) con
 * el modal "Search customer" encima.
 */
test('guardar lleva al pre-ticket con el modal "Search customer" encima', async ({ page }) => {
  await page.goto(TICKETS);
  await page.getByRole('button', { name: '+ New ticket' }).click();

  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL(/\/tickets\/ticket\/new\/pre-ticket$/);

  const modal = page.getByRole('dialog', { name: 'Search customer' });
  await expect(modal).toBeVisible();
  await expect(page.locator('.detail__id')).toHaveText('#0');

  // Los siete criterios de búsqueda del original, en su orden.
  await expect(modal.getByLabel('Criterio de búsqueda')).toHaveValue('Msisdn');
  await expect(modal.getByLabel('Criterio de búsqueda').locator('option')).toHaveText([
    'Msisdn',
    'Alias',
    'Email',
    'Accountid',
    'Externalid',
    'Operationid',
    'Cardlast4',
  ]);

  // Cerrarlo deja el pre-ticket a la vista, no devuelve a la lista.
  await modal.getByRole('button', { name: 'Cancel' }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.locator('.detail__id')).toHaveText('#0');
});

test('elegir grupo y guardar cierra el SELECTOR DE GRUPO', async ({ page }) => {
  await openModal(page);

  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Save' }).click();

  // Ojo: antes esto comprobaba que no quedaba NINGÚN diálogo, y describía una
  // réplica incompleta. Guardar cierra el selector de grupo pero abre el de
  // "Search customer" — es el paso 2, no el final del flujo.
  await expect(
    page.getByRole('dialog', { name: 'Select a group for this ticket' }),
  ).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Search customer' })).toBeVisible();
});

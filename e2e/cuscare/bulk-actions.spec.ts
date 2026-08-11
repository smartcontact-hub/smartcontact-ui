import { expect, test, type Page } from '@playwright/test';

/**
 * CusCare · las CUATRO acciones en bloque y su modal de confirmación.
 *
 * Extraído de la app real leyendo el DOM, sin ejecutar ninguna acción sobre
 * ningún ticket: los paneles y los modales viven ocultos en el árbol desde el
 * arranque, así que se pudieron medir sin pulsar nada. Lo que hay que blindar
 * aquí es justo lo que sorprendió al mirar:
 *
 *   · los cuatro botones NO abren la misma cosa
 *   · "Archive" no abre panel: va directo al modal
 *   · el desplegable de estado tiene DOS opciones (no las cuatro de la columna)
 *   · el panel es oscuro, y el desplegable que va dentro es claro
 */

const TICKETS = '/#/private/cuscare/tickets';

async function gotoConSeleccion(page: Page) {
  await page.goto(TICKETS);
  await expect(page.locator('.cc-table tbody tr').first()).toBeVisible();
  await page.locator('.cc-table tbody .cc-check').first().check();
}

const trigger = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test.describe('paneles', () => {
  test('Assign: buscador + 34 agentes + su botón', async ({ page }) => {
    await gotoConSeleccion(page);
    await trigger(page, 'Assign').click();

    const panel = page.getByRole('dialog', { name: 'Assign' });
    await expect(panel).toBeVisible();
    await expect(panel.getByPlaceholder('Search')).toBeVisible();
    await expect(panel.getByText('Agentes')).toBeVisible();
    await expect(panel.locator('.panel__item')).toHaveCount(34);
  });

  test('Assign: el buscador filtra de verdad y el botón se habilita al elegir', async ({ page }) => {
    await gotoConSeleccion(page);
    await trigger(page, 'Assign').click();

    const panel = page.getByRole('dialog', { name: 'Assign' });
    const cta = panel.getByRole('button', { name: 'Assign' });
    await expect(cta).toBeDisabled();

    await panel.getByPlaceholder('Search').fill('TECH');
    const items = panel.locator('.panel__item');
    await expect(items.first()).toBeVisible();
    const n = await items.count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(34);

    await items.first().click();
    await expect(cta).toBeEnabled();
  });

  test('Change status ofrece SOLO Pending y Resolved, más el enlace Spam', async ({ page }) => {
    await gotoConSeleccion(page);
    await trigger(page, 'Change status').click();

    const panel = page.getByRole('dialog', { name: 'Change status' });
    await expect(panel.getByText('Spam')).toBeVisible();

    await panel.locator('.cselect').click();
    await expect(panel.locator('.cselect__option')).toHaveText(['Pending', 'Resolved']);
  });

  test('Unsubscribe trae un único radio, ya marcado', async ({ page }) => {
    await gotoConSeleccion(page);
    await trigger(page, 'Unsubscribe').click();

    const panel = page.getByRole('dialog', { name: 'Unsubscribe' });
    const radio = panel.getByRole('radio');
    await expect(radio).toHaveCount(1);
    await expect(radio).toBeChecked();
    await expect(panel.getByText('Unsubscribe all products')).toBeVisible();
  });

  test('abrir un panel cierra el anterior', async ({ page }) => {
    await gotoConSeleccion(page);

    await trigger(page, 'Assign').click();
    await expect(page.getByRole('dialog', { name: 'Assign' })).toBeVisible();

    await trigger(page, 'Unsubscribe').click();
    await expect(page.getByRole('dialog', { name: 'Assign' })).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Unsubscribe' })).toBeVisible();
  });

  test('sin selección no se abre ningún panel', async ({ page }) => {
    await page.goto(TICKETS);
    await expect(page.locator('.cc-table tbody tr').first()).toBeVisible();

    await expect(trigger(page, 'Assign')).toBeDisabled();
    await expect(page.locator('.panel')).toHaveCount(0);
  });
});

test.describe('modal de confirmación', () => {
  test('Archive NO abre panel: va directo al modal', async ({ page }) => {
    await gotoConSeleccion(page);
    await trigger(page, 'Archive').click();

    await expect(page.locator('.panel')).toHaveCount(0);
    const modal = page.getByRole('dialog', { name: 'Archive' });
    await expect(modal).toBeVisible();
    await expect(modal.getByText('You will archive the following 1 tickets')).toBeVisible();
  });

  test('el modal lista los tickets marcados en una tabla de 8 columnas', async ({ page }) => {
    await gotoConSeleccion(page);
    await page.locator('.cc-table tbody .cc-check').nth(1).check();
    await trigger(page, 'Archive').click();

    const modal = page.getByRole('dialog', { name: 'Archive' });
    await expect(modal.getByText('You will archive the following 2 tickets')).toBeVisible();
    await expect(modal.locator('thead th')).toHaveText([
      'Id',
      'Created at',
      'Service',
      'Assign',
      'Group',
      'Status',
      'Channel',
      'Description',
    ]);
    await expect(modal.locator('tbody tr')).toHaveCount(2);
  });

  test('el subtítulo cambia con la acción', async ({ page }) => {
    await gotoConSeleccion(page);

    await trigger(page, 'Change status').click();
    await page.locator('.cselect').click();
    await page.locator('.cselect__option', { hasText: 'Resolved' }).click();
    await page.getByRole('button', { name: 'Accept' }).click();

    const modal = page.getByRole('dialog', { name: 'Change status' });
    // Termina con el DESTINO elegido, no colgando en "to": lo delató la clave
    // del diccionario real ("… tickets to {{name}}").
    await expect(
      modal.getByText('You will change the status of the next 1 tickets to Resolved'),
    ).toBeVisible();
  });

  test('Cancel cierra sin tocar la selección; confirmar la limpia', async ({ page }) => {
    await gotoConSeleccion(page);

    await trigger(page, 'Archive').click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog', { name: 'Archive' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Download (1)' })).toBeVisible();

    await trigger(page, 'Archive').click();
    await page.getByRole('dialog', { name: 'Archive' }).getByRole('button', { name: 'Archive' }).click();
    await expect(page.getByRole('dialog', { name: 'Archive' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Download/ })).toHaveCount(0);
  });
});

test('"Delete filters" NO existe hasta que hay un filtro puesto', async ({ page }) => {
  await page.goto(TICKETS);
  await expect(page.locator('.cc-table tbody tr').first()).toBeVisible();

  await expect(page.getByRole('button', { name: /Delete filters/ })).toHaveCount(0);

  // Un filtro de texto cualquiera lo hace aparecer.
  await page.locator('.cc-table thead input[type="text"]').first().fill('2050');
  await expect(page.getByRole('button', { name: /Delete filters/ })).toBeVisible();

  await page.getByRole('button', { name: /Delete filters/ }).click();
  await expect(page.getByRole('button', { name: /Delete filters/ })).toHaveCount(0);
});

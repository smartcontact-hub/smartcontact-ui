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
    await page.getByLabel('Show column Carrier').uncheck();

    await expect(page.getByRole('columnheader', { name: 'Carrier', exact: true })).toHaveCount(0);
    // Las demás siguen.
    await expect(page.getByRole('columnheader', { name: 'Status', exact: true })).toBeVisible();
  });

  test('"Reset to default" devuelve todas las columnas', async ({ page }) => {
    await goto(page);

    await page.getByRole('button', { name: 'Manage columns' }).click();
    await page.getByLabel('Show column Carrier').uncheck();
    await page.getByLabel('Show column Email').uncheck();
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

  test('arrastrar una columna reordena la TABLA, no solo el panel', async ({ page }) => {
    await goto(page);

    // Orden de partida en la tabla (se salta la columna de selección).
    const headersAntes = await page.locator('.cc-table thead tr').first().locator('th').allInnerTexts();
    expect(headersAntes[1].trim()).toBe('ID');
    expect(headersAntes[2].trim()).toBe('Status');

    await page.getByRole('button', { name: 'Manage columns' }).click();
    const panel = page.getByRole('dialog', { name: 'Manage columns' });
    const handles = panel.locator('.colitem__drag');

    // Arrastre REAL por el asa: pasos intermedios para que el CDK lo registre
    // (un solo salto no dispara el reordenado).
    const origen = await handles.nth(0).boundingBox();
    const destino = await handles.nth(2).boundingBox();
    if (!origen || !destino) throw new Error('No se pudieron medir las asas');

    await page.mouse.move(origen.x + origen.width / 2, origen.y + origen.height / 2);
    await page.mouse.down();
    await page.mouse.move(destino.x + destino.width / 2, destino.y + destino.height / 2, {
      steps: 12,
    });
    await page.mouse.up();
    // El CDK anima la vuelta: medir antes da lecturas a medias (lo aprendí
    // diagnosticando esto — sin la espera parecía que se perdía una columna).
    await page.waitForTimeout(600);

    // La tabla refleja el nuevo orden: ID ya no es la primera.
    const th = page.locator('.cc-table thead tr').first().locator('th');
    await expect(th.nth(1)).not.toHaveText('ID');
    // Y sigue habiendo 18 columnas: reordenar no pierde ninguna.
    await expect(th).toHaveCount(headersAntes.length);
  });

  test('"Reset to default" deshace también el reordenado', async ({ page }) => {
    await goto(page);
    await page.getByRole('button', { name: 'Manage columns' }).click();
    const panel = page.getByRole('dialog', { name: 'Manage columns' });
    const handles = panel.locator('.colitem__drag');

    const origen = await handles.nth(0).boundingBox();
    const destino = await handles.nth(2).boundingBox();
    if (!origen || !destino) throw new Error('No se pudieron medir las asas');

    await page.mouse.move(origen.x + origen.width / 2, origen.y + origen.height / 2);
    await page.mouse.down();
    await page.mouse.move(destino.x + destino.width / 2, destino.y + destino.height / 2, {
      steps: 12,
    });
    await page.mouse.up();
    // El CDK anima la vuelta: medir antes da lecturas a medias (lo aprendí
    // diagnosticando esto — sin la espera parecía que se perdía una columna).
    await page.waitForTimeout(600);

    await page.getByRole('button', { name: 'Reset to default' }).click();

    // Aserciones que REINTENTAN: `allInnerTexts()` es una lectura única y
    // capturaba el estado anterior al repintado de Angular.
    const th = page.locator('.cc-table thead tr').first().locator('th');
    await expect(th.nth(1)).toHaveText('ID');
    await expect(th.nth(2)).toHaveText('Status');
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
    await expect(pop.getByLabel('Filter by ID')).toBeVisible();
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
    await page.locator('.popfilter').getByLabel('Filter by ID').fill('2050');

    await expect(page.locator('.tickets__count')).not.toHaveText(antes);
    await expect(page.getByRole('button', { name: /Delete filters/ })).toBeEnabled();
  });
});

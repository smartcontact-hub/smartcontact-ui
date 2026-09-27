import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL PANEL RÁPIDO DE AGENTES, desde el listado de grupos (visión de producto de grupos, 2026-09-25;
 * DD-121). Asignar y desasignar agentes es lo que más se hace con un grupo una vez creado, así que
 * está a un clic de la fila, con la MISMA tabla que la ficha.
 *
 * Lo que fija:
 *   1. «Agentes» abre el panel de ESA fila sin abrir la ficha, y dentro no se eligen filas (la barra
 *      de lote quedaría debajo de la máscara).
 *   2. Guardar dice cuántos AGENTES cambian, y al guardar la cifra de la fila se pone al día.
 *   3. Cerrar con cambios pregunta antes (con Cancelar y con Escape): el cierre de `p-drawer` no se
 *      puede vetar, así que lo gobierna el panel.
 *
 * Storage limpio por test → cada store de admin re-siembra su seed.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const abrirPanel = async (page: Page, grupo: string): Promise<void> => {
  await page.getByRole('button', { name: `Asignar agentes de ${grupo}` }).click();
  await expect(page.locator('.agents-panel')).toBeVisible();
};
const panel = (page: Page) => page.locator('.agents-panel');
const cifraDeAgentes = (page: Page, grupo: string) =>
  page.locator('tbody tr', { hasText: grupo }).locator('sc-group-popover').last();

test('«Agentes» abre el panel de esa fila sin abrir la ficha, y dentro no se eligen filas', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await abrirPanel(page, 'Reclamaciones');

  await expect(page.getByText('Agentes · Reclamaciones')).toBeVisible();
  await expect(page).toHaveURL(/admin\/grupos$/);
  // Las columnas son los canales del grupo, y no hay casilla de elegir filas.
  await expect(panel(page).getByRole('columnheader', { name: 'WhatsApp' })).toHaveCount(1);
  await expect(panel(page).locator('thead input[type=checkbox]')).toHaveCount(0);
  await expect(panel(page).getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

test('guardar dice cuántos agentes cambian, y la cifra de la fila se pone al día', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const antes = Number((await cifraDeAgentes(page, 'ACD Demo C2CB').innerText()).trim());
  await abrirPanel(page, 'ACD Demo C2CB');

  await panel(page).locator('tbody tr').first().getByRole('button', { name: /^Quitar a / }).click();
  await expect(panel(page).getByText('Sin guardar: 1')).toBeVisible();
  await panel(page).getByRole('button', { name: 'Guardar (1)' }).click();

  await expect(page.getByText('Agentes de "ACD Demo C2CB" actualizados')).toBeVisible();
  await expect(panel(page)).toHaveCount(0);
  await expect(cifraDeAgentes(page, 'ACD Demo C2CB')).toHaveText(String(antes - 1));
});

test('cerrar con cambios pregunta antes, con Cancelar y con Escape, y descartar no guarda', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const antes = (await cifraDeAgentes(page, 'ACD Demo C2CB').innerText()).trim();
  await abrirPanel(page, 'ACD Demo C2CB');
  await panel(page).locator('tbody tr').first().getByRole('button', { name: /^Quitar a / }).click();

  const aviso = page.getByRole('dialog', { name: '¿Descartar cambios?' });
  await panel(page).getByRole('button', { name: 'Cancelar' }).click();
  await expect(aviso).toBeVisible();
  await aviso.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(panel(page).getByRole('button', { name: 'Guardar (1)' })).toBeVisible();

  // Escape entra por la misma puerta.
  await panel(page).getByRole('button', { name: 'Guardar (1)' }).focus();
  await page.keyboard.press('Escape');
  await expect(aviso).toBeVisible();
  await aviso.getByRole('button', { name: 'Descartar' }).click();

  await expect(panel(page)).toHaveCount(0);
  await expect(cifraDeAgentes(page, 'ACD Demo C2CB')).toHaveText(antes);
});

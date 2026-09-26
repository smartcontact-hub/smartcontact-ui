import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL LISTADO DE GRUPOS HABLA COMO SU FICHA (visión de producto de grupos, 2026-09-25; DD-121): cada
 * familia de canales reparte con su estrategia.
 *
 * Lo que fija:
 *   1. Una columna por estrategia, la de Teléfono y la de Chat (la de Chat no salía nunca), y «—» en la
 *      de un canal que el grupo no tiene (antes enseñaba una estrategia de teléfono que no aplicaba).
 *   2. Cambiar en bloque la estrategia de Chat escribe la de CHAT (antes, la de teléfono), y solo en los
 *      grupos elegidos que tienen Chat.
 *   3. Prioridad ordena por rango, de Baja a Máxima (antes, alfabético: Alta < Baja < Máxima < Media).
 *
 * Storage limpio por test → cada store de admin re-siembra su seed.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const fila = (page: Page, grupo: string) => page.locator('tbody tr', { hasText: grupo });

/** El índice de una columna por su cabecera: sale de la tabla, no de un número clavado. */
const columna = async (page: Page, cabecera: string): Promise<number> => {
  const cabeceras = await page.locator('thead th').allInnerTexts();
  const i = cabeceras.findIndex((texto) => texto.trim().startsWith(cabecera));
  expect(i, `no hay columna «${cabecera}»: ${cabeceras.join(' | ')}`).toBeGreaterThanOrEqual(0);
  return i;
};

const celda = async (page: Page, grupo: string, cabecera: string) =>
  fila(page, grupo).locator('td').nth(await columna(page, cabecera));

test('cada familia de canales enseña su estrategia en su columna, y «—» donde el grupo no tiene el canal', async ({
  page,
}) => {
  await goto(page, 'admin/grupos');
  await expect(await celda(page, 'Online Support', 'Estrategia de teléfono')).toHaveText('Balanceada');
  await expect(await celda(page, 'Online Support', 'Estrategia de chat')).toHaveText('Menos chats activos');
  await expect(await celda(page, 'ACD Demo C2CB', 'Estrategia de chat')).toHaveText('—');

  // Un grupo solo de Chat: ni estrategia ni número de teléfono, aunque los guarde.
  await goto(page, 'admin/grupos/crear');
  await page.locator('#group-name').fill('Solo chat E2E');
  const general = page.locator('#group-section-general');
  await general.locator('sc-checkbox').filter({ hasText: /^\s*Teléfono\s*$/ }).click();
  await general.locator('sc-checkbox').filter({ hasText: /^\s*Chat\s*$/ }).click();
  await page.getByRole('button', { name: 'Crear grupo' }).click();
  await expect(page).toHaveURL(/admin\/grupos\/editar\/\d+/);

  await goto(page, 'admin/grupos');
  await expect(await celda(page, 'Solo chat E2E', 'Estrategia de teléfono')).toHaveText('—');
  await expect(await celda(page, 'Solo chat E2E', 'Teléfono')).toHaveText('—');
  await expect(await celda(page, 'Solo chat E2E', 'Estrategia de chat')).toHaveText('Rotativa (por turnos)');
});

test('cambiar en bloque la estrategia de chat escribe la de chat, y solo en los grupos con Chat', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await fila(page, 'Reclamaciones').locator('p-table-checkbox').click();
  await fila(page, 'Telemarketing').locator('p-table-checkbox').click();

  const lote = page.locator('sc-bulk-edit-menu');
  await lote.locator('sc-select').first().click();
  await page.getByRole('option', { name: 'Estrategia de chat', exact: true }).click();
  await lote.locator('sc-select').last().click();
  await page.getByRole('option', { name: 'Menos chats activos', exact: true }).click();
  await lote.getByRole('button', { name: 'Aplicar' }).click();

  // La vista previa solo trae al que tiene Chat: a Telemarketing (solo Teléfono) no le aplica.
  const vista = page.getByRole('dialog', { name: 'Aplicar cambio a 1 grupo(s)' });
  await expect(vista).toContainText('Reclamaciones');
  await expect(vista).not.toContainText('Telemarketing');
  await vista.getByRole('button', { name: 'Aplicar' }).click();

  await expect(await celda(page, 'Reclamaciones', 'Estrategia de chat')).toHaveText('Menos chats activos');
  await expect(await celda(page, 'Reclamaciones', 'Estrategia de teléfono')).toHaveText('Balanceada');
  await expect(await celda(page, 'Telemarketing', 'Estrategia de chat')).toHaveText('—');
});

test('Prioridad ordena de Baja a Máxima, no por orden alfabético', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await page.locator('thead th', { hasText: 'Prioridad' }).click();

  const indice = await columna(page, 'Prioridad');
  const textos = await page.locator('tbody tr').evaluateAll(
    (filas, i) => filas.map((f) => f.querySelectorAll('td')[i]?.textContent?.trim() ?? ''),
    indice,
  );
  const rango = ['Baja', 'Media', 'Alta', 'Máxima'];
  const rangos = textos.map((t) => rango.indexOf(t));
  expect(rangos, textos.join(', ')).not.toContain(-1);
  // En un sentido o en el otro, pero por rango (el seed tiene las cuatro).
  const subiendo = [...rangos].sort((a, b) => a - b);
  expect([subiendo.join(), [...subiendo].reverse().join()], textos.join(', ')).toContain(rangos.join());
});

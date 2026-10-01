import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL LISTADO DE GRUPOS HABLA COMO SU FICHA (visión de producto de grupos, 2026-09-25; DD-121): cada
 * familia de canales reparte con su estrategia.
 *
 * Lo que fija:
 *   1. Una columna por estrategia, la de Teléfono y la de Chat (opcional: con las dos a la vez no caben a 1440
 *      sin recortar), y «—» en la de un canal que el grupo no tiene (antes enseñaba una estrategia de teléfono
 *      que no aplicaba).
 *   2. Cambiar en bloque la estrategia de Chat escribe la de CHAT (antes, la de teléfono), y solo en los
 *      grupos elegidos que tienen Chat.
 *   3. Prioridad ordena por rango, de Baja a Máxima (antes, alfabético: Alta < Baja < Máxima < Media).
 *   4. Nada se recorta a 1440 (DD-102: una lista no recorta): ni una cabecera ni una etiqueta. Con la columna
 *      de chat encendida, la tabla se desplaza de lado en vez de cortar. Tampoco las estrategias más largas de
 *      cada catálogo (DD-141), aunque ningún grupo de la semilla las use.
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

/** Enciende una columna opcional desde el selector de columnas y lo cierra. Si ya se ve, no la toca: la lista
 *  recuerda sus columnas en `localStorage`, y un segundo clic la apagaría. */
const mostrarColumna = async (page: Page, nombre: string): Promise<void> => {
  const cabecera = page.locator('thead th', { hasText: nombre });
  await page.locator('tbody tr').first().waitFor();
  if ((await cabecera.count()) > 0) return;
  await page.locator('.page__action-bar .p-multiselect').click();
  await page
    .locator('.p-multiselect-overlay li[role="option"]')
    .filter({ hasText: new RegExp(`^\\s*${nombre}\\s*$`) })
    .click();
  await page.keyboard.press('Escape');
  await expect(cabecera).toHaveCount(1);
};

/** Lo que sale recortado en la tabla: celdas (la tabla ajustable pone `overflow: hidden` en cada una) y su
 *  contenido, con el texto más ancho que su caja. */
const recortes = async (page: Page) => {
  const tablaGrupos = page.getByTestId('groups-table');
  await tablaGrupos.waitFor();
  /* Se mide con las fuentes cargadas. Mientras carga la de iconos (`font-display: block`), el glifo de «Asignar»
   * ocupa el ancho de su nombre, «group_add», con la letra de reserva: el botón mide 146 px en su celda de 120 y el
   * recorte es de la carga, no del diseño (medido el 2026-09-28, 1 de 3 vueltas con la máquina cargada). */
  await page.evaluate(async () => {
    await document.fonts.load('14px "Material Symbols Outlined Variable"');
    await document.fonts.ready;
  });
  return tablaGrupos.evaluate((tabla) => {
    const fuera: string[] = [];
    for (const el of tabla.querySelectorAll<HTMLElement>('th, td, th *, td *')) {
      const cs = getComputedStyle(el);
      const corta = cs.overflowX !== 'visible' || cs.textOverflow === 'ellipsis';
      const texto = (el.textContent ?? '').trim();
      if (corta && texto && el.scrollWidth > el.clientWidth + 1) fuera.push(`«${texto.slice(0, 40)}» ${el.scrollWidth}>${el.clientWidth}`);
    }
    return [...new Set(fuera)];
  });
};

test('cada familia de canales enseña su estrategia en su columna, y «—» donde el grupo no tiene el canal', async ({
  page,
}) => {
  await goto(page, 'admin/grupos');
  await mostrarColumna(page, 'Estrategia de chat');
  await expect(await celda(page, 'Online Support', 'Estrategia de teléfono')).toHaveText('Balanceada');
  await expect(await celda(page, 'Online Support', 'Estrategia de chat')).toHaveText('Menos conversaciones activas');
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
  await mostrarColumna(page, 'Estrategia de chat');
  await expect(await celda(page, 'Solo chat E2E', 'Estrategia de teléfono')).toHaveText('—');
  await expect(await celda(page, 'Solo chat E2E', 'Teléfono')).toHaveText('—');
  // Nace con la de Contact Center › Grupos, que de fábrica es Balanceada (DD-135).
  await expect(await celda(page, 'Solo chat E2E', 'Estrategia de chat')).toHaveText('Balanceada');
});

test('cambiar en bloque la estrategia de chat escribe la de chat, y solo en los grupos con Chat', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await mostrarColumna(page, 'Estrategia de chat');
  await fila(page, 'Reclamaciones').locator('p-table-checkbox').click();
  await fila(page, 'Telemarketing').locator('p-table-checkbox').click();

  const lote = page.locator('sc-bulk-edit-menu');
  await lote.locator('sc-select').first().click();
  await page.getByRole('option', { name: 'Estrategia de chat', exact: true }).click();
  await lote.locator('sc-select').last().click();
  await page.getByRole('option', { name: 'Menos conversaciones activas', exact: true }).click();
  await lote.getByRole('button', { name: 'Aplicar' }).click();

  // La vista previa solo trae al que tiene Chat: a Telemarketing (solo Teléfono) no le aplica.
  const vista = page.getByRole('dialog', { name: 'Aplicar cambio a 1 grupo(s)' });
  await expect(vista).toContainText('Reclamaciones');
  await expect(vista).not.toContainText('Telemarketing');
  await vista.getByRole('button', { name: 'Aplicar' }).click();

  await expect(await celda(page, 'Reclamaciones', 'Estrategia de chat')).toHaveText('Menos conversaciones activas');
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

test('a 1440 no se recorta nada: ni cabeceras ni etiquetas, con la columna de chat encendida o no', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/grupos');
  // La de chat es opcional: por defecto no sale.
  await expect(page.locator('thead th', { hasText: 'Estrategia de chat' })).toHaveCount(0);
  expect(await recortes(page)).toEqual([]);

  await mostrarColumna(page, 'Estrategia de chat');
  expect(await recortes(page)).toEqual([]);
});

/* Las más largas de cada catálogo desde DD-141, que no trae ningún grupo de la semilla: el ancho de cada columna es el
 * de su dato más largo (DD-102), no el del más largo que haya hoy en la tabla. */
const grupoConLasEstrategiasMasLargas = {
  id: 1,
  code: '20001',
  name: 'Online Support',
  phone: '918371548',
  priority: 'Máxima',
  channels: ['phone', 'chat', 'whatsapp', 'email'],
  strategy: 'Menos conversaciones atendidas',
  chatStrategy: 'Menos conversaciones activas',
  services: ['Soporte técnico'],
};

test('a 1440 caben también las estrategias más largas del catálogo, con la columna de chat encendida o no', async ({
  page,
}) => {
  await page.addInitScript((grupo) => {
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify([grupo]));
  }, grupoConLasEstrategiasMasLargas);
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/grupos');
  await expect(await celda(page, 'Online Support', 'Estrategia de teléfono')).toHaveText('Menos conversaciones atendidas');
  expect(await recortes(page)).toEqual([]);

  await mostrarColumna(page, 'Estrategia de chat');
  await expect(await celda(page, 'Online Support', 'Estrategia de chat')).toHaveText('Menos conversaciones activas');
  expect(await recortes(page)).toEqual([]);
});

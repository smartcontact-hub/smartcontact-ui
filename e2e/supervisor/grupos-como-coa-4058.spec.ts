import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA FICHA DE GRUPO, COMO SU PÁGINA DE COA (SISMAC-4058, versión del 2026-10-22; DD-223):
 *   1. «En qué conversaciones» sale con «Permitir comentarios» o con «Tipificar conversaciones», y vale para los dos.
 *   2. Activar un canal en un grupo sin canales se lo marca a sus agentes, si lo tienen permitido; quien no lo tiene
 *      permitido sale del grupo al guardar, pero antes lo pregunta (hasta DD-223 salía en silencio al crear).
 *   3. Asignados vacía, sin búsqueda, dice «Sin agentes asignados», no «No hay agentes que coincidan con el filtro».
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Dos agentes: uno con los tres canales permitidos y otro solo con Chat. Ningún grupo ni enlace. */
async function sembrar(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('sc-agents')) return;
    const permissions = { manageDevices: true, selfActivate: false, externalDevices: true, callsEnabled: true, transfersEnabled: true, callsDestFixed: true, callsDestMobile: true, callsDestInternational: true, callsDestSpecial: false, transfersDestFixed: true, transfersDestMobile: true, transfersDestInternational: true, transfersDestSpecial: false, recording: false };
    localStorage.setItem('sc-agents-v', '3');
    localStorage.setItem('sc-agents', JSON.stringify([
      { id: 1, code: '10001', name: 'Agente Completo', email: 'agente.completo@example.com', extension: '122', extensionType: 'webrtc', agentType: 'normal', status: 'active', presenceStatus: 'disponible', permissions },
      { id: 2, code: '10002', name: 'Agente Chat', email: 'agente.chat@example.com', extension: '124', extensionType: 'webrtc', agentType: 'normal', status: 'active', presenceStatus: 'disponible', permissions, allowedChannels: ['chat'] },
    ]));
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify([]));
    localStorage.setItem('sc-group-agent-links-v', '1');
    localStorage.setItem('sc-group-agent-links', JSON.stringify([]));
  });
}

const canal = (page: Page, nombre: string) =>
  page.locator('#group-section-general sc-checkbox').filter({ hasText: new RegExp(`^\\s*${nombre}\\s*$`) });
const irA = (page: Page, seccion: string) =>
  page.locator('sc-form-section-nav').getByText(seccion, { exact: true }).click();
const tabla = (page: Page) => page.locator('sc-agent-channel-table');
const fila = (page: Page, nombre: string) => tabla(page).locator('tbody tr', { hasText: nombre });

test('«En qué conversaciones» sale con comentarios o con tipificación, y se va sin ninguno', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  const alcance = page.locator('#group-wrapup-scope-label');
  await expect(alcance).toHaveCount(0);

  // Solo comentarios: el alcance, sin el campo de la tipificación.
  await page.locator('label[for="group-wrapup-comments"]').click();
  await expect(alcance).toHaveText('En qué conversaciones');
  for (const opcion of ['Todas', 'Solo entrantes', 'Solo salientes']) {
    await expect(page.locator('.wrapup').getByText(opcion, { exact: true })).toBeVisible();
  }
  await expect(page.locator('#group-typification')).toHaveCount(0);

  // Con los dos, uno solo para los dos, junto a la tipificación.
  await page.locator('label[for="group-wrapup-classify"]').click();
  await expect(page.locator('#group-typification')).toHaveCount(1);
  await expect(alcance).toHaveCount(1);

  // Sin ninguno, nada que preguntar.
  await page.locator('label[for="group-wrapup-comments"]').click();
  await page.locator('label[for="group-wrapup-classify"]').click();
  await expect(alcance).toHaveCount(0);
});

test('activar un canal en un grupo sin canales se lo marca a sus agentes, y antes de sacar a quien no lo tiene, pregunta', async ({ page }) => {
  await sembrar(page);
  await goto(page, 'admin/grupos/crear');
  await canal(page, 'Teléfono').click();
  await page.locator('#group-name').fill('Sin canales');

  await irA(page, 'Agentes asignados');
  await tabla(page).getByRole('checkbox', { name: 'Asignado — Agente Completo' }).click();
  await tabla(page).getByRole('checkbox', { name: 'Asignado — Agente Chat' }).click();

  await irA(page, 'General');
  await canal(page, 'Teléfono').click();
  await irA(page, 'Agentes asignados');
  await expect(fila(page, 'Agente Completo').getByRole('checkbox', { name: /^Agente Completo — Teléfono/ })).toBeChecked();
  await expect(fila(page, 'Agente Chat')).toContainText('Sin canales compatibles');

  await irA(page, 'Distribución y colas');
  await page.locator('#group-phone').click();
  await page.getByRole('option').first().click();

  const crear = page.getByRole('button', { name: 'Crear grupo', exact: true });
  await crear.click();
  const aviso = page.getByRole('dialog', { name: '¿Sacar del grupo a 1 agente?' });
  await expect(aviso).toContainText('Se queda sin ninguno de los canales del grupo.');
  await aviso.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/grupos\/crear/);

  await crear.click();
  await aviso.getByRole('button', { name: 'Sacar', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/grupos\/editar\/\d+/);
  const id = Number(/editar\/(\d+)/.exec(page.url())![1]);
  const enlaces: { agentId: number; groupId: number; channels: string[] }[] = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('sc-group-agent-links') ?? '[]'),
  );
  expect(enlaces.filter((l) => l.groupId === id).map((l) => [l.agentId, l.channels])).toEqual([[1, ['phone']]]);
});

test('un grupo recién creado abre en Asignados y dice que no tiene agentes, no que nada coincide', async ({ page }) => {
  await sembrar(page);
  await goto(page, 'admin/grupos/crear');
  await canal(page, 'Teléfono').click();
  await page.locator('#group-name').fill('Recién creado');
  await irA(page, 'Agentes asignados');
  await page.getByRole('button', { name: 'Crear grupo', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/grupos\/editar\/.*seccion=agentes/);

  await expect(tabla(page)).toContainText('Sin agentes asignados');
  await expect(tabla(page)).toContainText('Asígnalos desde la pestaña «Todos».');
  await expect(tabla(page)).not.toContainText('No hay agentes que coincidan');

  // Buscando, sí: nada coincide.
  await tabla(page).getByPlaceholder('Buscar agentes…').fill('zzz');
  await expect(tabla(page)).toContainText('No hay agentes que coincidan con el filtro.');
});

import { expect, test, type Page } from '@playwright/test';

import { goto } from './helpers';

/**
 * AGENDAS: A QUÉ AGENTES SE ASIGNA, EL EDITOR DE UN CONTACTO Y LO QUE NO SALE AL CREAR. COA SISMAC-4440 y la reunión del
 * 2026-10-26 (sustituye el árbol Grupo → Agentes de DD-211 §1):
 *   1. la última sección es «Agentes»: una tabla plana con casilla, nombre, email y los grupos del agente, el buscador y
 *      «Todos / Asignados (N)». Se asigna SOLO a agentes: marcar uno no marca a su grupo ni a los demás de él, y los grupos
 *      se muestran como información (para buscar por grupo y marcar de golpe los que salen, con la casilla de la cabecera);
 *   2. las etiquetas de los campos personalizados no salen al crear, solo al editar;
 *   3. pulsar la fila de un contacto abre su editor, como en las listas; con casillas, marcar varios y borrarlos con el clic
 *      derecho (DD-227), con su confirmación y su aviso;
 *   4. el diálogo de importar no lleva texto explicativo.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const tabla = (page: Page) => page.locator('sc-agent-assignment-table');
const casillas = (page: Page) => tabla(page).getByRole('checkbox', { name: /^Asignar la agenda a / });
const guardarArriba = (page: Page) => page.locator('sc-top-bar').getByRole('button', { name: /^(Guardar|Crear)/ });
const leer = <T,>(page: Page, clave: string) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]'), clave) as Promise<T>;

test('crear: sin etiquetas de personalizados, con la sección «Agentes» la última', async ({ page }) => {
  await goto(page, 'admin/agendas/crear');
  await expect(page.getByText('Etiquetas de los campos personalizados')).toHaveCount(0);
  const titulos = await page.locator('sc-section-card').evaluateAll((els) => els.map((e) => e.querySelector('h2, h3')?.textContent?.trim() ?? ''));
  expect(titulos.at(-1)).toBe('Agentes');
  expect(titulos.at(-2)).toBe('Contactos');
});

test('editar: las etiquetas de personalizados sí salen', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/1');
  await expect(page.getByText('Etiquetas de los campos personalizados')).toBeVisible();
});

test('agentes: tabla plana con nombre, email y grupos; marcar un agente no marca a su grupo', async ({ page }) => {
  await goto(page, 'admin/agendas/crear');
  await page.locator('#agenda-name').fill('Agenda de agentes');
  await expect(tabla(page).locator('thead th[data-field]')).toHaveText(['Nombre', 'Email', 'Grupos']);
  await expect(tabla(page).getByRole('button', { name: /^Asignados \(0\)$/ })).toBeVisible();
  // Scarlett Johansson está en varios grupos, y los otros agentes de esos grupos no se marcan con ella.
  await tabla(page).getByPlaceholder('Buscar agentes…').fill('Scarlett');
  await expect(casillas(page)).toHaveCount(1);
  await expect(tabla(page).locator('tbody tr').first()).toContainText('ACD Demo C2CB');
  await casillas(page).first().click();
  await expect(tabla(page).getByRole('button', { name: /^Asignados \(1\)$/ })).toBeVisible();
  await tabla(page).getByPlaceholder('Buscar agentes…').fill('');
  await expect(tabla(page).getByRole('button', { name: /^Asignados \(1\)$/ })).toBeVisible();
  // Solo ella está marcada: «Asignados» enseña una única fila.
  await tabla(page).getByRole('button', { name: /^Asignados/ }).click();
  await expect(casillas(page)).toHaveCount(1);
  await expect(casillas(page).first()).toBeChecked();
});

test('agentes: buscar por grupo y marcar todos los que salen con la casilla de la cabecera; se guarda en cada agente', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/4');
  const antes = (await leer<{ id: number; schedules?: number[] }[]>(page, 'sc-agents')).filter((a) => a.schedules?.includes(4)).length;
  const gruposAntes = (await leer<{ id: number; schedules?: number[] }[]>(page, 'sc-groups')).map((g) => [g.id, g.schedules ?? []]);
  await tabla(page).getByPlaceholder('Buscar agentes…').fill('Campaigns');
  const filas = await tabla(page).locator('tbody tr').count();
  expect(filas).toBeGreaterThan(1);
  await tabla(page).getByRole('checkbox', { name: 'Marcar todos los agentes que se ven' }).click();
  for (const casilla of await casillas(page).all()) await expect(casilla).toBeChecked();
  // Lo que el filtro esconde se conserva: el contador sube, no se sustituye por lo visible.
  await tabla(page).getByPlaceholder('Buscar agentes…').fill('');
  await expect(tabla(page).getByRole('button', { name: /^Asignados \(\d+\)$/ })).toBeVisible();
  await guardarArriba(page).click();
  await expect
    .poll(async () => (await leer<{ schedules?: number[] }[]>(page, 'sc-agents')).filter((a) => a.schedules?.includes(4)).length)
    .toBeGreaterThanOrEqual(Math.max(antes, filas));
  // Solo agentes: los grupos no se tocan.
  expect((await leer<{ id: number; schedules?: number[] }[]>(page, 'sc-groups')).map((g) => [g.id, g.schedules ?? []])).toEqual(gruposAntes);
});

test('agentes: «Asignados» enseña solo los marcados, y quitarle uno lo guarda', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/4');
  await tabla(page).getByRole('button', { name: /^Asignados/ }).click();
  const total = await casillas(page).count();
  expect(total).toBeGreaterThan(0);
  for (const casilla of await casillas(page).all()) await expect(casilla).toBeChecked();
  await casillas(page).first().click();
  await expect(tabla(page).getByRole('button', { name: new RegExp(`^Asignados \\(${total - 1}\\)$`) })).toBeVisible();
  await guardarArriba(page).click();
  await expect
    .poll(async () => (await leer<{ schedules?: number[] }[]>(page, 'sc-agents')).filter((a) => a.schedules?.includes(4)).length)
    .toBe(total - 1);
});

test('listado: Descripción, Contactos y Agentes con guion si no hay, y «Agentes» cuenta los de la tabla del editor', async ({ page }) => {
  await goto(page, 'admin/agendas');
  const cabeceras = page.getByTestId('repo-table').locator('thead th[data-field]');
  await expect(cabeceras).toHaveText(['Título', 'Descripción', 'Contactos', 'Agentes', 'Modificada', '']);
  const fila = page.getByTestId('repo-table').locator('tbody tr', { hasText: 'Emergencias 24h' });
  const cifra = (await fila.locator('td').nth(3).innerText()).trim();
  await goto(page, 'admin/agendas/editar/4');
  await expect(tabla(page).getByRole('button', { name: new RegExp(`^Asignados \\(${cifra}\\)$`) })).toBeVisible();
  // Una agenda sin agentes lo dice con «—», y el globo con nombres no existe.
  await goto(page, 'admin/agendas');
  const retencion = page.getByTestId('repo-table').locator('tbody tr', { hasText: 'Retención' });
  await expect(retencion.locator('td').nth(3)).toContainText('—');
  await expect(page.getByTestId('repo-table').locator('sc-group-popover')).toHaveCount(0);
});

test('contactos: marcar varios y borrarlos con el clic derecho, con su confirmación y su aviso (DD-227)', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/10');
  const contactos = page.locator('sc-agenda-contacts-table');
  const filas = contactos.locator('.p-datatable-tbody > tr');
  const antes = await filas.count();
  await filas.nth(0).getByRole('checkbox').click();
  await filas.nth(1).getByRole('checkbox').click();
  await filas.nth(0).locator('td').nth(2).click({ button: 'right' });
  const eliminar = page.getByRole('menuitem', { name: 'Eliminar (2)' });
  await expect(page.getByRole('menuitem')).toHaveCount(1);
  await eliminar.click();
  const d = page.getByRole('alertdialog', { name: '¿Eliminar 2 contactos?' });
  await expect(d).toContainText('Esta acción no se puede deshacer.');
  await d.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(d).toBeHidden();
  await expect(page.getByText('2 contactos eliminados')).toBeVisible();
  await expect(filas).toHaveCount(Math.min(antes, 10) - 2 > 0 ? Math.min(antes - 2, 10) : 0);
  // Sin guardar: se puede deshacer.
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Deshacer' })).toBeVisible();
});

test('contactos: pulsar la fila abre su editor con todos sus campos', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/10');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Clientes VIP');
  const fila = page.locator('sc-agenda-contacts-table .p-datatable-tbody > tr', { hasText: 'Meryl' });
  await expect(fila).toContainText('Streep');
  await expect(fila).toContainText('Sunset Pictures');
  await fila.locator('td').nth(3).click();
  const d = page.getByRole('dialog', { name: 'Editar contacto' });
  await expect(d.getByLabel('Empresa')).toHaveValue('Sunset Pictures');
  await expect(d.getByLabel('Cliente desde')).toHaveValue('2014');
  await d.getByLabel('Puesto').fill('Presidenta');
  await d.getByRole('button', { name: 'Guardar' }).click();
  await expect(d).toBeHidden();
});

test('contactos: Intro con el foco en la fila abre su editor (WCAG 2.1.1)', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/10');
  const fila = page.locator('sc-agenda-contacts-table .p-datatable-tbody > tr', { hasText: 'Tom' });
  await fila.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Editar contacto' }).getByLabel('Empresa')).toHaveValue('Golden Reel Studios');
});

test('importar: el diálogo no lleva texto explicativo', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/1');
  await page.getByRole('button', { name: 'Importar' }).click();
  const d = page.getByRole('dialog', { name: 'Importar contactos' });
  await expect(d).toBeVisible();
  await expect(d.getByText(/punto y coma/)).toHaveCount(0);
  await expect(d.getByRole('button', { name: 'Descargar plantilla' })).toBeVisible();
});

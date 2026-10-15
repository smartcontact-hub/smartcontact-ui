import { expect, test, type Page } from '@playwright/test';

import { goto } from './helpers';

/**
 * AGENDAS: LOS AGENTES QUE LA VEN, EL EDITOR DE UN CONTACTO Y LO QUE NO SALE AL CREAR. Revisión de producto:
 *   1. la última sección es «Agentes»: una tabla con buscador, un filtro «Todos / Asignados» y una casilla por agente
 *      (en Voice, un muro de casillas); lo marcado se guarda en las `schedules` de cada agente;
 *   2. las etiquetas de los campos personalizados no salen al crear, solo al editar;
 *   3. pulsar la fila de un contacto abre su editor, como en las listas, y la agenda de ejemplo lo permite probar;
 *   4. el diálogo de importar no lleva texto explicativo.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const seccionAgentes = (page: Page) => page.locator('sc-agenda-agents-table');
const filasAgentes = (page: Page) => seccionAgentes(page).locator('.p-datatable-tbody > tr');
const guardarArriba = (page: Page) => page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' });

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

test('agentes: buscar, ver solo los asignados, asignar uno y guardar lo deja en el agente', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/4');
  await expect(seccionAgentes(page)).toBeVisible();
  await expect(seccionAgentes(page).getByRole('status')).toContainText(/\d+ de \d+ asignados/);

  // Solo los asignados: el filtro dice cuántos son, y todas las filas que enseña están marcadas.
  const filtro = seccionAgentes(page).getByRole('button', { name: /^Asignados/ });
  const marcados = Number(/\((\d+)\)/.exec((await filtro.textContent()) ?? '')?.[1]);
  expect(marcados).toBeGreaterThan(0);
  await filtro.click();
  await expect(filasAgentes(page).first().getByRole('checkbox')).toBeChecked();
  await seccionAgentes(page).getByRole('button', { name: 'Todos' }).click();

  const buscador = seccionAgentes(page).getByPlaceholder('Buscar agentes…');
  await buscador.fill('Miguel Palacios');
  // La fila buscada, ya filtrada: sin esperar, la primera podía ser aún la de antes de buscar.
  await expect(filasAgentes(page)).toHaveCount(1);
  const fila = filasAgentes(page).first();
  const casilla = fila.getByRole('checkbox');
  const estabaMarcada = await casilla.isChecked();
  await casilla.setChecked(!estabaMarcada);
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' })).toBeEnabled();
  await guardarArriba(page).click();

  // Lo guardado está en `schedules` del agente, no en la agenda.
  await expect
    .poll(async () => page.evaluate(() => (JSON.parse(localStorage.getItem('sc-agents') ?? '[]') as { schedules?: number[] }[]).filter((a) => a.schedules?.includes(4)).length))
    .toBe(estabaMarcada ? marcados - 1 : marcados + 1);
  const enAgenda = await page.evaluate(() => JSON.parse(localStorage.getItem('sc-agendas-repo') ?? '[]').find((a: { id: number }) => a.id === 4));
  expect(enAgenda).not.toHaveProperty('agentIds');
});

test('contactos: pulsar la fila abre su editor con todos sus campos', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/10');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Clientes VIP');
  const fila = page.locator('sc-agenda-contacts-table .p-datatable-tbody > tr', { hasText: 'Meryl' });
  await expect(fila).toContainText('Streep');
  await expect(fila).toContainText('Sunset Pictures');
  await fila.locator('td').nth(2).click();
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

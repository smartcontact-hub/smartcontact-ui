import { expect, test, type Page } from '@playwright/test';

import { goto } from './helpers';

/**
 * AGENDAS: A QUIÉN SE ASIGNA, EL EDITOR DE UN CONTACTO Y LO QUE NO SALE AL CREAR. Revisiones de producto:
 *   1. la última sección es «Grupos y agentes» (DD-211 §1): un árbol Grupo → Agentes, con buscador y el filtro
 *      «Todos / Asignados». La selección es por persona (un agente marcado lo está en todos sus grupos), marcar un
 *      grupo lo deja entero y dinámico (se guarda en el grupo), y desmarcar a uno de sus agentes lo deja parcial. Los
 *      agentes sin grupo van en «Sin grupo», al final, y se guardan sueltos, en el agente;
 *   2. las etiquetas de los campos personalizados no salen al crear, solo al editar;
 *   3. pulsar la fila de un contacto abre su editor, como en las listas, y la agenda de ejemplo lo permite probar;
 *   4. el diálogo de importar no lleva texto explicativo.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const arbol = (page: Page) => page.locator('sc-agenda-assignment-tree');
const filaDe = (page: Page, texto: string) => arbol(page).locator('tbody tr', { hasText: texto });
/** Despliega un grupo (o «Sin grupo») con su flecha. */
const abrir = async (page: Page, grupo: string) => {
  await filaDe(page, grupo).first().locator('p-treetable-toggler button').click();
};
const casillaGrupo = (page: Page, grupo: string) => arbol(page).getByRole('checkbox', { name: `Asignar la agenda a todo el grupo ${grupo}`, exact: true });
/** Las casillas de una persona: una por cada grupo desplegado donde está. */
const casillasDe = (page: Page, agente: string) => arbol(page).getByRole('checkbox', { name: `Asignar la agenda a ${agente}`, exact: true });
const guardarArriba = (page: Page) => page.locator('sc-top-bar').getByRole('button', { name: /^(Guardar|Crear)/ });
const leer = <T,>(page: Page, clave: string) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]'), clave) as Promise<T>;

test('crear: sin etiquetas de personalizados, con la sección «Grupos y agentes» la última', async ({ page }) => {
  await goto(page, 'admin/agendas/crear');
  await expect(page.getByText('Etiquetas de los campos personalizados')).toHaveCount(0);
  const titulos = await page.locator('sc-section-card').evaluateAll((els) => els.map((e) => e.querySelector('h2, h3')?.textContent?.trim() ?? ''));
  expect(titulos.at(-1)).toBe('Grupos y agentes');
  expect(titulos.at(-2)).toBe('Contactos');
});

test('editar: las etiquetas de personalizados sí salen', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/1');
  await expect(page.getByText('Etiquetas de los campos personalizados')).toBeVisible();
});

test('árbol: un agente marcado lo está en todos sus grupos; un grupo entero, y parcial al quitarle a uno', async ({ page }) => {
  await goto(page, 'admin/agendas/crear');
  await page.getByLabel('Nombre').first().fill('Agenda del árbol');
  await expect(arbol(page)).toBeVisible();
  // Scarlett Johansson está en «Grupo de prueba 2» y en «ACD Demo C2CB», entre otros.
  await abrir(page, 'ACD Demo C2CB');
  await abrir(page, 'Grupo de prueba 2');
  await expect(casillasDe(page, 'Scarlett Johansson')).toHaveCount(2);
  await casillasDe(page, 'Scarlett Johansson').last().click();
  for (const casilla of await casillasDe(page, 'Scarlett Johansson').all()) await expect(casilla).toBeChecked();
  await expect(casillaGrupo(page, 'Grupo de prueba 2')).toBeChecked({ indeterminate: true });

  // Parcial, la casilla del grupo lo desmarca entero, como toda casilla de «todos» del DS (`sc-checkbox`); la segunda
  // vez lo marca entero: sus cuatro agentes, también donde estén en otros grupos.
  await casillaGrupo(page, 'Grupo de prueba 2').click();
  await expect(casillaGrupo(page, 'Grupo de prueba 2')).not.toBeChecked();
  for (const casilla of await casillasDe(page, 'Scarlett Johansson').all()) await expect(casilla).not.toBeChecked();
  await casillaGrupo(page, 'Grupo de prueba 2').click();
  await expect(casillaGrupo(page, 'Grupo de prueba 2')).toBeChecked();
  for (const casilla of await casillasDe(page, 'Morgan Freeman').all()) await expect(casilla).toBeChecked();
  await expect(arbol(page).getByRole('status')).toHaveText(/^4 de \d+ agentes y 1 grupos enteros$/);

  // Quitar a Morgan Freeman desde OTRO grupo deja «Grupo de prueba 2» parcial: ya no es dinámico.
  await casillasDe(page, 'Morgan Freeman').first().click();
  await expect(casillaGrupo(page, 'Grupo de prueba 2')).toBeChecked({ indeterminate: true });
  await expect(arbol(page).getByRole('status')).toHaveText(/^3 de \d+ agentes y 0 grupos enteros$/);

  // Volver a marcarlo uno a uno deja el grupo entero otra vez.
  await casillasDe(page, 'Morgan Freeman').last().click();
  await expect(casillaGrupo(page, 'Grupo de prueba 2')).toBeChecked();

  // Guardar: el grupo entero lo lleva el grupo; sus agentes no la llevan además sueltos.
  await guardarArriba(page).click();
  await expect(page).toHaveURL(/agendas\/editar\/\d+$/);
  const id = Number(/editar\/(\d+)/.exec(page.url())![1]);
  const grupos = await leer<{ id: number; name: string; schedules?: number[] }[]>(page, 'sc-groups');
  expect(grupos.filter((g) => g.schedules?.includes(id)).map((g) => g.name)).toEqual(['Grupo de prueba 2']);
  const agentes = await leer<{ schedules?: number[] }[]>(page, 'sc-agents');
  expect(agentes.filter((a) => a.schedules?.includes(id))).toHaveLength(0);
});

test('árbol: buscar y «Sin grupo»; el agente sin grupo se guarda suelto, en el agente', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/4');
  // Nicole Kidman (id 21) es uno de los agentes de ejemplo que no está en ningún grupo, y no tiene la agenda 4.
  await arbol(page).getByPlaceholder('Buscar grupos o agentes…').fill('Nicole Kidman');
  await expect(filaDe(page, 'Sin grupo')).toBeVisible();
  const casilla = casillasDe(page, 'Nicole Kidman').first();
  await expect(casilla).not.toBeChecked();
  await casilla.click();
  await expect(casilla).toBeChecked();

  // «Asignados» enseña solo lo marcado, y la persona sigue ahí.
  await arbol(page).getByRole('button', { name: /^Asignados/ }).click();
  await expect(casillasDe(page, 'Nicole Kidman').first()).toBeChecked();

  await guardarArriba(page).click();
  await expect
    .poll(async () => (await leer<{ id: number; schedules?: number[] }[]>(page, 'sc-agents')).find((a) => a.id === 21)?.schedules?.includes(4))
    .toBe(true);
  const enAgenda = await page.evaluate(() => JSON.parse(localStorage.getItem('sc-agendas-repo') ?? '[]').find((a: { id: number }) => a.id === 4));
  expect(enAgenda).not.toHaveProperty('agentIds');
});

test('listado: la columna «Grupos y agentes» dice lo mismo que el árbol del editor, con la misma regla de grupo entero', async ({
  page,
}) => {
  // «Emergencias 24h» (la 4) la lleva entero «Grupo pedidos», y los agentes de Online Support, Soporte Taller y
  // Telemarketing ya la tienen todos (por ese grupo o sueltos): el árbol los enseña enteros, y el listado también.
  const enteros = ['Grupo pedidos', 'Online Support', 'Soporte Taller', 'Telemarketing'];
  await goto(page, 'admin/agendas/editar/4');
  await expect(arbol(page).getByRole('status')).toHaveText(new RegExp(` y ${enteros.length} grupos enteros$`));
  await arbol(page).getByRole('button', { name: /^Asignados/ }).click();
  for (const grupo of enteros) {
    await expect(arbol(page).getByRole('checkbox', { name: `Asignar la agenda a todo el grupo ${grupo}`, exact: true })).toBeChecked();
  }

  await goto(page, 'admin/agendas');
  await expect(page.getByRole('columnheader', { name: 'Grupos y agentes' })).toBeVisible();
  const cifra = page.getByTestId('repo-table').locator('tbody tr', { hasText: 'Emergencias 24h' }).locator('.group-popover__trigger');
  for (const grupo of enteros) await expect(cifra).toHaveAccessibleDescription(new RegExp(grupo));
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

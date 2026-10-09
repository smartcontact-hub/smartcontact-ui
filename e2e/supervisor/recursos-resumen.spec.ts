import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion } from './helpers';

/**
 * EL RESUMEN DE CADA RECURSO, CON «EDITAR» (DD-164, DD-187).
 *
 * La revisión de producto del 2026-10-04, sobre Recursos de las fichas: cada agenda o plantilla asignada era un chip con
 * su nombre, sin nada que dijera qué es (una agenda de 3 contactos y otra de 1.250 se veían iguales) ni cómo llegar a
 * editarla. Desde la revisión del 2026-10-09, «Editar» no sale de la ficha: abre la misma ventana que el «+». Lo que fija:
 *   1. bajo cada campo, una fila por recurso con su nombre, un dato y «Editar», que abre la ventana con sus datos sin
 *      salir de la ficha; al guardar, la fila lo dice;
 *   2. una plantilla, igual: su ventana, con su texto;
 *   3. se ofrecen las agendas activas, y la inactiva que ya estaba puesta, para poder quitarla;
 *   4. lo borrado en Repositorios no se cuenta ni se guarda, y la ficha no abre con cambios por ello;
 *   5. en un alta también se edita: no se sale de la ficha, así que no hay alta vacía a la que volver.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Las filas bajo un campo de Recursos: la lista se llama como el campo. */
const filas = (page: Page, campo: string) => page.getByRole('list', { name: campo, exact: true }).getByRole('listitem');
const etiqueta = (page: Page, id: string) => page.locator(`sc-multiselect:has(#${id}) .p-multiselect-label`);

/** Los textos de las opciones de un `sc-multiselect`, por el id de su campo. Lo deja cerrado. */
const opciones = async (page: Page, id: string): Promise<string[]> => {
  await page.locator(`sc-multiselect:has(#${id}) .p-multiselect`).click();
  const lista = page.locator('.p-multiselect-overlay .p-multiselect-option');
  await expect(lista.first()).toBeVisible();
  const textos = (await lista.allInnerTexts()).map((t) => t.trim());
  await page.keyboard.press('Escape');
  return textos;
};

const marcar = async (page: Page, id: string, opcion: string): Promise<void> => {
  await page.locator(`sc-multiselect:has(#${id}) .p-multiselect`).click();
  await page.locator('.p-multiselect-overlay .p-multiselect-option', { hasText: opcion }).click();
  await page.keyboard.press('Escape');
};

test('grupo · cada agenda es una fila con sus contactos y su estado; «Editar» abre su ventana sin salir de la ficha', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  const agendas = filas(page, 'Agendas');
  await expect(agendas).toHaveCount(3);
  await expect(agendas.first()).toContainText('Ventas Nacional');
  await expect(agendas.first()).toContainText('3 contactos, activa');
  // Los nombres ya están en las filas: el desplegable dice cuántas, no las repite.
  await expect(etiqueta(page, 'group-agendas')).toHaveText('3 agendas');

  await agendas.first().getByRole('button', { name: 'Editar Ventas Nacional' }).click();
  const ventana = page.getByRole('dialog', { name: 'Editar agenda' });
  await expect(ventana.locator('#repo-field-name')).toHaveValue('Ventas Nacional');
  await expect(page).toHaveURL(/\/admin\/grupos\/editar\/11\?seccion=recursos$/);
  await ventana.locator('#repo-field-name').fill('Ventas Nacional Norte');
  await ventana.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(ventana).toBeHidden();
  await expect(agendas.first()).toContainText('Ventas Nacional Norte');
});

test('grupo · una plantilla abre su ventana con su texto, sin salir de la ficha', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  const chat = filas(page, 'Plantillas de chat');
  await expect(chat).toHaveCount(6);
  // El dato es el principio de su texto: el campo ya dice el canal, y lo pedido es saber qué es.
  await expect(chat.first()).toContainText('Hola, soy {agente}.');
  await chat.first().getByRole('button', { name: 'Editar Saludo inicial' }).click();
  const ventana = page.getByRole('dialog', { name: 'Editar plantilla' });
  await expect(ventana.locator('sc-template-form-panel input').first()).toHaveValue('Saludo inicial');
  await expect(page).toHaveURL(/\/admin\/grupos\/editar\/11\?seccion=recursos$/);
});

test('se ofrecen las agendas activas, y la inactiva que ya estaba puesta, para poder quitarla', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/5?seccion=recursos');
  expect(await opciones(page, 'group-agendas')).toContain('Soporte Técnico');
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  expect(await opciones(page, 'group-agendas')).not.toContain('Soporte Técnico');
});

test('lo borrado en Repositorios no se cuenta ni se guarda, y la ficha no abre con cambios por ello', async ({ page }) => {
  // La agenda 3 (Cobros), puesta en el grupo 11, ya no existe.
  await page.addInitScript(() => {
    if (localStorage.getItem('sc-agendas-repo')) return;
    localStorage.setItem('sc-agendas-repo-v', '1');
    localStorage.setItem(
      'sc-agendas-repo',
      JSON.stringify([
        { id: 1, name: 'Ventas Nacional', contacts: [], description: '', status: 'active' },
        { id: 2, name: 'Soporte Premium', contacts: [], description: '', status: 'active' },
      ]),
    );
  });
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  await expect(filas(page, 'Agendas')).toHaveCount(2);
  await expect(etiqueta(page, 'group-agendas')).toHaveText('2 agendas');
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Deshacer' })).toHaveCount(0);

  await marcar(page, 'group-agendas', 'Soporte Premium');
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (JSON.parse(localStorage.getItem('sc-groups') ?? '[]') as { id: number; schedules?: number[] }[]).find((g) => g.id === 11)?.schedules,
      ),
    )
    .toEqual([1]);
});

test('agente · las agendas y sus «Editar»; en el alta, también', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/3?seccion=recursos');
  const agendas = filas(page, 'Agendas');
  await expect(agendas).toHaveCount(2);
  await expect(agendas.nth(1)).toContainText('Cobros');
  await expect(agendas.nth(1)).toContainText('4 contactos, activa');
  await expect(agendas.nth(1).getByRole('button', { name: 'Editar Cobros' })).toHaveAttribute('aria-haspopup', 'dialog');

  await goto(page, 'admin/agentes/crear');
  await irASeccion(page, 'Recursos');
  await marcar(page, 'agent-agendas', 'Cobros');
  await expect(filas(page, 'Agendas')).toHaveCount(1);
  await expect(filas(page, 'Agendas')).toContainText('4 contactos, activa');
  await filas(page, 'Agendas').getByRole('button', { name: 'Editar Cobros' }).click();
  await expect(page.getByRole('dialog', { name: 'Editar agenda' })).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/agentes\/crear/);
});

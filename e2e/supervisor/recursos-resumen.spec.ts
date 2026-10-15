import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion } from './helpers';

/**
 * «EDITAR» DE CADA RECURSO, EN SU OPCIÓN (DD-204, que retira las filas de DD-164; la ventana sin salir, DD-187).
 *
 * La revisión de producto del 2026-10-14, sobre Recursos de las fichas: la lista con «Editar» bajo cada campo repetía lo
 * que ya dice el desplegable. «Editar» va en la propia opción, un lápiz que sale al pasar por ella, con su tooltip, y abre
 * la misma ventana que el «+». Lo que fija:
 *   1. bajo el campo no hay lista; el lápiz de una agenda abre su ventana con sus datos sin salir de la ficha ni marcar o
 *      desmarcar la opción; al guardar, la opción lo dice;
 *   2. una plantilla, igual: su ventana, con su texto;
 *   3. se ofrecen todas las agendas: ya no son activas ni inactivas;
 *   4. lo borrado en Repositorios no se cuenta ni se guarda, y la ficha no abre con cambios por ello;
 *   5. en un alta también se edita: no se sale de la ficha, así que no hay alta vacía a la que volver.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const etiqueta = (page: Page, id: string) => page.locator(`sc-multiselect:has(#${id}) .p-multiselect-label`);

/** Abre el desplegable de un campo de Recursos, por el id de su campo. */
const abrir = async (page: Page, id: string): Promise<void> => {
  await page.locator(`sc-multiselect:has(#${id}) .p-multiselect`).click();
  await expect(page.locator('.p-multiselect-overlay .p-multiselect-option').first()).toBeVisible();
};

/** La opción de un recurso en el desplegable abierto. */
const opcion = (page: Page, nombre: string) => page.locator('.p-multiselect-overlay .p-multiselect-option', { hasText: nombre });

/** Los nombres de las opciones de un `sc-multiselect`, por el id de su campo (sin el lápiz). Lo deja cerrado. */
const opciones = async (page: Page, id: string): Promise<string[]> => {
  await abrir(page, id);
  const textos = (await page.locator('.p-multiselect-overlay .p-multiselect-option .resource-option__name').allInnerTexts()).map((t) => t.trim());
  await page.keyboard.press('Escape');
  return textos;
};

const marcar = async (page: Page, id: string, nombre: string): Promise<void> => {
  await abrir(page, id);
  await opcion(page, nombre).click();
  await page.keyboard.press('Escape');
};

/** El lápiz de una opción: sale al pasar por ella. */
const lapiz = async (page: Page, nombre: string) => {
  await opcion(page, nombre).hover();
  const boton = opcion(page, nombre).getByRole('button', { name: `Editar ${nombre}`, exact: true });
  await expect(boton).toHaveCSS('opacity', '1');
  return boton;
};

test('grupo · sin lista bajo el campo; el lápiz de una agenda abre su ventana sin salir ni marcar la opción', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  await expect(page.getByRole('list', { name: 'Agendas', exact: true })).toHaveCount(0);
  await expect(etiqueta(page, 'group-agendas')).toHaveText('3 agendas');

  await abrir(page, 'group-agendas');
  // Sin pasar por ella, el lápiz no se ve: «Editar» no compite con lo que se elige.
  await expect(opcion(page, 'Cobros').getByRole('button', { name: 'Editar Cobros', exact: true })).toHaveCSS('opacity', '0');
  const editar = await lapiz(page, 'Ventas Nacional');
  await expect(editar).toHaveAttribute('aria-haspopup', 'dialog');
  await editar.click();
  const ventana = page.getByRole('dialog', { name: 'Editar agenda' });
  await expect(ventana.locator('#repo-field-name')).toHaveValue('Ventas Nacional');
  await expect(page).toHaveURL(/\/admin\/grupos\/editar\/11\?seccion=recursos$/);
  // El clic se quedó en el lápiz: la lista se cerró y lo marcado sigue igual.
  await expect(page.locator('.p-multiselect-overlay')).toHaveCount(0);
  await expect(etiqueta(page, 'group-agendas')).toHaveText('3 agendas');

  await ventana.locator('#repo-field-name').fill('Ventas Nacional Norte');
  await ventana.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(ventana).toBeHidden();
  expect(await opciones(page, 'group-agendas')).toContain('Ventas Nacional Norte');
});

test('grupo · una plantilla abre su ventana con su texto, sin salir de la ficha', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  await abrir(page, 'group-templates-chat');
  await (await lapiz(page, 'Saludo inicial')).click();
  const ventana = page.getByRole('dialog', { name: 'Editar plantilla' });
  await expect(ventana.locator('sc-template-form-panel input').first()).toHaveValue('Saludo inicial');
  await expect(page).toHaveURL(/\/admin\/grupos\/editar\/11\?seccion=recursos$/);
});

test('se ofrecen todas las agendas, tengan o no la puesta el grupo', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/5?seccion=recursos');
  expect(await opciones(page, 'group-agendas')).toContain('Soporte Técnico');
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  expect(await opciones(page, 'group-agendas')).toContain('Soporte Técnico');
});

test('lo borrado en Repositorios no se cuenta ni se guarda, y la ficha no abre con cambios por ello', async ({ page }) => {
  // La agenda 3 (Cobros), puesta en el grupo 11, ya no existe.
  await page.addInitScript(() => {
    if (localStorage.getItem('sc-agendas-repo')) return;
    localStorage.setItem('sc-agendas-repo-v', '1');
    localStorage.setItem(
      'sc-agendas-repo',
      JSON.stringify([
        { id: 1, name: 'Ventas Nacional', contacts: [], description: '' },
        { id: 2, name: 'Soporte Premium', contacts: [], description: '' },
      ]),
    );
  });
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
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

test('agente · las agendas con su lápiz; en el alta, también', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/3?seccion=recursos');
  await expect(etiqueta(page, 'agent-agendas')).toHaveText('2 agendas');
  await abrir(page, 'agent-agendas');
  await expect(await lapiz(page, 'Cobros')).toHaveAttribute('aria-haspopup', 'dialog');
  await page.keyboard.press('Escape');

  await goto(page, 'admin/agentes/crear');
  await irASeccion(page, 'Recursos');
  await marcar(page, 'agent-agendas', 'Cobros');
  await expect(etiqueta(page, 'agent-agendas')).toHaveText('1 agenda');
  await abrir(page, 'agent-agendas');
  await (await lapiz(page, 'Cobros')).click();
  await expect(page.getByRole('dialog', { name: 'Editar agenda' })).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/agentes\/crear/);
});

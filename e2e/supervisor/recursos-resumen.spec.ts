import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion, pickSelectOption } from './helpers';

/**
 * RECURSOS DE LAS FICHAS: LO ELEGIDO EN CHIPS, Y SE EDITA EN REPOSITORIOS (DD-217, que retira el lápiz de DD-204 y la
 * ventana sin salir de DD-187; DD-204 ya había retirado las filas de DD-164).
 *
 * Hasta la revisión de producto del 2026-10-20, «Editar» iba en cada opción, un lápiz que abría la ventana del «+». Desde
 * DD-217 ninguna ficha lo lleva: lo elegido va en chips, la opción enseña al pasar lo que contiene, y se crea y se edita
 * en Repositorios. Lo que fija:
 *   1. bajo el campo no hay lista, lo elegido va en chips y la opción no lleva lápiz, en la ficha y en el alta;
 *   2. se ofrecen todas las agendas: ya no son activas ni inactivas;
 *   3. lo borrado en Repositorios no se cuenta ni se guarda, y la ficha no abre con cambios por ello.
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

/** Los nombres de las opciones de un `sc-multiselect`, por el id de su campo: su nombre accesible.
 *  Lo deja cerrado. */
const opciones = async (page: Page, id: string): Promise<string[]> => {
  await abrir(page, id);
  const textos = await page
    .locator('.p-multiselect-overlay .p-multiselect-option')
    .evaluateAll((es) => es.map((e) => (e.getAttribute('aria-label') ?? '').trim()));
  await page.keyboard.press('Escape');
  return textos;
};

const marcar = async (page: Page, id: string, nombre: string): Promise<void> => {
  await abrir(page, id);
  await opcion(page, nombre).click();
  await page.keyboard.press('Escape');
};

const chips = (page: Page, id: string) => page.locator(`sc-multiselect:has(#${id}) .p-multiselect-chip-item:not(.sc-multiselect__more-item)`);

test('agente · sin lista bajo el campo: lo elegido en chips, y la opción sin lápiz; en el alta, igual', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/3?seccion=recursos');
  await expect(page.getByRole('list', { name: 'Agendas', exact: true })).toHaveCount(0);
  await expect(chips(page, 'agent-agendas')).toHaveCount(2);
  await expect(etiqueta(page, 'agent-agendas')).not.toContainText('2 agendas');
  await abrir(page, 'agent-agendas');
  await opcion(page, 'Cobros').hover();
  await expect(opcion(page, 'Cobros').getByRole('button')).toHaveCount(0);
  await page.keyboard.press('Escape');

  await goto(page, 'admin/agentes/crear');
  await irASeccion(page, 'Recursos');
  await marcar(page, 'agent-agendas', 'Cobros');
  await expect(chips(page, 'agent-agendas')).toHaveText(['Cobros']);
  await expect(page).toHaveURL(/\/admin\/agentes\/crear/);
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
    localStorage.setItem('sc-agendas-repo-v', '2');
    localStorage.setItem(
      'sc-agendas-repo',
      JSON.stringify([
        { id: 1, name: 'Ventas Nacional', contacts: [], description: '' },
        { id: 2, name: 'Soporte Premium', contacts: [], description: '' },
      ]),
    );
  });
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  // Lo elegido, en chips (DD-217): dos, sin la borrada.
  await expect(page.locator('sc-multiselect:has(#group-agendas) .p-multiselect-chip')).toHaveCount(2);
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Deshacer' })).toHaveCount(0);

  await marcar(page, 'group-agendas', 'Soporte Premium');
  // Online Support tiene Chat y ninguna cuenta de WhatsApp: sin ella «Guardar» está apagado (DD-222).
  await irASeccion(page, 'Distribución y colas');
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#group-chat-whatsapp') }), /^\+?\d/);
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (JSON.parse(localStorage.getItem('sc-groups') ?? '[]') as { id: number; schedules?: number[] }[]).find((g) => g.id === 11)?.schedules,
      ),
    )
    .toEqual([1]);
});

import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion, openKebabAction, pickSelectOption } from './helpers';

/**
 * REVISIÓN DE PRODUCTO DEL 2026-10-20 EN LA FICHA DE GRUPO (DD-217): duplicar sin modal y con «(1)», Recursos en chips
 * sin «+» ni lápiz, el resumen de Recursos que lleva a su campo y la tipificación sin su descripción.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const actual = (page: Page) => page.locator('sc-form-section-nav .form-nav__item[aria-current="page"]');

test('duplicar un grupo lo crea en el acto y lleva a su edición, en General, como «Online Support (1)»', async ({ page }) => {
  // Online Support, con un número de WhatsApp y un dominio para el script: lo que la copia no se lleva.
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#group-chat-whatsapp') }), /^\+?\d/);
  await page.locator('#group-chat-domain').fill('ejemplo.com');
  await page.keyboard.press('Enter');
  await expect(page.locator('sc-inputtags .p-chip')).toHaveCount(1);
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' })).toBeDisabled();

  await goto(page, 'admin/grupos');
  await openKebabAction(page, 'Online Support', 'Duplicar');

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/admin\/grupos\/editar\/\d+$/);
  await expect(page.locator('h1')).toContainText('Online Support (1)');
  await expect(actual(page)).toContainText('General');
  await expect(page.locator('.p-toast-message').filter({ hasText: 'Grupo "Online Support (1)" creado' })).toBeVisible();

  // Lo que el funcional no copia: los dominios del script de chat y el número de WhatsApp. Lo demás, sí: el teléfono
  // saliente y los canales.
  await irASeccion(page, 'Distribución y colas');
  await expect(page.locator('sc-select:has(#group-chat-whatsapp)')).toContainText('Sin número');
  await expect(page.locator('sc-inputtags .p-chip')).toHaveCount(0);
  await expect(page.locator('sc-select:has(#group-phone)')).toContainText('918371548');

  // Otra vez el original: el siguiente número libre.
  await goto(page, 'admin/grupos');
  await openKebabAction(page, 'Online Support', 'Duplicar');
  await expect(page.locator('h1')).toContainText('Online Support (2)');
});

test('Recursos: lo elegido en chips, sin «+» ni lápiz en las opciones; «Gestionar en Repositorios» se queda', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  const plantillas = page.locator('sc-multiselect').filter({ has: page.locator('#group-templates-chat') });
  await expect(plantillas.locator('.p-multiselect-chip')).not.toHaveCount(0);
  await expect(plantillas).not.toContainText('6 plantillas');
  // Caben enteros: tres chips y «+3 más», ninguno bajo la flecha (a media columna el tercero se cortaba).
  await expect(plantillas.locator('.sc-multiselect__more')).toHaveText(/\+3/);
  for (const campo of [plantillas, page.locator('sc-multiselect').filter({ has: page.locator('#group-agendas') })]) {
    const cortados = await campo.evaluate((el) => {
      const flecha = el.querySelector('.p-multiselect-dropdown')!.getBoundingClientRect().left;
      return [...el.querySelectorAll('.p-multiselect-chip-item')]
        .map((c) => ({ texto: (c.textContent ?? '').trim(), sobra: c.getBoundingClientRect().right - flecha }))
        .filter((c) => c.sobra > 0.5);
    });
    expect(cortados, 'chips cortados por la flecha').toEqual([]);
  }
  await expect(page.getByRole('button', { name: /^Nueva (agenda|plantilla)$/ })).toHaveCount(0);

  await plantillas.locator('.p-multiselect-dropdown').click();
  await expect(page.locator('.p-multiselect-overlay')).toBeVisible();
  await expect(page.locator('.p-multiselect-overlay sc-resource-option')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('link', { name: 'Gestionar en Repositorios' })).toBeVisible();
});

test('el resumen: Recursos no se despliega, y pulsar una fila lleva a su campo', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  const resumen = page.locator('.ficha-summary');
  await expect(resumen.locator('[aria-expanded]')).toHaveCount(0);
  await resumen.getByText('Plantillas de chat').click();
  await expect(actual(page)).toContainText('Recursos');
  await expect(page.locator('#group-templates-chat')).toBeFocused();
});

test('la tipificación elegida, sin su descripción: se queda «Ver detalle»', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  await expect(page.locator('.wrapup__description')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Ver detalle de/ })).toBeVisible();
});

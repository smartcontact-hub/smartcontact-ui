import { expect, test, type Page } from '@playwright/test';

import { goto } from './helpers';

/**
 * LOS 34 CAMPOS DE UN CONTACTO, COMO EN VOICE (revisión de producto de Agendas). Nombre y teléfono son los de siempre y
 * los únicos obligatorios: coinciden con los del puesto de agente. El resto es opcional y va agrupado en secciones;
 * los cinco personalizados llevan la etiqueta que cada agenda les pone («Personalizado 1» a «Personalizado 5» si no).
 */
test.use({ storageState: { cookies: [], origins: [] } });

const dialogo = (page: Page, nombre: string) => page.getByRole('dialog', { name: nombre });

test('añadir un contacto: 34 campos en secciones, y solo nombre y teléfono obligatorios', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/1');
  await page.getByRole('button', { name: 'Añadir contacto' }).click();
  const d = dialogo(page, 'Añadir contacto');
  await expect(d.locator('.panel__field')).toHaveCount(34);
  for (const seccion of ['Datos del contacto', 'Teléfonos', 'Emails', 'Dirección de trabajo', 'Dirección personal', 'Redes y chat', 'Otros', 'Campos personalizados']) {
    await expect(d.getByRole('heading', { name: seccion })).toBeVisible();
  }
  // Sin «(opcional)» en cada uno de los 32: sería ruido.
  await expect(d.getByText('(opcional)')).toHaveCount(0);

  await d.getByLabel('Nombre', { exact: true }).fill('Ana');
  await d.getByLabel('Teléfono', { exact: true }).fill('900 100 299');
  await d.getByLabel('Empresa').fill('ACME');
  await d.getByLabel('Email trabajo').fill('ana@acme.test');
  await d.getByLabel('Personalizado 2').fill('VIP');
  await d.getByRole('button', { name: 'Crear' }).click();
  await expect(d).toBeHidden();
  await expect(page.locator('sc-agenda-contacts-table .p-datatable-tbody > tr').first()).toContainText('ACME');

  // Editar: lo escrito vuelve al formulario.
  await page.locator('sc-agenda-contacts-table .p-datatable-tbody > tr').first().getByRole('button', { name: 'Más acciones' }).click();
  await page.locator('.p-menu-overlay').getByRole('menuitem', { name: 'Editar' }).click();
  const e = dialogo(page, 'Editar contacto');
  await expect(e.getByLabel('Personalizado 2')).toHaveValue('VIP');
  await expect(e.getByLabel('Email trabajo')).toHaveValue('ana@acme.test');
});

test('cada agenda pone su etiqueta a los campos personalizados, y sale en el formulario y se guarda', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/1');
  await page.locator('#agenda-custom-1').fill('Cliente VIP');
  await page.getByRole('button', { name: 'Añadir contacto' }).click();
  const d = dialogo(page, 'Añadir contacto');
  await expect(d.getByLabel('Cliente VIP')).toBeVisible();
  await expect(d.getByLabel('Personalizado 1')).toHaveCount(0);
  await expect(d.getByLabel('Personalizado 2')).toBeVisible();
  await d.getByRole('button', { name: 'Cancelar' }).click();

  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' }).click();
  await expect
    .poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('sc-agendas-repo') ?? '[]').find((a: { id: number }) => a.id === 1)?.customLabels?.[0]))
    .toBe('Cliente VIP');
});

test('importar: la plantilla trae los 34 campos y el archivo con más columnas entra completo', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/1');
  await page.getByRole('button', { name: 'Importar' }).click();
  const d = dialogo(page, 'Importar contactos');
  const descarga = page.waitForEvent('download');
  await d.getByRole('button', { name: 'Descargar plantilla' }).click();
  const plantilla = await (await descarga).createReadStream();
  const trozos: Buffer[] = [];
  for await (const t of plantilla) trozos.push(t as Buffer);
  const cabecera = Buffer.concat(trozos).toString('utf8').replace(/^\uFEFF/, '').trim();
  expect(cabecera.split(';')).toHaveLength(34);
  expect(cabecera.startsWith('Nombre;Teléfono;Apellidos;Empresa')).toBe(true);

  const fila = 'Ana;900 100 298;Pérez;ACME;Jefa';
  await d.locator('input[type="file"]').setInputFiles({ name: 'contactos.csv', mimeType: 'text/csv', buffer: Buffer.from(fila, 'utf8') });
  await d.getByRole('button', { name: /Añadir 1 contacto/ }).click();
  await expect(page.locator('sc-agenda-contacts-table .p-datatable-tbody > tr').first()).toContainText('Pérez');
  await expect(page.locator('sc-agenda-contacts-table .p-datatable-tbody > tr').first()).toContainText('ACME');
});

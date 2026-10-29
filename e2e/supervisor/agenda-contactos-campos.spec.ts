import { expect, test, type Page } from '@playwright/test';

import { goto } from './helpers';

/**
 * LOS 34 CAMPOS DE UN CONTACTO, COMO EN VOICE (revisión de producto de Agendas), agrupados en secciones; los cinco
 * personalizados se llaman «Personalizado 1» a «Personalizado 5». Desde la
 * revisión de producto del 2026-10-15 ninguno es obligatorio, pero un contacto no se guarda sin al menos un dato.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const dialogo = (page: Page, nombre: string) => page.getByRole('dialog', { name: nombre });

test('añadir un contacto: 34 campos en secciones, sin «(opcional)» en cada uno', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/1');
  await page.getByRole('button', { name: 'Nuevo contacto' }).click();
  const d = dialogo(page, 'Nuevo contacto');
  await expect(d.locator('.panel__field')).toHaveCount(34);
  for (const seccion of ['Datos del contacto', 'Teléfonos', 'Emails', 'Dirección de trabajo', 'Dirección personal', 'Redes y chat', 'Otros', 'Campos personalizados']) {
    await expect(d.getByRole('heading', { name: seccion })).toBeVisible();
  }
  // Sin «(opcional)» en cada uno de los 34: sería ruido.
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

test('ningún campo es obligatorio, pero un contacto no se guarda sin ningún dato: solo espacios no vale', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/1');
  await page.getByRole('button', { name: 'Nuevo contacto' }).click();
  const d = dialogo(page, 'Nuevo contacto');
  await d.getByRole('button', { name: 'Crear' }).click();
  await expect(d).toContainText('Escribe al menos un dato del contacto.');
  await d.getByLabel('Empresa').fill('   ');
  await d.getByRole('button', { name: 'Crear' }).click();
  await expect(d).toContainText('Escribe al menos un dato del contacto.');
  // Sin nombre ni teléfono, con un solo dato, se guarda.
  await d.getByLabel('Empresa').fill('Solo empresa SL');
  await d.getByRole('button', { name: 'Crear' }).click();
  await expect(d).toBeHidden();
  await expect(page.locator('sc-agenda-contacts-table .p-datatable-tbody > tr').first()).toContainText('Solo empresa SL');
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

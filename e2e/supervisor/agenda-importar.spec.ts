import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * IMPORTAR CONTACTOS A UNA AGENDA, COMO EN VOICE (DD-166).
 *
 * La revisión de producto del 2026-10-04: hoy una agenda se llena descargando una plantilla e importándola, y eso hay
 * que replicarlo. Lo que fija:
 *   1. «Importar» abre un diálogo que da la plantilla y deja elegir el archivo;
 *   2. antes de añadir, dice qué entra, cada línea con error (con su número) y los repetidos, que se saltan;
 *   3. lo importado entra en la agenda sin guardar (Guardar y Deshacer, como el resto) y sale arriba;
 *   4. un archivo guardado por Excel en español (windows-1252) se lee con sus tildes;
 *   5. una agenda no pasa de 5000 contactos (en `es`, `Intl` no separa los miles de cuatro cifras): lo que no cabe se
 *      dice y no entra.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const filas = (page: Page) => page.locator('sc-agenda-contacts-table .p-datatable-tbody > tr');
const dialogo = (page: Page) => page.getByRole('dialog', { name: 'Importar contactos' });

const importar = async (page: Page, contenido: Buffer): Promise<void> => {
  await page.getByRole('button', { name: 'Importar', exact: true }).click();
  await dialogo(page).locator('input[type="file"]').setInputFiles({ name: 'contactos.csv', mimeType: 'text/csv', buffer: contenido });
};

test('la plantilla sale del diálogo; la vista previa dice qué entra, cada error con su línea y los repetidos', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/1');
  await page.getByRole('button', { name: 'Importar', exact: true }).click();
  const descarga = page.waitForEvent('download');
  await dialogo(page).getByRole('button', { name: 'Descargar plantilla' }).click();
  expect((await descarga).suggestedFilename()).toMatch(/\.csv$/);

  await dialogo(page)
    .locator('input[type="file"]')
    .setInputFiles({
      name: 'contactos.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('﻿nombre;teléfono\nOficina norte;900 100 210\nSin teléfono;abc\nCentralita bis;900-100-200\n', 'utf8'),
    });
  await expect(dialogo(page)).toContainText('Se añadirá 1 contacto');
  await expect(dialogo(page)).toContainText('Línea 3: el teléfono no es válido');
  await expect(dialogo(page)).toContainText('1 ya estaba en la agenda o se repite en el archivo');

  await dialogo(page).getByRole('button', { name: 'Añadir 1 contacto' }).click();
  await expect(dialogo(page)).toBeHidden();
  await expect(filas(page)).toHaveCount(4);
  await expect(filas(page).first()).toContainText('Oficina norte');
  // Entra sin guardar, como un contacto añadido a mano: Deshacer lo quita.
  await page.locator('sc-top-bar').getByRole('button', { name: 'Deshacer' }).click();
  await expect(filas(page)).toHaveCount(3);
});

test('un archivo de Excel en español (windows-1252) se lee con sus tildes', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/1');
  // «Señal;900 100 211» en windows-1252: la «ñ» es el byte 0xF1.
  await importar(page, Buffer.from([0x53, 0x65, 0xf1, 0x61, 0x6c, ...Buffer.from(';900 100 211', 'latin1')]));
  await dialogo(page).getByRole('button', { name: 'Añadir 1 contacto' }).click();
  await expect(filas(page).first()).toContainText('Señal');
});

test('una agenda no pasa de 5000 contactos: lo que no cabe se dice y no entra', async ({ page }) => {
  // La agenda grande tiene 1.250: de 3.760 líneas caben 3.750.
  await goto(page, 'admin/agendas/editar/9');
  const lineas = Array.from({ length: 3760 }, (_, i) => `Tienda ${i};910 ${String(100000 + i).slice(0, 3)} ${String(100000 + i).slice(3)}`);
  await importar(page, Buffer.from(lineas.join('\n'), 'utf8'));
  await expect(dialogo(page)).toContainText('Se añadirán 3750 contactos');
  await expect(dialogo(page)).toContainText('10 no caben: el tope es 5000 contactos por agenda');
});

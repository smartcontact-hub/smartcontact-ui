import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * La última ronda del barrido de PrimeNG (sección 7 de `docs/AUDIT-PRIMENG-CATALOGO.md`): avisos que se iban solos o
 * lejos de su control, lo que el lector no oía y los controles que no decían que abren un menú. Cada prueba hace lo que
 * la pieza de antes no hacía, así que se pone roja si vuelve.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('foto rechazada: el porqué sale bajo la foto, en su línea, y no se va solo (9)', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1');
  await page.locator('.photo-upload__input').first().setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('hola') });
  const linea = page.locator('.photo-upload__hint').first();
  await expect(linea).toHaveText('Tipo de archivo no válido. Usa JPG, PNG o GIF.');
  await expect(page.locator('.photo-upload__button').first()).toHaveAccessibleDescription('Tipo de archivo no válido. Usa JPG, PNG o GIF.');
  await expect(page.locator('.p-toast-message')).toHaveCount(0);
  await page.waitForTimeout(4_000);
  await expect(linea).toHaveText('Tipo de archivo no válido. Usa JPG, PNG o GIF.');
});

test('borrar: copiar el nombre lo dice el ✓, y el lector lo oye, sin toast (15)', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await goto(page, 'admin/agentes/editar/1');
  await page.locator('main').getByRole('button', { name: /^Eliminar/ }).first().click();
  await page.locator('.delete-entity__copy-name').click();
  await expect(page.locator('.delete-entity__copy-check')).toBeVisible();
  await expect(page.locator('.delete-entity__live')).toHaveText('Copiado al portapapeles');
  await expect(page.locator('.p-toast-message')).toHaveCount(0);
});

test('repositorio: el estado es un interruptor, y el panel devuelve el foco a «Crear» al cerrarse (22 y 29)', async ({ page }) => {
  await goto(page, 'admin/horarios');
  const crear = page.locator('.top-bar__cta button').first();
  await crear.focus();
  await page.keyboard.press('Enter');

  const estado = page.getByRole('switch', { name: /^Estado/ });
  await expect(estado).toBeChecked();
  await expect(page.locator('.panel__switch')).toHaveText('Activa');
  await estado.focus();
  await page.keyboard.press('Space');
  await expect(estado).not.toBeChecked();
  await expect(page.locator('.panel__switch')).toHaveText('Inactiva');

  await page.keyboard.press('Escape');
  await expect(crear).toBeFocused();
});

test('listado de agentes: la cifra de grupos lleva sus nombres para el lector (14)', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const cifra = page.locator('.group-popover__trigger').first();
  await expect(cifra).toHaveAccessibleDescription(/ACD Demo C2CB, ACD demo cuscare/);
});

test('el «⋮» de fila y «Nueva regla» dicen que abren un menú, y si está abierto (7.4, DD-171)', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const kebab = page.locator('.rules-kebab-btn button').first();
  await expect(kebab).toHaveAttribute('aria-haspopup', 'menu');
  await expect(kebab).toHaveAttribute('aria-expanded', 'false');
  await kebab.click();
  await expect(kebab).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.rules-kebab-btn button').nth(1)).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Escape');
  await expect(kebab).toHaveAttribute('aria-expanded', 'false');

  await goto(page, 'conversaciones/reglas');
  const nueva = page.locator('.top-bar__cta button').first();
  await expect(nueva).toHaveAttribute('aria-haspopup', 'menu');
  await nueva.click();
  await expect(nueva).toHaveAttribute('aria-expanded', 'true');
});

test('datos de prueba de Conversaciones: un menú que se recorre con flechas y elige con Intro (28)', async ({ page }) => {
  await goto(page, 'conversaciones');
  const actual = page.locator('.mock-sample-switcher__current');
  const antes = (await actual.textContent())?.trim() ?? '';
  await page.locator('.mock-sample-switcher__trigger').click();
  await expect(page.getByRole('menuitem', { name: `${antes}, en uso` })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(actual).not.toHaveText(antes);
});

test('reproductor: descargar baja el fichero en un clic, sin modal, y una llamada sin grabación lo tiene apagado (12)', async ({
  page,
}) => {
  await goto(page, 'conversaciones');
  const abrir = (id: string) =>
    page.locator('[data-testid="conversations-table"] .p-datatable-tbody > tr').filter({ hasText: id }).locator('td').nth(3).click();
  const player = page.locator('sc-memory-conversation-player-modal .p-dialog');

  await abrir('OUT6677ZZ');
  const descarga = page.waitForEvent('download');
  await player.getByRole('button', { name: 'Descargar audio' }).click();
  expect((await descarga).suggestedFilename()).toMatch(/^memory-export-OUT6677ZZ-/);
  await expect(page.getByText('Selecciona qué descargar')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(player).toBeHidden();

  // Una llamada sin grabación: nada que bajar. Antes abría un modal con su única casilla apagada y sin salida.
  await abrir('INT9911QQ');
  await expect(player.getByText('No hay grabación de esta llamada')).toBeVisible();
  await expect(player.getByRole('button', { name: 'Descargar audio' })).toBeDisabled();
});

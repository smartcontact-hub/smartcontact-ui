import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * La ronda de campos del barrido de PrimeNG (sección 7 de `docs/AUDIT-PRIMENG-CATALOGO.md`): campos que aceptaban
 * cualquier cosa o pedían más pasos de los necesarios, y las categorías del asistente de widgets. Cada prueba hace
 * lo que el campo de antes dejaba pasar o no sabía hacer, así que se pone roja si vuelve.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('categorías del asistente: seis fichas con radio, y las flechas pasan de una a otra', async ({ page }) => {
  await goto(page, 'dashboard');
  await page.getByRole('button', { name: 'Añadir widget' }).first().click();
  const grupo = page.getByRole('radiogroup', { name: 'Categoría' });
  await expect(grupo.getByRole('radio')).toHaveCount(6);

  const elegida = grupo.locator('label:has(input:checked)');
  const antes = (await elegida.textContent())?.trim() ?? '';
  await grupo.locator('input:checked').focus();
  await page.keyboard.press('ArrowRight');
  await expect(elegida).not.toHaveText(antes);
});

test('ficha de agente: un teléfono que no lo es se dice en su campo', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1');
  const telefono = page.locator('#agent-phone');
  await telefono.fill('abc');
  await telefono.blur();
  await expect(telefono).toHaveAttribute('aria-invalid', 'true');
  // En su campo, y también junto a «Guardar», que se apaga: no se puede guardar «abc» como el móvil de la extensión.
  await expect(page.locator('#agent-phone-msg')).toHaveText('El teléfono no es válido: usa cifras, con un + delante si lleva prefijo.');

  await telefono.fill('+34 600 100 200');
  await telefono.blur();
  await expect(telefono).not.toHaveAttribute('aria-invalid', 'true');
});

test('entidad de tipo lista: cada sinónimo es una etiqueta', async ({ page }) => {
  await goto(page, 'conversaciones/entidades');
  await page.locator('.top-bar__cta').first().click();
  const modal = page.locator('div[role="dialog"][aria-modal="true"]');
  await modal.locator('sc-select .p-select').first().click();
  await page.locator('.p-select-overlay [role=option]').filter({ hasText: 'Lista' }).first().click();
  await modal.getByRole('button', { name: /Añadir valor/ }).first().click();
  await modal.getByRole('button', { name: /sinónimos/i }).first().click();

  await modal.locator('#syn-input-0').click();
  await page.keyboard.type('alta, baja');
  await page.keyboard.press('Enter');
  await expect(modal.locator('.p-inputtags-chip-item, .p-chip')).toHaveText(['alta', 'baja']);
});

test('cuenta de correo: el puerto es un número de 1 a 65535', async ({ page }) => {
  await goto(page, 'admin/emails/cuentas/crear');
  const puerto = page.locator('#mailbox-incoming-port');
  await expect(puerto).toHaveAttribute('type', 'number');
  await expect(puerto).toHaveAttribute('min', '1');
  await expect(puerto).toHaveAttribute('max', '65535');
});

test('mensajes de la cola: el texto que lee la voz se escribe en varias líneas y tiene nombre', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const plegado = page.getByRole('button', { name: /Mensajes en cola/ }).first();
  if ((await plegado.getAttribute('aria-expanded')) === 'false') await plegado.click();
  const fila = page.locator('.queue-messages .field').first();
  await fila.getByRole('button', { name: 'Texto a voz' }).click();
  await expect(fila.getByRole('textbox', { name: 'Identificador del grupo: Texto que lee la voz' })).toHaveJSProperty('tagName', 'TEXTAREA');
});

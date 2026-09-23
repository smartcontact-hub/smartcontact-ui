import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * Los CANALES de la ficha de grupo: que se puedan asignar los cuatro, y que lo que no aplica se
 * aparte solo.
 *
 * Nace de un fallo servido (2026-09-23): `canonicalizeChannels`, que normaliza lo que se escribe
 * en cada enlace (agente, grupo), listaba `['phone', 'chat', 'email']` y se dejaba fuera
 * `whatsapp`. Como se llama en CADA escritura, marcar WhatsApp a un agente no guardaba nada: la
 * casilla volvía sola, desde la ficha del grupo y desde la del agente. No lo vio nadie porque
 * todavía no hay clientes con WhatsApp; se cayó solo al pintar los canales con sus glifos, donde
 * faltaba uno.
 *
 * Storage limpio por test → cada store admin re-siembra su SEED.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('los cuatro canales se pueden asignar a un agente, WhatsApp incluido', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');

  const canal = (nombre: string) =>
    page.locator('.channel-row sc-checkbox').filter({ hasText: nombre }).first();

  // El grupo ofrece los cuatro.
  for (const c of ['Chat', 'WhatsApp', 'Email']) {
    await canal(c).click();
  }

  /* Una columna por canal. Por ROL y no con `hasText: /^WhatsApp$/`: el `th` lleva espacios
   * alrededor del rótulo y el ancla `$` no casa con ellos (me costó una tirada roja). */
  await expect(page.getByRole('columnheader', { name: 'WhatsApp' })).toHaveCount(1);

  /* Y la casilla de WhatsApp de la primera fila se queda marcada. CON EL FALLO PUESTO esto se pone
   * rojo: `canonicalizeChannels` devolvía el enlace sin `whatsapp` y la casilla volvía a `false`. */
  const indice = await page.evaluate(() =>
    [...document.querySelectorAll('thead th')].findIndex((t) => t.textContent?.trim() === 'WhatsApp'),
  );
  expect(indice, 'no hay columna de WhatsApp').toBeGreaterThan(0);

  const celda = page.locator('tbody tr').first().locator('td').nth(indice);
  const casilla = celda.locator('[role=checkbox], input[type=checkbox]').first();
  await expect(casilla).toHaveAttribute('aria-checked', 'false');

  await celda.locator('sc-checkbox').first().click();
  await expect(casilla).toHaveAttribute('aria-checked', 'true');
});

test('sin el canal teléfono, «Anuncios y audio» se apaga en vez de desaparecer', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');

  const pestanas = page.getByRole('tab');
  await expect(pestanas).toHaveCount(5);

  const anuncios = page.getByRole('tab', { name: /anuncios/i });
  await expect(anuncios).not.toHaveAttribute('aria-disabled', 'true');

  // Fuera el teléfono: todo lo que suena en la llamada deja de aplicar.
  await page.locator('.channel-row sc-checkbox').filter({ hasText: 'Chat' }).first().click();
  await page.locator('.channel-row sc-checkbox').filter({ hasText: 'Teléfono' }).first().click();

  /* La tira NO encoge —quitar la pestaña movía las dos de su derecha— y la que no aplica queda
   * apagada, con su motivo en el `title`. */
  await expect(pestanas).toHaveCount(5);
  await expect(anuncios).toHaveAttribute('aria-disabled', 'true');
  await expect(anuncios).toHaveAttribute('title', /Teléfono/);

  // Y el «Teléfono asociado» deja de pedirse en Identidad.
  await page.getByRole('tab', { name: /identidad/i }).click();
  await expect(page.locator('#group-phone')).toHaveCount(0);
});

import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * Los CANALES de la ficha de grupo: que se puedan asignar los cuatro, y que lo que no aplica se
 * aparte solo. Desde el 2026-09-26 se marcan en General (Chat es la madre de Web Chat y WhatsApp)
 * y cada canal se configura en su bloque de Distribución y colas.
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

/** Una casilla de canal de General, por su rótulo EXACTO: «Chat» no debe casar con «Web Chat». */
const canal = (page: Page, nombre: string) =>
  page.locator('#group-section-general sc-checkbox').filter({ hasText: new RegExp(`^\\s*${nombre}\\s*$`) });
const irA = (page: Page, seccion: string) =>
  page.locator('sc-form-section-nav').getByText(seccion, { exact: true }).click();

test('los cuatro canales se pueden asignar a un agente, WhatsApp incluido', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');

  // El grupo ofrece los cuatro.
  for (const c of ['Web Chat', 'WhatsApp', 'Email']) {
    await canal(page, c).click();
  }
  await irA(page, 'Agentes');

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

test('sin Teléfono, su bloque se va de Distribución y deja la línea que dice dónde se enciende', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');
  await irA(page, 'Distribución y colas');
  await expect(page.locator('#group-channel-phone')).toBeVisible();
  await expect(page.locator('#group-phone')).toHaveCount(1);

  // Fuera el teléfono (con Web Chat, para que el grupo siga teniendo un canal).
  await irA(page, 'General');
  await canal(page, 'Web Chat').click();
  await canal(page, 'Teléfono').click();

  /* Solo se ve lo que aplica (visión de producto de grupos, 2026-09-25): ni su bloque ni el
   * teléfono saliente. Pero no se esfuma sin rastro: una línea dice que existe y dónde se
   * enciende (la decisión del 2026-09-23 contra las secciones que desaparecen). Y el índice no
   * encoge: sigue con sus cuatro secciones. */
  await irA(page, 'Distribución y colas');
  await expect(page.locator('#group-channel-phone')).toHaveCount(0);
  await expect(page.locator('#group-phone')).toHaveCount(0);
  await expect(page.locator('#group-section-distribution')).toContainText('Teléfono no está activo · actívalo en General');
  await expect(page.locator('sc-form-section-nav .form-nav__item')).toHaveCount(4);
});

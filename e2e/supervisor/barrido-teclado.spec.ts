import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * El teclado de las piezas que el barrido de PrimeNG pasó a su nativo (sección 7 de `docs/AUDIT-PRIMENG-CATALOGO.md`).
 *
 * Eran piezas hechas a mano con un `role` que prometía un teclado que no traían: un `div role="menu"`, un botón
 * `role="slider"` que solo atendía al clic, filas-botón con una casilla dentro. Cada prueba hace lo que el nativo
 * promete y la pieza a mano no hacía, así que se pone roja si alguien vuelve a la de antes. Que no vuelvan las vigila
 * también `audit:screen-hygiene` (8).
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('menú del avatar: el foco entra al abrirlo, las flechas recorren y Escape lo devuelve al avatar', async ({ page }) => {
  await goto(page, 'dashboard');
  const avatar = page.locator('.top-bar__avatar');
  await avatar.focus();
  await page.keyboard.press('Enter');

  const menu = page.getByRole('menu', { name: 'Mario Supervisor' });
  await expect(menu).toBeVisible();
  await expect(avatar).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => menu.evaluate((el) => el.contains(document.activeElement))).toBe(true);

  // La primera flecha marca «Atajos de teclado»; Intro abre la hoja: los atajos se alcanzan con el teclado.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Atajos de teclado' })).toBeVisible();
  await page.keyboard.press('Escape');

  await avatar.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(avatar).toBeFocused();
});

test('reproductor: la barra avanza con las flechas y con Re Pág', async ({ page }) => {
  await goto(page, 'conversaciones');
  await page.locator('[data-testid="conversations-table"] .p-datatable-tbody > tr').first().locator('td').nth(3).click();
  const player = page.locator('sc-memory-conversation-player-modal .p-dialog');
  await expect(player).toBeVisible();

  const barra = player.getByRole('slider', { name: 'Buscar posición' });
  const actual = player.locator('.player-audio__time').first();
  await barra.focus();
  await page.keyboard.press('ArrowRight');
  await expect(actual).toHaveText('00:01');
  await page.keyboard.press('PageUp');
  await expect(actual).toHaveText('00:11');
});

test('reproductor de varias grabaciones: el tramo activo es la barra, que avanza con las flechas y con Re Pág', async ({
  page,
}) => {
  await goto(page, 'conversaciones');
  await page.locator('.mock-sample-switcher__trigger').click();
  await page.getByRole('menuitem', { name: 'Solo multi-grabación' }).click();
  await page.locator('[data-testid="conversations-table"] .p-datatable-tbody > tr').first().locator('td').nth(3).click();
  const player = page.locator('sc-memory-multi-recording-player');
  await expect(player).toBeVisible();

  // Una sola barra con mando, la del tramo activo; los demás tramos son pista sin mando.
  const barra = player.getByRole('slider', { name: 'Buscar posición en el tramo activo' });
  await expect(barra).toHaveCount(1);
  const alto = (selector: string) => player.locator(selector).first().evaluate((el) => el.getBoundingClientRect().height);
  expect(await alto('.multi-rec__seg'), 'un tramo inactivo mide lo que la pista del slider').toBe(await alto('.p-slider-track'));
  const actual = player.locator('.multi-rec__time');
  await barra.focus();
  await page.keyboard.press('ArrowRight');
  await expect(actual).toContainText('00:01 /');
  await page.keyboard.press('PageUp');
  await expect(actual).toContainText('00:11 /');
  await expect(barra).toHaveAttribute('aria-valuetext', '00:11');
});

test('Numeración especial: una lista con flechas y Espacio, y su buscador por prefijo', async ({ page }) => {
  await goto(page, 'config/sistema');
  const seccion = page.locator('sc-numeracion-especial-section');
  const lista = seccion.getByRole('listbox', { name: 'Numeración especial' });
  await lista.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(lista.getByRole('option', { selected: true })).toHaveCount(1);
  await expect(seccion.locator('sc-chip')).toHaveCount(1);

  await seccion.getByRole('searchbox', { name: 'Buscar país, prefijo o código ISO...' }).fill('+34');
  await expect(lista.getByRole('option').first()).toContainText('España');
});

test('Regeneración de contraseñas: «marcar todo» y Espacio cambian la cifra de marcados', async ({ page }) => {
  await goto(page, 'config/sistema');
  const seccion = page.locator('sc-section-card').filter({ hasText: 'Regeneración de contraseñas' }).first();
  await seccion.locator('button[aria-expanded="false"]').first().click();
  const lista = seccion.getByRole('listbox', { name: 'Regeneración de contraseñas' });
  // `count()` no espera: sin esto, cuenta antes de que la sección desplegada pinte sus filas.
  await expect(lista.getByRole('option').first()).toBeVisible();
  const total = await lista.getByRole('option').count();
  expect(total, 'la lista enseña los agentes activos').toBeGreaterThan(0);

  await seccion.locator('.p-listbox-header .p-checkbox').first().click();
  await expect(seccion.locator('.agent-list__count')).toHaveText(`${total} seleccionados`);

  await lista.focus();
  await page.keyboard.press('Space');
  await expect(seccion.locator('.agent-list__count')).toHaveText(`${total - 1} seleccionados`);
});

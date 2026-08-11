import { expect, test } from '@playwright/test';

/**
 * CusCare · barra inferior de estado.
 *
 * Medida en la real: 38px de alto, fondo #2d333a, con el pill del agente
 * (178.7×27.4, radio 9.125, rojo #f75454 cuando NO está disponible) y el avatar.
 * Detalle que tenía mal: el texto del pill va casi NEGRO (#11131a), no blanco.
 *
 * El botón azul "SC" de abajo a la derecha NO se replica a propósito: en la app
 * real está inyectado en <body>, fuera de <app-root> — es un overlay de
 * terceros, no parte del producto (el mismo que ya se quitó del Agent).
 */

test('la barra está en el flujo y no tapa el engranaje', async ({ page }) => {
  await page.goto('/#/private/cuscare/tickets');

  const bar = page.locator('.statusbar');
  await expect(bar).toBeVisible();
  const box = await bar.boundingBox();
  expect(box?.height).toBeCloseTo(38, 0);

  // El gate de verdad: el engranaje sigue siendo pulsable (la barra `fixed` lo
  // tapaba y el botón parecía correcto pero no respondía).
  await page.locator('.nav__gear').click();
  await expect(page.locator('.settingsmenu')).toBeVisible();
});

test('el pill alterna entre disponible y no disponible', async ({ page }) => {
  await page.goto('/#/private/cuscare/tickets');

  const pill = page.locator('.statusbar__pill');
  await expect(pill).toHaveText('No available');
  await expect(pill).toHaveAttribute('aria-pressed', 'false');

  await pill.click();
  await expect(pill).toHaveText('Available');
  await expect(pill).toHaveAttribute('aria-pressed', 'true');
});

test('el pill usa el rojo medido y texto oscuro cuando no hay disponibilidad', async ({ page }) => {
  await page.goto('/#/private/cuscare/tickets');

  const pill = page.locator('.statusbar__pill');
  await expect(pill).toHaveCSS('background-color', 'rgb(247, 84, 84)');
  await expect(pill).toHaveCSS('color', 'rgb(17, 19, 26)');
});

test('NO se replica el widget "SC" (es de terceros, no del producto)', async ({ page }) => {
  await page.goto('/#/private/cuscare/tickets');

  // Si alguien lo añade "para que se parezca más", esto lo caza y obliga a
  // releer por qué se dejó fuera.
  await expect(page.getByRole('button', { name: 'SC', exact: true })).toHaveCount(0);
});

/**
 * El pill de la barra inferior no es solo un interruptor de disponibilidad:
 * **dentro de un ticket pasa a "Managed ticket" y se deshabilita**. Medido en
 * la real, donde la clase cambia a `status no-available disabled`: gestionando
 * un ticket no puedes tocar tu estado.
 */
test('dentro de un ticket el pill dice "Managed ticket" y no se puede pulsar', async ({ page }) => {
  await page.goto('/#/private/cuscare/tickets');
  const pill = page.locator('.statusbar__pill');
  await expect(pill).toHaveText('No available');
  await expect(pill).toBeEnabled();

  await page.goto('/#/private/cuscare/tickets/ticket/2050567');
  await expect(pill).toHaveText('Managed ticket');
  await expect(pill).toBeDisabled();

  // Y al volver a la lista recupera su estado normal.
  await page.goto('/#/private/cuscare/tickets');
  await expect(pill).toHaveText('No available');
  await expect(pill).toBeEnabled();
});

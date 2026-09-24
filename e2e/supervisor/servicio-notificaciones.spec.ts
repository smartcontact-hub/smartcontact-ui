import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * UNA NOTIFICACIÓN SIN DIRECCIÓN NO SE ENSEÑA COMO ENCENDIDA.
 *
 * En Contact Center → General, la tabla de notificaciones pintaba sus seis casillas marcadas y deshabilitadas
 * cuando no había URL: decían «esto se envía» de algo que no puede enviarse (hand-off del DS, 2026-09-12).
 * Ahora, sin URL, la casilla sale desmarcada; al escribir la dirección aparecen los eventos que vienen activos
 * por defecto. El dato guardado no cambia: solo deja de enseñarse lo que no puede pasar.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('Servicio · sin URL las casillas salen desmarcadas; con URL, activas y marcadas', async ({ page }) => {
  await goto(page, 'config/aed/servicio');
  const inicio = page.getByRole('checkbox', { name: 'Inicio — Entrante' });
  await inicio.scrollIntoViewIfNeeded();

  await expect(inicio).toBeDisabled();
  await expect(inicio, 'sin dirección la casilla dice «encendido»').toHaveAttribute('aria-checked', 'false');

  await page.locator('#general-notif-entrante').fill('mi-sistema.com/eventos');
  await expect(inicio).toBeEnabled();
  await expect(inicio, 'con dirección, el evento que viene activo por defecto se ve marcado').toHaveAttribute(
    'aria-checked',
    'true',
  );
});

/*
 * LA DIRECCIÓN SE LEE. Las tres columnas de casillas medían 175 cada una (como la matriz de Agentes) y el campo
 * de la dirección se quedaba en 121 px a 1440: no cabía ni `mi-sistema.com/eventos`. Ahora las casillas miden
 * su rótulo y la dirección se queda el resto (decisión de producto, 2026-09-15).
 */
test('Servicio · a 1440 la dirección cabe entera en su campo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'config/aed/servicio');
  const campo = page.locator('#general-notif-entrante');
  await campo.scrollIntoViewIfNeeded();
  await campo.fill('mi-sistema.com/eventos');
  const cabe = await campo.evaluate((e) => (e as HTMLInputElement).scrollWidth <= (e as HTMLInputElement).clientWidth);
  expect(cabe, 'la dirección no cabe en su campo: la columna vuelve a ser estrecha').toBe(true);
});

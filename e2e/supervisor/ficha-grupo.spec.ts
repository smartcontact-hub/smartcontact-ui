import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA FICHA DE GRUPO — «una página + pestañas».
 *
 * Esta red nace el 2026-09-23, el día que esta forma sustituyó a la de índice lateral. No es
 * opcional: al cambiar de forma, la ficha salió de `page-anatomy` (no tiene rail que medir) y de
 * `form-section-nav-legibility` (no tiene índice), así que sin esto se quedaba sin ninguna red
 * propia — y lo que se deja de medir es lo que se rompe.
 *
 * Lo que fija son las tres decisiones que definen la forma, no los píxeles de adorno:
 *
 *   1. UNA sola tira de pestañas gobierna TODO el contenido. Nada de un título suelto arriba y
 *      una tira debajo diciendo lo mismo.
 *   2. Se abre por donde se trabaja: al EDITAR, «Canales y agentes»; al CREAR, «Identidad»,
 *      porque sin nombre no hay grupo al que asignar agentes.
 *   3. La página se ensancha por `.ficha-tabs` SIN cambiar de arquetipo: sigue siendo `--rail`.
 *      Declarar dos arquetipos es lo que `audit:page-anatomy` prohíbe.
 */

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('la tira de pestañas gobierna la ficha, y abre por canales al editar', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');

  const pestañas = page.locator('[role="tab"]');
  await expect(pestañas).toHaveCount(5);

  // La activa es la primera y es la de canales: es lo que se toca de verdad en un grupo.
  await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText('Canales y agentes');

  // UNA sola sección pintada a la vez: la tira gobierna el contenido, no lo decora.
  await expect(page.locator('[id^="group-section-"]')).toHaveCount(1);
  await expect(page.locator('#group-section-channels')).toBeVisible();

  // Y no hay índice lateral: si vuelve, es que la forma se ha revertido a medias.
  await expect(page.locator('.page__rail')).toHaveCount(0);

  await page.locator('[role="tab"]', { hasText: 'Identidad' }).click();
  await expect(page.locator('#group-section-identity')).toBeVisible();
  await expect(page.locator('#group-section-channels')).toHaveCount(0);
});

test('al crear abre por Identidad: sin nombre no hay grupo al que asignar agentes', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/crear');

  await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText('Identidad');
  await expect(page.locator('#group-name')).toBeVisible();
});

test('la página se ensancha sin cambiar de arquetipo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/grupos/editar/1');

  const molde = await page.evaluate(() => {
    const el = document.querySelector('.page__inner') as HTMLElement;
    const s = getComputedStyle(el);
    return { clases: el.className, maxWidth: s.maxWidth, padding: s.padding };
  });

  // Un solo arquetipo declarado (`--rail`), ensanchado por su modificador de ficha.
  expect(molde.clases).toContain('page__inner--rail');
  expect(molde.clases).toContain('ficha-tabs');
  expect(molde.clases).not.toContain('page__inner--list');
  expect(molde.maxWidth).toBe('1600px');
  // El relleno del molde NO se toca: probarlo con `--list` lo dejaba a 0 por los cuatro lados.
  expect(molde.padding).toBe('22.75px 28px');
});

test('el nombre del grupo es el título de la página, y solo hay un h1', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');

  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveClass(/headline__name/);
  await expect(h1).not.toBeEmpty();
});

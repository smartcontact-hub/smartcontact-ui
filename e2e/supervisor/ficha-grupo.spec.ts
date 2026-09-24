import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA FICHA DE GRUPO — «una página + pestañas», y su alta, que es un diálogo.
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
 *   2. Se abre por donde se trabaja, «Canales y agentes». El ALTA no es esta página desde el
 *      2026-09-23: es un diálogo corto sobre la lista que pide lo que dice la CABECERA (la pieza de
 *      Identidad) y deja aquí. No pide canales (2026-09-24): la ficha abre por ellos, y pedirlos
 *      antes era enseñar al entrar lo que se acababa de rellenar.
 *   4. Los grupos no llevan cara (2026-09-23): ni foto en la ficha ni avatar en las listas. La foto
 *      de WhatsApp o Teams distingue un grupo de una persona porque van mezclados; aquí no.
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

  // Y no hay índice lateral ni cajas de sección: si vuelve uno, la forma se ha revertido a medias.
  await expect(page.locator('.page__rail')).toHaveCount(0);
  await expect(page.locator('sc-section-card')).toHaveCount(0);

  await page.locator('[role="tab"]', { hasText: 'Identidad' }).click();
  await expect(page.locator('#group-section-identity')).toBeVisible();
  await expect(page.locator('#group-section-channels')).toHaveCount(0);
});

test('crear es un diálogo corto: pide lo de la cabecera, no los canales, y deja en «Canales y agentes»', async ({
  page,
}) => {
  // La dirección de siempre sigue viva (paleta de comandos, enlaces guardados): abre el diálogo.
  await goto(page, 'admin/grupos/crear');
  const dialogo = page.getByRole('dialog', { name: 'Nuevo grupo' });
  await expect(dialogo).toBeVisible();
  await expect(page).toHaveURL(/admin\/grupos$/);

  // Rima con Identidad: los mismos tres campos, y ninguna casilla de canal (esas abren la ficha).
  await expect(page.locator('#group-create-phone')).toBeVisible();
  await expect(page.locator('#group-create-priority')).toBeVisible();
  await expect(dialogo.locator('sc-checkbox')).toHaveCount(0);

  // Lo obligatorio se dice al intentar crear, no al abrir.
  await dialogo.getByRole('button', { name: 'Crear' }).click();
  await expect(dialogo).toContainText('El nombre es obligatorio');

  // Un nombre que ya existe se dice en vivo.
  await page.locator('#group-create-name').fill('campaigns');
  await expect(dialogo).toContainText('Ya hay un grupo con este nombre');

  await page.locator('#group-create-name').fill(`E2E Alta ${Date.now()}`);
  await page.locator('#group-create-name').press('Enter');
  await expect(page).toHaveURL(/admin\/grupos\/editar\/\d+$/);
  await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText('Canales y agentes');
  // Lo que se rellenó en el alta es lo que dice la cabecera.
  await expect(page.locator('.headline__meta')).toContainText('Prioridad: Baja');
});

test('duplicar abre el mismo diálogo y se lleva los agentes del original', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const fila = page.locator('tbody tr', { hasText: 'Reclamaciones' });
  await fila.locator('.rules-kebab-btn').click();
  await page.getByRole('menuitem', { name: 'Duplicar' }).click();

  const dialogo = page.getByRole('dialog', { name: 'Duplicar grupo' });
  await expect(page.locator('#group-create-name')).toHaveValue('Reclamaciones (copia)');
  await dialogo.getByRole('button', { name: 'Duplicar' }).click();

  await expect(page).toHaveURL(/admin\/grupos\/editar\/\d+$/);
  await expect(page.locator('.headline__name')).toHaveText('Reclamaciones (copia)');
  await expect(page.locator('.assign tbody tr').first()).toBeVisible();
});

test('los grupos no llevan cara: ni avatar en las listas ni foto en la ficha', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await expect(page.locator('tbody tr').first()).toBeVisible();
  await expect(page.locator('tbody sc-illustrated-avatar')).toHaveCount(0);

  await goto(page, 'admin/grupos/editar/1');
  await page.locator('[role="tab"]', { hasText: 'Identidad' }).click();
  await expect(page.locator('#group-name')).toBeVisible();
  await expect(page.locator('sc-photo-upload')).toHaveCount(0);
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

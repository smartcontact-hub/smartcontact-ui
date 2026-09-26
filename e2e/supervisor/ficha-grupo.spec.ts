import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA FICHA DE GRUPO — índice lateral con cuatro secciones y el resumen debajo, y su alta, que es
 * un diálogo.
 *
 * Nace el 2026-09-23 como red de la forma «una página + pestañas»; el 2026-09-26 la ficha pasa al
 * índice lateral que pide la visión de producto de grupos (2026-09-25, DD-121) y esta red pasa con
 * ella. Lo que fija son las decisiones que definen la forma, no los píxeles de adorno:
 *
 *   1. UN índice lateral gobierna TODO el contenido: una sección a la vista, y abre en General,
 *      que es la que decide las demás (sus canales).
 *   2. El molde es el de Contact Center (`--rail`, índice de 196 y contenido de 920 a 1440), con
 *      la cabecera ENCIMA de los dos: el título arranca en la misma vertical que el índice.
 *   3. El índice y el resumen caben en la ventana: el carril es fijo y no tiene scroll.
 *   4. Los grupos no llevan cara (2026-09-23): ni foto en la ficha ni avatar en las listas.
 *   5. Recargar la ficha no es «otra pestaña»; abrirla en otra de verdad, sí.
 * El alta sigue siendo un diálogo corto sobre la lista hasta que pase a la propia ficha.
 */

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const indice = (page: Page) => page.locator('sc-form-section-nav');

test('el índice lateral gobierna la ficha, y abre por General', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');

  await expect(indice(page).locator('.form-nav__item')).toHaveCount(4);
  await expect(indice(page).locator('.form-nav__item[aria-current="true"] .form-nav__label')).toHaveText('General');

  // UNA sola sección pintada a la vez: el índice gobierna el contenido, no lo decora.
  await expect(page.locator('[id^="group-section-"]')).toHaveCount(1);
  await expect(page.locator('#group-section-general')).toBeVisible();

  // Y no vuelve la tira de pestañas: si reaparece, la forma se ha revertido a medias.
  await expect(page.locator('p-tabs')).toHaveCount(0);

  await indice(page).getByText('Agentes', { exact: true }).click();
  await expect(page.locator('#group-section-agents')).toBeVisible();
  await expect(page.locator('#group-section-general')).toHaveCount(0);
});

test('crear es un diálogo corto: pide lo de la cabecera, no los canales, y deja en General', async ({ page }) => {
  // La dirección de siempre sigue viva (paleta de comandos, enlaces guardados): abre el diálogo.
  await goto(page, 'admin/grupos/crear');
  const dialogo = page.getByRole('dialog', { name: 'Nuevo grupo' });
  await expect(dialogo).toBeVisible();
  await expect(page).toHaveURL(/admin\/grupos$/);

  // Los mismos campos que la cabecera, y ninguna casilla de canal (esas están en General).
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
  await expect(indice(page).locator('.form-nav__item[aria-current="true"] .form-nav__label')).toHaveText('General');
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
  await indice(page).getByText('Agentes', { exact: true }).click();
  await expect(page.locator('.assign tbody tr').first()).toBeVisible();
});

test('los grupos no llevan cara: ni avatar en las listas ni foto en la ficha', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await expect(page.locator('tbody tr').first()).toBeVisible();
  await expect(page.locator('tbody sc-illustrated-avatar')).toHaveCount(0);

  await goto(page, 'admin/grupos/editar/1');
  await expect(page.locator('#group-name')).toBeVisible();
  await expect(page.locator('sc-photo-upload')).toHaveCount(0);
  // En la ficha (no en la barra de arriba, que lleva la cara de quien usa la app).
  await expect(page.locator('.page__inner sc-illustrated-avatar')).toHaveCount(0);
});

test('el molde es el de Contact Center, con la cabecera encima del índice y del contenido', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/grupos/editar/1');

  const m = await page.evaluate(() => {
    const caja = (sel: string) => (document.querySelector(sel) as HTMLElement).getBoundingClientRect();
    const inner = document.querySelector('.page__inner') as HTMLElement;
    const s = getComputedStyle(inner);
    const h1 = caja('h1');
    const rail = caja('.page__rail');
    const main = caja('.page__main');
    return {
      clases: inner.className,
      maxWidth: s.maxWidth,
      padding: s.padding,
      h1: { x: Math.round(h1.left), abajo: h1.bottom },
      rail: { x: Math.round(rail.left), arriba: rail.top, ancho: Math.round(rail.width) },
      main: { ancho: Math.round(main.width), arriba: main.top },
    };
  });

  // Un solo arquetipo declarado (`--rail`); `ficha-rail` solo parte la fila para la cabecera.
  expect(m.clases).toContain('page__inner--rail');
  expect(m.clases).toContain('ficha-rail');
  expect(m.clases).not.toContain('ficha-tabs');
  expect(m.maxWidth).toBe('1200px');
  expect(m.padding).toBe('22.75px 28px');
  // El índice y el contenido miden lo de Contact Center: 196 y 1200 − 2×28 − 196 − 28 = 920.
  expect(m.rail.ancho).toBe(196);
  expect(m.main.ancho).toBe(920);
  // La cabecera va ENCIMA de los dos, y el título arranca en la vertical del índice.
  expect(m.h1.abajo).toBeLessThan(m.rail.arriba);
  expect(m.rail.arriba).toBe(m.main.arriba);
  expect(m.h1.x).toBe(m.rail.x);
});

test('el índice y el resumen caben en la ventana a 1440×900 (el carril no tiene scroll)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // El 11 es el grupo más cargado del seed: los cuatro canales, dos avisos y dos estrategias.
  await goto(page, 'admin/grupos/editar/11');
  await expect(page.locator('sc-group-summary')).toBeVisible();

  const fondo = await page.locator('.page__rail').evaluate((el) => el.getBoundingClientRect().bottom);
  // Medido el 2026-09-26: 918 con la primera maqueta del resumen (se cortaba Recursos), 844 hoy.
  expect(fondo).toBeLessThanOrEqual(900);
});

test('recargar la ficha no es «otra pestaña»; abrirla en otra de verdad, sí', async ({ page, context }) => {
  await goto(page, 'admin/grupos/editar/1');
  await page.reload();
  await expect(page.locator('main#main-content')).toBeVisible();
  await expect(page.locator('.headline__name')).toBeVisible();
  await expect(page.locator('.ficha-conflict')).toHaveCount(0);

  const otra = await context.newPage();
  await goto(otra, 'admin/grupos/editar/1');
  await expect(otra.locator('.ficha-conflict')).toBeVisible();
  // Y la primera se entera también (evento `storage`).
  await expect(page.locator('.ficha-conflict')).toBeVisible();
});

test('el nombre del grupo es el título de la página, y solo hay un h1', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');

  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveClass(/headline__name/);
  await expect(h1).not.toBeEmpty();
});

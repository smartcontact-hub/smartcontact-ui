import { expect, test, type Page } from '@playwright/test';

import { enNavegador } from '../shared/color';
import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL SIDEBAR SIGUE A SU TABLERO DE FIGMA (SISMAC-4340, nodo 14912:6324; DD-137).
 *
 * Lo que el tablero fija y el código no hacía hasta el 2026-10-01:
 *  - plegado a 80 sigue abierto lo que estaba abierto, sea o no la categoría de la página;
 *  - no hay botón de anclar;
 *  - texto e icono de la fila en blanco al 100% y la flecha al 60%;
 *  - todos los iconos a 14, y los que nombra el catálogo del tablero (nodo 14912:6774).
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const fila = (page: Page, key: string) => page.locator(`.nav-item[data-nav-key="${key}"]`);
const hijos = (page: Page, key: string) =>
  page.locator(`.nav-item[data-nav-key="${key}"] ~ .nav-item__children`);

const plegar = async (page: Page): Promise<void> => {
  await page.mouse.move(900, 450);
  await expect(page.locator('.sidebar')).not.toHaveClass(/sidebar--expanded/);
};

const rgba = (page: Page, selector: string, propiedad = 'color') =>
  page
    .locator(selector)
    .first()
    .evaluate(
      enNavegador((kit, el: Element, prop: string) => kit.rgba(getComputedStyle(el).getPropertyValue(prop))),
      propiedad,
    );

test('sidebar · plegado sigue abierta una categoría que no es la de la página', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await page.locator('.sidebar').hover();
  await fila(page, 'sidebar.supervision').click();
  await expect(hijos(page, 'sidebar.supervision')).toHaveClass(/nav-item__children--open/);

  await plegar(page);
  await expect(hijos(page, 'sidebar.supervision'), 'plegado se repliega Supervisión').toHaveClass(
    /nav-item__children--open/,
  );
  await expect(hijos(page, 'sidebar.administration')).toHaveClass(/nav-item__children--open/);
});

test('sidebar · sin botón de anclar', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await page.locator('.sidebar').hover();
  await expect(page.locator('.sidebar__anchor')).toHaveCount(0);
});

test('sidebar · texto e icono en blanco, flecha al 60% y el padre de la página en cyan', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await page.locator('.sidebar').hover();

  const blanco = [255, 255, 255, 1];
  expect(await rgba(page, '.nav-item[data-nav-key="sidebar.centro_control"] .nav-item__label')).toEqual(blanco);
  expect(await rgba(page, '.nav-item[data-nav-key="sidebar.centro_control"] .nav-item__icon')).toEqual(blanco);
  expect(await rgba(page, '.sidebar__section-title')).toEqual(blanco);

  const [r, g, b, a] = await rgba(page, '.nav-item[data-nav-key="sidebar.configuration"] .nav-item__chevron');
  expect([r, g, b]).toEqual([255, 255, 255]);
  expect(a).toBeCloseTo(0.6, 2);

  const acento = await rgba(page, '.nav-item[data-nav-key="sidebar.administration"] .nav-item__icon');
  const cyan = await page.evaluate(
    enNavegador((kit) =>
      kit.rgba(getComputedStyle(document.documentElement).getPropertyValue('--sc-color-cyan-300').trim()),
    ),
  );
  expect(acento, 'el padre de Grupos no lleva el cyan').toEqual(cyan);
});

test('sidebar · los iconos del catálogo del tablero, todos a 14', async ({ page }) => {
  await goto(page, 'nodo-ia/monitor');
  await page.locator('.sidebar').hover();
  await fila(page, 'sidebar.administration').click();

  const esperados: Record<string, string> = {
    'sidebar.supervision': 'monitoring',
    'sidebar.dashboard': 'space_dashboard',
    'sidebar.servicios': 'cell_tower',
    'sidebar.nodo_ia': 'neurology',
    'sidebar.monitor_ia': 'table_eye',
    'sidebar.estadisticas': 'analytics',
    'sidebar.vui_designer': 'account_tree',
    'sidebar.administration': 'groups',
    'sidebar.groups': 'group',
    'sidebar.agents': 'headphones',
    'sidebar.repositories': 'folder_open',
  };
  for (const [key, glifo] of Object.entries(esperados)) {
    const icono = fila(page, key).locator('.nav-item__icon .sc-icon');
    await expect(icono, key).toHaveText(glifo);
    await expect(icono, `${key} no mide 14`).toHaveCSS('font-size', '14px');
  }
});

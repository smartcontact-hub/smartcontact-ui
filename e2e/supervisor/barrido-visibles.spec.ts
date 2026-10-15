import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * Los cambios visibles del barrido de PrimeNG (sección 7 de `docs/AUDIT-PRIMENG-CATALOGO.md`, DD-205): la confirmación
 * sencilla pregunta en un `p-confirmpopup` pegado a lo que la pide, los pares de «Más filtros» no se quedan vacíos y
 * el menú del widget agrupa Tipo y Canal en submenús de `p-tieredmenu`. Cada prueba se pone roja con la pieza de antes.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('tabla de agentes del grupo: la casilla de «todos» pregunta en un globo junto a ella, y el foco vuelve al cerrarlo', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const table = page.locator('sc-agent-channel-table');
  await table.getByRole('button', { name: 'Todos', exact: true }).click();
  const todos = table.getByRole('columnheader', { name: 'Asignado', exact: true }).getByRole('checkbox');
  await todos.click();

  const globo = page.getByRole('alertdialog', { name: 'Confirmar cambios colectivos' });
  await expect(globo).toHaveClass(/p-confirmpopup/);
  await page.keyboard.press('Escape');
  await expect(globo).toHaveCount(0);
  await expect(todos).toBeFocused();
});

test('«Expirar contraseña» pregunta junto al botón, con el foco en Cancelar porque no se deshace', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1?seccion=configuracion');
  await page.locator('main').getByRole('button', { name: /Avanzado/ }).click();
  const boton = page.getByRole('button', { name: 'Expirar contraseña' });
  await boton.click();

  const globo = page.getByRole('alertdialog', { name: '¿Expirar contraseña?' });
  await expect(globo).toHaveClass(/p-confirmpopup/);
  await expect(globo.getByRole('button', { name: 'Cancelar' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(boton).toBeFocused();
});

test('«Más filtros»: un par no se queda sin ninguno marcado', async ({ page }) => {
  await goto(page, 'conversaciones');
  await page.getByRole('button', { name: /^Filtros de tipo y estado/ }).click();
  const tipo = page.getByRole('group', { name: 'Tipo de conversación' });
  const interna = tipo.getByRole('button', { name: 'Interna' });
  const externa = tipo.getByRole('button', { name: 'Externa' });

  await interna.click();
  await expect(interna).toHaveAttribute('aria-pressed', 'false');
  // Quitar el que queda dejaría la tabla en 0: no se deja, ni con el ratón ni con el teclado.
  await externa.click();
  await expect(externa).toHaveAttribute('aria-pressed', 'true');
  await externa.focus();
  await page.keyboard.press('Space');
  await expect(externa).toHaveAttribute('aria-pressed', 'true');
});

test('menú del widget: Tipo y Canal son submenús, la flecha derecha entra y «Quitar widget» sigue en rojo', async ({ page }) => {
  await goto(page, 'dashboard');
  await page.getByRole('button', { name: 'Más acciones de Tabla de agentes' }).click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem')).toHaveText(['Tipo', 'Canal', 'Editar', 'Quitar widget']);

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('menuitem', { name: 'Entrantes' })).toBeVisible();

  const peligro = await page.evaluate(() => {
    const muestra = document.body.appendChild(document.createElement('span'));
    muestra.style.color = 'var(--sc-text-danger)';
    const color = getComputedStyle(muestra).color;
    muestra.remove();
    return color;
  });
  await expect(page.locator('.sc-menu-item--danger .p-tieredmenu-item-link')).toHaveCSS('color', peligro);
});

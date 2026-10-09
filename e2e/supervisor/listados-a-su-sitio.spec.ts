import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA CIFRA DE UN LISTADO LLEVA A DONDE SE CAMBIA (DD-159).
 *
 * La revisión de producto del 2026-10-04: en Grupos, la cifra de agentes y el botón «Asignar» eran dos columnas para
 * lo mismo; y en Agentes, la cifra de grupos solo enseñaba sus nombres. Lo que fija:
 *   1. Grupos: la cifra de agentes abre la asignación de ESE grupo, y la columna «Asignar» desaparece. Al pasar por
 *      encima sigue diciendo quiénes son;
 *   2. Agentes: la cifra de grupos lleva a la sección «Grupos» de la ficha de ese agente, no a General. Se llamaba
 *      «Grupos asignados», y la primera, Identidad, hasta DD-187 (la ficha de agente con las secciones de la de grupo).
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('Grupos: la cifra de agentes abre su asignación, y ya no hay columna «Asignar»', async ({ page }) => {
  await goto(page, 'admin/grupos');
  // Por su nombre accesible: la cabecera de «Asignar» no lleva texto, solo `aria-label`.
  const cabeceras = await page
    .locator('sc-datatable thead th')
    .evaluateAll((ths) => ths.map((th) => th.getAttribute('aria-label') ?? th.textContent!.trim()));
  expect(cabeceras.length, 'la tabla, con sus cabeceras').toBeGreaterThan(3);
  expect(cabeceras.join(' · '), 'sin columna de asignar').not.toMatch(/Asignar/);

  const fila = page.locator('sc-datatable tbody tr', { hasText: 'ACD demo cuscare' });
  const cifra = fila.getByRole('button', { name: /\d+ agentes/ });
  await expect(cifra, 'la cifra nombra su acción y su grupo').toHaveAccessibleName(/Asignar agentes de ACD demo cuscare/);
  // Y se pulsa en al menos 24×24 (WCAG 2.5.8): pinta lo que mide su número, y la zona la agranda un `::after`.
  const zona = await cifra.evaluate((b) => {
    const r = b.getBoundingClientRect();
    const a = getComputedStyle(b, '::after');
    const agranda = a.content !== 'none' && a.position === 'absolute';
    return [Math.max(r.width, agranda ? parseFloat(a.width) : 0), Math.max(r.height, agranda ? parseFloat(a.height) : 0)];
  });
  expect(Math.min(...zona), 'el lado menor de la zona que se pulsa').toBeGreaterThanOrEqual(24);
  await cifra.click();
  await expect(page.locator('sc-group-agents-panel sc-agent-channel-table tbody tr').first()).toBeVisible();
  await expect(page, 'abre el panel, no la ficha').toHaveURL(/\/admin\/grupos$/);
});

test('Agentes: la cifra de grupos lleva a «Grupos» de su ficha', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const fila = page.locator('sc-datatable tbody tr', { hasText: 'Tom Hanks' });
  await fila.getByRole('button', { name: /\d+ grupos/ }).click();
  await expect(page).toHaveURL(/\/admin\/agentes\/editar\/\d+\?seccion=grupos$/);
  await expect(page.locator('sc-form-section-nav .form-nav__item[aria-current="page"] .form-nav__label')).toHaveText('Grupos');
});

import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LOS GRUPOS ASIGNADOS DE UN AGENTE (DD-204, revisión de producto del 2026-10-14).
 *
 * Lo que fija, en la tabla de la ficha de agente:
 *   1. Sin columna Nivel (el nivel lo pone el grupo, que es quien reparte por niveles), y a 1440 cabe sin desplazar.
 *   2. Salientes es un radio por fila: uno elegido, y elegir otro lo cambia y se guarda.
 *   3. Con «Activación por grupo», Habilitado lo sigue cambiando el supervisor: el interruptor se toca, sin candado.
 *   4. Desconectado no se cambia desde la ficha: el Estado se ve apagado.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('sin columna Nivel, y a 1440 la tabla cabe sin desplazar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/agentes/editar/1?seccion=grupos');
  const tabla = page.locator('sc-group-assignment-table');
  await tabla.locator('tbody tr').first().waitFor();
  await expect(tabla.getByRole('columnheader')).toHaveText(['', 'Grupo', /Teléfono/, /Chat/, /Email/, 'Salientes', /Habilitado/]);
  await expect(tabla.getByRole('columnheader', { name: /^Nivel/ })).toHaveCount(0);
  const desborda = await tabla
    .locator('.p-datatable-table-container')
    .evaluate((c) => c.scrollWidth - c.clientWidth);
  expect(desborda, 'lo que la tabla desplaza de lado').toBeLessThanOrEqual(0);
});

test('Salientes es un radio por fila: elegir otro grupo lo cambia y se guarda', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1?seccion=grupos');
  const tabla = page.locator('sc-group-assignment-table');
  const radios = tabla.getByRole('radio', { name: /^Sus llamadas salientes, por / });
  await expect(radios.first()).toBeVisible();
  await expect(tabla.getByRole('radio', { checked: true })).toHaveCount(1);
  const otro = tabla.getByRole('radio', { name: 'Sus llamadas salientes, por Campaigns', exact: true });
  await otro.check();
  await expect(otro).toBeChecked();
  await expect(tabla.getByRole('radio', { checked: true })).toHaveCount(1);
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (JSON.parse(localStorage.getItem('sc-agents') ?? '[]') as { id: number; defaultOutboundGroupId?: number }[]).find((a) => a.id === 1)?.defaultOutboundGroupId,
      ),
    )
    .toBeDefined();
  await goto(page, 'admin/agentes/editar/1?seccion=grupos');
  await expect(page.locator('sc-group-assignment-table').getByRole('radio', { name: 'Sus llamadas salientes, por Campaigns', exact: true })).toBeChecked();
});

test('con «Activación por grupo», Habilitado lo cambia el supervisor: sin candado, en las dos tablas', async ({ page }) => {
  // Morgan Freeman (7) tiene «Activación por grupo» en la semilla.
  await goto(page, 'admin/agentes/editar/7?seccion=grupos');
  const tabla = page.locator('sc-group-assignment-table');
  const interruptor = tabla.getByRole('switch').first();
  await expect(interruptor).toBeEnabled();
  await expect(tabla.locator('tbody').getByRole('button', { name: /Activación por grupo|Configuración/ })).toHaveCount(0);
  const antes = await interruptor.isChecked();
  await interruptor.click();
  await expect(interruptor).toBeChecked({ checked: !antes });

  await goto(page, 'admin/grupos/editar/1?seccion=agentes');
  const fila = page.locator('sc-agent-channel-table tbody tr', { hasText: 'Morgan Freeman' });
  await expect(fila.getByRole('switch')).toBeEnabled();
  await expect(fila.getByRole('link', { name: /Configuración de/ })).toHaveCount(0);
});

test('un agente desconectado no cambia de estado desde la ficha', async ({ page }) => {
  // Scarlett Johansson (6), desconectada en la semilla.
  await goto(page, 'admin/agentes/editar/6?seccion=general');
  await expect(page.locator('#agent-presence')).toHaveText('Desconectado');
  await expect(page.locator('#agent-presence')).toHaveAttribute('aria-disabled', 'true');
});

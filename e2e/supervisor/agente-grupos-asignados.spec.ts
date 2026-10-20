import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LOS GRUPOS ASIGNADOS DE UN AGENTE (DD-204, revisión de producto del 2026-10-14).
 *
 * Lo que fija, en la tabla de la ficha de agente:
 *   1. Sin columna Nivel (el nivel lo pone el grupo, que es quien reparte por niveles), y a 1440 cabe sin desplazar.
 *   2. El grupo de sus salientes, en un desplegable bajo la tabla (revisión de producto del 2026-10-15, que corrige el
 *      radio por fila de DD-204 §8): elegir otro lo cambia y se guarda, y en la tabla el elegido lleva su flecha. Sin
 *      ningún grupo con teléfono, el desplegable sale apagado y dice por qué.
 *   3. Con «Activación por grupo», Habilitado lo sigue cambiando el supervisor: el interruptor se toca, sin candado.
 *   4. Desconectado no se cambia desde la ficha: el Estado se ve apagado.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('sin columnas Nivel ni Salientes, y a 1440 la tabla cabe sin desplazar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/agentes/editar/1?seccion=grupos');
  const tabla = page.locator('sc-group-assignment-table');
  await tabla.locator('tbody tr').first().waitFor();
  await expect(tabla.getByRole('columnheader')).toHaveText(['', 'Grupo', /Teléfono/, /Chat/, /Email/, /Habilitado/]);
  await expect(tabla.getByRole('columnheader', { name: /^Nivel/ })).toHaveCount(0);
  const desborda = await tabla
    .locator('.p-datatable-table-container')
    .evaluate((c) => c.scrollWidth - c.clientWidth);
  expect(desborda, 'lo que la tabla desplaza de lado').toBeLessThanOrEqual(0);
});

test('el grupo de sus salientes, en un desplegable bajo la tabla: elegir otro lo cambia, lleva la flecha y se guarda', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1?seccion=grupos');
  const tabla = page.locator('sc-group-assignment-table');
  await expect(tabla.getByRole('radio')).toHaveCount(0);
  const desplegable = tabla.getByRole('combobox', { name: 'Grupo para llamadas salientes' });
  await expect(desplegable).toBeEnabled();
  // Va debajo de la tabla, no en una columna.
  const finTabla = await tabla.locator('.table-card').evaluate((e) => e.getBoundingClientRect().bottom);
  expect(await desplegable.evaluate((e) => e.getBoundingClientRect().top)).toBeGreaterThan(finTabla);
  const flecha = tabla.getByRole('img', { name: 'Grupo para llamadas salientes' });
  await expect(flecha, 'una sola fila lleva la flecha').toHaveCount(1);

  await desplegable.click();
  await page.getByRole('option', { name: 'Campaigns', exact: true }).click();
  await expect(tabla.locator('.p-select-label')).toHaveText('Campaigns');
  await expect(flecha).toHaveCount(1);
  await expect(tabla.locator('tbody tr', { has: page.getByRole('img', { name: 'Grupo para llamadas salientes' }) })).toContainText('Campaigns');
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (JSON.parse(localStorage.getItem('sc-agents') ?? '[]') as { id: number; defaultOutboundGroupId?: number }[]).find((a) => a.id === 1)?.defaultOutboundGroupId,
      ),
    )
    .toBeDefined();
  await goto(page, 'admin/agentes/editar/1?seccion=grupos');
  await expect(page.locator('sc-group-assignment-table .assign__outbound .p-select-label')).toHaveText('Campaigns');
});

test('sin ningún grupo con teléfono, el desplegable de salientes sale apagado y dice por qué', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1?seccion=grupos');
  const tabla = page.locator('sc-group-assignment-table');
  // Quita todos sus grupos con la casilla de «todos» de Asignado, que pregunta antes.
  await tabla.getByRole('checkbox', { name: 'Cambiar Asignado en los resultados filtrados' }).click();
  await page.getByRole('alertdialog', { name: /^¿Quitar el agente de \d+ grupos\?$/ }).getByRole('button', { name: 'Quitar', exact: true }).click();
  await expect(tabla.getByRole('checkbox', { name: /^Asignado — / , checked: true })).toHaveCount(0);
  const desplegable = tabla.getByRole('combobox', { name: 'Grupo para llamadas salientes' });
  await expect(desplegable).toBeDisabled();
  await expect(tabla.locator('.assign__outbound')).toContainText('Asigna un grupo con teléfono');
  await expect(tabla.getByRole('img', { name: 'Grupo para llamadas salientes' })).toHaveCount(0);
});

test('con «Activación por grupo», Habilitado se ve pero no se toca, y la casilla de «todos» lo salta, en las dos tablas', async ({ page }) => {
  // Como SISMAC-4058 (2026-10-20, revierte DD-204 §6): ese agente se habilita él mismo desde su puesto. Morgan Freeman
  // (7) tiene el permiso en la semilla; Tom Hanks (1), no.
  await goto(page, 'admin/agentes/editar/7?seccion=grupos');
  const tabla = page.locator('sc-group-assignment-table');
  const interruptor = tabla.locator('tbody').getByRole('switch').first();
  await expect(interruptor).toBeDisabled();
  // El de Habilitado: `.assign__locked` envuelve también el candado del último canal.
  await tabla.locator('tbody .assign__locked:has([role="switch"])').first().hover();
  await expect(page.locator('.p-tooltip')).toContainText('Activación por grupo');
  await expect(tabla.getByRole('columnheader', { name: 'Habilitado', exact: true }).getByRole('checkbox')).toBeDisabled();

  await goto(page, 'admin/grupos/editar/1?seccion=agentes');
  const filas = page.locator('sc-agent-channel-table tbody tr');
  await expect(filas.filter({ hasText: 'Morgan Freeman' }).getByRole('switch')).toBeDisabled();
  const tom = filas.filter({ hasText: 'Tom Hanks' }).getByRole('switch');
  await expect(tom).toBeEnabled();
  // La de «todos» cambia a los demás y deja a Morgan como estaba.
  const morganAntes = await filas.filter({ hasText: 'Morgan Freeman' }).getByRole('switch').isChecked();
  const todos = page.locator('sc-agent-channel-table').getByRole('columnheader', { name: 'Habilitado', exact: true }).getByRole('checkbox');
  await todos.click();
  // Doce agentes más en el grupo: siempre pregunta.
  await page.getByRole('alertdialog', { name: /^¿(Des)?[Hh]abilitar \d+ agentes\?$/ }).getByRole('button', { name: /^(Des)?[Hh]abilitar$/ }).click();
  await expect(filas.filter({ hasText: 'Morgan Freeman' }).getByRole('switch')).toBeChecked({ checked: morganAntes });
});

test('un agente desconectado no cambia de estado desde la ficha', async ({ page }) => {
  // Scarlett Johansson (6), desconectada en la semilla.
  await goto(page, 'admin/agentes/editar/6?seccion=general');
  await expect(page.locator('#agent-presence')).toHaveText('Desconectado');
  await expect(page.locator('#agent-presence')).toHaveAttribute('aria-disabled', 'true');
});

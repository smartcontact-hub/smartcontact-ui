import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * CREAR UN RECURSO ES EN REPOSITORIOS, NO DESDE LA FICHA (DD-217).
 *
 * Hasta la revisión de producto del 2026-10-20, cada «+» de Recursos (agenda y plantillas) abría un `sc-dialog` con el
 * formulario de Repositorios dentro, primero en las dos fichas y luego solo en la de agente. Desde DD-217 ninguna lo
 * tiene: Recursos son desplegables en chips y «Gestionar en Repositorios». Lo que fija:
 *   1. Ni la ficha de agente ni la de grupo tienen un «+» en Recursos, ni su diálogo.
 *   2. La tipificación no tiene «+» (DD-173): es un árbol con su ficha. Desde DD-187 se elige en General ›
 *      Postconversación; se crea en Repositorios, y su alta lleva su título con género: «Nueva tipificación».
 *   3. Recursos ya no enseña Etiquetas (DD-142), y el grupo conserva las suyas al guardar: el campo se queda hecho y
 *      apagado, por si vuelve.
 *   4. «Gestionar en Repositorios» sale de la ficha: sin cambios, va directo; con cambios, pregunta si guardar antes
 *      (SISMAC-4058, 2026-10-20), y sin que salte además el aviso de descartar.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Los «+» de Recursos, por su nombre: «Nueva agenda», «Nueva plantilla». */
const masDeRecursos = (page: Page, seccion: string) =>
  page.locator(seccion).getByRole('button', { name: /^Nueva (agenda|plantilla)$/ });

test('agente 1 y grupo 11 · Recursos sin «+» ni su diálogo: se crea en Repositorios', async ({ page }) => {
  for (const [ruta, seccion, campo] of [
    ['admin/agentes/editar/1?seccion=recursos', '#agent-section-resources', '#agent-agendas'],
    ['admin/grupos/editar/11?seccion=recursos', '#group-section-resources', '#group-agendas'],
  ] as const) {
    await goto(page, ruta);
    // El campo a la vista: así el cero de abajo no es de una sección sin pintar.
    await expect(page.locator(`sc-multiselect:has(${campo})`)).toBeVisible();
    await expect(masDeRecursos(page, seccion)).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator(seccion).getByRole('link', { name: 'Gestionar en Repositorios' })).toBeVisible();
  }
});

test('grupo 11 · la tipificación se elige en General y no tiene «+»: se crea en su ficha, con su título con género', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=general');
  await expect(page.locator('sc-select:has(#group-typification)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nueva tipificación', exact: true })).toHaveCount(0);

  await goto(page, 'admin/tipificaciones');
  await page.locator('sc-top-bar').getByRole('button', { name: 'Nueva tipificación', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/tipificaciones\/crear$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nueva tipificación');
  await expect(page.locator('main')).not.toContainText('Nuevo/a');
});

test('grupo 11 · sin tipificaciones, «Tipificar conversaciones» sale apagado y deshabilitado, y dice dónde se crean', async ({ page }) => {
  // SISMAC-4058: sin ninguna, no hay nada que pedir al agente, y el grupo se guarda sin ella.
  await page.addInitScript(() => {
    localStorage.setItem('sc-tipificaciones-v', '2');
    localStorage.setItem('sc-tipificaciones', '[]');
  });
  await goto(page, 'admin/grupos/editar/11?seccion=general');
  const tipificar = page.getByRole('switch', { name: 'Tipificar conversaciones' });
  await expect(tipificar).toBeDisabled();
  await expect(tipificar).not.toBeChecked();
  await expect(tipificar).toHaveAccessibleDescription('No hay tipificaciones: se crean en Repositorios.');
  await expect(page.locator('sc-select:has(#group-typification)')).toHaveCount(0);

  await page.locator('#group-wrapup-comments').click();
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.locator('.p-toast-message')).toContainText('Grupo «Online Support» actualizado');
  const guardado = await page.evaluate(() => (JSON.parse(localStorage.getItem('sc-groups')!) as { id: number; wrapUp?: { classify: boolean; typificationId: number | null } }[]).find((g) => g.id === 11)?.wrapUp);
  expect(guardado).toMatchObject({ classify: false, typificationId: null });
});

test('grupo 11 · Recursos no enseña Etiquetas, y el grupo conserva las suyas al guardar', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  const recursos = page.locator('#group-section-resources');
  // Las agendas a la vista: así el cero de abajo no es de una sección sin pintar.
  await expect(recursos.locator('sc-multiselect:has(#group-agendas)')).toBeVisible();
  await expect(recursos.locator('#group-labels')).toHaveCount(0);
  await expect(recursos.getByText('Etiquetas', { exact: true })).toHaveCount(0);
  // El resumen cuenta lo que se ve, por tipo (DD-204): tres agendas y seis plantillas de chat, sin las dos etiquetas. La
  // tipificación ya no es de Recursos: la elige la Postconversación de General (DD-187).
  await expect(page.locator('.ficha-summary')).toContainText(/Agendas\s*3(?!\d)/);
  await expect(page.locator('.ficha-summary')).toContainText(/Plantillas de chat\s*6(?!\d)/);

  // Guardar no las tira: el grupo 11 sigue con las suyas, por si Etiquetas vuelve. El cambio: quitarle una agenda.
  await recursos.locator('sc-multiselect:has(#group-agendas) .p-multiselect').click();
  await page.locator('.p-multiselect-overlay .p-multiselect-option').filter({ hasText: 'Ventas Nacional' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Grupo «Online Support» actualizado')).toBeVisible();
  const etiquetas = await page.evaluate(
    () => (JSON.parse(localStorage.getItem('sc-groups') ?? '[]') as { id: number; labels?: number[] }[]).find((g) => g.id === 11)?.labels,
  );
  expect(etiquetas).toEqual([3, 6]);
});

test('grupo 11 · «Gestionar en Repositorios» va directo sin cambios; con cambios, pide guardar antes y guarda', async ({ page }) => {
  const enlace = page.locator('#group-section-resources').getByRole('link', { name: 'Gestionar en Repositorios' });
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  await enlace.click();
  await expect(page).toHaveURL(/\/admin\/repositorios$/);
  await expect(page.getByRole('alertdialog', { name: '¿Guardar los cambios?' })).toHaveCount(0);

  await goto(page, 'admin/grupos/editar/11?seccion=general');
  const comentarios = page.locator('#group-wrapup-comments');
  const antes = await comentarios.isChecked();
  await comentarios.click();
  await page.locator('sc-form-section-nav .form-nav__item', { hasText: 'Recursos' }).click();
  await enlace.click();
  const pregunta = page.getByRole('alertdialog', { name: '¿Guardar los cambios?' });
  await expect(pregunta).toContainText('Para ir a Repositorios, guarda antes el grupo.');
  await pregunta.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(pregunta).toHaveCount(0);
  await expect(page).toHaveURL(/\/admin\/grupos\/editar\/11\?seccion=recursos$/);

  await enlace.click();
  await pregunta.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/repositorios$/);
  await expect(page.getByRole('dialog', { name: '¿Descartar cambios?' }), 'guardado, no hay nada que descartar').toHaveCount(0);
  await expect(page.locator('.p-toast-message')).toContainText('Grupo «Online Support» actualizado');
  const guardado = await page.evaluate(() => (JSON.parse(localStorage.getItem('sc-groups')!) as { id: number; wrapUp?: { comments?: boolean } }[]).find((g) => g.id === 11)?.wrapUp?.comments);
  expect(guardado).toBe(!antes);
});

test('agente 1 · «Gestionar en Repositorios» con cambios pide guardar antes, igual que en el grupo', async ({ page }) => {
  const enlace = page.locator('#agent-section-resources').getByRole('link', { name: 'Gestionar en Repositorios' });
  await goto(page, 'admin/agentes/editar/1?seccion=general');
  await page.locator('#agent-phone').fill('600111222');
  await page.locator('sc-form-section-nav .form-nav__item', { hasText: 'Recursos' }).click();
  await enlace.click();
  const pregunta = page.getByRole('alertdialog', { name: '¿Guardar los cambios?' });
  await expect(pregunta).toContainText('Para ir a Repositorios, guarda antes el agente.');
  await pregunta.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/repositorios$/);
  await expect(page.getByRole('dialog', { name: '¿Descartar cambios?' })).toHaveCount(0);
  await expect(page.locator('.p-toast-message')).toContainText('actualizado');
  const telefono = await page.evaluate(() => (JSON.parse(localStorage.getItem('sc-agents')!) as { id: number; phone?: string }[]).find((a) => a.id === 1)?.phone);
  expect(telefono).toBe('600111222');
});

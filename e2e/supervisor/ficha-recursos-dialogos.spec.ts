import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * CREAR UN RECURSO ES EN REPOSITORIOS, NO DESDE LA FICHA (DD-217).
 *
 * Hasta la revisión de producto del 2026-10-20, cada «+» de Recursos (agenda y plantillas) abría un `sc-dialog` con el
 * formulario de Repositorios dentro, primero en las dos fichas y luego solo en la de agente. Desde DD-217 ninguna lo
 * tiene: Recursos son desplegables en chips y «Gestionar en Repositorios». Lo que fija:
 *   1. La ficha de agente no tiene un «+» en Recursos, ni su diálogo.
 *   2. La tipificación no tiene «+» (DD-173): es un árbol con su ficha. Desde DD-187 se elige en General ›
 *      Postconversación; se crea en Repositorios, y su alta lleva su título con género: «Nueva tipificación».
 *   3. Agendas y Plantillas se asignan solo a agentes (DD-239): la ficha de grupo ya no enseña Repositorios en Recursos
 *      (ni Agendas, ni Plantillas, ni Etiquetas, ni «Gestionar en Repositorios»), pero conserva lo que el grupo tenía al
 *      guardar: el bloque se queda hecho y apagado, por si vuelve.
 *   4. «Gestionar en Repositorios» sale de la ficha de agente: sin cambios, va directo; con cambios, pregunta si guardar
 *      antes (SISMAC-4058, 2026-10-20), y sin que salte además el aviso de descartar. «Editar en Repositorios», en el
 *      detalle de la tipificación del grupo, igual (DD-224).
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Los «+» de Recursos, por su nombre: «Nueva agenda», «Nueva plantilla». */
const masDeRecursos = (page: Page, seccion: string) =>
  page.locator(seccion).getByRole('button', { name: /^Nueva (agenda|plantilla)$/ });

test('agente 1 · Recursos sin «+» ni su diálogo: se crea en Repositorios', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1?seccion=recursos');
  // El campo a la vista: así el cero de abajo no es de una sección sin pintar.
  await expect(page.locator('sc-multiselect:has(#agent-agendas)')).toBeVisible();
  await expect(masDeRecursos(page, '#agent-section-resources')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#agent-section-resources').getByRole('link', { name: 'Gestionar en Repositorios' })).toBeVisible();
});

test('grupo 11 · Recursos sin Repositorios: Agendas y Plantillas se asignan solo a agentes (DD-239)', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  const recursos = page.locator('#group-section-resources');
  // La sección sigue, con su Ficha de cliente a la vista: así los ceros de abajo no son de una sección sin pintar.
  await expect(recursos.getByText('Ficha de cliente', { exact: true })).toBeVisible();
  for (const campo of ['#group-agendas', '#group-templates-chat', '#group-templates-email', '#group-labels']) {
    await expect(recursos.locator(campo), campo).toHaveCount(0);
  }
  await expect(recursos.getByRole('link', { name: 'Gestionar en Repositorios' })).toHaveCount(0);
  await expect(masDeRecursos(page, '#group-section-resources')).toHaveCount(0);
  // El resumen no cuenta lo que ya no se asigna desde el grupo, ni deja un «Recursos» vacío.
  await expect(page.locator('#group-summary-resources')).toHaveCount(0);
  await expect(page.locator('.ficha-summary')).not.toContainText(/Agendas\s*\d/);
  await expect(page.locator('.ficha-summary')).not.toContainText(/Plantillas de chat\s*\d/);
  // El índice sigue con sus cuatro secciones: Recursos vale por la Ficha de cliente.
  await expect(page.locator('sc-form-section-nav .form-nav__item', { hasText: 'Recursos' })).toHaveCount(1);
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

test('grupo 11 · guardar conserva lo que el grupo tenía: etiquetas, agendas y plantillas, aunque ya no se vean', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=general');
  // Un cambio cualquiera para poder guardar. El grupo 11 trae tres agendas, seis plantillas y dos etiquetas de su semilla.
  await page.locator('#group-wrapup-comments').click();
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Grupo «Online Support» actualizado')).toBeVisible();
  const guardado = await page.evaluate(
    () =>
      (JSON.parse(localStorage.getItem('sc-groups') ?? '[]') as { id: number; labels?: number[]; schedules?: number[]; templates?: number[] }[]).find(
        (g) => g.id === 11,
      ),
  );
  expect(guardado?.labels).toEqual([3, 6]);
  expect(guardado?.schedules).toEqual([1, 2, 3]);
  expect(guardado?.templates).toEqual([1, 2, 3, 4, 5, 11]);
});

test('grupo 11 · «Editar en Repositorios» de la tipificación, con cambios, pide guardar antes (DD-224)', async ({ page }) => {
  const verDetalle = page.getByRole('button', { name: 'Ver detalle de «Atención al cliente»' });
  const arbol = page.getByRole('dialog', { name: 'Atención al cliente' });
  const editar = arbol.getByRole('link', { name: 'Editar en Repositorios' });
  const pregunta = page.getByRole('alertdialog', { name: '¿Guardar los cambios?' });
  const descartar = page.getByRole('dialog', { name: '¿Descartar cambios?' });

  // Sin cambios, directo a su ficha.
  await goto(page, 'admin/grupos/editar/11?seccion=general');
  await verDetalle.click();
  await editar.click();
  await expect(page).toHaveURL(/\/admin\/tipificaciones\/editar\/1\?seccion=categorias$/);
  await expect(pregunta).toHaveCount(0);

  // Con cambios, guardar antes; no «¿Descartar cambios?».
  await goto(page, 'admin/grupos/editar/11?seccion=general');
  const comentarios = page.locator('#group-wrapup-comments');
  const antes = await comentarios.isChecked();
  await comentarios.click();
  await verDetalle.click();
  await editar.click();
  await expect(pregunta).toContainText('Para ir a Repositorios, guarda antes el grupo.');
  await expect(descartar).toHaveCount(0);
  await expect(arbol, 'el detalle se cierra antes de preguntar').toBeHidden();
  await pregunta.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(page).toHaveURL(/\/admin\/grupos\/editar\/11\?seccion=general$/);

  await verDetalle.click();
  await editar.click();
  await pregunta.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/tipificaciones\/editar\/1\?seccion=categorias$/);
  await expect(descartar, 'guardado, no hay nada que descartar').toHaveCount(0);
  await expect(page.locator('.p-toast-message')).toContainText('Grupo «Online Support» actualizado');
  const guardado = await page.evaluate(() => (JSON.parse(localStorage.getItem('sc-groups')!) as { id: number; wrapUp?: { comments?: boolean } }[]).find((g) => g.id === 11)?.wrapUp?.comments);
  expect(guardado).toBe(!antes);
});

test('agente 1 · «Gestionar en Repositorios» con cambios pide guardar antes, igual que «Editar en Repositorios» en el grupo', async ({ page }) => {
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

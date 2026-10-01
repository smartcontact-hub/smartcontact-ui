import { expect, test, type Page } from '@playwright/test';

import { colorEfectivo } from '../shared/color';
import { disableAnimations, forceLightTheme, goto, irASeccion, pickSelectOption } from './helpers';

/**
 * QUÉ TRAE CADA TIPO DE USUARIO (DD-132): los cuatro tipos del documento de producto de usuarios y grupos, y cada
 * uno con su plantilla de acceso. Hasta el 2026-09-28 el tipo no significaba nada: elegirlo no marcaba ni una
 * casilla, y un alta nacía «Agente» con todo apagado.
 *
 * Lo que fija:
 *   1. Cuatro tipos, del que más puede al que menos. El alta nace Supervisor Offline con su plantilla: la
 *      supervisión y nada de lo sensible.
 *   2. En un alta que nadie ha tocado, elegir otro tipo marca su plantilla sin preguntar.
 *   3. Al editar, cambiar el tipo pregunta cuántas casillas cambian. Mantenerlas deja el desvío a la vista, y
 *      «Volver a la plantilla» lo quita.
 *   4. Lo guardado con los tipos de antes se lee como Supervisor Offline, con las casillas nuevas apagadas.
 *   5. El listado nombra los tipos nuevos.
 *
 * Storage limpio por test → cada store de admin re-siembra su seed.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const tipo = (page: Page) => page.getByRole('combobox', { name: 'Tipo de usuario' });
const plantilla = (page: Page) => page.locator('#user-section-access .access-template');
/** Las cifras del resumen, como las lee un lector de pantalla: «9 de 16», «0 de 9». */
const resumen = (page: Page) => page.locator('sc-summary-kpi .visually-hidden');
/** Por su nombre EXACTO: «Grupos» no es «Gestión de grupos», ni «Contact Center» su gestión. */
const casilla = (page: Page, nombre: string) =>
  page.locator('#user-section-access').getByRole('checkbox', { name: nombre, exact: true });

test('cuatro tipos, y el alta nace Supervisor Offline con su plantilla: la supervisión y nada sensible', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');
  await expect(tipo(page)).toHaveText('Supervisor Offline');
  await tipo(page).click();
  await expect(page.locator('.p-select-overlay .p-select-option')).toHaveText([
    'Superadmin',
    'Administrador',
    'Supervisor Online',
    'Supervisor Offline',
  ]);
  await page.keyboard.press('Escape');

  await irASeccion(page, 'Acceso');
  await expect(plantilla(page)).toHaveText('Plantilla: Supervisor Offline');
  await expect(resumen(page)).toHaveText(['9 de 16', '0 de 9']);
  await expect(casilla(page, 'Tipificaciones')).toBeChecked();
  await expect(casilla(page, 'Grupos')).not.toBeChecked();
  await expect(casilla(page, 'Espiar conversaciones')).not.toBeChecked();
});

test('en un alta sin tocar, elegir otro tipo marca su plantilla sin preguntar', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');
  await pickSelectOption(page, tipo(page), 'Administrador');
  await expect(page.getByRole('dialog', { name: /¿Aplicar la plantilla/ })).toHaveCount(0);

  await irASeccion(page, 'Acceso');
  await expect(plantilla(page)).toHaveText('Plantilla: Administrador');
  await expect(resumen(page)).toHaveText(['15 de 16', '6 de 9']);
  await expect(casilla(page, 'Contact Center')).toBeChecked();
  await expect(casilla(page, 'Sistema')).not.toBeChecked();
});

test('al editar, cambiar el tipo pregunta; mantener deja el desvío y «Volver a la plantilla» lo quita', async ({ page }) => {
  // U002 es Supervisor Online con un cambio a mano (gestiona grabaciones).
  await goto(page, 'admin/usuarios/editar/2?seccion=acceso');
  await expect(plantilla(page)).toContainText('Plantilla: Supervisor Online');
  await expect(plantilla(page)).toContainText('1 cambio');

  await irASeccion(page, 'Identidad');
  await pickSelectOption(page, tipo(page), 'Administrador');
  const aviso = page.getByRole('dialog', { name: '¿Aplicar la plantilla de Administrador?' });
  await expect(aviso).toBeVisible();
  await expect(aviso).toContainText('Cambia 7 casillas de Acceso');
  await aviso.getByRole('button', { name: 'Mantener las casillas' }).click();
  await expect(aviso).toHaveCount(0);
  await expect(tipo(page)).toHaveText('Administrador');

  await irASeccion(page, 'Acceso');
  await expect(plantilla(page)).toContainText('Plantilla: Administrador');
  await expect(plantilla(page)).toContainText('7 cambios');
  // Un botón de texto en la variante `contrast`: en `secondary` medía 2,95:1 sobre la tarjeta (medido el 2026-09-28).
  const volver = plantilla(page).getByRole('button', { name: 'Volver a la plantilla' });
  expect((await volver.locator('span').first().evaluate(colorEfectivo)).ratio, 'AA sobre la tarjeta').toBeGreaterThanOrEqual(4.5);
  await volver.click();
  await expect(plantilla(page)).toHaveText('Plantilla: Administrador');
  await expect(resumen(page)).toHaveText(['15 de 16', '6 de 9']);
  await expect(page.getByRole('button', { name: 'Guardar' })).toBeEnabled();
});

test('lo guardado con los tipos de antes se lee como Supervisor Offline, con las casillas nuevas apagadas', async ({ page }) => {
  // Un usuario de antes: tipo «viewer» y solo las secciones de entonces, «Grupos / Agentes / Tipificaciones» incluida.
  await page.addInitScript(() => {
    localStorage.setItem('sc-users-v', '1');
    localStorage.setItem(
      'sc-users',
      JSON.stringify([
        {
          id: 7,
          code: 'U007',
          name: 'Usuario de antes',
          email: 'antes@example.com',
          identifier: 'ANT007',
          type: 'viewer',
          sections: { dashboard: true, conversations: true, groupsAgentsTypifications: true },
          permissions: { usersManagement: false },
          assignedGroups: [],
          assignedServices: [],
          status: 'active',
          createdAt: '2025-01-01',
        },
      ]),
    );
  });
  await goto(page, 'admin/usuarios');
  await expect(page.locator('tbody tr', { hasText: 'Usuario de antes' })).toContainText('Supervisor Offline');

  await goto(page, 'admin/usuarios/editar/7?seccion=acceso');
  await expect(resumen(page)).toHaveText(['2 de 16', '0 de 9']);
  // La casilla vieja no concede nada nuevo: Grupos, Agentes y Tipificaciones salen apagadas.
  for (const nombre of ['Grupos', 'Agentes', 'Tipificaciones']) await expect(casilla(page, nombre)).not.toBeChecked();
  await expect(plantilla(page)).toContainText('Plantilla: Supervisor Offline');
});

test('el listado nombra los tipos nuevos', async ({ page }) => {
  await goto(page, 'admin/usuarios');
  const fila = (codigo: string) => page.locator('tbody tr', { hasText: codigo });
  await expect(fila('Mario Supervisor')).toContainText('Superadmin');
  await expect(fila('Roberto Sánchez')).toContainText('Administrador');
  await expect(fila('Laura Martínez')).toContainText('Supervisor Online');
  await expect(fila('Ana López')).toContainText('Supervisor Offline');
});

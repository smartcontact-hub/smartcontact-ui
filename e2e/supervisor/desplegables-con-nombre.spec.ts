import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * CADA DESPLEGABLE SE OYE CON SU RÓTULO, NO CON SU VALOR (DD-133).
 *
 * PrimeNG pinta el select como `<span role="combobox">`. Un `<label for>` no nombra un span, y un combobox sin nombre
 * PrimeNG lo nombra con la opción elegida: el lector oía «Automático, combobox» donde la pantalla dice «Descuelgue de
 * llamadas». Medido el 2026-10-05 recorriendo las secciones de las fichas, Sistema y el constructor de reglas. Lo que
 * fija:
 *   1. en las fichas de agente y de grupo, cada desplegable se oye con el rótulo que tiene encima;
 *   2. en Sistema, las dos políticas de contraseña, con el nombre de su fila;
 *   3. en el constructor de reglas, los de una condición, que no tienen rótulo a la vista, con lo que eligen.
 *
 * Que no aparezca otro sin nombre lo vigila `audit:screen-hygiene` en el código.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const nombres = async (page: Page, esperados: Record<string, string>) => {
  for (const [selector, nombre] of Object.entries(esperados)) {
    await expect(page.locator(selector), selector).toHaveAccessibleName(nombre);
  }
};

test('la ficha de agente: tipo, estado y chats simultáneos se oyen con su rótulo', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1');
  // «Estado» desde la revisión del 2026-10-09 (antes «Presencia inicial»), en General.
  await nombres(page, { '#agent-type': 'Tipo de agente', '#agent-presence': 'Estado' });
  // El descuelgue es ahora una elección de tarjetas, no un desplegable; los chats simultáneos, en Avanzado (plegado).
  await goto(page, 'admin/agentes/editar/1?seccion=configuracion');
  await page.getByRole('button', { name: /Avanzado/ }).click();
  await nombres(page, { '#agent-max-chats': 'Chats simultáneos' });
});

test('la ficha de grupo: la tipificación, «Nº agentes simultáneos» y «Dentro de cada nivel» se oyen con su rótulo', async ({ page }) => {
  // Desde DD-187 el grupo elige UNA, en General › Postconversación.
  await goto(page, 'admin/grupos/editar/11?seccion=general');
  await nombres(page, { '#group-typification': 'Tipificación' });
  // Grupo 7: llama a todos (Ring All). Grupo 9: Niveles.
  await goto(page, 'admin/grupos/editar/7?seccion=distribucion');
  await nombres(page, { '#group-ring-all': 'Nº agentes simultáneos' });
  await goto(page, 'admin/grupos/editar/9?seccion=distribucion');
  await nombres(page, { '#group-sub-strategy': 'Dentro de cada nivel' });
});

test('Sistema: cada política de contraseña se oye con el nombre de su fila', async ({ page }) => {
  await goto(page, 'config/sistema');
  for (const fila of ['Longitud mínima', 'Expiración de contraseñas']) {
    const desplegable = page.locator('.policy-row').filter({ hasText: fila }).getByRole('combobox');
    await expect(desplegable, fila).toHaveAccessibleName(fila);
  }
});

test('el constructor de reglas: el campo y el operador de una condición se oyen por lo que eligen', async ({ page }) => {
  await goto(page, 'conversaciones/reglas/nueva?seccion=alcance');
  const condicion = page.locator('.cond-row').first();
  await expect(condicion.locator('.cond-row__field').getByRole('combobox')).toHaveAccessibleName('Campo');
  await expect(condicion.locator('.cond-row__op').getByRole('combobox')).toHaveAccessibleName('Operador');
});

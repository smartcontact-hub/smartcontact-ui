import { expect, test } from '@playwright/test';

import { goto } from './helpers';

/**
 * JUEGO DE DATOS — `?datos=tortura` estira los textos de la demo, `?datos=editorial` da a los grupos
 * su nombre de negocio y `?datos=demo` vuelve a los de siempre, sin que uno pise al otro (DD-124).
 *
 * Qué afirma: que el juego llega de verdad a los almacenes (un nombre de la lista cambia), que se
 * recuerda al navegar sin el parámetro, que vuelve, y que cada juego guarda en SUS claves. No afirma
 * nada de cómo se ven los textos largos: eso es para mirarlo (`npm run revision -- --datos tortura …`).
 */

test('tortura estira los textos, se recuerda al navegar, y demo vuelve a los de siempre', async ({ page }) => {
  await goto(page, 'admin/grupos?datos=tortura');
  await expect(page.getByText('ACD Demo C2CB — atención de incidencias de segundo nivel', { exact: false }).first()).toBeVisible();

  // Sin parámetro, la sesión recuerda el juego: una persona de la lista de agentes con su apellido largo.
  await goto(page, 'admin/agentes');
  await expect(page.getByText('Tom Hanks Fernández-Villaverde de la Concepción').first()).toBeVisible();

  await goto(page, 'admin/grupos?datos=demo');
  await expect(page.getByText('ACD Demo C2CB', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('atención de incidencias de segundo nivel', { exact: false })).toHaveCount(0);

  // Leer un almacén sella su versión (escribir los datos solo pasa al editar): las dos marcas, cada una
  // en su clave, dicen que los dos juegos se han leído sin compartir sitio.
  const claves = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('sc-groups-v')).sort());
  expect(claves, 'cada juego guarda en sus claves').toEqual(['sc-groups-v', 'sc-groups-v@tortura']);
});

test('editorial da a los grupos su nombre de negocio, también donde el nombre vive fuera del almacén', async ({ page }) => {
  await goto(page, 'admin/grupos?datos=editorial');
  await expect(page.getByText('Atención al cliente', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('ACD Demo C2CB', { exact: true })).toHaveCount(0);

  // Las conversaciones viven en memoria y repiten el nombre del grupo: «Soporte Taller» es «Segundo nivel».
  await goto(page, 'conversaciones');
  await expect(page.getByText('Segundo nivel', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Soporte Taller', { exact: true })).toHaveCount(0);

  await goto(page, 'admin/grupos?datos=demo');
  await expect(page.getByText('ACD Demo C2CB', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Atención al cliente', { exact: true })).toHaveCount(0);
});

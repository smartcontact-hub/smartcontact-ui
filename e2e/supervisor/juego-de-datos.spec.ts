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

  // Las conversaciones viven en memoria y repiten el nombre del grupo: «Soporte Taller» es «Segundo nivel». Y las
  // colas que solo viven ahí también tienen el suyo: ninguna de prueba en el juego para enseñar la app.
  await goto(page, 'conversaciones');
  await expect(page.getByText('Segundo nivel', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Desbordamiento', { exact: true }).first()).toBeVisible();
  for (const deSiempre of ['Soporte Taller', 'COLA_PRUEBA', 'Soporte Nivel 1', 'Soporte Nivel 2', 'Clientes vip']) {
    await expect(page.getByText(deSiempre, { exact: true }), `«${deSiempre}» sin nombre de negocio`).toHaveCount(0);
  }

  await goto(page, 'admin/grupos?datos=demo');
  await expect(page.getByText('ACD Demo C2CB', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Atención al cliente', { exact: true })).toHaveCount(0);
});

test('el juego se elige también en Configuración → Sistema, y manda sobre el de la dirección', async ({ page }) => {
  // Se entra con tortura en la dirección: elegir otro juego tiene que ganarle, no volver a tortura al recargar.
  await goto(page, 'config/sistema?datos=tortura');
  const juego = page.getByRole('group', { name: 'Juego de datos' });
  await expect(juego.getByRole('button', { name: 'Tortura' })).toHaveAttribute('aria-pressed', 'true');

  await juego.getByRole('button', { name: 'Editorial' }).click();
  await expect(page).toHaveURL(/datos=editorial/);
  await expect(juego.getByRole('button', { name: 'Editorial' })).toHaveAttribute('aria-pressed', 'true');

  // Sin parámetro, la pestaña recuerda el juego elegido.
  await goto(page, 'admin/grupos');
  await expect(page.getByText('Atención al cliente', { exact: true }).first()).toBeVisible();

  await goto(page, 'config/sistema');
  const juegoDeNuevo = page.getByRole('group', { name: 'Juego de datos' });
  await juegoDeNuevo.getByRole('button', { name: 'Demo' }).click();
  await expect(page).toHaveURL(/datos=demo/);
  await expect(juegoDeNuevo.getByRole('button', { name: 'Demo' })).toHaveAttribute('aria-pressed', 'true');
  await goto(page, 'admin/grupos');
  await expect(page.getByText('ACD Demo C2CB', { exact: true }).first()).toBeVisible();
});

import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * REPOSITORIOS: CUÁNTOS HAY DE CADA UNO, Y UN BUSCADOR (DD-165).
 *
 * La revisión de producto del 2026-10-04: el hub se queda como está, con un dato más (cuántas agendas hay, que de
 * horarios no hay ninguno) y un buscador. Lo que fija:
 *   1. cada fila dice cuántos hay, la misma cifra que enseña su lista, y el lector la oye con el nombre de la fila;
 *   2. las filas de IA cuentan lo que enseñan sus páginas de Conversaciones, adonde llevan;
 *   3. el buscador filtra por nombre y descripción, y sin resultados lo dice, con «Limpiar búsqueda».
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const filasDeLista = async (page: Page, ruta: string): Promise<number> => {
  await goto(page, ruta);
  await page.locator('tbody tr').first().waitFor();
  return page.locator('tbody tr').count();
};

test('cada fila dice cuántos hay, la cifra de su lista, y el lector la oye con su nombre', async ({ page }) => {
  const tipificaciones = await filasDeLista(page, 'admin/tipificaciones');
  const reglas = await filasDeLista(page, 'conversaciones/reglas');
  await goto(page, 'admin/repositorios');
  const fila = page.getByRole('menuitem', { name: `Tipificaciones (${tipificaciones})`, exact: true });
  await expect(fila).toBeVisible();
  await expect(fila.locator('.hub-link__count')).toHaveText(String(tipificaciones));
  await expect(page.getByRole('menuitem', { name: `Reglas IA (${reglas})`, exact: true })).toBeVisible();
});

test('el buscador filtra por nombre y descripción; sin resultados lo dice, con «Limpiar búsqueda»', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  const filas = page.getByRole('menuitem');
  const todas = await filas.count();
  const buscador = page.getByRole('searchbox');

  await buscador.fill('tipif');
  await expect(filas).toHaveCount(1);
  await expect(filas).toContainText('Tipificaciones');
  // También por la descripción: «turnos» solo está en la de Horarios.
  await buscador.fill('turnos');
  await expect(filas).toHaveCount(1);
  await expect(filas).toContainText('Horarios');

  await buscador.fill('zzz');
  await expect(filas).toHaveCount(0);
  await expect(page.locator('sc-empty-state')).toBeVisible();
  // El del vacío: el buscador lleva su propio botón de limpiar, con el mismo nombre.
  await page.locator('sc-empty-state').getByRole('button', { name: 'Limpiar búsqueda' }).click();
  await expect(buscador).toHaveValue('');
  await expect(filas).toHaveCount(todas);
});

import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * REPOSITORIOS EN TARJETAS POR GRUPO, CON SU PANEL (DD-179; las cifras y el buscador, DD-165).
 *
 * El hub dejó de ser el `Menu` del DS: cada destino es una tarjeta de su grupo, con su tono, y pulsarla abre a la
 * derecha un panel con lo que hay dentro. Lo que fija:
 *   1. cada tarjeta dice cuántos hay, la misma cifra que enseña su lista, y el lector la oye con su nombre;
 *   2. el buscador filtra por nombre y descripción, y sin resultados lo dice, con «Limpiar búsqueda»;
 *   3. el filtro deja solo un grupo, con la opción elegida en su tono, y pulsarla otra vez vuelve a todos;
 *   4. el panel: lo abre su tarjeta, con sus entradas; otra tarjeta lo cambia; lo cierran la misma tarjeta, Escape y
 *      un clic fuera; «Abrir repositorio» y cada entrada llevan a su sitio;
 *   5. con el teclado, el foco entra en el panel y vuelve a su tarjeta;
 *   6. acoplado, no tapa ninguna tarjeta y va sin velo; si las taparía, lleva velo y es un diálogo;
 *   7. todo cabe sin desplazar a 1440 × 800;
 *   8. el buscador vacío ofrece los últimos repositorios abiertos, el último primero.
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

const tarjeta = (page: Page, nombre: string) => page.locator('.repo-card', { hasText: nombre }).first();
const panel = (page: Page) => page.locator('#repo-panel');

test('cada tarjeta dice cuántos hay, la cifra de su lista, y el lector la oye con su nombre', async ({ page }) => {
  const tipificaciones = await filasDeLista(page, 'admin/tipificaciones');
  const reglas = await filasDeLista(page, 'conversaciones/reglas');
  await goto(page, 'admin/repositorios');
  const fila = page.getByRole('button', { name: `Tipificaciones (${tipificaciones})`, exact: true });
  await expect(fila).toBeVisible();
  await expect(fila.locator('.repo-card__count')).toHaveText(String(tipificaciones));
  await expect(page.getByRole('button', { name: `Reglas IA (${reglas})`, exact: true })).toBeVisible();
});

test('el buscador filtra por nombre y descripción; sin resultados lo dice, con «Limpiar búsqueda»', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  const tarjetas = page.locator('.repo-card');
  const todas = await tarjetas.count();
  const buscador = page.getByRole('searchbox');

  await buscador.fill('tipif');
  await expect(tarjetas).toHaveCount(1);
  await expect(tarjetas).toContainText('Tipificaciones');
  // También por la descripción: «turnos» solo está en la de Horarios.
  await buscador.fill('turnos');
  await expect(tarjetas).toHaveCount(1);
  await expect(tarjetas).toContainText('Horarios');

  await buscador.fill('zzz');
  await expect(tarjetas).toHaveCount(0);
  await expect(page.locator('sc-empty-state')).toBeVisible();
  // El del vacío: el buscador lleva su propio botón de limpiar, con el mismo nombre.
  await page.locator('sc-empty-state').getByRole('button', { name: 'Limpiar búsqueda' }).click();
  await expect(buscador).toHaveValue('');
  await expect(tarjetas).toHaveCount(todas);
});

test('el filtro deja solo su grupo, con la opción elegida en su tono; pulsarla otra vez vuelve a todos', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  const grupos = page.locator('.cat');
  await expect(grupos).toHaveCount(4);

  const ia = page.getByRole('button', { name: 'IA', exact: true });
  await ia.click();
  await expect(grupos).toHaveCount(1);
  await expect(grupos).toHaveAttribute('data-tono', 'orange');
  // La opción elegida se escribe en el tono de su grupo: el mismo color que el título del grupo.
  const color = (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).color);
  expect(await color('.hub-filter__label[data-tono="orange"]')).toBe(await color('.cat__title'));

  await ia.click();
  await expect(grupos).toHaveCount(4);
  await expect(page.locator('.hub-filter__label[data-tono]')).toHaveCount(0);
});

test('el panel: lo abre su tarjeta con sus entradas; otra lo cambia; lo cierran la misma, Escape y un clic fuera', async ({
  page,
}) => {
  const agendas = await filasDeLista(page, 'admin/agendas');
  await goto(page, 'admin/repositorios');

  const agenda = tarjeta(page, 'Agendas');
  await agenda.click();
  await expect(agenda).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.p-drawer-title')).toHaveText('Agendas');
  await expect(panel(page).locator('.entrada')).toHaveCount(agendas);

  // Otra tarjeta cambia el panel.
  await tarjeta(page, 'Variables').click();
  await expect(page.locator('.p-drawer-title')).toHaveText('Variables');
  await expect(agenda).toHaveAttribute('aria-expanded', 'false');

  // La misma tarjeta lo cierra.
  await tarjeta(page, 'Variables').click();
  await expect(page.locator('.repo-card--selected')).toHaveCount(0);
  await expect(panel(page)).toHaveCount(0);

  // Escape lo cierra.
  await agenda.click();
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);

  // Un clic fuera (el título de la página) lo cierra; uno dentro del panel, no.
  await agenda.click();
  await panel(page).locator('.panel__description').click();
  await expect(panel(page)).toBeVisible();
  await page.locator('h1').click();
  await expect(panel(page)).toHaveCount(0);
});

test('«Abrir repositorio» lleva a su página, y cada entrada a su sitio', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').click();
  await panel(page).getByRole('button', { name: 'Abrir repositorio' }).click();
  await expect(page).toHaveURL(/\/admin\/agendas$/);

  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Tipificaciones').click();
  await panel(page).locator('.entrada').first().click();
  await expect(page).toHaveURL(/\/admin\/tipificaciones\/editar\/\d+$/);
});

test('con el teclado, Enter abre el panel y lleva el foco dentro; Escape lo devuelve a su tarjeta', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  const agenda = tarjeta(page, 'Agendas');
  await agenda.focus();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toBeVisible();
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('#repo-panel'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await expect(agenda).toBeFocused();
});

test('acoplado no tapa ninguna tarjeta y va sin velo; si las taparía, lleva velo y es un diálogo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').click();
  const drawer = page.locator('.p-drawer');
  await expect(drawer).toHaveAttribute('role', 'complementary');
  const borde = await drawer.evaluate((el) => el.getBoundingClientRect().left);
  const derecha = await page.locator('.repo-card').evaluateAll((els) => Math.max(...els.map((e) => e.getBoundingClientRect().right)));
  expect(derecha).toBeLessThanOrEqual(borde);
  await expect(page.locator('.p-drawer-mask')).toHaveCount(0);

  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1280, height: 800 });
  await tarjeta(page, 'Agendas').click();
  await expect(drawer).toHaveAttribute('role', 'dialog');
  await expect(page.locator('.p-drawer-mask')).toHaveCount(1);
});

test('todo a la vista: a 1440 × 800 el hub no desplaza', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await goto(page, 'admin/repositorios');
  await expect(page.locator('.repo-card')).toHaveCount(11);
  const sobra = await page.locator('.hub').evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(sobra).toBe(0);
});

test('el buscador vacío ofrece los últimos repositorios abiertos, el último primero; elegir uno lo busca', async ({
  page,
}) => {
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').click();
  await tarjeta(page, 'Labels').click();
  await page.keyboard.press('Escape');

  await page.getByRole('searchbox').focus();
  const recientes = page.locator('.hub-recientes__item');
  await expect(recientes).toHaveCount(2);
  await expect(recientes.nth(0)).toContainText('Labels');
  await expect(recientes.nth(1)).toContainText('Agendas');

  await recientes.nth(1).click();
  await expect(page.getByRole('searchbox')).toHaveValue('Agendas');
  await expect(page.locator('.repo-card')).toHaveCount(1);
});

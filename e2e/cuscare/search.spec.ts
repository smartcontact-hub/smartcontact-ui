import { expect, test, type Page } from '@playwright/test';

import { watchTransient } from './helpers';

/**
 * CusCare · Search (`/customer`) FUNCIONANDO.
 *
 * Existe por un fallo concreto: la pantalla se veía perfecta pero pulsar el
 * botón no hacía NADA. Estaba maquetada, no implementada — y ni el AOT, ni el
 * lint, ni un pantallazo lo habrían dicho. Solo conducirla lo destapa.
 */

const SEARCH = '/#/private/cuscare/customer';

async function goto(page: Page) {
  await page.goto(SEARCH);
  await expect(page.getByLabel('Search term')).toBeVisible();
}

test('arranca con la ilustración y sin resultados', async ({ page }) => {
  await goto(page);
  await expect(page.locator('.search__art img')).toBeVisible();
  await expect(page.locator('.search__results')).toHaveCount(0);
});

test('el botón está deshabilitado hasta que hay término', async ({ page }) => {
  await goto(page);
  const btn = page.getByRole('button', { name: 'Search' });
  await expect(btn).toBeDisabled();

  await page.getByLabel('Search term').fill('34600');
  await expect(btn).toBeEnabled();
});

test('buscar devuelve resultados y se puede abrir uno', async ({ page }) => {
  await goto(page);

  await page.getByLabel('Search term').fill('34600');
  const loader = await watchTransient(page, '.search__loading');
  await page.getByRole('button', { name: 'Search' }).click();

  // Pasa por el estado de carga, como el original. Dura 380 ms, así que se
  // comprueba con el vigía y no mirando la pantalla: el mismo `toBeVisible()`
  // sobre este transitorio ya daba rojos intermitentes en el test de
  // paginación con la máquina cargada (el porqué, en `watchTransient`).
  await expect.poll(async () => (await loader()).seen, { timeout: 5_000 }).toBe(true);
  expect((await loader()).text).toContain('Loading data...');
  await expect(page.locator('.search__results')).toBeVisible({ timeout: 5000 });

  const rows = page.locator('.resulttable tbody tr');
  expect(await rows.count()).toBeGreaterThan(0);

  // Un resultado lleva a su ticket.
  await rows.first().locator('a.cell-id').click();
  await expect(page).toHaveURL(/tickets\/ticket\//);
});

test('un término sin coincidencias muestra el vacío explícito, no una pantalla muda', async ({
  page,
}) => {
  await goto(page);

  await page.getByLabel('Search term').fill('zzzz-no-existe');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByText('No results')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.resulttable')).toHaveCount(0);
});

test('el criterio cambia lo que se busca', async ({ page }) => {
  await goto(page);

  // Por Msisdn hay resultados para "34600"…
  await page.getByLabel('Search term').fill('34600');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.locator('.search__results')).toBeVisible({ timeout: 5000 });

  // …y por Email, ese mismo término no da nada.
  await page.getByLabel('Search criteria').selectOption('Email');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText('No results')).toBeVisible({ timeout: 5000 });
});

test('el filtro de país acota los resultados', async ({ page }) => {
  await goto(page);

  await page.getByLabel('Search term').fill('34600');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.locator('.search__results')).toBeVisible({ timeout: 5000 });
  expect(await page.locator('.resulttable tbody tr').count()).toBeGreaterThan(0);

  // Los que casan con "34600" son todos de España, así que acotar a Slovakia
  // debe dejarlo en cero. Se espera al estado FINAL, no a un locator que ya
  // estaba visible: mi primera versión contaba los resultados VIEJOS porque no
  // esperaba a que terminase la segunda búsqueda.
  await page.getByLabel('Country').selectOption('Slovakia');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByText('No results')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.resulttable')).toHaveCount(0);
});

test('"Limpiar búsqueda" devuelve a la ilustración', async ({ page }) => {
  await goto(page);

  await page.getByLabel('Search term').fill('34600');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.locator('.search__results')).toBeVisible({ timeout: 5000 });

  await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
  await expect(page.locator('.search__art img')).toBeVisible();
  await expect(page.locator('.search__results')).toHaveCount(0);
});

/**
 * El vacío del buscador NO es genérico: la app real cambia el mensaje según el
 * criterio de búsqueda. Los textos salen de su diccionario
 * (`SEARCH_SCC.EMPTY_STATE.DESCRIPTION_BY_TYPE.*`), no transcritos a ojo —
 * antes esto decía una frase mía en castellano dentro de una interfaz inglesa.
 */
test('el mensaje de "sin resultados" cambia con el criterio', async ({ page }) => {
  await page.goto('/#/private/cuscare/customer');

  await page.getByLabel('Search criteria').selectOption('Msisdn');
  await page.getByLabel('Search term').fill('000000000');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByText('No results found')).toBeVisible();
  await expect(
    page.getByText('Please check the phone number entered or modify the filters.'),
  ).toBeVisible();

  await page.getByLabel('Search criteria').selectOption('Email');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(
    page.getByText('Please check the email address entered or modify the filters.'),
  ).toBeVisible();
});

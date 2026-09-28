import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL PASE DE DISEÑO DE LAS FICHAS (DD-130).
 *
 * Lo que se decidió tras revisar el flujo rehecho de administración a 1440 y 1280, en los dos temas:
 *   · en la franja (por debajo de 1340) la cifra va junto a su anillo, las tarjetas de una fila miden lo
 *     mismo y los datos del grupo leen en dos columnas;
 *   · las tres altas se parecen: la cabecera de la ficha a la vista desde el alta («Nuevo agente» hasta que
 *     se escribe el nombre) y el botón que dice lo que hace («Crear agente»);
 *   · Guardar deja en la ficha también en usuario;
 *   · un usuario nuevo nace sin secciones ni permisos (mínimo privilegio);
 *   · Distribución y colas lleva saltos a cada canal;
 *   · el icono de un aviso pesa lo que su texto;
 *   · en el listado de grupos, el botón de cada fila dice «Asignar».
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const barra = (page: Page) => page.locator('header.top-bar');

test.describe('la franja, por debajo de 1340', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('usuario 3 · la cifra va junto a su anillo, y las tarjetas de la fila miden lo mismo', async ({ page }) => {
    await goto(page, 'admin/usuarios/editar/3');
    const kpis = page.locator('.ficha-summary sc-summary-kpi');
    await expect(kpis).toHaveCount(2);
    for (const kpi of await kpis.all()) {
      const hueco = await kpi.evaluate((k) => {
        const cifra = k.querySelector('.resumen__figure')!.getBoundingClientRect();
        const anillo = k.querySelector('p-progress-spinner')!.getBoundingClientRect();
        return Math.round(anillo.left - cifra.right);
      });
      // 28 (`--sc-spacing-2`): la cifra y su anillo son una pieza. En la franja llegaron a 290.
      expect(hueco, 'de la cifra a su anillo').toBeLessThanOrEqual(29);
    }
    const altos = await page
      .locator('.ficha-summary .resumen__cards > *')
      .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    expect(new Set(altos).size, `altos de la fila: ${altos.join(', ')}`).toBe(1);
  });

  test('grupo 11 · en la tarjeta de datos, los valores empiezan en la misma vertical', async ({ page }) => {
    await goto(page, 'admin/grupos/editar/11');
    const xs = await page
      .locator('.ficha-summary .resumen__facts')
      .evaluate((f) =>
        [...f.querySelectorAll('.resumen__pair > dd, .resumen__head > .resumen__digits')].map((e) =>
          Math.round(e.getBoundingClientRect().left)
        )
      );
    // Reparto (2), salida (2) y recursos (1), contados: sobre una lista vacía, «todos alineados» se cumpliría.
    expect(xs).toHaveLength(5);
    expect(new Set(xs).size, `x de cada valor: ${xs.join(', ')}`).toBe(1);
  });
});

for (const alta of [
  { ruta: 'admin/grupos/crear', titulo: 'Nuevo grupo', boton: 'Crear grupo', nombre: '#group-name' },
  { ruta: 'admin/agentes/crear', titulo: 'Nuevo agente', boton: 'Crear agente', nombre: '#agent-name' },
  { ruta: 'admin/usuarios/crear', titulo: 'Nuevo usuario', boton: 'Crear usuario', nombre: '#user-name' },
]) {
  test(`alta · «${alta.titulo}» a la vista, que sigue al nombre, y «${alta.boton}» arriba`, async ({ page }) => {
    await goto(page, alta.ruta);
    const h1 = page.locator('main#main-content h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(alta.titulo);
    expect(await h1.evaluate((e) => Math.round(e.getBoundingClientRect().height)), 'el título se ve').toBeGreaterThanOrEqual(16);
    await page.locator(alta.nombre).fill('Ada Lovelace');
    await expect(h1).toHaveText('Ada Lovelace');
    await expect(barra(page).getByRole('button', { name: alta.boton })).toBeVisible();
  });
}

test('usuario · crear deja en su edición, sin salto: el índice no se mueve', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');
  const indice = page.locator('.page__rail').first();
  const antes = await indice.evaluate((e) => Math.round(e.getBoundingClientRect().top));
  const nombre = `E2E Usuario ${Date.now()}`;
  await page.locator('#user-name').fill(nombre);
  await page.locator('#user-email').fill('e2e.pase@smartcontact.test');
  await barra(page).getByRole('button', { name: 'Crear usuario' }).click();
  await expect(page).toHaveURL(/\/admin\/usuarios\/editar\/\d+$/);
  await expect(page.locator('main#main-content h1')).toHaveText(nombre);
  const despues = await indice.evaluate((e) => Math.round(e.getBoundingClientRect().top));
  expect(despues, 'el índice, en la misma altura al pasar del alta a la edición').toBe(antes);
});

test('usuario · guardar deja en la ficha, como en grupo y agente', async ({ page }) => {
  await goto(page, 'admin/usuarios/editar/3');
  await page.locator('#user-identifier').fill('E2E-QUEDA');
  await barra(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Cambios sin guardar')).toHaveCount(0);
  await expect(page).toHaveURL(/\/admin\/usuarios\/editar\/3$/);
  await expect(page.locator('#user-identifier')).toHaveValue('E2E-QUEDA');
});

test('usuario nuevo · nace sin secciones ni permisos', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear?seccion=acceso');
  const casillas = page.locator('#user-section-access sc-checkbox input[type=checkbox]');
  await expect(casillas).toHaveCount(16);
  await expect(page.locator('#user-section-access sc-checkbox input[type=checkbox]:checked')).toHaveCount(0);
  await expect(page.locator('.ficha-summary .resumen__count').nth(0)).toHaveText('0');
  await expect(page.locator('.ficha-summary .resumen__count').nth(1)).toHaveText('0');
});

test('grupo 11 · Distribución y colas: un salto a cada canal, que lleva el foco a su título', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const saltos = page.getByRole('navigation', { name: 'Canales de esta sección' });
  // Por su nombre accesible, exacto: si el icono del canal colara su ligadura («call»), se oiría.
  await expect(saltos.getByRole('link')).toHaveCount(3);
  for (const canal of ['Teléfono', 'Chat', 'Email']) {
    await expect(saltos.getByRole('link', { name: canal, exact: true })).toBeVisible();
  }
  // Otro grupo que las reglas comunes: a 28 de ellas (la caja no pone hueco entre sus hijos; se tocaban).
  const hueco = await page.evaluate(
    () =>
      document.querySelector('#group-common-title')!.getBoundingClientRect().top -
      document.querySelector('.channel-jumps')!.getBoundingClientRect().bottom
  );
  expect(Math.round(hueco), 'de los saltos a las reglas comunes').toBeGreaterThanOrEqual(27);
  await saltos.getByRole('link', { name: 'Email' }).click();
  const titulo = page.locator('#group-channel-email-title');
  await expect(titulo).toBeFocused();
  await expect(titulo).toBeInViewport();
  // Un salto dentro de la sección no navega: la dirección no cambia.
  await expect(page).toHaveURL(/\/admin\/grupos\/editar\/11\?seccion=distribucion$/);
});

test('grupo 1 · con un solo canal no hay saltos', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1?seccion=distribucion');
  await expect(page.locator('#group-section-distribution')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Canales de esta sección' })).toHaveCount(0);
});

test('el icono de un aviso pesa lo que su texto semibold', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  const avisos = page.locator('.ficha-summary .resumen__warn sc-icon .sc-icon');
  await expect(avisos).toHaveCount(2);
  for (const icono of await avisos.all()) await expect(icono).toHaveClass(/sc-icon--weight-600/);
  await goto(page, 'admin/grupos/crear');
  await expect(page.locator('.resumen__missing sc-icon .sc-icon')).toHaveClass(/sc-icon--weight-600/);
});

test('listado de grupos · el botón de cada fila dice «Asignar»', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const boton = page.getByRole('button', { name: 'Asignar agentes de Online Support' });
  await expect(boton).toContainText('Asignar');
  await expect(boton).not.toContainText('Agentes');
});

import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, elegirTelefonoSaliente, forceLightTheme, goto, irAPaso } from './helpers';

/**
 * EL PASE DE DISEÑO DE LAS FICHAS (DD-130).
 *
 * Lo que se decidió tras revisar el flujo rehecho de administración a 1440 y 1280, en los dos temas:
 *   · en la franja (por debajo de 1340) la cifra va junto a su anillo, las tarjetas de una fila miden lo
 *     mismo y los datos del grupo leen en dos columnas;
 *   · las tres altas se parecen: la cabecera de la ficha a la vista desde el alta («Nuevo agente» hasta que
 *     se escribe el nombre) y el botón que dice lo que hace («Crear agente»);
 *   · Guardar deja en la ficha también en usuario;
 *   · un usuario nuevo nace con lo mínimo: desde DD-132, la plantilla de Supervisor Offline (la supervisión, nada
 *     sensible); con DD-130 nacía sin ninguna casilla;
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

// Desde DD-138 el alta va en pasos y el índice llega con la edición: lo que no se mueve es el contenido, que
// empieza a la misma altura con los pasos que con el índice.
test('usuario · crear deja en su edición, sin salto: el contenido no se mueve', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');
  const contenido = page.locator('.page__main').first();
  const antes = await contenido.evaluate((e) => Math.round(e.getBoundingClientRect().top));
  const nombre = `E2E Usuario ${Date.now()}`;
  await page.locator('#user-name').fill(nombre);
  await page.locator('#user-email').fill('e2e.pase@smartcontact.test');
  await barra(page).getByRole('button', { name: 'Crear usuario' }).click();
  await expect(page).toHaveURL(/\/admin\/usuarios\/editar\/\d+$/);
  await expect(page.locator('main#main-content h1')).toHaveText(nombre);
  await expect(page.locator('sc-form-section-nav')).toBeVisible();
  const despues = await contenido.evaluate((e) => Math.round(e.getBoundingClientRect().top));
  expect(despues, 'el contenido, a la misma altura al pasar del alta a la edición').toBe(antes);
});

test('usuario · guardar deja en la ficha, como en grupo y agente', async ({ page }) => {
  await goto(page, 'admin/usuarios/editar/3');
  await page.locator('#user-identifier').fill('E2E-QUEDA');
  await barra(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Cambios sin guardar')).toHaveCount(0);
  await expect(page).toHaveURL(/\/admin\/usuarios\/editar\/3$/);
  await expect(page.locator('#user-identifier')).toHaveValue('E2E-QUEDA');
});

// Enmendado por DD-132: ya no nace vacío, sino con la plantilla del tipo de menos privilegio. Lo sensible sigue
// apagado, que es lo que DD-130 protegía. Las 16 casillas de entonces son 25 (16 secciones y 9 permisos).
test('usuario nuevo · nace Supervisor Offline: la supervisión marcada y ningún permiso', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');
  await irAPaso(page, 'Acceso');
  const casillas = page.locator('#user-section-access sc-checkbox input[type=checkbox]');
  await expect(casillas).toHaveCount(25);
  await expect(page.locator('#user-section-access sc-checkbox input[type=checkbox]:checked')).toHaveCount(9);
  await expect(page.locator('.ficha-summary .resumen__count').nth(0)).toHaveText('9');
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
  // «Falta» y «Listo para crear» (DD-136), los dos en semibold con su icono a 600.
  await goto(page, 'admin/grupos/crear');
  const estado = page.locator('.resumen__status sc-icon .sc-icon');
  await expect(estado).toHaveClass(/sc-icon--weight-600/);
  await page.locator('#group-name').fill(`E2E Peso ${Date.now()}`);
  // Con Teléfono, «Listo» espera también al teléfono saliente (DD-142).
  await elegirTelefonoSaliente(page);
  await expect(page.locator('.resumen__status--ready')).toBeVisible();
  await expect(estado).toHaveClass(/sc-icon--weight-600/);
});

test('listado de grupos · el botón de cada fila dice «Asignar»', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const boton = page.getByRole('button', { name: 'Asignar agentes de Online Support' });
  await expect(boton).toContainText('Asignar');
  await expect(boton).not.toContainText('Agentes');
});

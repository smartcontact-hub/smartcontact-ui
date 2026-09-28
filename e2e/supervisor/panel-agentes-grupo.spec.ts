import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL PANEL RÁPIDO DE AGENTES, desde el listado de grupos (visión de producto de grupos, 2026-09-25;
 * DD-121). Asignar y desasignar agentes es lo que más se hace con un grupo una vez creado, así que
 * está a un clic de la fila, con la MISMA tabla que la ficha.
 *
 * Lo que fija:
 *   1. «Agentes» abre el panel de ESA fila sin abrir la ficha, y dentro no se eligen filas (la barra
 *      de lote quedaría debajo de la máscara).
 *   2. Guardar dice cuántos AGENTES cambian, y al guardar la cifra de la fila se pone al día.
 *   3. Cerrar con cambios pregunta antes (con Cancelar y con Escape): el cierre de `p-drawer` no se
 *      puede vetar, así que lo gobierna el panel.
 *   4. El panel mide lo que lleva dentro (DD-131). Hasta el 2026-09-28 era un `52rem` fijo: 832 px con
 *      450 px entre un nombre y su primera casilla, filas de 46 px y, en los grupos de un canal, una
 *      columna entera de casillas grises. Las cifras de cada aserción son las medidas en ese cambio.
 *
 * Storage limpio por test → cada store de admin re-siembra su seed.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const abrirPanel = async (page: Page, grupo: string): Promise<void> => {
  await page.getByRole('button', { name: `Asignar agentes de ${grupo}` }).click();
  await expect(page.locator('.agents-panel')).toBeVisible();
};
const panel = (page: Page) => page.locator('.agents-panel');
const cifraDeAgentes = (page: Page, grupo: string) =>
  page.locator('tbody tr', { hasText: grupo }).locator('sc-group-popover').last();

test('«Agentes» abre el panel de esa fila sin abrir la ficha, y dentro no se eligen filas', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await abrirPanel(page, 'Reclamaciones');

  await expect(page.getByText('Agentes · Reclamaciones')).toBeVisible();
  await expect(page).toHaveURL(/admin\/grupos$/);
  // Las columnas son los canales del grupo, y no hay casilla de elegir filas.
  await expect(panel(page).getByRole('columnheader', { name: 'WhatsApp' })).toHaveCount(1);
  await expect(panel(page).locator('thead input[type=checkbox]')).toHaveCount(0);
  await expect(panel(page).getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

test('guardar dice cuántos agentes cambian, y la cifra de la fila se pone al día', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const antes = Number((await cifraDeAgentes(page, 'ACD Demo C2CB').innerText()).trim());
  await abrirPanel(page, 'ACD Demo C2CB');

  await panel(page).locator('tbody tr').first().getByRole('button', { name: /^Quitar a / }).click();
  await expect(panel(page).getByText('Sin guardar: 1')).toBeVisible();
  await panel(page).getByRole('button', { name: 'Guardar (1)' }).click();

  await expect(page.getByText('Agentes de "ACD Demo C2CB" actualizados')).toBeVisible();
  await expect(panel(page)).toHaveCount(0);
  await expect(cifraDeAgentes(page, 'ACD Demo C2CB')).toHaveText(String(antes - 1));
});

test('cerrar con cambios pregunta antes, con Cancelar y con Escape, y descartar no guarda', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const antes = (await cifraDeAgentes(page, 'ACD Demo C2CB').innerText()).trim();
  await abrirPanel(page, 'ACD Demo C2CB');
  await panel(page).locator('tbody tr').first().getByRole('button', { name: /^Quitar a / }).click();

  const aviso = page.getByRole('dialog', { name: '¿Descartar cambios?' });
  await panel(page).getByRole('button', { name: 'Cancelar' }).click();
  await expect(aviso).toBeVisible();
  await aviso.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(panel(page).getByRole('button', { name: 'Guardar (1)' })).toBeVisible();

  // Escape entra por la misma puerta.
  await panel(page).getByRole('button', { name: 'Guardar (1)' }).focus();
  await page.keyboard.press('Escape');
  await expect(aviso).toBeVisible();
  await aviso.getByRole('button', { name: 'Descartar' }).click();

  await expect(panel(page)).toHaveCount(0);
  await expect(cifraDeAgentes(page, 'ACD Demo C2CB')).toHaveText(antes);
});

/** El cajón que envuelve el panel: su caja es la que el usuario ve. */
const cajon = (page: Page) => page.locator('.p-drawer', { has: panel(page) });

/** Ancho del cajón, alto de la primera fila y el hueco del final de su NOMBRE (el texto) a su primera casilla. */
const medidas = (page: Page) =>
  cajon(page).evaluate((drawer) => {
    const fila = drawer.querySelector('tbody tr');
    const nombre = fila?.querySelector('.assign__name-label');
    const casilla = fila?.querySelector('sc-checkbox');
    return {
      ancho: drawer.getBoundingClientRect().width,
      altoFila: fila ? fila.getBoundingClientRect().height : 0,
      hueco: nombre && casilla ? casilla.getBoundingClientRect().left - nombre.getBoundingClientRect().right : null,
    };
  });

test('un grupo de un solo canal no pinta columna de canal: el panel cabe en 28rem y no tiene casillas', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await abrirPanel(page, 'ACD Demo C2CB');

  // Todo agente asignado atiende el único canal: la columna solo eran casillas bloqueadas (13 de 13).
  await expect(panel(page).getByRole('columnheader', { name: 'Teléfono' })).toHaveCount(0);
  await expect(panel(page).locator('tbody sc-checkbox')).toHaveCount(0);
  await expect(panel(page).locator('tbody tr')).toHaveCount(13);
  // 28rem es lo que piden el título y la barra en una línea; antes, 832 px.
  expect((await medidas(page)).ancho).toBeLessThanOrEqual(28 * 16);
});

test('con dos canales, el panel se ajusta a sus columnas: nombre cerca de sus casillas, filas compactas, sin repetir los canales', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await abrirPanel(page, 'ACD demo cuscare');

  await expect(panel(page).getByRole('columnheader', { name: 'Teléfono' })).toHaveCount(1);
  await expect(panel(page).getByRole('columnheader', { name: 'Email' })).toHaveCount(1);
  // La línea «Canales: …» bajo el título repetía las cabeceras.
  await expect(panel(page).locator('.agents-panel__channels')).toHaveCount(0);

  const { ancho, altoFila, hueco } = await medidas(page);
  expect(ancho, 'ancho del cajón (476 medido; antes 832)').toBeLessThanOrEqual(30 * 16);
  expect(hueco, 'del nombre a su primera casilla (154 medido; antes 450)').not.toBeNull();
  expect(hueco!, 'del nombre a su primera casilla (154 medido; antes 450)').toBeLessThanOrEqual(12 * 16);
  expect(altoFila, 'alto de fila (34 medido; antes 46)').toBeLessThanOrEqual(36);
});

test('el último canal se lee marcado y fijo: la casilla desactivada queda al 60 % de Figma, no al 36 %', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await abrirPanel(page, 'ACD demo cuscare');

  const candado = panel(page).locator('tbody .assign__locked sc-checkbox').first();
  await expect(candado).toBeVisible();
  // La opacidad EFECTIVA de la caja: el producto de la suya y la de cada antepasado. El DS la ponía dos veces.
  const opacidad = await candado.locator('.tri-checkbox__box').evaluate((caja) => {
    let o = 1;
    for (let n: Element | null = caja; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity || '1');
    return o;
  });
  expect(opacidad).toBeCloseTo(0.6, 2);
});

test('la papelera dice qué hace al pasar por encima: «Quitar del grupo», lo que nombra la ayuda del candado', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await abrirPanel(page, 'ACD demo cuscare');

  await panel(page).locator('tbody tr').first().getByRole('button', { name: /^Quitar a / }).hover();
  await expect(page.locator('.p-tooltip')).toHaveText('Quitar del grupo');
});

test('una fila que llega sin canal devuelve la columna en un grupo de uno, y marcar su casilla no la quita', async ({ page }) => {
  // Un vínculo de antes, sin canal, en el grupo 1 (Teléfono). Solo ese: el resto de grupos queda sin agentes.
  await page.addInitScript(() => {
    localStorage.setItem('sc-group-agent-links-v', '1');
    localStorage.setItem(
      'sc-group-agent-links',
      JSON.stringify([{ agentId: 1, groupId: 1, channels: [], active: true }]),
    );
  });
  await goto(page, 'admin/grupos');
  await abrirPanel(page, 'ACD Demo C2CB');

  await expect(panel(page).getByRole('columnheader', { name: 'Teléfono' })).toHaveCount(1);
  const ancho = (await medidas(page)).ancho;
  expect(ancho).toBeLessThanOrEqual(28 * 16);

  // Es la única forma de darle canal desde aquí; al marcarla pasa a ser su último canal, y la columna se queda.
  await panel(page).getByRole('checkbox', { name: 'Tom Hanks — Teléfono' }).click();
  await expect(panel(page).getByRole('checkbox', { name: /^Tom Hanks — Teléfono: único canal/ })).toBeChecked();
  await expect(panel(page).getByRole('columnheader', { name: 'Teléfono' })).toHaveCount(1);
  expect((await medidas(page)).ancho).toBe(ancho);
  await expect(panel(page).getByRole('button', { name: 'Guardar (1)' })).toBeEnabled();
});

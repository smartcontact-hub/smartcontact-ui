import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/** La tabla compartida usa Asignado y confirma cambios colectivos (DD-151).
 * El panel conserva el borrador, el cierre con aviso y los permisos de canal. */

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
// La cifra es el botón del globo, que desde DD-159 también abre el panel: se lee su texto, no el del globo entero
// (al pulsarlo, la lista de nombres se cierra, pero con las animaciones quitadas de golpe queda a medio cerrar).
const cifraDeAgentes = (page: Page, grupo: string) =>
  page.locator('tbody tr', { hasText: grupo }).locator('sc-group-popover .group-popover__trigger').last();

test('«Agentes» abre el panel de esa fila sin abrir la ficha, y comparte la asignación desde la cabecera', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await abrirPanel(page, 'Reclamaciones');

  await expect(page.getByText('Agentes · Reclamaciones')).toBeVisible();
  await expect(page).toHaveURL(/admin\/grupos$/);
  // La cabecera cambia asignaciones, no selecciona filas para una barra aparte.
  await expect(panel(page).getByRole('columnheader', { name: 'Chat', exact: true })).toHaveCount(1);
  await expect(panel(page).getByRole('columnheader', { name: 'Asignado', exact: true }).getByRole('checkbox')).toBeVisible();
  await expect(panel(page).getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

test('cerrar el panel devuelve el foco a la cifra que lo abrió', async ({ page }) => {
  // Ni `p-drawer` ni `sc-drawer` lo devuelven: el foco caía en <body> y el teclado empezaba de cero (DD-168).
  await goto(page, 'admin/grupos');
  const cifra = page.getByRole('button', { name: 'Asignar agentes de Reclamaciones' });
  await cifra.click();
  await expect(panel(page)).toBeVisible();

  await panel(page).getByRole('button', { name: 'Cancelar' }).click();
  await expect(panel(page)).toHaveCount(0);
  await expect(cifra).toBeFocused();
});

test('guardar dice cuántos agentes cambian, y la cifra de la fila se pone al día', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const antes = Number((await cifraDeAgentes(page, 'ACD Demo C2CB').innerText()).trim());
  await abrirPanel(page, 'ACD Demo C2CB');

  await panel(page).locator('tbody tr').first().getByRole('checkbox', { name: /^Asignado —/ }).click();
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
  await panel(page).locator('tbody tr').first().getByRole('checkbox', { name: /^Asignado —/ }).click();

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

/**
 * Ancho del cajón, alto de la primera fila y su aire, en dos tramos: del final de su identidad (nombre y email) a su
 * estado, y de la columna del estado a su primera casilla. Desde DD-156 el estado va en su columna, entre las dos.
 */
const medidas = (page: Page) =>
  cajon(page).evaluate((drawer) => {
    const fila = drawer.querySelector('tbody tr');
    const rotulos = [...drawer.querySelectorAll('thead th')].map((th) => th.getAttribute('aria-label'));
    const celdaEstado = fila?.querySelectorAll(':scope > td')[rotulos.indexOf('Estado')];
    const nombre = fila?.querySelector('.assign__name');
    const estado = celdaEstado?.querySelector('sc-tag');
    const casilla = fila?.querySelector('.assign__locked sc-checkbox, .assign__permission sc-checkbox');
    return {
      ancho: drawer.getBoundingClientRect().width,
      altoFila: fila ? fila.getBoundingClientRect().height : 0,
      hueco: nombre && estado ? estado.getBoundingClientRect().left - nombre.getBoundingClientRect().right : null,
      huecoCasilla: celdaEstado && casilla ? casilla.getBoundingClientRect().left - celdaEstado.getBoundingClientRect().right : null,
    };
  });

test('un grupo de un solo canal muestra compatibilidad y asignación, sin páginas, en el panel de altura completa', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await abrirPanel(page, 'ACD Demo C2CB');
  await expect(panel(page).getByRole('columnheader', { name: 'Teléfono', exact: true })).toHaveCount(1);
  // Sin páginas (DD-171): los 13 asignados, todos.
  await expect(panel(page).locator('.p-paginator')).toHaveCount(0);
  await expect(panel(page).locator('tbody tr')).toHaveCount(13);
  expect((await cajon(page).boundingBox())!.y).toBe(0);
  expect((await medidas(page)).ancho).toBeLessThanOrEqual(48 * 16);
});

test('con dos canales, el panel se ajusta a sus columnas: nombre cerca de sus casillas, filas compactas, sin repetir los canales', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await abrirPanel(page, 'ACD demo cuscare');

  await expect(panel(page).getByRole('columnheader', { name: 'Teléfono' })).toHaveCount(1);
  await expect(panel(page).getByRole('columnheader', { name: 'Email' })).toHaveCount(1);
  // La línea «Canales: …» bajo el título repetía las cabeceras.
  await expect(panel(page).locator('.agents-panel__channels')).toHaveCount(0);

  const { ancho, altoFila, hueco, huecoCasilla } = await medidas(page);
  expect(ancho, 'agente, estado, canales y Habilitado, cada columna medida (DD-156)').toBeLessThanOrEqual(48 * 16);
  expect(hueco, 'del nombre y el email a su estado').not.toBeNull();
  expect(hueco!, 'del nombre y el email a su estado').toBeLessThanOrEqual(6 * 16);
  expect(huecoCasilla, 'de la columna del estado a la primera casilla').not.toBeNull();
  expect(huecoCasilla!, 'de la columna del estado a la primera casilla').toBeLessThanOrEqual(3 * 16);
  expect(altoFila, 'nombre y email en dos líneas, con el estado al lado').toBeLessThanOrEqual(58);
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

test('el último canal explica que desmarcar Asignado quita del grupo', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await abrirPanel(page, 'ACD demo cuscare');
  await panel(page).locator('.assign__locked').first().hover();
  await expect(page.locator('.p-tooltip')).toContainText('desmarca Asignado');
  await expect(panel(page).getByRole('button', { name: /^Quitar a / })).toHaveCount(0);
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
  // Solo Teléfono: 37,25rem (DD-171: su cabecera es su casilla y su icono, sin rótulo).
  expect(ancho).toBeLessThanOrEqual(37.25 * 16);

  // Es la única forma de darle canal desde aquí; al marcarla pasa a ser su último canal, y la columna se queda.
  await panel(page).getByRole('checkbox', { name: 'Tom Hanks — Teléfono' }).click();
  await expect(panel(page).getByRole('checkbox', { name: /^Tom Hanks — Teléfono: único canal/ })).toBeChecked();
  await expect(panel(page).getByRole('columnheader', { name: 'Teléfono' })).toHaveCount(1);
  expect((await medidas(page)).ancho).toBe(ancho);
  await expect(panel(page).getByRole('button', { name: 'Guardar (1)' })).toBeEnabled();
});

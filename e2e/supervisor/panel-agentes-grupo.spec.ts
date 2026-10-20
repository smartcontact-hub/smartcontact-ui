import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/** La tabla compartida usa Asignado y confirma cambios colectivos (DD-151).
 * El panel conserva el borrador, el cierre con aviso y los permisos de canal.
 *
 * El panel se abre desde el Monitor: desde el 2026-10-20 la cifra de agentes del listado de grupos lleva a «Agentes
 * asignados» de la ficha (SISMAC-4056), y el panel se queda donde no hay ficha a mano. Los grupos del widget «Grupos» de
 * «Colas y agentes» son de Teléfono. */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const tarjetaGrupos = (page: Page) =>
  page.locator('sc-dashboard-widget-card').filter({ has: page.locator('sc-dashboard-group-panel') });

/** «Colas y agentes» (el segundo monitor de fábrica), «Agentes» y el grupo en su menú. */
const abrirPanel = async (page: Page, grupo: string): Promise<void> => {
  await goto(page, 'dashboard');
  await page.getByRole('tab').nth(1).click();
  // El monitor elegido, antes de abrir nada: el de «Monitor» también tiene un widget «Grupos».
  await expect(page.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
  await tarjetaGrupos(page).getByRole('button', { name: 'Asignar agentes', exact: true }).click();
  await page.getByRole('menu').getByRole('menuitem', { name: grupo }).click();
  await expect(page.locator('.agents-panel')).toBeVisible();
};
const panel = (page: Page) => page.locator('.agents-panel');
const cifraDeAgentes = (page: Page, grupo: string) =>
  page.locator('tbody tr', { hasText: grupo }).locator('sc-group-popover .group-popover__trigger').last();

test('el panel comparte la asignación desde la cabecera, y Guardar empieza apagado', async ({ page }) => {
  await abrirPanel(page, 'ACD Demo C2CB');

  await expect(page.getByText('Agentes: ACD Demo C2CB')).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
  // La cabecera cambia asignaciones, no selecciona filas para una barra aparte.
  await expect(panel(page).getByRole('columnheader', { name: 'Teléfono', exact: true })).toHaveCount(1);
  await expect(panel(page).getByRole('columnheader', { name: 'Asignado', exact: true }).getByRole('checkbox')).toBeVisible();
  await expect(panel(page).getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

test('guardar dice cuántos agentes cambian, y la cifra del listado se pone al día', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const antes = Number((await cifraDeAgentes(page, 'ACD Demo C2CB').innerText()).trim());
  await abrirPanel(page, 'ACD Demo C2CB');

  await panel(page).locator('tbody tr').first().getByRole('checkbox', { name: /^Asignado —/ }).click();
  await expect(panel(page).getByText('Sin guardar: 1')).toBeVisible();
  await panel(page).getByRole('button', { name: 'Guardar (1)' }).click();

  await expect(page.getByText('Agentes de «ACD Demo C2CB» actualizados')).toBeVisible();
  await expect(panel(page)).toHaveCount(0);
  await goto(page, 'admin/grupos');
  await expect(cifraDeAgentes(page, 'ACD Demo C2CB')).toHaveText(String(antes - 1));
});

test('cerrar con cambios pregunta antes, con Cancelar y con Escape, y descartar no guarda', async ({ page }) => {
  await abrirPanel(page, 'ACD Demo C2CB');
  const marcados = panel(page).locator('tbody').getByRole('checkbox', { name: /^Asignado —/, checked: true });
  const antes = await marcados.count();
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
  await tarjetaGrupos(page).getByRole('button', { name: 'Asignar agentes', exact: true }).click();
  await page.getByRole('menu').getByRole('menuitem', { name: 'ACD Demo C2CB' }).click();
  await expect(marcados).toHaveCount(antes);
});

/** El cajón que envuelve el panel: su caja es la que el usuario ve. */
const cajon = (page: Page) => page.locator('.p-drawer', { has: panel(page) });

/** Ancho del cajón y alto de la primera fila. */
const medidas = (page: Page) =>
  cajon(page).evaluate((drawer) => {
    const fila = drawer.querySelector('tbody tr');
    return {
      ancho: drawer.getBoundingClientRect().width,
      altoFila: fila ? fila.getBoundingClientRect().height : 0,
    };
  });

test('un grupo de un solo canal muestra compatibilidad y asignación, sin páginas, en el panel de altura completa', async ({ page }) => {
  await abrirPanel(page, 'ACD Demo C2CB');
  await expect(panel(page).getByRole('columnheader', { name: 'Teléfono', exact: true })).toHaveCount(1);
  // Sin páginas (DD-176): los 13 asignados, todos.
  await expect(panel(page).locator('.p-paginator')).toHaveCount(0);
  await expect(panel(page).locator('tbody tr')).toHaveCount(13);
  expect((await cajon(page).boundingBox())!.y).toBe(0);
  const { ancho, altoFila } = await medidas(page);
  expect(ancho).toBeLessThanOrEqual(48 * 16);
  expect(altoFila, 'nombre y email en dos líneas').toBeLessThanOrEqual(58);
});

test('el último canal se lee marcado y fijo: la casilla desactivada queda al 60 % de Figma, no al 36 %', async ({ page }) => {
  await abrirPanel(page, 'ACD Demo C2CB');

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
  await abrirPanel(page, 'ACD Demo C2CB');
  await panel(page).locator('.assign__locked sc-checkbox').first().hover();
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
  await abrirPanel(page, 'ACD Demo C2CB');

  await expect(panel(page).getByRole('columnheader', { name: 'Teléfono' })).toHaveCount(1);
  const ancho = (await medidas(page)).ancho;
  // Solo Teléfono: 47,25rem (DD-181: Teléfono y Habilitado con su casilla de «todos»; con DD-176, 44,375).
  expect(ancho).toBeLessThanOrEqual(47.25 * 16);

  // Es la única forma de darle canal desde aquí; al marcarla pasa a ser su último canal, y la columna se queda.
  await panel(page).getByRole('checkbox', { name: 'Tom Hanks — Teléfono' }).click();
  await expect(panel(page).getByRole('checkbox', { name: /^Tom Hanks — Teléfono: único canal/ })).toBeChecked();
  await expect(panel(page).getByRole('columnheader', { name: 'Teléfono' })).toHaveCount(1);
  expect((await medidas(page)).ancho).toBe(ancho);
  await expect(panel(page).getByRole('button', { name: 'Guardar (1)' })).toBeEnabled();
});

import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion, pickSelectOption } from './helpers';

/**
 * EL LISTADO DE GRUPOS HABLA COMO SU FICHA (visión de producto de grupos, 2026-09-25; DD-121): cada
 * familia de canales reparte con su estrategia.
 *
 * Lo que fija:
 *   1. Una columna por estrategia, la de Teléfono y la de Chat (opcional: con las dos a la vez no caben a 1440
 *      sin recortar), y «—» en la de un canal que el grupo no tiene (antes enseñaba una estrategia de teléfono
 *      que no aplicaba).
 *   2. Casillas para elegir y exportar, sin edición en lote (DD-215): lo de cada grupo va por su menú de fila, y
 *      «Eliminar» es la confirmación simple del DS, sin teclear el nombre. Con dos o más marcados, el clic derecho
 *      sobre uno de ellos ofrece solo «Eliminar» para todos (SISMAC-4056, 2026-10-20).
 *   3. Prioridad ordena por rango, de Baja a Máxima (antes, alfabético: Alta < Baja < Máxima < Media).
 *   4. Nada se recorta a 1440 (DD-102: una lista no recorta): ni una cabecera ni una etiqueta. Con la columna
 *      de chat encendida, la tabla se desplaza de lado en vez de cortar. Tampoco las estrategias más largas de
 *      cada catálogo (DD-141), aunque ningún grupo de la semilla las use.
 *
 * Storage limpio por test → cada store de admin re-siembra su seed.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const fila = (page: Page, grupo: string) => page.locator('tbody tr', { hasText: grupo });

/** Una celda vacía: «—» a la vista y, para el lector, «Sin dato» o «No aplica» si el grupo no tiene ese canal (DD-197). */
const SIN_DATO = '—Sin dato';
const NO_APLICA = '—No aplica';

/** El índice de una columna por su cabecera: sale de la tabla, no de un número clavado. */
const columna = async (page: Page, cabecera: string): Promise<number> => {
  const cabeceras = await page.locator('thead th').allInnerTexts();
  const i = cabeceras.findIndex((texto) => texto.trim().startsWith(cabecera));
  expect(i, `no hay columna «${cabecera}»: ${cabeceras.join(' | ')}`).toBeGreaterThanOrEqual(0);
  return i;
};

const celda = async (page: Page, grupo: string, cabecera: string) =>
  fila(page, grupo).locator('td, th').nth(await columna(page, cabecera));

/** Enciende una columna opcional desde el selector de columnas y lo cierra. Si ya se ve, no la toca: la lista
 *  recuerda sus columnas en `localStorage`, y un segundo clic la apagaría. */
const mostrarColumna = async (page: Page, nombre: string): Promise<void> => {
  const cabecera = page.locator('thead th', { hasText: nombre });
  await page.locator('tbody tr').first().waitFor();
  if ((await cabecera.count()) > 0) return;
  // El globo de columnas, con una casilla por columna (DD-176).
  await page.locator('.page__action-bar').getByRole('button', { name: /^Columnas, / }).click();
  await page.getByRole('dialog', { name: 'Columnas' }).getByRole('checkbox', { name: nombre, exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(cabecera).toHaveCount(1);
};

/** Lo que sale recortado en la tabla: celdas (la tabla ajustable pone `overflow: hidden` en cada una) y su
 *  contenido, con el texto más ancho que su caja. */
const recortes = async (page: Page) => {
  const tablaGrupos = page.getByTestId('groups-table');
  await tablaGrupos.waitFor();
  /* Se mide con las fuentes cargadas. Mientras carga la de iconos (`font-display: block`), el glifo de «Asignar»
   * ocupa el ancho de su nombre, «group_add», con la letra de reserva: el botón mide 146 px en su celda de 120 y el
   * recorte es de la carga, no del diseño (medido el 2026-09-28, 1 de 3 vueltas con la máquina cargada). */
  await page.evaluate(async () => {
    await document.fonts.load('14px "Material Symbols Outlined Variable"');
    await document.fonts.ready;
  });
  return tablaGrupos.evaluate((tabla) => {
    const fuera: string[] = [];
    for (const el of tabla.querySelectorAll<HTMLElement>('th, td, th *, td *')) {
      // El texto solo para el lector (el «No aplica» de una celda vacía, DD-197) mide 1 px a propósito: no es un recorte.
      if (el.closest('.visually-hidden')) continue;
      const cs = getComputedStyle(el);
      const corta = cs.overflowX !== 'visible' || cs.textOverflow === 'ellipsis';
      const texto = (el.textContent ?? '').trim();
      if (corta && texto && el.scrollWidth > el.clientWidth + 1) fuera.push(`«${texto.slice(0, 40)}» ${el.scrollWidth}>${el.clientWidth}`);
    }
    return [...new Set(fuera)];
  });
};

test('cada familia de canales enseña su estrategia en su columna, y «—» donde el grupo no tiene el canal', async ({
  page,
}) => {
  await goto(page, 'admin/grupos');
  await mostrarColumna(page, 'Estrategia de chat');
  await expect(await celda(page, 'Online Support', 'Estrategia de teléfono')).toHaveText('Balanceada');
  await expect(await celda(page, 'Online Support', 'Estrategia de chat')).toHaveText('Menos conversaciones atendidas');
  await expect(await celda(page, 'ACD Demo C2CB', 'Estrategia de chat')).toHaveText(NO_APLICA);

  // Un grupo solo de Chat: ni estrategia ni número de teléfono, aunque los guarde.
  await goto(page, 'admin/grupos/crear');
  await page.locator('#group-name').fill('Solo chat E2E');
  const general = page.locator('#group-section-general');
  await general.locator('sc-checkbox').filter({ hasText: /^\s*Teléfono\s*$/ }).click();
  await general.locator('sc-checkbox').filter({ hasText: /^\s*Chat\s*$/ }).click();
  // Con Chat, el número de WhatsApp es obligatorio (DD-222).
  await irASeccion(page, 'Distribución y colas');
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#group-chat-whatsapp') }), /^\+?\d/);
  await page.getByRole('button', { name: 'Crear grupo' }).click();
  await expect(page).toHaveURL(/admin\/grupos\/editar\/\d+/);

  await goto(page, 'admin/grupos');
  await mostrarColumna(page, 'Estrategia de chat');
  await expect(await celda(page, 'Solo chat E2E', 'Estrategia de teléfono')).toHaveText(NO_APLICA);
  await expect(await celda(page, 'Solo chat E2E', 'Teléfono')).toHaveText(SIN_DATO);
  // Nace con la de Contact Center › Grupos, que de fábrica es Balanceada (DD-135).
  await expect(await celda(page, 'Solo chat E2E', 'Estrategia de chat')).toHaveText('Balanceada');
});

test('casillas sin barra de lote: «Eliminar» del menú de fila pregunta una vez, sin teclear el nombre', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await expect(fila(page, 'Reclamaciones')).toBeVisible();
  const tabla = page.getByTestId('groups-table');
  await expect(tabla.locator('p-table-header-checkbox'), 'con casilla de cabecera').toHaveCount(1);
  await expect(page.locator('sc-bulk-action-bar'), 'sin barra de lote').toHaveCount(0);

  const abrirMenu = () => fila(page, 'Reclamaciones').locator('.rules-kebab-btn').click();
  const eliminar = page.locator('.p-menu-overlay .p-menu-item-link').filter({ hasText: /eliminar/i });
  // El título pregunta con el nombre y el cuerpo solo añade lo que no se sabe (2026-10-20).
  const pregunta = page.getByRole('alertdialog', { name: '¿Eliminar el grupo «Reclamaciones»?' });

  await abrirMenu();
  await expect(eliminar, 'sin puntos suspensivos: no lleva a la puerta tecleada').toHaveText(/^\s*Eliminar\s*$/);
  await eliminar.click();
  await expect(pregunta).toContainText('Esta acción no se puede deshacer.');
  await expect(pregunta.getByRole('textbox'), 'no pide escribir el nombre').toHaveCount(0);
  await pregunta.getByRole('button', { name: 'Cancelar' }).click();
  await expect(fila(page, 'Reclamaciones'), 'cancelar no borra').toBeVisible();

  await abrirMenu();
  await eliminar.click();
  await pregunta.getByRole('button', { name: 'Eliminar' }).click();
  await expect(fila(page, 'Reclamaciones')).toHaveCount(0);
  await expect(page.locator('.p-toast-message')).toContainText('Grupo «Reclamaciones» eliminado');
});

test('con dos marcados, el clic derecho sobre uno ofrece solo «Eliminar» y borra los dos; fuera de ellos, el menú de su fila', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const opciones = page.locator('.p-menu-overlay .p-menu-item-link');
  for (const grupo of ['Reclamaciones', 'Online Support']) await fila(page, grupo).locator('p-table-checkbox').click();

  // Una fila sin marcar, y el «⋮» de una marcada: el menú de esa fila.
  await fila(page, 'ACD Demo C2CB').locator('td').nth(1).click({ button: 'right' });
  await expect(opciones.first()).toBeVisible();
  await expect(opciones).toHaveText([/Editar/, /Duplicar/, /Eliminar/]);
  await page.keyboard.press('Escape');
  await expect(opciones).toHaveCount(0);
  await fila(page, 'Reclamaciones').locator('.rules-kebab-btn').click();
  await expect(opciones).toHaveText([/Editar/, /Duplicar/, /Eliminar/]);
  await page.keyboard.press('Escape');
  await expect(opciones).toHaveCount(0);

  // Clic derecho sobre una marcada: lo de todas, y solo borrar (sin edición en lote, DD-215).
  await fila(page, 'Reclamaciones').locator('td').nth(1).click({ button: 'right' });
  await expect(opciones).toHaveText([/^\s*Eliminar\s*$/]);
  await opciones.click();
  const pregunta = page.getByRole('alertdialog', { name: '¿Eliminar 2 grupos?' });
  await expect(pregunta).toContainText('Esta acción no se puede deshacer.');
  await pregunta.getByRole('button', { name: 'Eliminar' }).click();

  await expect(fila(page, 'Reclamaciones')).toHaveCount(0);
  await expect(fila(page, 'Online Support')).toHaveCount(0);
  await expect(fila(page, 'ACD Demo C2CB')).toHaveCount(1);
  await expect(page.locator('.p-toast-message')).toContainText('2 grupos eliminados');
  // Y sus agentes, desasignados: no quedan enlaces a un grupo que ya no existe.
  const huerfanos = await page.evaluate(() => {
    const ids = new Set((JSON.parse(localStorage.getItem('sc-groups')!) as { id: number }[]).map((g) => g.id));
    return (JSON.parse(localStorage.getItem('sc-group-agent-links') ?? '[]') as { groupId: number }[]).filter((l) => !ids.has(l.groupId)).length;
  });
  expect(huerfanos).toBe(0);
});

test('Prioridad ordena de Baja a Máxima, no por orden alfabético', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await page.locator('thead th', { hasText: 'Prioridad' }).click();

  const indice = await columna(page, 'Prioridad');
  // El consumidor ordena al recibir sortChange; esperar el resultado evita leer las filas anteriores.
  await expect.poll(async () => {
    const textos = await page.locator('tbody tr').evaluateAll(
      (filas, i) => filas.map((f) => f.children[i]?.textContent?.trim() ?? ''),
      indice,
    );
    const rangos = textos.map((t) => ['Baja', 'Media', 'Alta', 'Máxima'].indexOf(t));
    const subiendo = [...rangos].sort((a, b) => a - b);
    return rangos.length > 0 && !rangos.includes(-1)
      && [subiendo.join(), [...subiendo].reverse().join()].includes(rangos.join());
  }, { message: 'Prioridad ordena por rango, en cualquiera de los dos sentidos' }).toBe(true);
});

test('a 1440 no se recorta nada: ni cabeceras ni etiquetas, con la columna de chat encendida o no', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/grupos');
  // La de chat es opcional: por defecto no sale.
  await expect(page.locator('thead th', { hasText: 'Estrategia de chat' })).toHaveCount(0);
  expect(await recortes(page)).toEqual([]);

  await mostrarColumna(page, 'Estrategia de chat');
  expect(await recortes(page)).toEqual([]);
});

/* Las más largas de cada catálogo desde DD-141, que no trae ningún grupo de la semilla: el ancho de cada columna es el
 * de su dato más largo (DD-102), no el del más largo que haya hoy en la tabla. */
const grupoConLasEstrategiasMasLargas = {
  id: 1,
  code: '20001',
  name: 'Online Support',
  phone: '918371548',
  priority: 'Máxima',
  channels: ['phone', 'chat', 'whatsapp', 'email'],
  strategy: 'Menos conversaciones atendidas',
  chatStrategy: 'Menos conversaciones atendidas',
  services: ['Soporte técnico'],
};

test('a 1440 caben también las estrategias más largas del catálogo, con la columna de chat encendida o no', async ({
  page,
}) => {
  await page.addInitScript((grupo) => {
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify([grupo]));
  }, grupoConLasEstrategiasMasLargas);
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/grupos');
  await expect(await celda(page, 'Online Support', 'Estrategia de teléfono')).toHaveText('Menos conversaciones atendidas');
  expect(await recortes(page)).toEqual([]);

  await mostrarColumna(page, 'Estrategia de chat');
  await expect(await celda(page, 'Online Support', 'Estrategia de chat')).toHaveText('Menos conversaciones atendidas');
  expect(await recortes(page)).toEqual([]);
});

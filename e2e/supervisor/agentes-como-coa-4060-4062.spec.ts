import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion, pickSelectOption } from './helpers';

/**
 * EL LISTADO Y LA FICHA DE AGENTES, COMO SUS PÁGINAS DE COA (SISMAC-4060 y SISMAC-4062, borradores del 2026-10-23;
 * DD-225). Lo que el prototipo no hacía como dicen:
 *   1. Con dos o más marcados, el clic derecho sobre uno ofrece solo «Eliminar»: «¿Eliminar 2 agentes?» y su toast.
 *   2. Teléfono y Estado salen de primeras; Estado se ordena, de más a menos disponible, con «Conversación», y su color
 *      va por familia: rojo No disponible y sus motivos, Administrativo en su marrón, azul lo de la conversación, con
 *      Post-conversando en el mismo azul sin borde (DD-226).
 *   3. «Grupos» ordena de mayor a menor al primer clic.
 *   4. El Excel lleva la columna Canales.
 *   5. Duplicar deja vacíos la foto y el móvil, y la copia nace «Desconectado», como todo agente nuevo.
 *   6. Solo se eligen extensiones libres (al editar, también la suya), y un email de otro agente se dice en vivo.
 *   7. La tabla de grupos vacía dice por qué, como la de agentes del grupo (DD-223).
 *   8. El índice del alta lleva los marcadores del grupo (DD-222), sin «Falta: …» encima del resumen; «Deshacer» lo deja
 *      como al empezar; al editar, lo que falta va con la etiqueta corta («Un grupo»).
 *   9. Quitar un canal que solo tenía en un grupo dice «en 1 grupo», no «en 1 grupos».
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const PERMISOS = {
  manageDevices: true,
  selfActivate: false,
  externalDevices: true,
  callsEnabled: true,
  transfersEnabled: true,
  callsDestFixed: true,
  callsDestMobile: true,
  callsDestInternational: true,
  callsDestSpecial: false,
  transfersDestFixed: true,
  transfersDestMobile: true,
  transfersDestInternational: true,
  transfersDestSpecial: false,
  recording: false,
};

/** Un agente por estado, desordenados, sin grupos: lo justo para leer el orden de la columna Estado. */
async function sembrarEstados(page: Page): Promise<void> {
  await page.addInitScript((permissions) => {
    if (localStorage.getItem('sc-agents')) return;
    const estados = ['conversacion', 'formacion', 'desconectado', 'disponible', 'post_conversando', 'bano', 'administrativo', 'no_disponible', 'comida'];
    localStorage.setItem('sc-agents-v', '3');
    localStorage.setItem(
      'sc-agents',
      JSON.stringify(
        estados.map((presenceStatus, i) => ({
          id: i + 1,
          code: String(10001 + i),
          name: `Agente ${String.fromCharCode(65 + i)}`,
          email: `agente.${i + 1}@example.com`,
          extension: String(300 + i),
          extensionType: 'webrtc',
          agentType: 'normal',
          status: 'active',
          presenceStatus,
          permissions,
        })),
      ),
    );
  }, PERMISOS);
}

const tabla = (page: Page) => page.getByTestId('agents-table');
const fila = (page: Page, nombre: string) => tabla(page).locator('tbody tr', { hasText: nombre });
const cabecera = (page: Page, texto: string) => tabla(page).locator('thead th', { hasText: texto });
/** Los textos de una columna, por su cabecera, en las filas pintadas. */
const columna = async (page: Page, texto: string): Promise<string[]> => {
  const indice = await tabla(page)
    .locator('thead th')
    .evaluateAll((ths, t) => ths.findIndex((th) => th.textContent?.trim() === t), texto);
  expect(indice, `la columna «${texto}», a la vista`).toBeGreaterThanOrEqual(0);
  return tabla(page)
    .locator('tbody tr')
    .evaluateAll((trs, i) => trs.map((tr) => tr.children[i]?.textContent?.trim() ?? ''), indice);
};

const indice = (page: Page) => page.locator('sc-form-section-nav');
const filaIndice = (page: Page, etiqueta: string) => indice(page).locator('.form-nav__item').filter({ hasText: etiqueta });
const linea = (page: Page, etiqueta: string) => filaIndice(page, etiqueta).locator('.form-nav__hint--paso');
const marcador = (page: Page, etiqueta: string, estado: string) =>
  filaIndice(page, etiqueta).locator(`sc-step-marker.sc-step-marker--${estado}`);
const siguiente = (page: Page) => page.getByRole('button', { name: 'Siguiente', exact: true });
const barra = (page: Page) => page.locator('sc-top-bar');

/** Los almacenes no escriben en `localStorage` hasta el primer cambio: se guarda una ficha (la de Mario Pérez) para que
 *  agentes y enlaces queden escritos y la prueba pueda retocarlos. */
async function escribirLosAlmacenes(page: Page): Promise<void> {
  await goto(page, 'admin/agentes/editar/20');
  await page.locator('#agent-name').fill('Mario Pérez E2E');
  await barra(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('.p-toast-message')).toContainText('Agente «Mario Pérez E2E» actualizado');
}

test('listado · Teléfono y Estado de primeras; Estado ordena de Disponible a Desconectado, y su color va por familia', async ({ page }) => {
  await sembrarEstados(page);
  await goto(page, 'admin/agentes');
  await expect(cabecera(page, 'Teléfono')).toHaveCount(1);
  await expect(cabecera(page, 'Estado')).toHaveCount(1);

  // Por familia, sin tokens nuevos (DD-225): Administrativo en su marrón, no en el rojo de No disponible; Conversación
  // en azul, y Post-conversando en el mismo azul sin borde, con la hechura de las demás (DD-226).
  await expect(fila(page, 'Agente A').locator('sc-tag')).toHaveText('Conversación');
  // El fondo que pinta cada etiqueta, el que gana en pantalla.
  const etiqueta = (agente: string) => fila(page, agente).locator('sc-tag .sc-tag__label');
  const fondo = (agente: string) => etiqueta(agente).evaluate((el) => getComputedStyle(el).backgroundColor);
  const borde = (agente: string) => etiqueta(agente).evaluate((el) => getComputedStyle(el).borderTopColor);
  // El fondo de un token, resuelto por el navegador.
  const fondoDe = (token: string) =>
    page.evaluate((t) => {
      const muestra = document.body.appendChild(document.createElement('span'));
      muestra.style.background = `var(${t})`;
      const pintado = getComputedStyle(muestra).backgroundColor;
      muestra.remove();
      return pintado;
    }, token);
  const [administrativo, noDisponible, conversacion, postConversando] = await Promise.all(
    ['Agente G', 'Agente H', 'Agente A', 'Agente E'].map(fondo),
  );
  expect(administrativo, 'Administrativo, en su marrón').toBe(await fondoDe('--sc-label-brown-bg'));
  expect(noDisponible, 'No disponible, en rojo').toBe(await fondoDe('--sc-label-red-bg'));
  expect(conversacion, 'Conversación, en el azul de etiqueta').toBe(await fondoDe('--sc-label-blue-bg'));
  expect(postConversando, 'Post-conversando, en el mismo azul de etiqueta').toBe(conversacion);
  expect(await borde('Agente A'), 'Conversación, con su borde azul').not.toBe('rgba(0, 0, 0, 0)');
  expect(await borde('Agente E'), 'Post-conversando, sin borde').toBe('rgba(0, 0, 0, 0)');
  // La misma pieza: el alto de las dos es el de las demás etiquetas.
  const alto = (agente: string) => etiqueta(agente).evaluate((el) => el.getBoundingClientRect().height);
  expect(await alto('Agente E'), 'Post-conversando, del alto de las demás').toBe(await alto('Agente A'));
  expect(conversacion).not.toBe(administrativo);

  await cabecera(page, 'Estado').click();
  await expect(cabecera(page, 'Estado')).toHaveAttribute('aria-sort', 'ascending');
  await expect
    .poll(() => columna(page, 'Estado'))
    .toEqual(['Disponible', 'No disponible', 'Baño', 'Comida', 'Formación', 'Administrativo', 'Post-conversando', 'Conversación', 'Desconectado']);
});

test('listado · «Grupos» ordena de mayor a menor al primer clic', async ({ page }) => {
  await goto(page, 'admin/agentes');
  await cabecera(page, 'Grupos').click();
  await expect(cabecera(page, 'Grupos')).toHaveAttribute('aria-sort', 'descending');
  // Arriba, una cifra: el que está en más grupos (con uno solo saldría su nombre, y con ninguno, «—»). Detrás de la cifra,
  // el texto de su desplegable.
  await expect.poll(async () => (await columna(page, 'Grupos'))[0]).toMatch(/^\d+\b/);
});

test('listado · con dos marcados, el clic derecho sobre uno ofrece solo «Eliminar» y borra los dos', async ({ page }) => {
  await sembrarEstados(page);
  await goto(page, 'admin/agentes');
  const opciones = page.locator('.p-menu-overlay .p-menu-item-link');
  for (const agente of ['Agente A', 'Agente B']) await fila(page, agente).locator('p-table-checkbox').click();

  // Sobre una sin marcar, el menú de su fila.
  await fila(page, 'Agente C').locator('td').nth(1).click({ button: 'right' });
  await expect(opciones).toHaveText([/Editar/, /Duplicar/, /Eliminar/]);
  await page.keyboard.press('Escape');
  await expect(opciones).toHaveCount(0);

  await fila(page, 'Agente A').locator('td').nth(1).click({ button: 'right' });
  await expect(opciones).toHaveText([/^\s*Eliminar \(2\)\s*$/]);
  await opciones.click();
  const pregunta = page.getByRole('alertdialog', { name: '¿Eliminar 2 agentes?' });
  await expect(pregunta).toContainText('Esta acción no se puede deshacer.');
  await pregunta.getByRole('button', { name: 'Eliminar' }).click();

  await expect(fila(page, 'Agente A')).toHaveCount(0);
  await expect(fila(page, 'Agente B')).toHaveCount(0);
  await expect(fila(page, 'Agente C')).toHaveCount(1);
  await expect(page.locator('.p-toast-message')).toContainText('2 agentes eliminados');
});

test('listado · el Excel lleva todas las columnas, con Canales detrás del teléfono', async ({ page }) => {
  await goto(page, 'admin/agentes');
  await page.getByRole('button', { name: 'Acciones', exact: true }).click();
  const descarga = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'Exportar', exact: true }).click();
  const fichero = await (await descarga).path();
  const { default: ExcelJS } = await import('exceljs');
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(fichero);
  const hoja = libro.getWorksheet('Agentes')!;
  const cabeceras = (hoja.getRow(1).values as unknown[]).slice(1);
  expect(cabeceras).toEqual(['ID', 'Nombre', 'Extensión', 'Tipo de extensión', 'Email', 'Teléfono', 'Canales', 'Tipo', 'Estado', 'Grabación', 'Grupos', 'Equipos']);
  // Los de Tom Hanks, el primero de la tabla, los mismos que su celda: cada canal por su nombre.
  const enLaTabla = await fila(page, 'Tom Hanks').locator('.sc-channel-row__item').evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')).join(', '));
  expect(enLaTabla).not.toBe('');
  expect(hoja.getRow(2).getCell(2).value).toBe('Tom Hanks');
  expect(hoja.getRow(2).getCell(7).value).toBe(enLaTabla);
});

test('duplicar · la foto y el móvil salen vacíos, y la copia nace «Desconectado»', async ({ page }) => {
  // Un original con foto y móvil, que suena en su teléfono.
  await escribirLosAlmacenes(page);
  await page.evaluate(() => {
    const agentes = JSON.parse(localStorage.getItem('sc-agents')!) as ({ id: number } & Record<string, unknown>)[];
    const tom = agentes.find((a) => a.id === 1)!;
    Object.assign(tom, { phone: '612345678', extensionType: 'phone', photo: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' });
    localStorage.setItem('sc-agents', JSON.stringify(agentes));
  });
  await goto(page, 'admin/agentes/crear?seedFromId=1');
  await expect(page.locator('#agent-name')).toHaveValue('Tom Hanks (1)');
  await expect(page.locator('#agent-phone')).toHaveValue('');
  // Sin la foto del original: con nombre, el avatar ilustrado que sale de él.
  await expect(page.locator('sc-photo-upload img')).toHaveCount(1);
  await expect(page.locator('sc-photo-upload img[src^="data:image/gif"]')).toHaveCount(0);
  // Suena en su teléfono: sin móvil, falta también, y «Gestión de dispositivos» se apaga.
  await expect(linea(page, 'General')).toHaveText('Email, extensión, teléfono móvil');
  await expect(barra(page).getByRole('button', { name: 'Crear agente' })).toBeDisabled();

  await page.locator('#agent-email').fill(`copia.${Date.now()}@example.com`);
  await page.locator('#agent-phone').fill('698765432');
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#agent-ext') }), /./);
  await barra(page).getByRole('button', { name: 'Crear agente' }).click();
  await expect(page).toHaveURL(/\/admin\/agentes\/editar\/\d+/);
  const id = Number(/editar\/(\d+)/.exec(page.url())![1]);
  const copia = await page.evaluate(
    (i) => (JSON.parse(localStorage.getItem('sc-agents')!) as { id: number; presenceStatus?: string; photo?: string }[]).find((a) => a.id === i),
    id,
  );
  expect(copia?.presenceStatus).toBe('desconectado');
  expect(copia?.photo).toBeUndefined();
  // Y su Estado, apagado: no tiene sesión a la que cambiársela.
  await expect(page.locator('sc-select').filter({ has: page.locator('#agent-presence') })).toContainText('Desconectado');
});

test('extensión y email · solo las extensiones libres (al editar, también la suya), y un email de otro agente se dice en vivo', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  const extension = page.locator('sc-select').filter({ has: page.locator('#agent-ext') });
  await extension.locator('.p-select').click();
  const opciones = page.locator('.p-select-overlay .p-select-option');
  await expect(opciones.first()).toBeVisible();
  // 122 es de Tom Hanks: no se ofrece.
  await expect(opciones.filter({ hasText: /^\s*122\s*$/ })).toHaveCount(0);
  await page.keyboard.press('Escape');

  await page.locator('#agent-email').fill('meryl.streep@company.com');
  await expect(page.locator('#agent-section-general')).toContainText('Ya hay un agente con este email');
  await expect(linea(page, 'General')).toContainText('ya hay un agente con este email');

  // Al editar, la suya sí sale, y su propio email no se repite consigo mismo.
  await goto(page, 'admin/agentes/editar/1');
  await expect(extension).toContainText('122');
  await extension.locator('.p-select').click();
  await expect(opciones.filter({ hasText: /^\s*122\s*$/ })).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#agent-section-general')).not.toContainText('Ya hay un agente con este email');
});

test('alta · el índice lleva los marcadores del grupo, sin «Falta: …» sobre el resumen; «Deshacer» lo deja como al empezar', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  await expect(page.locator('.resumen__status')).toHaveCount(0);
  await expect(marcador(page, 'General', 'actual')).toBeVisible();
  await expect(linea(page, 'General')).toHaveText('Nombre, email, extensión');
  await expect(linea(page, 'Configuración')).toHaveText('Sin revisar');
  await expect(linea(page, 'Recursos')).toHaveText('Sin revisar');
  await expect(linea(page, 'Grupos asignados')).toHaveText('Un grupo');

  // Dejar General sin lo obligatorio la pone en rojo, y al volver sus campos lo dicen en rojo.
  await page.locator('#agent-name').fill('E2E Índice');
  await siguiente(page).click();
  await expect(marcador(page, 'General', 'error')).toBeVisible();
  await expect(linea(page, 'General')).toHaveText('Email, extensión');
  await expect(marcador(page, 'Configuración', 'actual')).toBeVisible();
  await expect(linea(page, 'Configuración')).toHaveText('En curso');
  // Configuración no tiene nada obligatorio: al dejarla, «Revisada».
  await siguiente(page).click();
  await expect(linea(page, 'Configuración')).toHaveText('Revisada');
  await irASeccion(page, 'General');
  await expect(page.locator('#agent-section-general')).toContainText('El email es obligatorio');
  await expect(page.locator('#agent-email')).toHaveAttribute('aria-invalid', 'true');

  // «Deshacer»: el formulario vacío y el índice como al empezar; la sección abierta sigue abierta.
  await barra(page).getByRole('button', { name: 'Deshacer' }).click();
  await expect(page.locator('#agent-name')).toHaveValue('');
  await expect(marcador(page, 'General', 'actual')).toBeVisible();
  await expect(linea(page, 'General')).toHaveText('Nombre, email, extensión');
  for (const seccion of ['Configuración', 'Recursos']) await expect(linea(page, seccion)).toHaveText('Sin revisar');
  await expect(marcador(page, 'Configuración', 'pendiente')).toBeVisible();
});

test('editar · lo que falta va con la etiqueta corta, y la tabla de grupos vacía dice por qué', async ({ page }) => {
  // Un agente guardado sin grupos.
  await goto(page, 'admin/agentes');
  await page.evaluate(() => {
    const enlaces = JSON.parse(localStorage.getItem('sc-group-agent-links') ?? '[]') as { agentId: number }[];
    localStorage.setItem('sc-group-agent-links', JSON.stringify(enlaces.filter((l) => l.agentId !== 2)));
  });
  await goto(page, 'admin/agentes/editar/2?seccion=grupos');
  await expect(filaIndice(page, 'Grupos asignados')).toHaveClass(/form-nav__item--has-error/);
  await expect(filaIndice(page, 'Grupos asignados').locator('.form-nav__hint')).toHaveText('Un grupo');
  await expect(indice(page).locator('sc-step-marker')).toHaveCount(0);

  const grupos = page.locator('sc-group-assignment-table');
  await expect(grupos).toContainText('Sin grupos asignados');
  await expect(grupos).toContainText('Asígnalos desde «Todos».');
  await grupos.getByPlaceholder('Buscar grupos…').fill('zzz');
  await expect(grupos).toContainText('Ningún grupo coincide con el filtro.');
});

test('quitar un canal que solo atiende en un grupo dice «en 1 grupo»', async ({ page }) => {
  await escribirLosAlmacenes(page);
  // Un agente que atiende Chat y algo más en un grupo, y en ninguno más: quitarle Chat no lo saca de él.
  const id = await page.evaluate(() => {
    const enlaces = JSON.parse(localStorage.getItem('sc-group-agent-links')!) as { agentId: number; groupId: number; channels: string[] }[];
    const uno = enlaces.find((l) => l.channels.includes('chat') && l.channels.length > 1)!;
    localStorage.setItem('sc-group-agent-links', JSON.stringify([...enlaces.filter((l) => l.agentId !== uno.agentId), uno]));
    return uno.agentId;
  });
  await goto(page, `admin/agentes/editar/${id}`);
  await page.locator('#agent-section-general').getByRole('checkbox', { name: 'Chat', exact: true }).click();
  await barra(page).getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Vas a quitar canales' })).toContainText('Deja de atender Chat en 1 grupo. ¿Continuar?');
});

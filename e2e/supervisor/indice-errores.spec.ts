import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, elegirTelefonoSaliente, forceLightTheme, goto, irASeccion } from './helpers';

/**
 * LO QUE FALTA, EN GRIS Y EN EL RESUMEN; EN ROJO AL DEJARLO VACÍO (DD-219), Y EL ✓ DICE LO QUE VISTE (DD-217).
 *
 * Revisión de producto del 2026-10-20, con dos recorridos de un compañero medidos en sc-supervisor.pages.dev:
 *   1. nombre → Distribución y colas → vuelta a General: Distribución ganaba un punto rojo (el teléfono saliente) sin
 *      haber visto nada en rojo dentro; al borrar el nombre salía otro en General, y la barra solo decía «El nombre es
 *      obligatorio». El punto de Distribución parecía causado por el nombre.
 *   2. Teléfono y su saliente → vuelta a General y fuera los canales: Distribución y colas seguía con ✓ aunque ya no
 *      quedaba nada de lo que se rellenó, junto al rojo de General.
 *
 * Con DD-219, como pide la página de COA del alta: «Crear …» apagado mientras falte algo, y «Falta: …» arriba del
 * resumen, con cada cosa llevando a su campo. El aviso de cada campo sale en gris desde el principio y pasa a rojo al
 * dejarlo vacío; el índice no se pone en rojo por lo que se toca. El ✓ se va si otra sección le cambia el contenido.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const fila = (page: Page, etiqueta: string) => page.locator('sc-form-section-nav .form-nav__item').filter({ hasText: etiqueta });
const conPunto = (page: Page) => page.locator('sc-form-section-nav .form-nav__item--has-error');
const actual = (page: Page) => page.locator('sc-form-section-nav .form-nav__item[aria-current="page"]');
const siguiente = (page: Page) => page.getByRole('button', { name: 'Siguiente', exact: true });
const barra = (page: Page) => page.locator('sc-top-bar');
const estado = (page: Page) => page.locator('.resumen__status');
const completa = /Completa/;
/** El aviso en gris: la ayuda de un campo del DS o la que va bajo un grupo de casillas. */
const gris = (page: Page, seccion: string, texto: string) =>
  page.locator(`#${seccion} :is(.field__help, .sc-field__msg:not(.sc-field__msg--error))`).filter({ hasText: texto });
/** El aviso en rojo: el error de un campo del DS o el que va bajo un grupo de casillas. */
const rojo = (page: Page, seccion: string) => page.locator(`#${seccion} :is(.field__error, .sc-field__msg--error)`);

test('grupo · el recorrido del compañero: «Crear grupo» apagado, el aviso en gris y en rojo al dejar el nombre vacío, y el índice dice qué falta al dejar una sección', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/crear');
  const crear = barra(page).getByRole('button', { name: 'Crear grupo' });
  await expect(crear).toBeDisabled();
  // En el alta el resumen no lleva estado (DD-222): lo que falta se lee en el índice, junto a lo que se toca.
  await expect(estado(page)).toHaveCount(0);
  // El nombre lo dice en gris desde el principio: es algo por rellenar, no un error.
  await expect(gris(page, 'group-section-general', 'El nombre es obligatorio')).toHaveCount(1);
  await expect(rojo(page, 'group-section-general')).toHaveCount(0);

  await page.locator('#group-name').fill('Soporte');
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Distribución y colas');
  await irASeccion(page, 'General');
  // Dejar Distribución sin el teléfono saliente la pone en rojo con lo que le falta.
  await expect(conPunto(page)).toHaveCount(1);
  await expect(fila(page, 'Distribución y colas')).toHaveClass(/form-nav__item--has-error/);
  await expect(fila(page, 'Distribución y colas')).toContainText('Teléfono saliente');

  // Vaciar el nombre no lo pone en rojo mientras se escribe, aunque ya se dejó una vez (relleno); al dejarlo vacío, sí.
  // Lo gris se mira en positivo: un «no hay rojo» se cumpliría antes de pintar.
  await page.locator('#group-name').fill('');
  await expect(gris(page, 'group-section-general', 'El nombre es obligatorio')).toHaveCount(1);
  await expect(rojo(page, 'group-section-general')).toHaveCount(0);
  await page.locator('#group-name').press('Tab');
  await expect(rojo(page, 'group-section-general')).toHaveText(['El nombre es obligatorio']);
  await expect(crear).toBeDisabled();

  // El rojo se va en vivo al rellenarlo.
  await page.locator('#group-name').fill(`E2E Índice ${Date.now()}`);
  await expect(rojo(page, 'group-section-general')).toHaveCount(0);
  await expect(fila(page, 'General')).not.toContainText('obligatorio');
});

test('grupo · «Distribución y colas» del índice lleva a su campo; abrir la lista del teléfono saliente no lo pone en rojo', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/crear');
  await page.locator('#group-name').fill(`E2E Índice ${Date.now()}`);
  await fila(page, 'Distribución y colas').click();
  await expect(actual(page)).toContainText('Distribución y colas');
  await expect(gris(page, 'group-channel-phone', 'El teléfono saliente es obligatorio')).toHaveCount(1);

  // Abrir la lista para elegir no es dejar el campo vacío.
  await page.locator('sc-select:has(#group-phone) .p-select-dropdown').click();
  await expect(page.locator('.p-select-overlay')).toBeVisible();
  await expect(rojo(page, 'group-channel-phone')).toHaveCount(0);
  await page.locator('.p-select-overlay .p-select-option', { hasText: '917945449' }).first().click();

  // Con el teléfono saliente elegido ya no falta nada.
  await expect(barra(page).getByRole('button', { name: 'Crear grupo' })).toBeEnabled();
  await expect(conPunto(page)).toHaveCount(0);
});

test('grupo · el resultado de una sección es vivo: tras dejarla en rojo, rellenarla la deja completa sin volver a pasar', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/crear');
  await page.locator('#group-name').fill(`E2E Índice ${Date.now()}`);
  await siguiente(page).click();
  await irASeccion(page, 'General');
  await expect(fila(page, 'Distribución y colas')).toHaveClass(/form-nav__item--has-error/);

  await irASeccion(page, 'Distribución y colas');
  await elegirTelefonoSaliente(page);
  await irASeccion(page, 'General');
  await expect(fila(page, 'Distribución y colas')).toHaveAccessibleName(completa);
  await expect(conPunto(page)).toHaveCount(0);
});

test('grupo · sin canales se crea: los canales no son obligatorios', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  await expect(page.locator('#group-section-general')).not.toContainText('Al menos uno');
  const nombre = `E2E Sin canales ${Date.now()}`;
  await page.locator('#group-name').fill(nombre);
  await page.locator('#group-channels-phone').click();
  await expect(page.locator('#group-section-general .field__error')).toHaveCount(0);

  await barra(page).getByRole('button', { name: 'Crear grupo' }).click();
  await expect(page).toHaveURL(/\/admin\/grupos\/editar\/\d+/);
  await expect(page.locator('.p-toast-message').filter({ hasText: `Grupo «${nombre}» creado` })).toBeVisible();
  // Sin canales, Agentes asignados solo pide asignar y habilitar.
  await irASeccion(page, 'Agentes asignados');
  const cabecera = page.locator('sc-agent-channel-table thead');
  await expect(cabecera).not.toContainText('Teléfono');
  await expect(cabecera).toContainText('Habilitado');
});

test('grupo · Online Support: quitar Teléfono y volver a ponerlo no le quita el canal a nadie', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  await page.locator('#group-channels-phone').click();
  await page.locator('#group-channels-phone').click();
  await irASeccion(page, 'Agentes asignados');

  const tabla = page.locator('sc-agent-channel-table');
  await expect(tabla).not.toContainText('Sin canales');
  await expect(page.locator('.ficha-summary')).not.toContainText('Sin agentes');
  // Lo guardado no ha cambiado: nada que guardar.
  await expect(barra(page).getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

test('agente · «Crear agente» apagado con lo que falta; General lo dice en gris, y dejarla la pone en rojo, como el grupo', async ({
  page,
}) => {
  await goto(page, 'admin/agentes/crear');
  await expect(barra(page).getByRole('button', { name: 'Crear agente' })).toBeDisabled();
  // Lo que falta, en el índice y no sobre el resumen (DD-222, DD-225).
  await expect(estado(page)).toHaveCount(0);
  await expect(fila(page, 'General')).toContainText('Nombre, email, extensión');
  await expect(fila(page, 'Grupos asignados')).toContainText('Un grupo');
  for (const aviso of ['El nombre es obligatorio', 'El email es obligatorio', 'La extensión es obligatoria']) {
    await expect(gris(page, 'agent-section-general', aviso)).toHaveCount(1);
  }
  await expect(rojo(page, 'agent-section-general')).toHaveCount(0);
  await expect(conPunto(page)).toHaveCount(0);

  // Dejar General así la pone en rojo; Grupos asignados, aún sin dejar, lo dice en gris.
  await siguiente(page).click();
  await expect(conPunto(page)).toHaveCount(1);
  await expect(fila(page, 'General')).toHaveClass(/form-nav__item--has-error/);
  await irASeccion(page, 'Grupos asignados');
  await expect(gris(page, 'agent-section-groups', 'Hace falta al menos un grupo')).toHaveCount(1);
  // Al volver, sus campos lo dicen en rojo (DD-222 §6).
  await irASeccion(page, 'General');
  await expect(rojo(page, 'agent-section-general')).toHaveCount(3);
});

test('agente · lo único que falta son los grupos: el índice lo dice en Grupos asignados, y su aviso va encima de la tabla', async ({
  page,
}) => {
  await goto(page, 'admin/agentes/crear');
  await page.locator('#agent-name').fill('E2E Sin grupos');
  await page.locator('#agent-email').fill(`e2e.sin.grupos.${Date.now()}@ejemplo.com`);
  await page.locator('sc-select:has(#agent-ext) .p-select').click();
  await page.locator('.p-select-overlay .p-select-option').first().click();
  await expect(fila(page, 'General')).toContainText('En curso');
  await expect(fila(page, 'Grupos asignados')).toContainText('Un grupo');
  await expect(barra(page).getByRole('button', { name: 'Crear agente' })).toBeDisabled();

  await irASeccion(page, 'Grupos asignados');
  await expect(actual(page)).toContainText('Grupos asignados');
  const aviso = page.locator('#agent-groups-error');
  // En gris es una ayuda, con su punto; en rojo, un error, sin él (DD-219).
  await expect(aviso).toHaveText('Hace falta al menos un grupo.');
  await expect(aviso).toHaveClass(/field__help/);
  // Encima de la tabla: debajo de una larga no se vería.
  const [arribaAviso, arribaTabla] = await Promise.all([
    aviso.evaluate((el) => el.getBoundingClientRect().top),
    page.locator('sc-group-assignment-table').evaluate((el) => el.getBoundingClientRect().top),
  ]);
  expect(arribaAviso).toBeLessThan(arribaTabla);
});

test('el resumen: en el alta no lleva estado y en la edición no dice «Listo», sin avisos amarillos en las fichas', async ({ page }) => {
  const avisos = page.locator('.ficha-summary sc-icon[name="warning"], .ficha-summary .resumen__warn');
  await goto(page, 'admin/grupos/crear');
  await expect(estado(page)).toHaveCount(0);
  await page.locator('#group-name').fill('Soporte');
  // El teléfono saliente sin elegir y un canal sin agentes se dicen sin aviso amarillo.
  await expect(page.locator('.ficha-summary')).toContainText('Sin número');
  await expect(avisos).toHaveCount(0);

  // Online Support, guardado y completo: un WhatsApp sin cuenta no es un aviso, y al editar no se dice «Listo».
  await goto(page, 'admin/grupos/editar/11');
  await expect(avisos).toHaveCount(0);
  await expect(page.locator('.ficha-summary')).not.toContainText('Listo para crear');
  // El alta de agente, tampoco desde que lleva los marcadores del grupo (DD-225).
  await goto(page, 'admin/agentes/crear');
  await expect(estado(page)).toHaveCount(0);
  await expect(avisos).toHaveCount(0);
});

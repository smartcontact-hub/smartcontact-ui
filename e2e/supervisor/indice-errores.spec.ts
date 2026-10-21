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
const completa = /Esta sección está completa/;
/** El aviso en gris: la ayuda de un campo del DS o la que va bajo un grupo de casillas. */
const gris = (page: Page, seccion: string, texto: string) =>
  page.locator(`#${seccion} :is(.field__help, .sc-field__msg:not(.sc-field__msg--error))`).filter({ hasText: texto });
/** El aviso en rojo: el error de un campo del DS o el que va bajo un grupo de casillas. */
const rojo = (page: Page, seccion: string) => page.locator(`#${seccion} :is(.field__error, .sc-field__msg--error)`);

test('grupo · el recorrido del compañero: «Crear grupo» apagado con lo que falta, el aviso en gris y en rojo al dejar el nombre vacío, y el índice sin rojo', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/crear');
  const crear = barra(page).getByRole('button', { name: 'Crear grupo' });
  await expect(crear).toBeDisabled();
  await expect(estado(page)).toContainText('Falta: nombre, teléfono saliente');
  // El nombre lo dice en gris desde el principio: es algo por rellenar, no un error.
  await expect(gris(page, 'group-section-general', 'El nombre es obligatorio')).toHaveCount(1);
  await expect(rojo(page, 'group-section-general')).toHaveCount(0);

  await page.locator('#group-name').fill('Soporte');
  await expect(estado(page)).toContainText('Falta: teléfono saliente');
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Distribución y colas');
  await irASeccion(page, 'General');
  // Dejar Distribución sin el teléfono saliente no pone su sección en rojo: lo dice el resumen.
  await expect(conPunto(page)).toHaveCount(0);

  // Vaciar el nombre no lo pone en rojo mientras se escribe, aunque ya se dejó una vez (relleno); al dejarlo vacío, sí.
  // El índice sigue sin rojo. Lo gris se mira en positivo: un «no hay rojo» se cumpliría antes de pintar.
  await page.locator('#group-name').fill('');
  await expect(gris(page, 'group-section-general', 'El nombre es obligatorio')).toHaveCount(1);
  await expect(rojo(page, 'group-section-general')).toHaveCount(0);
  await page.locator('#group-name').press('Tab');
  await expect(rojo(page, 'group-section-general')).toHaveText(['El nombre es obligatorio']);
  await expect(conPunto(page)).toHaveCount(0);
  await expect(crear).toBeDisabled();

  // El rojo se va en vivo al rellenarlo.
  await page.locator('#group-name').fill(`E2E Índice ${Date.now()}`);
  await expect(rojo(page, 'group-section-general')).toHaveCount(0);
  await expect(fila(page, 'General')).not.toContainText('obligatorio');
});

test('grupo · «teléfono saliente» del resumen lleva a Distribución y colas y a su campo; abrir su lista no lo pone en rojo', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/crear');
  await page.locator('#group-name').fill(`E2E Índice ${Date.now()}`);
  await estado(page).getByRole('button', { name: 'teléfono saliente' }).click();
  await expect(actual(page)).toContainText('Distribución y colas');
  await expect(page.locator('#group-phone')).toBeFocused();
  await expect(gris(page, 'group-channel-phone', 'El teléfono saliente es obligatorio')).toHaveCount(1);

  // Abrir la lista para elegir no es dejar el campo vacío.
  await page.locator('sc-select:has(#group-phone) .p-select-dropdown').click();
  await expect(page.locator('.p-select-overlay')).toBeVisible();
  await expect(rojo(page, 'group-channel-phone')).toHaveCount(0);
  await page.locator('.p-select-overlay .p-select-option', { hasText: '917945449' }).first().click();

  await expect(estado(page)).toContainText('Listo para crear');
  await expect(barra(page).getByRole('button', { name: 'Crear grupo' })).toBeEnabled();
  await expect(conPunto(page)).toHaveCount(0);
});

test('grupo · el ✓ se va si otra sección le cambia el contenido: quitar Teléfono deja Distribución sin ✓ ni rojo', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/crear');
  await page.locator('#group-name').fill(`E2E Índice ${Date.now()}`);
  await siguiente(page).click();
  await elegirTelefonoSaliente(page);
  await irASeccion(page, 'General');
  await expect(fila(page, 'Distribución y colas')).toHaveAccessibleName(completa);

  await page.locator('#group-channels-phone').click();
  await expect(fila(page, 'Distribución y colas')).not.toHaveAccessibleName(completa);
  await expect(conPunto(page)).toHaveCount(0);

  // Al verla otra vez, tal como está, vuelve su ✓.
  await irASeccion(page, 'Distribución y colas');
  await irASeccion(page, 'General');
  await expect(fila(page, 'Distribución y colas')).toHaveAccessibleName(completa);
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

test('agente · «Crear agente» apagado con lo que falta; General lo dice en gris, y dejarla no pone el índice en rojo', async ({
  page,
}) => {
  await goto(page, 'admin/agentes/crear');
  await expect(barra(page).getByRole('button', { name: 'Crear agente' })).toBeDisabled();
  await expect(estado(page)).toContainText('Falta: nombre, email, extensión, un grupo');
  for (const aviso of ['El nombre es obligatorio', 'El email es obligatorio', 'La extensión es obligatoria']) {
    await expect(gris(page, 'agent-section-general', aviso)).toHaveCount(1);
  }
  await expect(rojo(page, 'agent-section-general')).toHaveCount(0);

  await siguiente(page).click();
  await irASeccion(page, 'Grupos asignados');
  await expect(gris(page, 'agent-section-groups', 'Hace falta al menos un grupo')).toHaveCount(1);
  await irASeccion(page, 'General');
  await expect(conPunto(page)).toHaveCount(0);
  await expect(rojo(page, 'agent-section-general')).toHaveCount(0);
});

test('agente · lo único que falta son los grupos: el resumen lleva a Grupos asignados, y su aviso va encima de la tabla', async ({
  page,
}) => {
  await goto(page, 'admin/agentes/crear');
  await page.locator('#agent-name').fill('E2E Sin grupos');
  await page.locator('#agent-email').fill(`e2e.sin.grupos.${Date.now()}@ejemplo.com`);
  await page.locator('sc-select:has(#agent-ext) .p-select').click();
  await page.locator('.p-select-overlay .p-select-option').first().click();
  await expect(estado(page)).toContainText('Falta: un grupo');
  await expect(barra(page).getByRole('button', { name: 'Crear agente' })).toBeDisabled();

  await estado(page).getByRole('button', { name: 'un grupo' }).click();
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

test('el resumen dice lo que falta y «Listo para crear», sin avisos amarillos en las fichas', async ({ page }) => {
  const avisos = page.locator('.ficha-summary sc-icon[name="warning"], .ficha-summary .resumen__warn');
  await goto(page, 'admin/grupos/crear');
  await expect(estado(page)).toContainText('Falta: nombre, teléfono saliente');
  await expect(estado(page)).not.toHaveClass(/resumen__status--ready/);
  await page.locator('#group-name').fill('Soporte');
  await expect(estado(page)).toContainText('Falta: teléfono saliente');
  // El teléfono saliente sin elegir y un canal sin agentes se dicen sin aviso amarillo.
  await expect(page.locator('.ficha-summary')).toContainText('Sin número');
  await expect(avisos).toHaveCount(0);
  await elegirTelefonoSaliente(page);
  await expect(estado(page)).toContainText('Listo para crear');
  await expect(estado(page)).toHaveClass(/resumen__status--ready/);

  // Online Support, guardado y completo: el WhatsApp sin número no es un aviso, y al editar no se dice «Listo».
  await goto(page, 'admin/grupos/editar/11');
  await expect(avisos).toHaveCount(0);
  await expect(page.locator('.ficha-summary')).not.toContainText('Listo para crear');
  await goto(page, 'admin/agentes/crear');
  await expect(estado(page)).toContainText('Falta:');
  await expect(avisos).toHaveCount(0);
});

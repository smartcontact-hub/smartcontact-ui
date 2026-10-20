import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, elegirTelefonoSaliente, forceLightTheme, goto, irASeccion } from './helpers';

/**
 * LO QUE FALTA SE DICE AL PULSAR CREAR O GUARDAR, Y EL ✓ DICE LO QUE VISTE (DD-216).
 *
 * Revisión de producto del 2026-10-20, con dos recorridos de un compañero medidos en sc-supervisor.pages.dev:
 *   1. nombre → Distribución y colas → vuelta a General: Distribución ganaba un punto rojo (el teléfono saliente) sin
 *      haber visto nada en rojo dentro; al borrar el nombre salía otro en General, y la barra solo decía «El nombre es
 *      obligatorio». El punto de Distribución parecía causado por el nombre.
 *   2. Teléfono y su saliente → vuelta a General y fuera los canales: Distribución y colas seguía con ✓ aunque ya no
 *      quedaba nada de lo que se rellenó, junto al rojo de General.
 *
 * Ahora nada acusa mientras se rellena: «Crear» está siempre activo y, al pulsarlo con algo pendiente, cada sección dice
 * lo suyo en el índice, en texto, y se llega al primer campo. El ✓ se va si otra sección le cambia el contenido.
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
const completa = /Esta sección está completa/;

test('grupo · el recorrido del compañero: nada en rojo hasta pulsar «Crear grupo», y entonces cada sección dice lo suyo', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/crear');
  // «Crear grupo», activo desde el principio, y sin motivo al lado.
  await expect(barra(page).getByRole('button', { name: 'Crear grupo' })).toBeEnabled();
  await expect(page.locator('.form-save-reason')).toHaveCount(0);

  await page.locator('#group-name').fill('Soporte');
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Distribución y colas');
  await irASeccion(page, 'General');
  await page.locator('#group-name').fill('');
  // Dejar Distribución sin el teléfono saliente y vaciar el nombre no acusa: aún no se ha intentado crear.
  await expect(conPunto(page)).toHaveCount(0);
  await expect(page.locator('#group-section-general .field__error')).toHaveCount(0);

  await barra(page).getByRole('button', { name: 'Crear grupo' }).click();
  // No crea: se queda en el alta, en General, con el foco en el nombre, y el índice dice qué falta en cada sitio.
  await expect(page).toHaveURL(/\/admin\/grupos\/crear/);
  await expect(actual(page)).toContainText('General');
  await expect(page.locator('#group-name')).toBeFocused();
  await expect(fila(page, 'General')).toContainText('El nombre es obligatorio');
  await expect(fila(page, 'Distribución y colas')).toContainText('El teléfono saliente es obligatorio');

  // El rojo se va en vivo al arreglarlo, y el de la otra sección se queda: es suyo.
  await page.locator('#group-name').fill(`E2E Índice ${Date.now()}`);
  await expect(fila(page, 'General')).not.toContainText('obligatorio');
  await expect(conPunto(page)).toHaveCount(1);
  await expect(conPunto(page)).toContainText('Distribución y colas');
});

test('grupo · al pulsar «Crear grupo» con solo el teléfono saliente pendiente, lleva a Distribución y colas y a su campo', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/crear');
  await page.locator('#group-name').fill(`E2E Índice ${Date.now()}`);
  await barra(page).getByRole('button', { name: 'Crear grupo' }).click();
  await expect(actual(page)).toContainText('Distribución y colas');
  await expect(page.locator('#group-phone')).toBeFocused();
  await expect(page.locator('#group-channel-phone')).toContainText('El teléfono saliente es obligatorio');
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
  await expect(page.locator('.p-toast-message').filter({ hasText: `Grupo "${nombre}" creado` })).toBeVisible();
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

test('agente · nada en rojo al dejar General vacía; al pulsar «Crear agente», General y Grupos dicen lo suyo', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  await expect(barra(page).getByRole('button', { name: 'Crear agente' })).toBeEnabled();
  await siguiente(page).click();
  await irASeccion(page, 'Grupos asignados');
  await irASeccion(page, 'General');
  await expect(conPunto(page)).toHaveCount(0);

  await barra(page).getByRole('button', { name: 'Crear agente' }).click();
  await expect(page).toHaveURL(/\/admin\/agentes\/crear/);
  await expect(actual(page)).toContainText('General');
  await expect(page.locator('#agent-name')).toBeFocused();
  await expect(fila(page, 'General')).toContainText('El nombre es obligatorio');
  await expect(fila(page, 'Grupos asignados')).toContainText('Asigna al menos un grupo');
  // Cada campo dice lo suyo, también el nombre, el email y la extensión.
  const general = page.locator('#agent-section-general');
  await expect(general).toContainText('El nombre es obligatorio');
  await expect(general).toContainText('Escribe el email');
  await expect(general).toContainText('Selecciona una extensión');
});

test('el resumen no dice «Falta» ni «Listo para crear», y no hay avisos amarillos en las fichas', async ({ page }) => {
  const avisos = page.locator('.ficha-summary sc-icon[name="warning"], .ficha-summary .resumen__warn');
  await goto(page, 'admin/grupos/crear');
  await expect(page.locator('.ficha-summary')).not.toContainText('Falta');
  await page.locator('#group-name').fill('Soporte');
  await expect(page.locator('.ficha-summary')).not.toContainText('Listo para crear');
  // El teléfono saliente sin elegir y un canal sin agentes se dicen sin aviso amarillo.
  await expect(page.locator('.ficha-summary')).toContainText('Sin número');
  await expect(avisos).toHaveCount(0);

  // Online Support: el WhatsApp sin número, igual.
  await goto(page, 'admin/grupos/editar/11');
  await expect(avisos).toHaveCount(0);
  await goto(page, 'admin/agentes/crear');
  await expect(page.locator('.ficha-summary')).not.toContainText('Falta');
  await expect(avisos).toHaveCount(0);
});

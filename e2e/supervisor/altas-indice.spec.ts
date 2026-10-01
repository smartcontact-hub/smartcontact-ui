import { expect, test, type Page } from '@playwright/test';

import { colorEfectivo } from '../shared/color';
import { disableAnimations, forceLightTheme, goto, irASeccion, pickSelectOption } from './helpers';

/**
 * LAS ALTAS VUELVEN AL ÍNDICE, CON ✓ Y «SIGUIENTE» (DD-143, que revierte los pasos de DD-138).
 *
 * El alta tiene la maqueta de la edición: el índice a la izquierda, una sección a la vista y el resumen a la derecha.
 * La sección que se deja completa lleva ✓ en el índice, y al pie de cada una van «Atrás» y «Siguiente». General sigue
 * siendo la puerta del grupo (DD-121).
 *
 * Lo que fija:
 *   1. El alta tiene el índice de la edición, con sus secciones en orden y la primera a la vista, y ningún Stepper.
 *   2. Grupo: sin nombre, ni el índice ni «Siguiente» sacan de General; dicen qué falta y llevan el foco al campo. Con
 *      él, «Siguiente» y «Atrás» cambian de sección y llevan el foco a su título.
 *   3. «Siguiente» sube al principio de la sección nueva: sin eso, desde el pie de una sección larga se llega a media
 *      altura de la siguiente.
 *   4. La sección que se deja completa lleva ✓ en el índice, y su enlace lo dice; el ✓ se ve (3:1). La abierta no
 *      lo lleva aunque esté bien.
 *   5. Cambiar de sección en el alta no toca la dirección ni el historial: Atrás del navegador sale del alta. La
 *      primera sección no lleva «Atrás», y la última no lleva «Siguiente».
 *   6. Agente y usuario: las secciones, en cualquier orden.
 *   7. Crear desde una sección lleva a la edición en esa sección.
 *   8. Al editar, ni ✓ ni «Atrás / Siguiente».
 *   9. El aire: 28 de la sección a «Atrás / Siguiente», el de entre grupos (7 · 14 · 28).
 *  10. Los títulos van h1 → h2 → h3 sin saltos, como al editar.
 *
 * Storage limpio por test → cada store vuelve a su seed.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const filas = (page: Page) => page.locator('sc-form-section-nav .form-nav__item');
const fila = (page: Page, etiqueta: string) => filas(page).filter({ hasText: etiqueta });
/** La sección a la vista: el índice la marca como la página actual. */
const actual = (page: Page) => page.locator('sc-form-section-nav .form-nav__item[aria-current="page"]');
const siguiente = (page: Page) => page.getByRole('button', { name: 'Siguiente', exact: true });
const atras = (page: Page) => page.getByRole('button', { name: 'Atrás', exact: true });
const titulo = (page: Page, nombre: string) => page.getByRole('heading', { level: 2, name: nombre, exact: true });

test('grupo · el alta tiene el índice de la edición, con General a la vista, y ningún Stepper', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  await expect(filas(page)).toHaveText([/General/, /Distribución y colas/, /Recursos/, /Agentes/]);
  await expect(actual(page)).toContainText('General');
  await expect(titulo(page, 'General')).toBeVisible();
  await expect(page.locator('p-stepper')).toHaveCount(0);
});

test('grupo · sin nombre no se sale de General; con él, «Siguiente» y «Atrás» cambian de sección y llevan el foco a su título', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/crear');
  // Ni con «Siguiente» ni con el índice: lo dice el campo y el foco va a él.
  await siguiente(page).click();
  await expect(page.locator('#group-name-msg')).toHaveText('El nombre es obligatorio');
  await expect(page.locator('#group-name')).toBeFocused();
  await fila(page, 'Agentes').click();
  await expect(actual(page)).toContainText('General');
  await expect(page.locator('#group-name')).toBeFocused();

  await page.locator('#group-name').fill(`E2E Índice ${Date.now()}`);
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Distribución y colas');
  await expect(titulo(page, 'Distribución y colas')).toBeFocused();

  await atras(page).click();
  await expect(actual(page)).toContainText('General');
  await expect(titulo(page, 'General')).toBeFocused();
});

test('«Siguiente» sube al principio de la sección nueva', async ({ page }) => {
  // A 1280×720 Identidad y Grupos asignados no caben: «Siguiente» se pulsa desde el final de la primera.
  await page.setViewportSize({ width: 1280, height: 720 });
  await goto(page, 'admin/agentes/crear');
  const zona = page.locator('main#main-content');
  await siguiente(page).scrollIntoViewIfNeeded();
  expect(await zona.evaluate((m) => m.scrollTop), 'se ha bajado para llegar a «Siguiente»').toBeGreaterThan(0);

  await siguiente(page).click();
  await expect(actual(page)).toContainText('Grupos asignados');
  await expect(titulo(page, 'Grupos asignados')).toBeFocused();
  // Arriba del todo, con el nombre de la ficha a la vista: como al llegar a una página.
  await expect.poll(() => zona.evaluate((m) => m.scrollTop)).toBe(0);
});

test('grupo · la sección que se deja completa lleva ✓ en el índice, su enlace lo dice y el ✓ se ve', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  await page.locator('#group-name').fill(`E2E Índice ${Date.now()}`);
  // Aún no se ha dejado: sin ✓.
  await expect(fila(page, 'General')).not.toHaveAccessibleName(/completa/);

  await siguiente(page).click();
  await expect(fila(page, 'General')).toHaveAccessibleName(/General.*Esta sección está completa/);
  const check = fila(page, 'General').locator('.form-nav__done');
  await expect(check).toBeVisible();
  expect((await check.evaluate(colorEfectivo)).ratio, 'el ✓ sobre su fondo').toBeGreaterThanOrEqual(3);
  // La abierta no lleva ✓ aunque esté bien: aún no se ha dejado. Y Distribución, sin teléfono saliente, no está
  // completa (DD-142): al dejarla tampoco lo lleva.
  await expect(fila(page, 'Distribución y colas')).not.toHaveAccessibleName(/completa/);
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Recursos');
  await expect(fila(page, 'Distribución y colas')).not.toHaveAccessibleName(/completa/);
  await expect(fila(page, 'Distribución y colas').locator('.form-nav__done')).toHaveCount(0);
});

test('grupo · cambiar de sección no toca la dirección ni el historial; la primera no lleva «Atrás», la última no lleva «Siguiente»', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/crear');
  const direccion = page.url();
  const historial = await page.evaluate(() => history.length);
  await expect(atras(page)).toHaveCount(0);
  await expect(siguiente(page)).toBeVisible();

  await page.locator('#group-name').fill(`E2E Índice ${Date.now()}`);
  await siguiente(page).click();
  await fila(page, 'Agentes').click();
  await expect(actual(page)).toContainText('Agentes');

  expect(page.url()).toBe(direccion);
  expect(await page.evaluate(() => history.length)).toBe(historial);
  // La última no lleva «Siguiente»: se crea con el botón de arriba.
  await expect(siguiente(page)).toHaveCount(0);
  await expect(atras(page)).toBeVisible();
});

test('agente · las secciones van en cualquier orden: sin nombre se llega a Permisos', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  await expect(filas(page)).toHaveText([/Identidad/, /Grupos asignados/, /Permisos/, /Recursos/, /Avanzado/]);
  await irASeccion(page, 'Permisos');
  await expect(page.locator('#agent-section-permissions')).toBeVisible();
  await expect(page.locator('p-stepper')).toHaveCount(0);
});

test('usuario · las secciones van en cualquier orden: sin nombre se llega a Acceso', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');
  await expect(filas(page)).toHaveText([/Identidad/, /Acceso/, /Servicios asignados/]);
  await irASeccion(page, 'Acceso');
  await expect(page.locator('#user-section-access')).toBeVisible();
});

test('crear desde una sección lleva a la edición en esa sección', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  await page.locator('#agent-name').fill(`E2E Índice ${Date.now()}`);
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#agent-ext') }), /./);
  await irASeccion(page, 'Permisos');
  await page.getByRole('button', { name: 'Crear agente', exact: true }).click();

  await expect(page).toHaveURL(/\/admin\/agentes\/editar\/\d+\?seccion=permisos$/);
  await expect(actual(page)).toContainText('Permisos');
});

test('al editar, ni ✓ ni «Atrás / Siguiente»', async ({ page }) => {
  for (const [ruta, otra] of [
    ['admin/grupos/editar/11', 'Recursos'],
    ['admin/agentes/editar/1', 'Permisos'],
    ['admin/usuarios/editar/1', 'Acceso'],
  ] as const) {
    await goto(page, ruta);
    await irASeccion(page, otra);
    await expect(page.locator('.form-nav__done'), ruta).toHaveCount(0);
    await expect(siguiente(page), ruta).toHaveCount(0);
    await expect(atras(page), ruta).toHaveCount(0);
  }
});

test('el aire: 28 de la sección a «Atrás / Siguiente»', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  await irASeccion(page, 'Permisos');
  const aire = await page.evaluate(() => {
    const seccion = document.querySelector('#agent-section-permissions')!.getBoundingClientRect();
    const boton = document.querySelector('.alta-pie sc-button')!.getBoundingClientRect();
    return Math.round(boton.top - seccion.bottom);
  });
  // Los botones son otro grupo que la sección: el doble de los 14 de dentro.
  expect(aire).toBe(28);
});

test('los títulos del alta van h1 → h2 → h3 sin saltos, como al editar', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  await expect(titulo(page, 'General')).toHaveCount(1);
  const niveles = await page
    .locator('main#main-content')
    .evaluate((m) => [...m.querySelectorAll('h1, h2, h3, h4')].map((h) => `${h.tagName} ${(h.textContent ?? '').trim()}`));
  const saltos = niveles.filter((t, i) => i > 0 && Number(t[1]) - Number(niveles[i - 1]![1]) > 1);
  expect(saltos, niveles.join(' · ')).toEqual([]);
});

import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

/**
 * LAS TRES FICHAS, UNA FORMA (DD-122) — agente, grupo y usuario.
 *
 * Nace el 2026-09-23 como red de «una página + pestañas» de usuario y agente. El 2026-09-27 las dos
 * pasan al índice lateral de la ficha de grupo (DD-122: un solo índice, y que funcione de una sola
 * forma) y esta red pasa con ellas. Fija lo que define la forma, no el adorno:
 *   1. El nombre es el único `h1` de la página, y es el mismo que el del campo de Identidad.
 *   2. UN índice lateral gobierna el contenido: una sección a la vista, en su caja; sin pestañas.
 *   3. Un solo orden por ficha en los dos modos, el de sus dependencias: el del índice al editar y el de los
 *      pasos en el alta (DD-137). La ficha abre en la primera (Identidad) y el listado la abre en su sección de
 *      trabajo (`?seccion=`).
 *   4. Las tres fichas comparten molde: la cabecera en la misma vertical, el índice de Contact
 *      Center (196, fijo) y el contenido de 812 a 1440 con el resumen a la derecha.
 *   5. Abierta en otra pestaña, lo dice (el candado ya se cogía; hasta el 2026-09-27 no se pintaba).
 *   6. El alta de agente deja en su EDICIÓN de verdad: el router en `editar/N`, y el índice con él.
 * Y «Valores por defecto» va sin caja: su título es el `h1` visible de la página (DD-33).
 */

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const FICHAS = [
  {
    nombre: 'usuario',
    editar: 'admin/usuarios/editar/1',
    crear: 'admin/usuarios/crear',
    lista: 'admin/usuarios',
    prefijo: 'user-section-',
    orden: ['Identidad', 'Acceso', 'Servicios asignados'],
    trabajo: { rotulo: 'Acceso', seccion: 'acceso' },
    campoNombre: '#user-name',
    alta: 'Nuevo usuario',
  },
  {
    nombre: 'agente',
    editar: 'admin/agentes/editar/1',
    crear: 'admin/agentes/crear',
    lista: 'admin/agentes',
    prefijo: 'agent-section-',
    orden: ['Identidad', 'Grupos asignados', 'Permisos', 'Recursos', 'Avanzado'],
    trabajo: { rotulo: 'Grupos asignados', seccion: 'grupos' },
    campoNombre: '#agent-name',
    alta: 'Nuevo agente',
  },
] as const;

const indice = (page: Page) => page.locator('sc-form-section-nav');
const rotulos = async (page: Page) =>
  (await indice(page).locator('.form-nav__label').allTextContents()).map((t) => t.trim());
const actual = (page: Page) => indice(page).locator('.form-nav__item[aria-current="page"] .form-nav__label');
/** En el alta, los pasos del Stepper en vez del índice (DD-137). */
const pasos = (page: Page) => page.getByRole('tablist', { name: 'Pasos del alta' });

for (const f of FICHAS) {
  test(`${f.nombre} · el nombre es el único h1 y el índice gobierna la ficha, sin pestañas`, async ({ page }) => {
    await goto(page, f.editar);

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveClass(/headline__name/);
    const nombre = (await h1.textContent())?.trim() ?? '';
    expect(nombre.length).toBeGreaterThan(0);

    // UN índice, con su orden, y abre en la primera. Ni pestañas ni tira.
    expect(await rotulos(page)).toEqual([...f.orden]);
    await expect(actual(page)).toHaveText(f.orden[0]);
    await expect(page.locator('[role="tab"], p-tabs')).toHaveCount(0);

    // Una sección a la vista, en su caja (la de la ficha de grupo).
    await expect(page.locator(`[id^="${f.prefijo}"]`)).toHaveCount(1);
    await expect(page.locator(`sc-section-card [id^="${f.prefijo}"]`)).toBeVisible();

    // El título es el nombre de verdad: el mismo que se edita en Identidad.
    await expect(page.locator(`${f.campoNombre} input, input${f.campoNombre}`).first()).toHaveValue(nombre);
  });

  test(`${f.nombre} · al crear, los pasos en el mismo orden y abre por Identidad`, async ({ page }) => {
    await goto(page, f.crear);
    await expect(pasos(page).getByRole('tab')).toHaveText(f.orden.map((r) => new RegExp(r)));
    await expect(pasos(page).locator('p-step[aria-current="step"]')).toContainText('Identidad');
    await expect(indice(page)).toHaveCount(0);
    // La cabecera, también en el alta (DD-130): «Nuevo …» hasta que se escribe el nombre, y sin «Eliminar».
    await expect(page.locator('.headline__name')).toHaveText(f.alta);
    await expect(page.locator('.headline__actions')).toHaveCount(0);
  });

  test(`${f.nombre} · el listado abre la ficha en su sección de trabajo`, async ({ page }) => {
    await goto(page, f.lista);
    // «Editar» del menú de la fila: abre donde abre el clic en la fila (`onRowOpen`).
    await page.locator('tbody tr').first().locator('.rules-kebab-btn').click();
    await page.locator('.p-menu-overlay .p-menu-item-link', { hasText: /editar/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${f.lista}/editar/\\d+\\?seccion=${f.trabajo.seccion}$`));
    await expect(actual(page)).toHaveText(f.trabajo.rotulo);
  });

  test(`${f.nombre} · el resumen de la derecha dice sus tres cifras`, async ({ page }) => {
    await goto(page, f.editar);
    await expect(page.locator('.ficha-summary .resumen__kpi')).toHaveCount(3);
  });

  test(`${f.nombre} · recargar no es «otra pestaña»; abrirla en otra de verdad, sí`, async ({ page, context }) => {
    await goto(page, f.editar);
    await page.reload();
    await expect(page.locator('.headline__name')).toBeVisible();
    await expect(page.locator('.ficha-conflict')).toHaveCount(0);

    const otra = await context.newPage();
    await goto(otra, f.editar);
    await expect(otra.locator('.ficha-conflict')).toBeVisible();
    // Y la primera se entera también (evento `storage`).
    await expect(page.locator('.ficha-conflict')).toBeVisible();
  });
}

test('agente · crear deja en su edición de verdad: el índice ya enlaza a la edición, no al alta', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  const nombre = `E2E Agente ${Date.now()}`;
  await page.locator('#agent-name').fill(nombre);
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#agent-ext') }), /./);

  await page.getByRole('button', { name: 'Crear agente' }).click();
  await expect(page).toHaveURL(/\/admin\/agentes\/editar\/\d+$/);
  await expect(page.locator('.headline__name')).toContainText(nombre);
  // Con `Location.replaceState` (hasta el 2026-09-27) la barra decía `editar/N`, pero el router seguía
  // en `crear`: cada enlace del índice llevaba a un alta vacía.
  // Los cinco, contados: sobre una lista vacía, «todos enlazan a la edición» se cumpliría sin índice.
  await expect(indice(page).locator('a.form-nav__item')).toHaveCount(5);
  const enlaces = await indice(page).locator('a.form-nav__item').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(enlaces.every((h) => /\/admin\/agentes\/editar\/\d+/.test(h ?? '')), enlaces.join(' · ')).toBe(true);
});

test('usuario · la línea bajo el nombre se lee entera', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/usuarios/editar/1');
  const meta = page.locator('.headline__meta');
  const cortada = await meta.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(cortada).toBe(false);
  // El tipo es una cifra del resumen, no un trozo de esa línea (no cabía: medido el 2026-09-23).
  await expect(page.locator('.ficha-summary')).toContainText('Tipo');
});

test('las tres fichas tienen «Eliminar» en su franja', async ({ page }) => {
  for (const ruta of ['admin/grupos/editar/1', 'admin/usuarios/editar/1', 'admin/agentes/editar/1']) {
    await goto(page, ruta);
    await expect(page.locator('.headline__actions').getByRole('button', { name: 'Eliminar' }), ruta).toBeVisible();
  }
});

/** El molde, leído en su sitio: dónde arranca el título, el índice y el contenido, y cuánto miden. */
const molde = (page: Page) =>
  page.evaluate(() => {
    const caja = (sel: string) => (document.querySelector(sel) as HTMLElement).getBoundingClientRect();
    const rail = document.querySelector('.page__rail') as HTMLElement;
    return {
      titulo: Math.round(caja('h1').left),
      indice: { x: Math.round(caja('.page__rail').left), ancho: Math.round(caja('.page__rail').width) },
      fijo: getComputedStyle(rail).position,
      contenido: Math.round(caja('.page__main').width),
      resumen: Math.round(caja('.ficha-summary').width),
    };
  });

test('las tres fichas comparten molde: título, índice, contenido y resumen en el mismo sitio', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const medidas: Record<string, Awaited<ReturnType<typeof molde>>> = {};
  for (const [nombre, ruta] of [
    ['grupo', 'admin/grupos/editar/1'],
    ['usuario', 'admin/usuarios/editar/1'],
    ['agente', 'admin/agentes/editar/1'],
  ]) {
    await goto(page, ruta);
    await expect(page.locator('.headline')).toBeVisible();
    medidas[nombre] = await molde(page);
  }
  const { grupo, usuario, agente } = medidas;
  // La de grupo, con las cifras del índice de Contact Center (DD-121): 196 y fijo; contenido de 812 a 1440.
  expect(grupo, JSON.stringify(medidas)).toMatchObject({ indice: { ancho: 196 }, fijo: 'sticky', contenido: 812, resumen: 240 });
  expect(usuario, JSON.stringify(medidas)).toEqual(grupo);
  expect(agente, JSON.stringify(medidas)).toEqual(grupo);
});

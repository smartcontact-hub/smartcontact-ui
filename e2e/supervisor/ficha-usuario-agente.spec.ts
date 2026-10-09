import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion, pickSelectOption } from './helpers';

/**
 * LAS TRES FICHAS, UNA FORMA (DD-122) — agente, grupo y usuario.
 *
 * Nace el 2026-09-23 como red de «una página + pestañas» de usuario y agente. El 2026-09-27 las dos
 * pasan al índice lateral de la ficha de grupo (DD-122: un solo índice, y que funcione de una sola
 * forma) y esta red pasa con ellas. Fija lo que define la forma, no el adorno:
 *   1. El nombre es el único `h1` de la página, y es el mismo que el del campo de nombre de la primera sección.
 *   2. UN índice lateral gobierna el contenido: una sección a la vista, en su caja; sin pestañas.
 *   3. Un solo orden por ficha en los dos modos, el de sus dependencias, con el mismo índice al crear y al editar
 *      (DD-143). La ficha abre en la primera (Identidad; en el agente, General desde DD-187) y el listado la abre
 *      en su sección de trabajo (`?seccion=`).
 *   4. Las tres fichas comparten molde: la cabecera en la misma vertical, el índice de Contact
 *      Center (196, fijo) y el contenido de 812 a 1440 con el resumen a la derecha.
 *   5. (Quitado el 2026-10-09, DD-187: el aviso de «abierta en otra pestaña» ya no existe.)
 *   6. El alta de agente deja en su EDICIÓN de verdad: el router en `editar/N`, y el índice con él.
 * Y «Valores por defecto» va sin caja: su título es el `h1` visible de la página (DD-33).
 * Y un subtítulo de sección dice algo que el título no dice, o no está (UX de pantalla, regla 3): «Capacidades del
 * agente» bajo «Permisos» y «Comportamiento, integración y sesión» bajo «Avanzado» eran relleno. Desde DD-187 las dos
 * son subsecciones de Configuración, y el relleno sigue sin volver.
 *
 * Cambió con DD-187 (revisión de agentes del 2026-10-09): la ficha de agente pasa de cinco secciones a las cuatro de la
 * de grupo (General, Configuración, Recursos y Grupos), su resumen dice seis filas junto al anillo, y crear un agente
 * pide email y un grupo.
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
    // Dos anillos y una fila.
    resumen: 3,
  },
  {
    nombre: 'agente',
    editar: 'admin/agentes/editar/1',
    crear: 'admin/agentes/crear',
    lista: 'admin/agentes',
    prefijo: 'agent-section-',
    // Las cuatro de la ficha de grupo desde DD-187; hasta entonces, Identidad, Grupos asignados, Permisos, Recursos y
    // Avanzado.
    orden: ['General', 'Configuración', 'Recursos', 'Grupos'],
    trabajo: { rotulo: 'Grupos', seccion: 'grupos' },
    campoNombre: '#agent-name',
    alta: 'Nuevo agente',
    // Su anillo (habilitado en grupos) y seis filas: Atiende por, Extensión, Grabación, Salientes, Recursos y Tipo de
    // agente (DD-187; eran dos, canales y tipo).
    resumen: 7,
  },
] as const;

const indice = (page: Page) => page.locator('sc-form-section-nav');
const rotulos = async (page: Page) =>
  (await indice(page).locator('.form-nav__label').allTextContents()).map((t) => t.trim());
const actual = (page: Page) => indice(page).locator('.form-nav__item[aria-current="page"] .form-nav__label');

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

    // El título es el nombre de verdad: el mismo que se edita en la primera sección.
    await expect(page.locator(`${f.campoNombre} input, input${f.campoNombre}`).first()).toHaveValue(nombre);
  });

  test(`${f.nombre} · al crear, el mismo orden y abre por la primera`, async ({ page }) => {
    await goto(page, f.crear);
    expect(await rotulos(page)).toEqual([...f.orden]);
    await expect(actual(page)).toHaveText(f.orden[0]);
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

  test(`${f.nombre} · el resumen de la derecha dice sus datos`, async ({ page }) => {
    await goto(page, f.editar);
    // Las cifras con anillo, cada una en su tarjeta, y los datos sueltos como filas de una sola tarjeta (`sc-fact-row`,
    // DD-186). Cuántos, en `resumen` de cada ficha. Las filas se esperan antes de contar: `count()` no espera.
    await expect(page.locator('.ficha-summary .resumen__pairs .sc-fact-row').first()).toBeVisible();
    const cifras = await page.locator('.ficha-summary sc-summary-kpi').count();
    const filas = await page.locator('.ficha-summary .resumen__pairs .sc-fact-row').count();
    expect(cifras + filas, `${cifras} cifras y ${filas} filas`).toBe(f.resumen);
  });
}

test('agente · crear deja en su edición de verdad: el índice ya enlaza a la edición, no al alta', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  const nombre = `E2E Agente ${Date.now()}`;
  await page.locator('#agent-name').fill(nombre);
  // Lo obligatorio desde DD-187: también el email y un grupo (el primero de su tabla).
  await page.locator('#agent-email').fill(`e2e.agente.${Date.now()}@example.com`);
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#agent-ext') }), /./);
  await irASeccion(page, 'Grupos');
  await page.locator('sc-group-assignment-table tbody tr').first().getByRole('checkbox', { name: /^Asignado —/ }).click();
  // Se crea desde General: crear desde otra sección lleva a la edición en esa sección (`altas-indice`).
  await irASeccion(page, 'General');

  await page.getByRole('button', { name: 'Crear agente' }).click();
  await expect(page).toHaveURL(/\/admin\/agentes\/editar\/\d+$/);
  await expect(page.locator('.headline__name')).toContainText(nombre);
  // Con `Location.replaceState` (hasta el 2026-09-27) la barra decía `editar/N`, pero el router seguía
  // en `crear`: cada enlace del índice llevaba a un alta vacía.
  // Los cuatro (cinco hasta DD-187), contados: sobre una lista vacía, «todos enlazan a la edición» se cumpliría sin
  // índice.
  await expect(indice(page).locator('a.form-nav__item')).toHaveCount(4);
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

// Desde DD-144, «Eliminar» va bajo el índice: con el título dentro del contenido, la franja ya no tiene sitio a su
// derecha.
test('las tres fichas tienen «Eliminar» bajo el índice', async ({ page }) => {
  for (const ruta of ['admin/grupos/editar/1', 'admin/usuarios/editar/1', 'admin/agentes/editar/1']) {
    await goto(page, ruta);
    await expect(page.locator('.page__rail').getByRole('button', { name: 'Eliminar' }), ruta).toBeVisible();
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

// Desde DD-187, Permisos y Avanzado son subsecciones de Configuración (Avanzado, plegada): sus títulos se leen ahí.
test('agente · Permisos y Avanzado, sin subtítulo de relleno: su título ya lo dice', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1?seccion=configuracion');
  await expect(page.getByRole('heading', { level: 2, name: 'Configuración', exact: true })).toBeVisible();
  for (const [titulo, relleno] of [
    ['Permisos', 'Capacidades del agente'],
    ['Avanzado', 'Comportamiento, integración y sesión'],
  ] as const) {
    await expect(page.locator('.sc-subsection__title').getByText(titulo, { exact: true }), titulo).toBeVisible();
    await expect(page.locator('main').getByText(relleno, { exact: true }), titulo).toHaveCount(0);
  }
});

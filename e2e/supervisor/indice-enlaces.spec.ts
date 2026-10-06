import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion } from './helpers';

/**
 * UN SOLO ÍNDICE, Y QUE FUNCIONE DE UNA SOLA FORMA (DD-122).
 *
 * Hasta el 2026-09-27 la app tenía dos índices con dos comportamientos: Contact Center enlazaba a sus
 * rutas con una pieza propia, y las fichas y el constructor de reglas usaban `sc-form-section-nav`,
 * cuyas filas eran `href="#"` con `role="tab"`: la sección vivía en la memoria de la página, Atrás
 * no volvía a la anterior, Cmd+clic abría la misma página con `#` y un enlace no podía llevar a una
 * sección. La regla que fija esta red, la misma en todas las pantallas con índice:
 *
 *   · cada fila es un ENLACE a su sitio —una ruta (Contact Center) o `?seccion=` (fichas y
 *     constructor)— y la actual se anuncia como la página actual;
 *   · clic = navegar dentro de la app, sin fundir la página; Cmd/Ctrl+clic = otra pestaña, en esa
 *     sección; Atrás = la sección anterior (al editar);
 *   · en un ALTA, cambiar de sección no toca la dirección ni el historial (DD-143, su red es
 *     `altas-indice`): Atrás sale del alta, y la de grupo no deja entrar por la dirección a otra
 *     sección sin completar General;
 *   · un solo «Guardar» por ficha: el índice marca las secciones con cambios sin guardar y la barra
 *     lo dice en palabras.
 * Las fichas de agente y usuario entran el mismo día, al pasar de pestañas al índice lateral.
 */

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const indice = (page: Page) => page.locator('sc-form-section-nav');
const filas = (page: Page) => indice(page).locator('a.form-nav__item');
const fila = (page: Page, rotulo: string) => indice(page).locator('a.form-nav__item', { hasText: rotulo });
const actual = (page: Page) => indice(page).locator('a.form-nav__item[aria-current="page"] .form-nav__label');
const seccion = (page: Page) => new URL(page.url()).searchParams.get('seccion');
const largoHistorial = (page: Page) => page.evaluate(() => history.length);

for (const { pantalla, ruta, hrefs } of [
  {
    pantalla: 'ficha de grupo',
    ruta: 'admin/grupos/editar/1',
    hrefs: [
      '/admin/grupos/editar/1',
      '/admin/grupos/editar/1?seccion=distribucion',
      '/admin/grupos/editar/1?seccion=recursos',
      '/admin/grupos/editar/1?seccion=agentes',
    ],
  },
  {
    pantalla: 'ficha de agente',
    ruta: 'admin/agentes/editar/1',
    hrefs: [
      '/admin/agentes/editar/1',
      '/admin/agentes/editar/1?seccion=grupos',
      '/admin/agentes/editar/1?seccion=permisos',
      '/admin/agentes/editar/1?seccion=recursos',
      '/admin/agentes/editar/1?seccion=avanzado',
    ],
  },
  {
    pantalla: 'ficha de usuario',
    ruta: 'admin/usuarios/editar/1',
    hrefs: ['/admin/usuarios/editar/1', '/admin/usuarios/editar/1?seccion=acceso', '/admin/usuarios/editar/1?seccion=servicios'],
  },
  {
    pantalla: 'constructor de reglas',
    ruta: 'conversaciones/reglas/1',
    hrefs: ['/conversaciones/reglas/1?seccion=general', '/conversaciones/reglas/1'],
  },
  {
    pantalla: 'Contact Center',
    ruta: 'config/aed/servicio',
    hrefs: ['/config/aed/servicio', '/config/aed/agentes', '/config/aed/grupos'],
  },
]) {
  test(`${pantalla} · cada fila es un enlace a su sitio, ninguna es pestaña y la actual es la página`, async ({ page }) => {
    await goto(page, ruta);
    await expect(filas(page).first()).toBeVisible();
    const enlaces = await filas(page).evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(enlaces.slice(0, hrefs.length)).toEqual(hrefs);
    await expect(indice(page).locator('[role="tab"]')).toHaveCount(0);
    await expect(indice(page).locator('[aria-current="page"]')).toHaveCount(1);
  });
}

test('ficha de grupo · cambiar de sección cambia la dirección, y Atrás vuelve a la anterior', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');
  await expect(actual(page)).toHaveText('General');

  await fila(page, 'Distribución').click();
  await expect(page.locator('#group-section-distribution')).toBeVisible();
  expect(seccion(page)).toBe('distribucion');

  await fila(page, 'Agentes').click();
  await expect(page.locator('#group-section-agents')).toBeVisible();
  expect(seccion(page)).toBe('agentes');

  await page.goBack();
  await expect(page.locator('#group-section-distribution')).toBeVisible();
  await expect(actual(page)).toHaveText('Distribución y colas');

  await page.goBack();
  await expect(page.locator('#group-section-general')).toBeVisible();
  expect(seccion(page)).toBeNull();
});

test('ficha de grupo · un enlace con ?seccion= abre esa sección', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1?seccion=recursos');
  await expect(page.locator('#group-section-resources')).toBeVisible();
  await expect(actual(page)).toHaveText('Recursos');
});

test('ficha de grupo · Cmd/Ctrl+clic abre la sección en otra pestaña, y las dos avisan de que la ficha está abierta en otra', async ({
  page,
  context,
}) => {
  /* Lo que es de la app: que el Ctrl+clic llegue al enlace de la sección SIN cancelar (entonces el navegador lo abre en
   * otra pestaña) y que la ficha no se mueva. El último oyente del clic —en `window`, en burbuja, detrás de los de la
   * app— lo apunta y corta la acción por defecto; la otra pestaña se abre con ese enlace, como en `ficha-grupo`.
   * Hasta el 2026-09-28 el test esperaba a que el navegador creara la pestaña en segundo plano
   * (`context.waitForEvent('page')`). En local pasaba siempre; en el runner del CI (medido el 2026-09-29, un worker y
   * `--repeat-each`) esa espera falla 6 de 203 veces y la forma de ahora 0 de 240. No es de la app, es una carrera
   * entre Playwright y Chromium, vista en el protocolo: cuando la carga de la pestaña empieza antes de que Playwright
   * active `Page` en ella, Chromium no le manda el `Page.frameNavigated` de esa primera navegación, y Playwright o no
   * entrega la pestaña (espera esa navegación: los 90 s del CI) o la entrega con el marco aún en `about:blank` (los
   * localizadores no encuentran la sección). La pestaña sí se abría y cargaba la ficha: la original mostraba el aviso.
   * Una pestaña de `context.newPage()` la sigue Playwright desde que nace. No vuelvas a la espera subiendo el timeout.
   * Que el manejador del índice no cancele el clic con tecla lo fija además la prueba unitaria del DS. */
  await page.addInitScript(() => {
    window.addEventListener('click', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const enlace = e.target instanceof Element ? e.target.closest('a') : null;
      const apunte = { href: enlace?.getAttribute('href') ?? null, cancelado: e.defaultPrevented };
      (window as unknown as { __ctrlClic: unknown }).__ctrlClic = apunte;
      e.preventDefault();
    });
  });
  await goto(page, 'admin/grupos/editar/1');
  await fila(page, 'Agentes').click({ modifiers: ['ControlOrMeta'] });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __ctrlClic?: unknown }).__ctrlClic))
    .toEqual({ href: '/admin/grupos/editar/1?seccion=agentes', cancelado: false });
  expect(seccion(page)).toBeNull();

  const otra = await context.newPage();
  await goto(otra, 'admin/grupos/editar/1?seccion=agentes');
  await expect(otra.locator('#group-section-agents')).toBeVisible();
  // La original no se ha movido.
  await expect(page.locator('#group-section-general')).toBeVisible();
  // Dos editores del mismo grupo: el aviso de otra pestaña es justo lo que lo cubre.
  await expect(otra.locator('.ficha-conflict')).toBeVisible();
  await expect(page.locator('.ficha-conflict')).toBeVisible();
});

test('alta · cambiar de sección no deja rastro: Atrás del navegador sale del alta', async ({ page }) => {
  await goto(page, 'admin/agentes');
  await page.getByRole('button', { name: 'Nuevo agente', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/agentes\/crear$/);

  await irASeccion(page, 'Permisos');
  await irASeccion(page, 'Avanzado');
  expect(seccion(page)).toBeNull();

  // Sin cambios que guardar, Atrás sale sin preguntar: si cada sección dejara su entrada, volvería a la anterior.
  await page.goBack();
  await expect(page).toHaveURL(/\/admin\/agentes$/);
});

test('alta de grupo · la dirección no se salta General: sin nombre ni canales, abre en General y sin parámetro', async ({
  page,
}) => {
  await goto(page, 'admin/grupos/crear?seccion=agentes');
  await expect(page.locator('#group-section-general')).toBeVisible();
  await expect(actual(page)).toHaveText('General');
  await expect.poll(() => seccion(page)).toBeNull();
  // Y al completar General no salta sola a la sección que pedía la dirección.
  await page.locator('#group-name').fill('Grupo que no salta');
  await expect(page.locator('#group-section-general')).toBeVisible();
});

test('cambiar de sección no funde la página; cambiar de pantalla, sí', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __vt: { abiertas: number; saltadas: number } };
    w.__vt = { abiertas: 0, saltadas: 0 };
    const original = document.startViewTransition?.bind(document);
    if (!original) return;
    document.startViewTransition = ((arg: Parameters<typeof original>[0]) => {
      const t = original(arg);
      w.__vt.abiertas += 1;
      const saltar = t.skipTransition.bind(t);
      t.skipTransition = () => {
        w.__vt.saltadas += 1;
        saltar();
      };
      return t;
    }) as typeof document.startViewTransition;
  });
  const cuenta = () => page.evaluate(() => (window as unknown as { __vt: { abiertas: number; saltadas: number } }).__vt);

  await goto(page, 'admin/grupos/editar/1');
  const inicio = await cuenta();
  await fila(page, 'Recursos').click();
  await expect(page.locator('#group-section-resources')).toBeVisible();
  await expect.poll(async () => (await cuenta()).abiertas).toBe(inicio.abiertas + 1);
  expect((await cuenta()).saltadas, 'el cambio de sección fundió la página entera').toBe(inicio.saltadas + 1);

  // Otra pantalla (Contact Center): esa sí funde, como siempre.
  await goto(page, 'config/aed/servicio');
  const cc = await cuenta();
  await fila(page, 'Agentes').click();
  await expect(page).toHaveURL(/\/config\/aed\/agentes$/);
  await expect.poll(async () => (await cuenta()).abiertas).toBe(cc.abiertas + 1);
  expect((await cuenta()).saltadas).toBe(cc.saltadas);
});

test('Contact Center · el rótulo nombra el índice, y cada sección es su ruta con Atrás', async ({ page }) => {
  await goto(page, 'config/aed/servicio');
  const nav = page.getByRole('navigation', { name: 'Contact Center' });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: 'General' })).toHaveAttribute('aria-current', 'page');

  await nav.getByRole('link', { name: 'Grupos' }).click();
  await expect(page).toHaveURL(/\/config\/aed\/grupos$/);
  await expect(nav.getByRole('link', { name: 'Grupos' })).toHaveAttribute('aria-current', 'page');

  await page.goBack();
  await expect(page).toHaveURL(/\/config\/aed\/servicio$/);
  await expect(nav.getByRole('link', { name: 'General' })).toHaveAttribute('aria-current', 'page');
});

test('ficha de grupo · un solo Guardar: el índice marca las secciones con cambios y la barra lo dice', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');
  const sinGuardar = page.getByText('Cambios sin guardar', { exact: true });
  await expect(indice(page).locator('.form-nav__item--has-changes')).toHaveCount(0);
  await expect(sinGuardar).toHaveCount(0);

  // Un cambio en Recursos: se marca Recursos, y solo Recursos.
  await fila(page, 'Recursos').click();
  await page.locator('#group-card-url').fill('https://crm.example.com/ficha');
  await expect(fila(page, 'Recursos')).toHaveClass(/form-nav__item--has-changes/);
  await expect(indice(page).locator('.form-nav__item--has-changes')).toHaveCount(1);
  await expect(sinGuardar).toBeVisible();

  // Moverse no guarda ni pierde nada: la marca sigue al volver a General.
  await fila(page, 'General').click();
  await expect(fila(page, 'Recursos')).toHaveClass(/form-nav__item--has-changes/);

  // Deshacer quita las marcas y el aviso.
  await page.getByRole('button', { name: 'Deshacer' }).click();
  await expect(indice(page).locator('.form-nav__item--has-changes')).toHaveCount(0);
  await expect(sinGuardar).toHaveCount(0);
});

test('constructor de reglas · la sección sale de la dirección, conserva el tipo, y en el alta no deja rastro', async ({
  page,
}) => {
  await goto(page, 'conversaciones/reglas/1');
  await expect(actual(page)).toHaveText('Alcance');
  await fila(page, 'General').click();
  // El router escribe la dirección UNA TAREA después del clic (abre antes la transición de vista, aunque
  // luego se salte). Medido en la página: vacía tras el clic y tras las microtareas, y `general` tras una
  // tarea. Leerla sin esperar fue una carrera que el CI perdió.
  await expect.poll(() => seccion(page)).toBe('general');
  await expect(actual(page)).toHaveText('General');
  await page.goBack();
  await expect(actual(page)).toHaveText('Alcance');
  expect(seccion(page)).toBeNull();

  await goto(page, 'conversaciones/reglas/nueva?type=classification');
  const antes = await largoHistorial(page);
  await fila(page, 'Alcance').click();
  await expect(actual(page)).toHaveText('Alcance');
  const url = new URL(page.url());
  expect(url.searchParams.get('type')).toBe('classification');
  expect(url.searchParams.get('seccion')).toBe('alcance');
  expect(await largoHistorial(page)).toBe(antes);
});

test('Atrás desde una ficha con cambios y «Seguir editando»: el listado sigue detrás', async ({ page }) => {
  // Con el router en `canceledNavigationResolution: 'replace'` (el de fábrica), cancelar el aviso
  // reescribía la entrada del LISTADO con la de la ficha, y el segundo Atrás salía de la app. Con
  // secciones que son enlaces, Atrás es un gesto de todos los días (DD-122).
  await goto(page, 'admin/grupos');
  await page.locator('tbody tr').first().locator('td').nth(2).click();
  await expect(page.locator('.headline__name')).toBeVisible();
  await page.locator('#group-name').fill('Nombre sin guardar');

  const aviso = page.getByRole('alertdialog', { name: '¿Descartar cambios?' });
  await page.evaluate(() => history.back());
  await expect(aviso).toBeVisible();
  await aviso.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(page).toHaveURL(/\/admin\/grupos\/editar\/\d+$/);
  await expect(page.locator('#group-name')).toHaveValue('Nombre sin guardar');

  await page.evaluate(() => history.back());
  await expect(aviso).toBeVisible();
  await aviso.getByRole('button', { name: 'Descartar' }).click();
  await expect(page).toHaveURL(/\/admin\/grupos$/);
});

test('las marcas del índice caen en la misma vertical, al final de su fila, sea cual sea el rótulo', async ({ page }) => {
  // Dos secciones con cambios: el nombre (General) y desbordar (Distribución y colas). Hasta DD-176 el punto iba
  // detrás de la última palabra, así que cada uno caía donde acababa su rótulo («General •», «Distribución y colas •»).
  await goto(page, 'admin/grupos/editar/11');
  await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Soporte de tarde');
  await irASeccion(page, 'Distribución y colas');
  await page.getByRole('switch', { name: 'Desbordar si todos los agentes están inactivos' }).click();
  await expect(page.locator('sc-form-section-nav .form-nav__dot')).toHaveCount(2);
  const marcas = await page.locator('sc-form-section-nav .form-nav__item').evaluateAll((filas) =>
    filas
      .map((fila) => ({ fila: fila.getBoundingClientRect(), punto: fila.querySelector('.form-nav__dot')?.getBoundingClientRect() }))
      .filter((m) => m.punto)
      .map((m) => ({ derecha: Math.round(m.punto!.right), finDeFila: Math.round(m.fila.right - parseFloat(getComputedStyle(document.querySelector('.form-nav__item')!).paddingRight)) })),
  );
  expect(marcas, 'dos secciones con cambios').toHaveLength(2);
  expect(marcas[0]!.derecha, 'los dos puntos, en la misma vertical').toBe(marcas[1]!.derecha);
  expect(marcas[0]!.derecha, 'al final de la fila, empujados por el rótulo').toBe(marcas[0]!.finDeFila);
});

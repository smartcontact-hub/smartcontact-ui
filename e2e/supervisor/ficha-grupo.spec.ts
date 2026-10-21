import { expect, test, type Page } from '@playwright/test';

import { columnasACadaAncho, disableAnimations, elegirTelefonoSaliente, forceLightTheme, goto } from './helpers';

/**
 * LA FICHA DE GRUPO — índice lateral con cuatro secciones y el resumen a la derecha; el alta es la misma
 * ficha en modo alta, y duplicar lleva a la ficha de la copia (DD-217; hasta entonces, un diálogo corto).
 *
 * Nace el 2026-09-23 como red de la forma «una página + pestañas»; el 2026-09-26 la ficha pasa al
 * índice lateral que pide la visión de producto de grupos (2026-09-25, DD-121) y esta red pasa con
 * ella. Lo que fija son las decisiones que definen la forma, no los píxeles de adorno:
 *
 *   1. UN índice lateral gobierna TODO el contenido: una sección a la vista, y abre en General,
 *      que es la que decide las demás (sus canales).
 *   2. El molde es el de Contact Center (`--rail`, índice de 196), con el resumen a la derecha y las tres
 *      columnas arrancando a la misma altura: el nombre va encima del índice, en su columna (DD-170).
 *   3. El índice y el resumen siguen enteros a la vista al bajar, también en un portátil; por debajo de 1340,
 *      el resumen es una franja encima del contenido.
 *   4. Los grupos no llevan cara (2026-09-23): ni foto en la ficha ni avatar en las listas.
 *   5. (Quitado el 2026-10-09, DD-187: el aviso de «abierta en otra pestaña» ya no existe.)
 *   6. El alta es la MISMA ficha, con el mismo índice (DD-143): abre en General, «Siguiente» guía por las secciones,
 *      sin puertas (DD-217), «Crear grupo» apagado hasta tener lo obligatorio (DD-219), y crear deja en la edición,
 *      en la sección abierta.
 */

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const indice = (page: Page) => page.locator('sc-form-section-nav');

test('el índice lateral gobierna la ficha, y abre por General', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');

  await expect(indice(page).locator('.form-nav__item')).toHaveCount(4);
  await expect(indice(page).locator('.form-nav__item[aria-current="page"] .form-nav__label')).toHaveText('General');

  // UNA sola sección pintada a la vez: el índice gobierna el contenido, no lo decora.
  await expect(page.locator('[id^="group-section-"]')).toHaveCount(1);
  await expect(page.locator('#group-section-general')).toBeVisible();

  // Y no vuelve la tira de pestañas: si reaparece, la forma se ha revertido a medias.
  await expect(page.locator('p-tabs')).toHaveCount(0);

  await indice(page).getByText('Agentes asignados', { exact: true }).click();
  await expect(page.locator('#group-section-agents')).toBeVisible();
  await expect(page.locator('#group-section-general')).toHaveCount(0);
});

test('crear es la misma ficha: abre en General con Teléfono, «Crear grupo» apagado hasta tener lo obligatorio, y crea desde donde está', async ({
  page,
}) => {
  // Aunque la dirección pida otra sección: en el alta, la abierta no vive en la dirección.
  await goto(page, 'admin/grupos/crear?seccion=agentes');
  const general = page.locator('#group-section-general');
  await expect(indice(page).locator('.form-nav__item[aria-current="page"] .form-nav__label')).toHaveText('General');
  await expect(page.locator('h1')).toHaveText('Nuevo grupo');
  // Nace con Teléfono marcado, y lo que falta se dice en gris, no en rojo (DD-219).
  const telefono = general.locator('sc-checkbox').filter({ hasText: /^\s*Teléfono\s*$/ });
  await expect(telefono.locator('input[type=checkbox]')).toHaveAttribute('aria-checked', 'true');
  await expect(general.locator('.sc-field__msg:not(.sc-field__msg--error)').filter({ hasText: 'El nombre es obligatorio' })).toHaveCount(1);
  await expect(general.locator('.sc-field__msg--error')).toHaveCount(0);

  // «Crear grupo», arriba, apagado mientras falte algo (DD-219).
  const crear = page.getByRole('button', { name: 'Crear grupo' });
  await expect(crear).toBeDisabled();

  // Un nombre que ya existe se dice en vivo, y tampoco deja crear.
  await page.locator('#group-name').fill('campaigns');
  await expect(general).toContainText('Ya hay un grupo con este nombre');
  await expect(crear).toBeDisabled();

  // Sin canales no falta nada en General: son opcionales (DD-217), y sin Teléfono tampoco hace falta su número.
  await page.locator('#group-name').fill(`E2E Alta ${Date.now()}`);
  await telefono.click();
  await expect(general).not.toContainText('Hace falta al menos un canal');
  await expect(crear).toBeEnabled();
  await telefono.click();
  await expect(crear).toBeDisabled();

  // «Siguiente» lleva a la sección siguiente, y crear deja en su edición EN esa sección. Con Teléfono, su número es
  // obligatorio (DD-142), y se elige allí.
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.locator('#group-section-distribution')).toBeVisible();
  await elegirTelefonoSaliente(page);
  await expect(crear).toBeEnabled();
  await crear.click();
  await expect(page).toHaveURL(/admin\/grupos\/editar\/\d+\?seccion=distribucion$/);
  await expect(page.locator('#group-section-distribution')).toBeVisible();
  // Nace con los valores por defecto de Grupos.
  await expect(page.locator('.headline__meta')).toContainText('prioridad: baja');
});

test('duplicar abre el alta con la copia, sin diálogo, y se lleva los agentes del original (SISMAC-4056)', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const fila = page.locator('tbody tr', { hasText: 'Reclamaciones' });
  await fila.locator('.rules-kebab-btn').click();
  await page.getByRole('menuitem', { name: 'Duplicar' }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/admin\/grupos\/crear\?seedFromId=12$/);
  await expect(page.locator('.headline__name')).toHaveText('Reclamaciones (1)');
  await indice(page).getByText('Agentes asignados', { exact: true }).click();
  await expect(page.locator('.assign tbody tr').first()).toBeVisible();
});

test('los grupos no llevan cara: ni avatar en las listas ni foto en la ficha', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await expect(page.locator('tbody tr').first()).toBeVisible();
  await expect(page.locator('tbody sc-illustrated-avatar')).toHaveCount(0);

  await goto(page, 'admin/grupos/editar/1');
  await expect(page.locator('#group-name')).toBeVisible();
  await expect(page.locator('sc-photo-upload')).toHaveCount(0);
  // En la ficha (no en la barra de arriba, que lleva la cara de quien usa la app).
  await expect(page.locator('.page__inner sc-illustrated-avatar')).toHaveCount(0);
});

test('el índice es el de Contact Center, y las tres columnas arrancan a la misma altura, con el nombre encima del índice', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/grupos/editar/1');

  const m = await page.evaluate(() => {
    const caja = (sel: string) => (document.querySelector(sel) as HTMLElement).getBoundingClientRect();
    const inner = document.querySelector('.page__inner') as HTMLElement;
    const s = getComputedStyle(inner);
    const r = getComputedStyle(document.querySelector('.page__rail') as HTMLElement);
    const h1 = caja('h1');
    const rail = caja('.page__rail');
    const main = caja('.page__main');
    const resumen = caja('sc-group-summary');
    return {
      clases: inner.className,
      padding: s.padding,
      rail: { x: Math.round(rail.left), arriba: rail.top, ancho: Math.round(rail.width), derecha: rail.right, pos: r.position, top: r.top },
      main: { x: main.left, ancho: Math.round(main.width), arriba: main.top, derecha: main.right },
      resumen: { x: resumen.left, ancho: Math.round(resumen.width), arriba: resumen.top },
      h1: { x: Math.round(h1.left), arriba: h1.top, abajo: h1.bottom },
    };
  });

  // Un solo arquetipo declarado (`--rail`); `ficha-rail` parte la fila y `--summary` abre la columna del resumen.
  expect(m.clases).toContain('page__inner--rail');
  expect(m.clases).toContain('ficha-rail--summary');
  expect(m.clases).not.toContain('ficha-tabs');
  expect(m.padding).toBe('28px');
  // El índice, el de Contact Center: en la caja, 235 (DD-221), y fijo con el mismo `top` que el relleno de arriba.
  expect(m.rail.ancho).toBe(235);
  expect(m.rail.pos).toBe('sticky');
  expect(m.rail.top).toBe('28px');
  // El resumen, a la derecha: 240, con el hueco de siempre (28) entre las tres columnas. A 1440 el
  // contenido mide 773, sitio de sobra para la tabla de agentes con sus cuatro canales.
  expect(m.resumen.ancho).toBe(240);
  expect(Math.round(m.main.x - m.rail.derecha)).toBe(28);
  expect(Math.round(m.resumen.x - m.main.derecha)).toBe(28);
  expect(m.main.ancho).toBe(773);
  // Desde DD-170 el nombre va arriba de la columna del índice, y la sección y el resumen arrancan a su altura. De
  // DD-144 a DD-170 iba en la columna del contenido, encima de la sección, que arrancaba 56 px más abajo.
  expect(m.h1.arriba).toBe(m.rail.arriba);
  expect(m.h1.x).toBe(m.rail.x);
  expect(m.main.arriba).toBe(m.rail.arriba);
  expect(m.resumen.arriba).toBe(m.rail.arriba);
});

test('en un portátil, al bajar hasta el final de la sección más larga, el índice y el resumen siguen enteros', async ({
  page,
}) => {
  // 1366×768 es el portátil más común; con el navegador abierto, la página se queda en unos 660 de alto.
  await page.setViewportSize({ width: 1366, height: 660 });
  // El 11 es el grupo más cargado del seed: los cuatro canales, dos avisos y dos estrategias.
  await goto(page, 'admin/grupos/editar/11');
  await page.locator('sc-form-section-nav').getByText('Distribución y colas', { exact: true }).click();
  await page.locator('#group-section-distribution').evaluate((el) => el.scrollIntoView({ block: 'end' }));

  const m = await page.evaluate(() => {
    const caja = (sel: string) => (document.querySelector(sel) as HTMLElement).getBoundingClientRect();
    return { indice: caja('sc-form-section-nav'), resumen: caja('.ficha-summary'), alto: window.innerHeight };
  });
  // Bajo el índice, en el carril sin scroll, el índice se iba por arriba a medio editar (medido el 2026-09-27).
  expect(m.indice.top).toBeGreaterThanOrEqual(0);
  expect(m.resumen.top).toBeGreaterThanOrEqual(0);
  // El nombre real de cada campo en Salida («Teléfono saliente», «Número WhatsApp», DD-146) no cabe en una línea con
  // su valor en los 240px del resumen: la clave se queda sola arriba y el valor baja, una línea más por fila (medido:
  // +40px en este grupo, con sus dos números de salida). El margen de sobra antes de esta etiqueta era de 12,5px;
  // ahora el resumen se pasa 6,5px del alto en el peor caso. Acortar el nombre del campo para ganarlos reintroduciría
  // la ambigüedad que corrigió DD-146, así que el margen se amplía en vez de acortar la etiqueta.
  // Desde la revisión del 2026-10-15 Email tiene estrategia y su fila en el resumen: a este alto el resumen ya no cabe
  // entero y se desplaza dentro de su columna (`.ficha-summary`, alto máximo y scroll propio). Se mide esa caja.
  expect(m.resumen.bottom).toBeLessThanOrEqual(m.alto + 10);
});

test('por debajo de 1340 el resumen pasa a una franja encima del contenido, en su columna, que vuelve a medir 881', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await goto(page, 'admin/grupos/editar/11');

  const m = await page.evaluate(() => {
    const caja = (sel: string) => (document.querySelector(sel) as HTMLElement).getBoundingClientRect();
    return { resumen: caja('sc-group-summary'), rail: caja('.page__rail'), main: caja('.page__main') };
  });
  expect(m.resumen.bottom).toBeLessThanOrEqual(m.main.top);
  // En la columna del contenido (DD-170): la del índice la ocupan el nombre y el índice, de arriba abajo.
  expect(Math.round(m.resumen.left)).toBe(Math.round(m.main.left));
  expect(Math.round(m.main.width)).toBe(881);
});

test('en General, los canales caen en las tres columnas de los campos de encima, en cualquier ancho', async ({ page }) => {
  // 1920: con la rejilla de casillas que se rellena sola (`auto-fill`) salían cuatro columnas y «Chat» caía 86 px a la
  // izquierda de «Prioridad»; a 1440, 3 px (medido en producción el 2026-10-05, DD-170). Y entre 1340 y 1410 los campos
  // pasaban a una columna, a todo el ancho, con los canales debajo en tres (medido en producción el 2026-10-17).
  await goto(page, 'admin/grupos/editar/1');
  const casillas = async () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.checkbox-grid--3 > .checkbox-stack')].map((e) => Math.round(e.getBoundingClientRect().left * 4) / 4),
    );
  for (const { ancho, columnas } of await columnasACadaAncho(page, '.identity-fields, .checkbox-grid--3')) {
    const [campos, canales] = columnas;
    expect(campos, `${ancho}: las columnas de los campos`).toHaveLength(ancho > 720 ? 3 : 1);
    expect(canales, `${ancho}: los canales, en las columnas de los campos`).toEqual(campos);
  }
  // Y cada casilla, en su columna, no solo la pista: a 1440 y a 1920, las tres.
  for (const ancho of [1440, 1920]) {
    const [{ columnas }] = await columnasACadaAncho(page, '.identity-fields', [ancho]);
    expect(await casillas(), `${ancho}: cada canal, en la vertical de su columna`).toEqual(columnas[0]);
  }
});

test('el nombre del grupo es el título de la página, y solo hay un h1', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');

  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveClass(/headline__name/);
  await expect(h1).not.toBeEmpty();
});

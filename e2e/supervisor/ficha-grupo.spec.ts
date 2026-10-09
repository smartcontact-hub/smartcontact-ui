import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, elegirTelefonoSaliente, forceLightTheme, goto } from './helpers';

/**
 * LA FICHA DE GRUPO — índice lateral con cuatro secciones y el resumen a la derecha; el alta es la misma
 * ficha en modo alta, y duplicar, un diálogo corto.
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
 *   6. El alta es la MISMA ficha, con el mismo índice (DD-143): General es la puerta (nombre y canales antes de
 *      seguir), «Siguiente» guía por las secciones y crear deja en la edición, en la sección abierta.
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

  await indice(page).getByText('Agentes', { exact: true }).click();
  await expect(page.locator('#group-section-agents')).toBeVisible();
  await expect(page.locator('#group-section-general')).toHaveCount(0);
});

test('crear es la misma ficha: abre en General con Teléfono, no deja pasar sin nombre y crea desde donde está', async ({
  page,
}) => {
  // Aunque la dirección pida otra sección: General es la puerta del alta.
  await goto(page, 'admin/grupos/crear?seccion=agentes');
  const general = page.locator('#group-section-general');
  await expect(indice(page).locator('.form-nav__item[aria-current="page"] .form-nav__label')).toHaveText('General');
  await expect(page.locator('h1')).toHaveText('Nuevo grupo');
  // Nace con Teléfono marcado, y nada acusa al abrir.
  const telefono = general.locator('sc-checkbox').filter({ hasText: /^\s*Teléfono\s*$/ });
  await expect(telefono.locator('input[type=checkbox]')).toHaveAttribute('aria-checked', 'true');
  await expect(general).not.toContainText('El nombre es obligatorio');

  // «Crear grupo», arriba, espera a que General esté completa.
  const crear = page.getByRole('button', { name: 'Crear grupo' });
  await expect(crear).toBeDisabled();

  // Sin nombre no se sale de General, ni con «Siguiente» ni con el índice: lo dice en su campo, y el foco
  // va a ese campo (con teclado, si no, «Siguiente» no haría nada visible).
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(general).toContainText('El nombre es obligatorio');
  await expect(page.locator('#group-name')).toBeFocused();
  await indice(page).getByText('Agentes', { exact: true }).click();
  await expect(general).toBeVisible();

  // Un nombre que ya existe se dice en vivo.
  await page.locator('#group-name').fill('campaigns');
  await expect(general).toContainText('Ya hay un grupo con este nombre');

  // Con nombre y sin canales, tampoco: el foco va al primer canal.
  await page.locator('#group-name').fill(`E2E Alta ${Date.now()}`);
  await telefono.click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(general).toContainText('Selecciona al menos un canal');
  await expect(page.locator('#group-channels-phone')).toBeFocused();
  await telefono.click();

  // Completa, «Siguiente» lleva a la sección siguiente, y crear deja en su edición EN esa sección. Con Teléfono, crear
  // espera también a su número (DD-142), que se elige allí.
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.locator('#group-section-distribution')).toBeVisible();
  await expect(crear).toBeDisabled();
  await elegirTelefonoSaliente(page);
  await expect(crear).toBeEnabled();
  await crear.click();
  await expect(page).toHaveURL(/admin\/grupos\/editar\/\d+\?seccion=distribucion$/);
  await expect(page.locator('#group-section-distribution')).toBeVisible();
  // Nace con los valores por defecto de Grupos.
  await expect(page.locator('.headline__meta')).toContainText('prioridad: baja');
});

test('duplicar sigue siendo un diálogo corto y se lleva los agentes del original', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const fila = page.locator('tbody tr', { hasText: 'Reclamaciones' });
  await fila.locator('.rules-kebab-btn').click();
  await page.getByRole('menuitem', { name: 'Duplicar' }).click();

  const dialogo = page.getByRole('dialog', { name: 'Duplicar grupo' });
  await expect(page.locator('#group-duplicate-name')).toHaveValue('Reclamaciones (copia)');
  // La copia no se lleva el teléfono del original, y con Teléfono hay que elegirlo (DD-142).
  await elegirTelefonoSaliente(page, '917945449', 'group-duplicate-phone');
  await dialogo.getByRole('button', { name: 'Duplicar' }).click();

  await expect(page).toHaveURL(/admin\/grupos\/editar\/\d+$/);
  await expect(page.locator('.headline__name')).toHaveText('Reclamaciones (copia)');
  await indice(page).getByText('Agentes', { exact: true }).click();
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
  expect(m.padding).toBe('22.75px 28px');
  // El índice, el de Contact Center: 196 y fijo con el mismo `top` que el relleno de arriba.
  expect(m.rail.ancho).toBe(196);
  expect(m.rail.pos).toBe('sticky');
  expect(m.rail.top).toBe('22.75px');
  // El resumen, a la derecha: 240, con el hueco de siempre (28) entre las tres columnas. A 1440 el
  // contenido mide 812, sitio de sobra para la tabla de agentes con sus cuatro canales.
  expect(m.resumen.ancho).toBe(240);
  expect(Math.round(m.main.x - m.rail.derecha)).toBe(28);
  expect(Math.round(m.resumen.x - m.main.derecha)).toBe(28);
  expect(m.main.ancho).toBe(812);
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
    return { indice: caja('sc-form-section-nav'), resumen: caja('sc-group-summary'), alto: window.innerHeight };
  });
  // Bajo el índice, en el carril sin scroll, el índice se iba por arriba a medio editar (medido el 2026-09-27).
  expect(m.indice.top).toBeGreaterThanOrEqual(0);
  expect(m.resumen.top).toBeGreaterThanOrEqual(0);
  expect(m.resumen.bottom).toBeLessThanOrEqual(m.alto);
});

test('por debajo de 1340 el resumen pasa a una franja encima del contenido, en su columna, que vuelve a medir 920', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await goto(page, 'admin/grupos/editar/11');

  const m = await page.evaluate(() => {
    const caja = (sel: string) => (document.querySelector(sel) as HTMLElement).getBoundingClientRect();
    return { resumen: caja('sc-group-summary'), rail: caja('.page__rail'), main: caja('.page__main') };
  });
  expect(m.resumen.bottom).toBeLessThanOrEqual(m.main.top);
  // En la columna del contenido (DD-170): la del índice la ocupan el nombre y el índice, de arriba abajo.
  expect(Math.round(m.resumen.left)).toBe(Math.round(m.main.left));
  expect(Math.round(m.main.width)).toBe(920);
});

test('en General, los canales caen en las tres columnas de los campos de encima, en cualquier ancho', async ({ page }) => {
  // 1920: con la rejilla de casillas que se rellena sola (`auto-fill`) salían cuatro columnas y «Chat» caía 86 px a la
  // izquierda de «Prioridad»; a 1440, 3 px (medido en producción el 2026-10-05, DD-170).
  for (const ancho of [1440, 1920]) {
    await page.setViewportSize({ width: ancho, height: 900 });
    await goto(page, 'admin/grupos/editar/1');
    const m = await page.evaluate(() => {
      const campos = document.querySelector('.identity-fields')!;
      const pistas = getComputedStyle(campos).gridTemplateColumns.split(' ').map(parseFloat);
      const hueco = parseFloat(getComputedStyle(campos).columnGap);
      const x0 = campos.getBoundingClientRect().left;
      const columnas = pistas.map((_, i) => x0 + pistas.slice(0, i).reduce((a, b) => a + b + hueco, 0));
      const casillas = [...document.querySelectorAll('.checkbox-grid > .checkbox-stack')].map((e) => e.getBoundingClientRect().left);
      return { columnas: columnas.map((x) => Math.round(x * 4) / 4), casillas: casillas.map((x) => Math.round(x * 4) / 4) };
    });
    expect(m.columnas, `${ancho}: tres columnas de campos`).toHaveLength(3);
    expect(m.casillas, `${ancho}: cada canal, en la vertical de su columna`).toEqual(m.columnas);
  }
});

test('el nombre del grupo es el título de la página, y solo hay un h1', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');

  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveClass(/headline__name/);
  await expect(h1).not.toBeEmpty();
});

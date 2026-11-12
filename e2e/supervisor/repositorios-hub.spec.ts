import { expect, test, type Page } from '@playwright/test';

import { enNavegador, type Rgb } from '../shared/color';
import { disableAnimations, forceDarkTheme, forceLightTheme, goto } from './helpers';

/**
 * REPOSITORIOS EN TARJETAS POR GRUPO, CON SU PANEL (DD-179; las cifras y el buscador, DD-165).
 *
 * El hub dejó de ser el `Menu` del DS: cada destino es una tarjeta de su grupo, con su tono, y pulsarla abre a la
 * derecha un panel con lo que hay dentro. Lo que fija:
 *   1. cada tarjeta dice cuántos hay, la misma cifra que enseña su lista, y el lector la oye con su nombre;
 *   2. el buscador filtra por nombre y descripción, y sin resultados lo dice, con «Limpiar búsqueda»;
 *   3. el filtro deja solo un grupo, con la opción elegida en su tono, y pulsarla otra vez vuelve a todos;
 *   4. el panel: lo abre su tarjeta, con sus entradas; otra tarjeta lo cambia; lo cierran la misma tarjeta, Escape y
 *      un clic fuera; «Abrir repositorio» y cada entrada llevan a su sitio;
 *   5. con el teclado, el foco entra en el panel y vuelve a su tarjeta;
 *   6. acoplado, no tapa ninguna tarjeta y va sin velo; si pisa alguna, flota con sombra y las demás siguen a mano; solo
 *      si no deja ninguna entera a la vista lleva velo y es un diálogo;
 *   7. todo cabe sin desplazar a 1440 × 800;
 *   8. el buscador vacío ofrece los últimos repositorios abiertos, el último primero, y elegir uno entra en él;
 *   9. los ocho que el COA da por «Próximamente» (SISMAC-4064) llevan su cifra y esa marca, no abren panel y no le quitan
 *      la marca a la que la tiene (DD-245);
 *  10. al pasar, el borde se ENCIENDE en el tono fuerte de su grupo, en claro y en oscuro, también en las de
 *      «Próximamente»; marcada, su halo es de ese mismo color (DD-246);
 *  11. marcar otra tarjeta es natural (DD-249, también el 6 y el 9): el doble clic no abre y cierra, arrastrar un texto
 *      del panel hacia fuera no lo cierra, el panel nuevo se lee desde arriba, encoger la ventana no lo deja sin poder
 *      cerrarse, y si la marcada deja de verse su panel se va con ella.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const filasDeLista = async (page: Page, ruta: string): Promise<number> => {
  await goto(page, ruta);
  await page.locator('tbody tr').first().waitFor();
  return page.locator('tbody tr').count();
};

const tarjeta = (page: Page, nombre: string) => page.locator('.repo-card', { hasText: nombre }).first();
const panel = (page: Page) => page.locator('#repo-panel');
/** Dos fotogramas: lo que deba cambiar ya ha cambiado. Para afirmar que algo SIGUE igual tras un gesto. */
const trasPintar = (page: Page) =>
  page.evaluate(() => new Promise((listo) => requestAnimationFrame(() => requestAnimationFrame(listo))));

test('cada tarjeta dice cuántos hay, la cifra de su lista, y el lector la oye con su nombre', async ({ page }) => {
  const tipificaciones = await filasDeLista(page, 'admin/tipificaciones');
  const reglas = await filasDeLista(page, 'conversaciones/reglas');
  await goto(page, 'admin/repositorios');
  const fila = page.getByRole('button', { name: `Tipificaciones (${tipificaciones})`, exact: true });
  await expect(fila).toBeVisible();
  await expect(fila.locator('.repo-card__count')).toHaveText(String(tipificaciones));
  await expect(page.getByRole('button', { name: `Reglas IA (${reglas})`, exact: true })).toBeVisible();
});

test('el buscador filtra por nombre y descripción; sin resultados lo dice, con «Limpiar búsqueda»', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  const tarjetas = page.locator('.repo-card');
  const todas = await tarjetas.count();
  const buscador = page.getByRole('searchbox');

  await buscador.fill('tipif');
  await expect(tarjetas).toHaveCount(1);
  await expect(tarjetas).toContainText('Tipificaciones');
  // También por la descripción: «turnos» solo está en la de Horarios.
  await buscador.fill('turnos');
  await expect(tarjetas).toHaveCount(1);
  await expect(tarjetas).toContainText('Horarios');

  await buscador.fill('zzz');
  await expect(tarjetas).toHaveCount(0);
  await expect(page.locator('sc-empty-state')).toBeVisible();
  // El del vacío: el buscador lleva su propio botón de limpiar, con el mismo nombre.
  await page.locator('sc-empty-state').getByRole('button', { name: 'Limpiar búsqueda' }).click();
  await expect(buscador).toHaveValue('');
  await expect(tarjetas).toHaveCount(todas);
});

test('el filtro deja solo su grupo, con la opción elegida en su tono; pulsarla otra vez vuelve a todos', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  const grupos = page.locator('.cat');
  await expect(grupos).toHaveCount(4);

  const ia = page.getByRole('button', { name: 'IA', exact: true });
  await ia.click();
  await expect(grupos).toHaveCount(1);
  await expect(grupos).toHaveAttribute('data-tono', 'orange');
  // La opción elegida se escribe en el tono de su grupo: el mismo color que el título del grupo.
  const color = (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).color);
  expect(await color('.hub-filter__label[data-tono="orange"]')).toBe(await color('.cat__title'));

  await ia.click();
  await expect(grupos).toHaveCount(4);
  await expect(page.locator('.hub-filter__label[data-tono]')).toHaveCount(0);
});

test('el panel: lo abre su tarjeta con sus entradas; otra lo cambia; lo cierran la misma, Escape y un clic fuera', async ({
  page,
}) => {
  const agendas = await filasDeLista(page, 'admin/agendas');
  await goto(page, 'admin/repositorios');

  const agenda = tarjeta(page, 'Agendas');
  await agenda.click();
  await expect(agenda).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.p-drawer-title')).toHaveText('Agendas');
  await expect(panel(page).locator('.entrada')).toHaveCount(agendas);

  // Otra tarjeta cambia el panel.
  await tarjeta(page, 'Equipos').click();
  await expect(page.locator('.p-drawer-title')).toHaveText('Equipos');
  await expect(agenda).toHaveAttribute('aria-expanded', 'false');

  // La misma tarjeta lo cierra.
  await tarjeta(page, 'Equipos').click();
  await expect(page.locator('.repo-card--selected')).toHaveCount(0);
  await expect(panel(page)).toHaveCount(0);

  // Escape lo cierra.
  await agenda.click();
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);

  // Un clic fuera (el título de la página) lo cierra; uno dentro del panel, no.
  await agenda.click();
  await panel(page).locator('.panel__description').click();
  await expect(panel(page)).toBeVisible();
  await page.locator('h1').click();
  await expect(panel(page)).toHaveCount(0);
});

test('«Abrir repositorio» lleva a su página, y cada entrada a su sitio', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').click();
  await panel(page).getByRole('button', { name: 'Abrir repositorio' }).click();
  await expect(page).toHaveURL(/\/admin\/agendas$/);

  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Tipificaciones').click();
  await panel(page).locator('.entrada').first().click();
  await expect(page).toHaveURL(/\/admin\/tipificaciones\/editar\/\d+$/);
});

test('con el teclado, Enter abre el panel y lleva el foco dentro; Escape lo devuelve a su tarjeta', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  const agenda = tarjeta(page, 'Agendas');
  await agenda.focus();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toBeVisible();
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('#repo-panel'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await expect(agenda).toBeFocused();
});

const sombra = (page: Page) => page.locator('.p-drawer').evaluate((el) => getComputedStyle(el).boxShadow);

test('acoplado no tapa ninguna tarjeta y va sin velo ni sombra', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').click();
  const drawer = page.locator('.p-drawer');
  await expect(drawer).toHaveAttribute('role', 'complementary');
  const borde = await drawer.evaluate((el) => el.getBoundingClientRect().left);
  const derecha = await page.locator('.repo-card').evaluateAll((els) => Math.max(...els.map((e) => e.getBoundingClientRect().right)));
  expect(derecha).toBeLessThanOrEqual(borde);
  await expect(page.locator('.p-drawer-mask')).toHaveCount(0);
  expect(await sombra(page)).toBe('none');
});

/* El ratón de verdad y sin `force`: Playwright no pulsa lo que tiene algo encima, y el velo se llevaba el clic. */
for (const ancho of [1440, 1280, 1100, 1024, 900, 768]) {
  test(`a ${ancho}, con una tarjeta marcada, pulsar otra marca la otra: sin velo que se lleve el clic`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: 900 });
    await goto(page, 'admin/repositorios');
    await tarjeta(page, 'Agendas').click();
    await expect(page.locator('.p-drawer-mask')).toHaveCount(0);

    await tarjeta(page, 'Tipificaciones').click();
    await expect(page.locator('.repo-card--selected')).toHaveCount(1);
    await expect(tarjeta(page, 'Tipificaciones')).toHaveClass(/repo-card--selected/);
    await expect(page.locator('.p-drawer-title')).toHaveText('Tipificaciones');
    await expect(page.locator('.p-drawer')).toHaveAttribute('role', 'complementary');
  });
}

test('si pisa tarjetas, flota con sombra; un clic fuera lo sigue cerrando', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').click();
  await expect(panel(page)).toBeVisible();
  expect(await sombra(page)).not.toBe('none');
  await page.locator('h1').click();
  await expect(panel(page)).toHaveCount(0);
});

test('si no deja ninguna tarjeta entera a la vista, lleva velo y es un diálogo; pulsar el velo lo cierra', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').click();
  await expect(page.locator('.p-drawer')).toHaveAttribute('role', 'dialog');
  const velo = page.locator('.p-drawer-mask');
  await expect(velo).toHaveCount(1);
  await velo.click({ position: { x: 100, y: 400 } });
  await expect(panel(page)).toHaveCount(0);
});

test('encoger la ventana con el panel abierto: sigue sin velo, otra tarjeta lo cambia y un clic fuera lo cierra', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').click();
  await expect(panel(page)).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(() => sombra(page)).not.toBe('none');
  await expect(page.locator('.p-drawer')).toHaveAttribute('role', 'complementary');

  await tarjeta(page, 'Tipificaciones').click();
  await expect(page.locator('.p-drawer-title')).toHaveText('Tipificaciones');
  await page.locator('h1').click();
  await expect(panel(page)).toHaveCount(0);
});

test('el doble clic en una tarjeta la deja abierta: no abre y cierra', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').dblclick();
  await trasPintar(page);
  await expect(panel(page)).toBeVisible();
  await expect(tarjeta(page, 'Agendas')).toHaveClass(/repo-card--selected/);
});

test('arrastrar para seleccionar un texto del panel y soltar fuera no lo cierra; un clic fuera, sí', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').click();
  const caja = await panel(page).locator('.panel__description').boundingBox();
  if (!caja) throw new Error('el panel no pinta su descripción');
  await page.mouse.move(caja.x + 60, caja.y + 6);
  await page.mouse.down();
  await page.mouse.move(caja.x - 300, caja.y + 200, { steps: 6 });
  await page.mouse.up();
  await trasPintar(page);
  await expect(panel(page)).toBeVisible();

  await page.locator('h1').click();
  await expect(panel(page)).toHaveCount(0);
});

test('al cambiar de tarjeta, el panel vuelve arriba: el repositorio nuevo se lee desde el principio', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').click();
  const contenido = page.locator('.p-drawer-content');
  await expect(panel(page)).toBeVisible();
  await contenido.evaluate((el) => {
    el.scrollTop = 200;
  });
  expect(await contenido.evaluate((el) => el.scrollTop)).toBe(200);

  await tarjeta(page, 'Plantillas').click();
  await expect(page.locator('.p-drawer-title')).toHaveText('Plantillas');
  await expect.poll(() => contenido.evaluate((el) => el.scrollTop)).toBe(0);
});

test('si el buscador o el filtro dejan fuera la tarjeta marcada, su panel se va con ella; si sigue a la vista, se queda', async ({
  page,
}) => {
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').click();
  await expect(panel(page)).toBeVisible();

  // Con el teclado, sin el clic fuera que lo cerraría.
  const buscador = page.getByRole('searchbox');
  await buscador.focus();
  await page.keyboard.type('agen');
  await expect(tarjeta(page, 'Horarios')).toHaveCount(0);
  await expect(tarjeta(page, 'Agendas')).toBeVisible();
  await trasPintar(page);
  await expect(panel(page)).toBeVisible();

  await buscador.fill('equipos');
  await expect(tarjeta(page, 'Equipos')).toBeVisible();
  await expect(panel(page)).toHaveCount(0);

  await buscador.fill('');
  await tarjeta(page, 'Agendas').click();
  await expect(panel(page)).toBeVisible();
  await page.getByRole('button', { name: 'IA', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.cat')).toHaveCount(1);
  await expect(panel(page)).toHaveCount(0);
});

test('abierto con el ratón, si el tabulador llega a una tarjeta que el panel tapa entera, el panel se aparta', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').click();
  await expect(panel(page)).toBeVisible();
  const tapada = await tarjeta(page, 'Plantillas').evaluate(
    (el) => el.getBoundingClientRect().left >= (document.querySelector('.p-drawer')?.getBoundingClientRect().left ?? Infinity),
  );
  expect(tapada, 'a 1024, Plantillas queda entera bajo el panel').toBe(true);

  // Agendas → Horarios → Email → Plantillas. Hasta llegar a ella, el panel sigue ahí.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await trasPintar(page);
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(tarjeta(page, 'Plantillas')).toBeFocused();
  await expect(panel(page)).toHaveCount(0);
});

test('todo a la vista: a 1440 × 800 el hub no desplaza', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await goto(page, 'admin/repositorios');
  // 13 desde DD-187: se suma Equipos.
  await expect(page.locator('.repo-card')).toHaveCount(13);
  const sobra = await page.locator('.hub').evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(sobra).toBe(0);
});

test('el buscador vacío ofrece los últimos repositorios abiertos, el último primero; elegir uno entra en él', async ({
  page,
}) => {
  await goto(page, 'admin/repositorios');
  await tarjeta(page, 'Agendas').click();
  await tarjeta(page, 'Equipos').click();
  await page.keyboard.press('Escape');

  await page.getByRole('searchbox').focus();
  const recientes = page.locator('.hub-recientes__item');
  await expect(recientes).toHaveCount(2);
  await expect(recientes.nth(0)).toContainText('Equipos');
  await expect(recientes.nth(1)).toContainText('Agendas');

  // COA SISMAC-4064: «Al pulsar sobre uno de los elementos recientes se accede al repositorio correspondiente».
  await recientes.nth(1).click();
  await expect(page).toHaveURL(/\/admin\/agendas$/);
});

test('los siete «Próximamente» (los ocho del COA menos Horarios, DD-251): con su cifra y la marca, y no abren panel', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  const pronto = page.locator('.repo-card--soon');
  await expect(pronto.locator('.repo-card__name')).toHaveText([
    'Email',
    'Labels',
    'Variables',
    'Entidades',
    'Intenciones',
    'Entidades IA',
    'Clasificación IA',
  ]);
  await expect(pronto.locator('.repo-card__soon')).toHaveText(Array(7).fill('Próximamente'));
  // Todas las tarjetas llevan su cifra (COA, «Contadores»), también estas.
  await expect(pronto.locator('.repo-card__count')).toHaveText(Array(7).fill(/^\d+$/));

  const pronta = tarjeta(page, 'Email');
  await expect(pronta).toHaveAttribute('aria-disabled', 'true');
  await expect(pronta).not.toHaveAttribute('aria-expanded');
  // `force`: Playwright no pulsa lo que lleva `aria-disabled`, pero el ratón de una persona sí llega.
  await pronta.click({ force: true });
  await expect(panel(page)).toHaveCount(0);
  await expect(page.locator('.repo-card--selected')).toHaveCount(0);

  // Con un panel abierto, pulsar una de estas no hace nada: ni la marca ni le quita la marca a la que la tiene.
  await tarjeta(page, 'Agendas').click();
  await expect(panel(page)).toBeVisible();
  await pronta.click({ force: true });
  await trasPintar(page);
  await expect(page.locator('.p-drawer-title')).toHaveText('Agendas');
  await expect(tarjeta(page, 'Agendas')).toHaveClass(/repo-card--selected/);
  await expect(pronta).not.toHaveClass(/repo-card--selected/);
});

/** El borde de arriba de la tarjeta y el tono fuerte de su grupo, ya resueltos, y el contraste del borde sobre su fondo. */
const bordeDeTarjeta = enNavegador(
  (kit, el: Element): { borde: Rgb; fuerte: Rgb; halo: Rgb | null; ratio: number } => {
    const cs = getComputedStyle(el);
    const fondo = kit.fondo(el);
    const rgb = (c: number[]): Rgb => [c[0], c[1], c[2]];
    const borde = kit.sobre(kit.rgba(cs.borderTopColor), fondo);
    const fuerte = kit.sobre(kit.rgba(cs.getPropertyValue('--tono-strong').trim()), fondo);
    const sombra = cs.boxShadow === 'none' ? null : cs.boxShadow.match(/^(rgba?\([^)]*\)|color\([^)]*\)|#\w+)/)?.[1];
    return {
      borde: rgb(borde),
      fuerte: rgb(fuerte),
      halo: sombra ? rgb(kit.sobre(kit.rgba(sombra), fondo)) : null,
      ratio: kit.ratioContraste(borde, fondo),
    };
  },
);

/* Una de cada grupo, y en IA y Comunicación una que abre y otra «Próximamente»: el fallo se vio en Diseñador (teal, sus
 * dos «Próximamente», que se quedaban grises) y en IA (naranja, cuyo borde de etiqueta queda por DEBAJO del gris). */
const AL_PASAR = ['Plantillas', 'Email', 'Equipos', 'Labels', 'Entidades', 'Intenciones', 'Reglas IA', 'Clasificación IA'];

for (const tema of ['claro', 'oscuro'] as const) {
  test(`al pasar, el borde se enciende en el tono fuerte de su grupo, también en «Próximamente» (${tema})`, async ({ page }) => {
    if (tema === 'oscuro') await forceDarkTheme(page);
    await goto(page, 'admin/repositorios');
    for (const nombre of AL_PASAR) {
      const card = page.locator('.repo-card', { has: page.locator('.repo-card__name', { hasText: new RegExp(`^${nombre}$`) }) });
      // El ratón, a una esquina vacía: en (0, 0) cae sobre la barra lateral, que al pasar se despliega y tapa la primera
      // columna. Y sin `force`, para que Playwright diga si otra cosa se lleva el ratón.
      await page.mouse.move(1430, 890);
      const reposo = await card.evaluate(bordeDeTarjeta);
      await card.hover();
      const encima = await card.evaluate(bordeDeTarjeta);
      expect(encima.borde, `${nombre}: el borde al pasar es el tono fuerte de su grupo`).toEqual(encima.fuerte);
      // Que se ENCIENDA: con el borde de la etiqueta (un 200), teal y naranja, y en oscuro los cuatro, se apagaban.
      expect(encima.ratio, `${nombre}: el borde al pasar se ve más que en reposo`).toBeGreaterThan(reposo.ratio + 0.5);
    }
  });
}

test('marcada, el halo es del mismo tono fuerte que su borde: dos píxeles, no uno como al pasar', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  const reglas = tarjeta(page, 'Reglas IA');
  await reglas.click();
  await expect(reglas).toHaveClass(/repo-card--selected/);
  const marcada = await reglas.evaluate(bordeDeTarjeta);
  expect(marcada.borde).toEqual(marcada.fuerte);
  expect(marcada.halo).toEqual(marcada.fuerte);
});

import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL RESUMEN DE LA FICHA DE GRUPO LLEVA A SU SECCIÓN (DD-146).
 *
 * La revisión de producto del 2026-10-01 pidió que el resumen no fuera solo de mirar: lo que dice se arregla en una
 * sección, y desde él se llega a ella. Lo que fija, en la ficha de grupo:
 *   1. El rótulo de cada tarjeta es un enlace de verdad a su sección (Cmd+clic la abre en otra pestaña): Agentes
 *      activos → Agentes, Reparto y Salida → Distribución y colas, Recursos → Recursos. Llega arriba, con el foco en
 *      el título de la sección.
 *   2. Cada fila de Reparto lleva al bloque de su canal, y cada fila de Salida a su número (el teléfono saliente, el
 *      de WhatsApp), con el foco ahí y a la vista, debajo del nombre fijo (DD-145).
 *   3. Las filas se nombran por lo que se ve («Teléfono») y su tarjeta las agrupa («Reparto», «Salida»): dos
 *      «Teléfono» no se confunden.
 *   4. En el alta, el resumen abre la sección sin tocar la dirección (DD-143), y General sigue siendo la puerta.
 *   5. Sobre el tinte de la tarjeta, el enlace se lee (AA) y se subraya al pasar, como la miga (DD-103).
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const resumen = (page: Page) => page.getByRole('region', { name: 'Resumen' });

/** Lo de abajo del nombre fijo: la línea de datos de la cabecera, en reposo. */
const finDelNombre = (page: Page) =>
  page.evaluate(() => document.querySelector('.ficha-rail > .headline .headline__meta')!.getBoundingClientRect().bottom);

test('el rótulo de cada tarjeta es un enlace a su sección, y llega arriba con el foco en su título', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  const destinos = [
    { rotulo: 'Agentes activos', slug: 'agentes', titulo: 'Agentes' },
    { rotulo: 'Reparto', slug: 'distribucion', titulo: 'Distribución y colas' },
    { rotulo: 'Salida', slug: 'distribucion', titulo: 'Distribución y colas' },
    { rotulo: 'Recursos', slug: 'recursos', titulo: 'Recursos' },
  ];
  for (const d of destinos) {
    await expect(resumen(page).getByRole('link', { name: d.rotulo, exact: true }), d.rotulo).toHaveAttribute(
      'href',
      new RegExp(`/admin/grupos/editar/11\\?seccion=${d.slug}$`),
    );
  }
  for (const d of destinos) {
    await goto(page, 'admin/grupos/editar/11');
    await resumen(page).getByRole('link', { name: d.rotulo, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`\\?seccion=${d.slug}$`));
    await expect(page.getByRole('heading', { level: 2, name: d.titulo, exact: true }), `${d.rotulo} → su título`).toBeFocused();
    expect(await page.evaluate(() => document.querySelector('main#main-content')!.scrollTop), 'llega arriba').toBe(0);
  }
});

test('cada fila de Reparto lleva al bloque de su canal, a la vista debajo del nombre fijo', async ({ page }) => {
  for (const canal of [
    { fila: 'Teléfono', titulo: '#group-channel-phone-title' },
    { fila: 'Chat', titulo: '#group-channel-chat-title' },
  ]) {
    await goto(page, 'admin/grupos/editar/11');
    const debajo = await finDelNombre(page);
    await resumen(page).getByRole('group', { name: 'Reparto' }).getByRole('link', { name: canal.fila, exact: true }).click();
    await expect(page).toHaveURL(/\?seccion=distribucion$/);
    const titulo = page.locator(canal.titulo);
    await expect(titulo, `Reparto › ${canal.fila}`).toBeFocused();
    const arriba = await titulo.evaluate((el) => el.getBoundingClientRect().top);
    expect(arriba, `Reparto › ${canal.fila}: debajo del nombre fijo`).toBeGreaterThan(debajo);
    expect(arriba, `Reparto › ${canal.fila}: a la vista`).toBeLessThan(900);
  }
});

test('cada fila de Salida lleva a su número: el teléfono saliente y el de WhatsApp', async ({ page }) => {
  for (const salida of [
    { fila: 'Teléfono', campo: '#group-phone' },
    { fila: 'WhatsApp', campo: '#group-chat-whatsapp' },
  ]) {
    await goto(page, 'admin/grupos/editar/11');
    const debajo = await finDelNombre(page);
    await resumen(page).getByRole('group', { name: 'Salida' }).getByRole('link', { name: salida.fila, exact: true }).click();
    await expect(page).toHaveURL(/\?seccion=distribucion$/);
    const campo = page.locator(salida.campo);
    await expect(campo, `Salida › ${salida.fila}`).toBeFocused();
    const caja = await campo.evaluate((el) => el.getBoundingClientRect());
    expect(caja.top, `Salida › ${salida.fila}: debajo del nombre fijo`).toBeGreaterThan(debajo);
    expect(caja.bottom, `Salida › ${salida.fila}: a la vista`).toBeLessThan(900);
  }
});

test('en el alta, el resumen abre la sección sin tocar la dirección, y General sigue siendo la puerta', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  const recursos = resumen(page).getByRole('link', { name: 'Recursos', exact: true });
  // Sin nombre, General no deja pasar: se queda en ella y lo dice.
  await recursos.click();
  await expect(page).toHaveURL(/\/admin\/grupos\/crear$/);
  await expect(page.getByRole('heading', { level: 2, name: 'General', exact: true })).toBeVisible();
  // Con nombre, abre Recursos, arriba y con el foco en su título, y la dirección sigue sin sección.
  await page.getByLabel('Nombre').fill('Grupo del resumen');
  await recursos.click();
  await expect(page.getByRole('heading', { level: 2, name: 'Recursos', exact: true })).toBeFocused();
  await expect(page).toHaveURL(/\/admin\/grupos\/crear$/);
});

test('sobre el tinte de la tarjeta el enlace se lee, y al pasar el ratón se subraya', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  const enlace = resumen(page).getByRole('link', { name: 'Recursos', exact: true });
  const medida = async () =>
    enlace.evaluate((el) => {
      const lum = (c: string) => {
        const [r, g, b] = (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map((v) => v / 255);
        const f = (x: number) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
        return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
      };
      let fondo = 'rgba(0, 0, 0, 0)';
      for (let e: Element | null = el; e && /rgba\(0, 0, 0, 0\)|transparent/.test(fondo); e = e.parentElement) {
        fondo = getComputedStyle(e).backgroundColor;
      }
      const [a, b] = [lum(getComputedStyle(el).color), lum(fondo)].sort((x, y) => y - x);
      return {
        contraste: (a! + 0.05) / (b! + 0.05),
        subrayado: getComputedStyle(el).textDecorationLine,
        cursor: getComputedStyle(el).cursor,
      };
    });
  const quieto = await medida();
  expect(quieto.contraste, 'el enlace sobre el tinte llega a AA').toBeGreaterThanOrEqual(4.5);
  expect(quieto.cursor).toBe('pointer');
  await enlace.hover();
  await expect.poll(async () => (await medida()).subrayado, { message: 'al pasar, subrayado' }).toContain('underline');
});

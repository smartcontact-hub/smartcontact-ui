import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

/**
 * EL RESUMEN DE LA FICHA DE GRUPO LLEVA A SU SECCIÓN (DD-146).
 *
 * La revisión de producto del 2026-10-01 pidió que el resumen no fuera solo de mirar: lo que dice se arregla en una
 * sección, y desde él se llega a ella. Lo que fija, en la ficha de grupo:
 *   1. El rótulo de cada tarjeta es un enlace de verdad a su sección (Cmd+clic la abre en otra pestaña): Agentes
 *      activos → Agentes, Reparto y Salida → Distribución y colas, Recursos → Recursos. Llega arriba, con el foco en
 *      el título de la sección.
 *   2. Cada fila de Reparto lleva al bloque de su canal, y cada fila de Salida a su número (el teléfono saliente, el
 *      de WhatsApp), con el foco ahí y a la vista, sin nada encima (desde DD-170 el nombre vive en la columna del
 *      índice, y encima del contenido no queda nada fijo).
 *   3. Las filas se nombran por lo que se ve («Teléfono») y su tarjeta las agrupa («Reparto», «Salida»): dos
 *      «Teléfono» no se confunden.
 *   4. En el alta, el resumen abre la sección sin tocar la dirección (DD-143), y General sigue siendo la puerta.
 *   5. Sobre el tinte de la tarjeta, el enlace se lee (AA) y se subraya al pasar, como la miga (DD-103).
 *   6. Cada enlace se pulsa en al menos 24 × 24 (WCAG 2.5.8), también en una pantalla de 1366 × 660: pinta 18 de alto.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const resumen = (page: Page) => page.getByRole('region', { name: 'Resumen' });

/** El borde de arriba de la zona que se desplaza: desde DD-170 no hay nada fijo encima del contenido. */
const arribaDeLaZona = (page: Page) =>
  page.evaluate(() => document.querySelector('main#main-content')!.getBoundingClientRect().top);

/** Que lo que se ve en el centro del borde izquierdo de un elemento es el propio elemento: nada lo tapa. */
const sinNadaEncima = (el: Element) => {
  const r = el.getBoundingClientRect();
  const encima = document.elementFromPoint(r.left + 4, r.top + r.height / 2);
  return { top: r.top, bottom: r.bottom, visto: !!encima && (encima === el || el.contains(encima)) };
};

test('el rótulo de cada tarjeta es un enlace a su sección, y llega arriba con el foco en su título', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  const destinos = [
    { rotulo: 'Agentes habilitados', slug: 'agentes', titulo: 'Agentes' },
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

test('cada fila de Reparto lleva al bloque de su canal, a la vista y sin nada encima', async ({ page }) => {
  for (const canal of [
    { fila: 'Teléfono', titulo: '#group-channel-phone-title' },
    { fila: 'Chat', titulo: '#group-channel-chat-title' },
  ]) {
    await goto(page, 'admin/grupos/editar/11');
    const zona = await arribaDeLaZona(page);
    await resumen(page).getByRole('group', { name: 'Reparto' }).getByRole('link', { name: canal.fila, exact: true }).click();
    await expect(page).toHaveURL(/\?seccion=distribucion$/);
    const titulo = page.locator(canal.titulo);
    await expect(titulo, `Reparto › ${canal.fila}`).toBeFocused();
    const caja = await titulo.evaluate(sinNadaEncima);
    expect(caja.top, `Reparto › ${canal.fila}: dentro de la zona que se desplaza`).toBeGreaterThanOrEqual(zona - 0.5); // medio píxel: el desplazamiento cae en fracciones
    expect(caja.top, `Reparto › ${canal.fila}: a la vista`).toBeLessThan(900);
    expect(caja.visto, `Reparto › ${canal.fila}: nada lo tapa`).toBe(true);
  }
});

test('cada fila de Salida lleva a su número: el teléfono saliente y el de WhatsApp', async ({ page }) => {
  for (const salida of [
    { fila: 'Teléfono', campo: '#group-phone' },
    { fila: 'WhatsApp', campo: '#group-chat-whatsapp' },
  ]) {
    await goto(page, 'admin/grupos/editar/11');
    const zona = await arribaDeLaZona(page);
    await resumen(page).getByRole('group', { name: 'Salida' }).getByRole('link', { name: salida.fila, exact: true }).click();
    await expect(page).toHaveURL(/\?seccion=distribucion$/);
    const campo = page.locator(salida.campo);
    await expect(campo, `Salida › ${salida.fila}`).toBeFocused();
    const caja = await campo.evaluate(sinNadaEncima);
    expect(caja.top, `Salida › ${salida.fila}: dentro de la zona que se desplaza`).toBeGreaterThanOrEqual(zona - 0.5); // medio píxel: el desplazamiento cae en fracciones
    expect(caja.bottom, `Salida › ${salida.fila}: a la vista`).toBeLessThan(900);
    expect(caja.visto, `Salida › ${salida.fila}: nada lo tapa`).toBe(true);
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
  // Sin teléfono saliente no se pasa de Distribución y colas (DD-158).
  await page.locator('sc-form-section-nav').getByText('Distribución y colas', { exact: true }).click();
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#group-phone') }), /./);
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

test('cada enlace del resumen se pulsa en al menos 24 × 24, también a 1366 × 660 (WCAG 2.5.8)', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 660 });
  await goto(page, 'admin/grupos/editar/11');
  const enlaces = resumen(page).locator('.resumen__enlace, a.sc-fact-row__link');
  await expect(enlaces).toHaveCount(8);
  // Las cuatro esquinas de un cuadrado de 24 centrado en el enlace caen en él: así se pulsa aunque pinte 18 de alto. Es
  // la prueba del navegador (`elementFromPoint`), no la caja que se pinta.
  const fuera = await enlaces.evaluateAll((els) =>
    els.flatMap((el) => {
      const r = el.getBoundingClientRect();
      const [cx, cy] = [r.x + r.width / 2, r.y + r.height / 2];
      const esquinas = [[-11.5, -11.5], [11.5, -11.5], [-11.5, 11.5], [11.5, 11.5]];
      const fallan = esquinas.filter(([dx, dy]) => document.elementFromPoint(cx + dx, cy + dy)?.closest('.resumen__enlace, a.sc-fact-row__link') !== el);
      const nombre = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      return fallan.length ? [`${nombre}: ${fallan.length} de 4 esquinas fuera (${r.width.toFixed(1)} × ${r.height.toFixed(1)})`] : [];
    }),
  );
  expect(fuera).toEqual([]);
});

import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA IDENTIDAD DE LA PÁGINA SE DICE UNA VEZ.
 *
 * El modelo "todo arriba" (S59) es explícito: la identidad la da el breadcrumb
 * de la TopBar, no una banda de título propia. Pero el modelo se aplicó página
 * a página y quedaron cuatro rezagadas —el hub de repositorios y las tres
 * subpáginas AED— que pintaban el nombre DOS VECES seguidas: en la barra y otra
 * vez debajo, usando literalmente la MISMA clave i18n. Lo cazó Rafa mirando la
 * pantalla; ningún test podía verlo porque nadie había escrito esta afirmación.
 *
 * Lo que fija:
 *   1. Cada página tiene EXACTAMENTE UN `<h1>` — ni cero (documento sin
 *      encabezado, que es el defecto que dejó S59) ni dos.
 *   2. Ese `<h1>` está VISUALMENTE OCULTO. Existe para lectores de pantalla;
 *      el diseño no lo pide porque el breadcrumb ya lo dice.
 *   3. Su texto coincide con la miga actual del breadcrumb: si divergen, una de
 *      las dos miente sobre dónde está el usuario.
 *
 * Por qué comprobar 2 y no solo 1: un `<h1>` visible que repite el breadcrumb
 * pasa el conteo y sigue siendo el defecto. La altura es la prueba: la clase
 * `.visually-hidden` lo deja en 1px.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Una por familia de pantalla, incluidas las cuatro que estaban mal. */
const PAGINAS = [
  { ruta: 'admin/repositorios', nombre: 'hub de repositorios' },
  { ruta: 'config/aed/servicio', nombre: 'AED · servicio' },
  { ruta: 'config/aed/agentes', nombre: 'AED · agentes' },
  { ruta: 'config/aed/grupos', nombre: 'AED · grupos' },
  { ruta: 'admin/labels', nombre: 'labels' },
  { ruta: 'admin/usuarios', nombre: 'usuarios' },
  { ruta: 'admin/plantillas', nombre: 'plantillas' },
] as const;

for (const { ruta, nombre } of PAGINAS) {
  test(`${nombre} · la identidad se dice UNA vez`, async ({ page }) => {
    await goto(page, ruta);

    const h1 = page.locator('main#main-content h1');
    await expect(h1).toHaveCount(1);

    const medido = await h1.evaluate((el: HTMLElement) => ({
      texto: (el.textContent ?? '').trim(),
      alto: Math.round(el.getBoundingClientRect().height),
      ancho: Math.round(el.getBoundingClientRect().width),
    }));

    // `.visually-hidden` lo deja en 1x1: si alguien vuelve a pintar la banda,
    // esto se dispara aunque el conteo de h1 siga siendo 1.
    expect(medido.alto).toBeLessThanOrEqual(2);
    expect(medido.ancho).toBeLessThanOrEqual(2);

    // Y dice lo mismo que la miga actual, que es lo que el usuario SÍ lee. La
    // miga la pinta ahora `sc-breadcrumb`: el tramo actual es el ÚLTIMO item de
    // la lista de PrimeNG (antes era `.top-bar__crumb-current`).
    const crumb = (
      await page.locator('sc-top-bar sc-breadcrumb .p-breadcrumb-list > li:last-child').last().innerText()
    ).trim();
    expect(medido.texto).toBe(crumb);
  });
}

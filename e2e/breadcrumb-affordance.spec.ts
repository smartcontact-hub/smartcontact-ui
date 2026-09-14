import { expect, test, type Locator } from '@playwright/test';

/**
 * UN TRAMO DE LA MIGA QUE LLEVA A ALGÚN SITIO LO PARECE (DD-103).
 *
 * Por qué existe: `component-structure` congela la CLASE que pone `sc-breadcrumb`
 * en los tramos pulsables, pero no lo que esa clase HACE. La manita y el subrayado
 * los pinta el tema (`sc-preset/css.ts`), y ahí un selector que deje de casar no
 * cambia ni una letra del DOM.
 *
 * Medido el 2026-09-14 antes del cambio, en esta misma demo: los tramos con solo
 * `command` salían con cursor `auto` y sin subrayado en hover. Con esa build, este
 * test falla en las dos primeras aserciones.
 *
 * El hover es real (el ratón de Playwright), no un `:hover` forzado: la regla va
 * dentro de `@media (hover: hover)`, y un estilo inyectado a mano se saltaría la
 * pregunta que hace el código.
 */

const STORY = '[data-testid="sc-breadcrumb"]';

/* El cursor se lee en la ETIQUETA, que es lo que queda bajo el ratón: la regla va en el
 * `<li>` y llega por herencia, y con cursor `auto` sobre texto el navegador pinta la I. */
const cursor = (link: Locator) =>
  link.evaluate((a) => getComputedStyle(a.querySelector('.p-breadcrumb-item-label') ?? a).cursor);
const underline = (link: Locator) =>
  link.evaluate((a) => getComputedStyle(a.querySelector('.p-breadcrumb-item-label') ?? a).textDecorationLine);

test.describe('sc-breadcrumb · tramo pulsable', () => {
  test.beforeEach(async ({ page }) => {
    // Enrutado por HASH: sin la almohadilla la app no arranca en el deep-link.
    await page.goto('/#/components/breadcrumb');
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
    await expect(page.locator(STORY)).toBeVisible();
  });

  test('los padres llevan manita y se subrayan al pasar el ratón; el tramo actual, no', async ({ page }) => {
    const links = page.locator(`${STORY} .p-breadcrumb-item .p-breadcrumb-item-link`);
    const padre = links.first();
    const actual = links.last();

    await expect(padre).toHaveText('Electronics');
    await expect(actual).toHaveText('Wireless');

    expect(await cursor(padre)).toBe('pointer');
    await padre.hover();
    await expect.poll(() => underline(padre)).toBe('underline');

    expect(await cursor(actual)).toBe('auto');
    await actual.hover();
    await expect.poll(() => underline(padre)).toBe('none');
    expect(await underline(actual)).toBe('none');
  });
});

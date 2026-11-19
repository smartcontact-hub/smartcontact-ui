import { expect, test, type Page } from '@playwright/test';

/**
 * La página de una dirección que no existe (la ruta `**` de `app.routes.ts`) y la mascota de obras que la ilustra.
 *
 * Antes de esta página, una dirección mala dejaba la doc en blanco: el router no casaba la ruta y cancelaba la
 * navegación sin decir nada. El primer test fija que ahora se dice qué pasó y se ofrece salir.
 *
 * El segundo fija la promesa de «reducir movimiento»: con la preferencia puesta, la mascota no se mueve ni al aparecer
 * ni al pasarle el ratón. La misma sonda, sin la preferencia, SÍ encuentra animaciones; si no, el test no probaría nada.
 */

/** Las animaciones que están corriendo dentro de la mascota (las de CSS y las que arranca el componente). */
async function animacionesDeLaMascota(page: Page): Promise<number> {
  return page
    .locator('app-mascota')
    .first()
    .evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length);
}

test('una dirección que no existe lo dice y ofrece salir', async ({ page }) => {
  await page.goto('/#/esto-no-existe');
  await expect(page.getByRole('heading', { name: 'Esta página no existe', level: 1 })).toBeVisible();
  await expect(page.locator('main code')).toHaveText('/esto-no-existe');
  await expect(page.getByRole('button', { name: 'Buscar en la doc' })).toBeVisible();

  await page.getByRole('link', { name: 'Ir al inicio' }).click();
  await expect(page).toHaveURL(/#\/$/);
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`la mascota se mueve solo si no se pide reducir movimiento (${reducedMotion})`, async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion });
    const page = await ctx.newPage();
    await page.goto('/#/en-obras');
    const mascota = page.locator('app-mascota').first();
    await expect(mascota).toBeVisible();

    const alAparecer = await animacionesDeLaMascota(page);
    // Pasada la entrada, el saludo al pasar el ratón.
    await expect.poll(() => animacionesDeLaMascota(page), { timeout: 8_000 }).toBe(0);
    await mascota.hover();
    const alPasar = await animacionesDeLaMascota(page);

    if (reducedMotion === 'reduce') {
      expect(alAparecer, 'al aparecer').toBe(0);
      expect(alPasar, 'al pasar el ratón').toBe(0);
    } else {
      expect(alAparecer, 'al aparecer').toBeGreaterThan(0);
      expect(alPasar, 'al pasar el ratón').toBeGreaterThan(0);
    }
    await ctx.close();
  });
}

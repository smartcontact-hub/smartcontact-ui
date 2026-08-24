import { expect, test } from '@playwright/test';

/**
 * CusCare · el arnés se comprueba a sí mismo.
 *
 * La suite depende de que el motion esté APAGADO: los overlays de PrimeNG 21
 * entran escalando y, con la CPU cargada, la caja de sus `<li>` no se queda
 * quieta el tiempo suficiente para que Playwright los clique (el porqué, con la
 * medición, está en `playwright.cuscare.config.ts`).
 *
 * El interruptor vive en la config… y puede dejar de llegar sin que se caiga
 * nada. Pasó: en Playwright 1.60 el runner ya no reenvía `reducedMotion` como
 * opción de primer nivel de `use` — hay que meterlo en `contextOptions` — y
 * mientras estuvo mal escrito la página recibía `no-preference`, la suite seguía
 * verde en una máquina tranquila y solo se rompía bajo carga. Ningún gate del
 * repo lo desmentía: `npm run typecheck` no entra en los configs de la raíz y
 * `eslint` no reporta errores de tipo.
 *
 * De ahí este test: pregunta por el ESTADO EN LA PÁGINA, que es lo que de verdad
 * gobierna la animación, en vez de releer la config que ya sabemos que puede
 * mentir. Si un día se cae, no toques los otros 90 tests — arregla la config.
 */
test('el motion está apagado en la página, no solo escrito en la config', async ({ page }) => {
  await page.goto('/#/private/cuscare/tickets');
  await expect(page.locator('.cc-table tbody tr').first()).toBeVisible();

  const reducido = await page.evaluate(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  expect(
    reducido,
    'La página NO está en modo reduced-motion: el `contextOptions.reducedMotion` de ' +
      '`playwright.cuscare.config.ts` no está llegando. Los tests que clican overlays ' +
      '(el multiselect de `filters-pagination`, sobre todo) volverán a ser inestables ' +
      'bajo carga sin que nadie lo note en una máquina tranquila.',
  ).toBe(true);
});

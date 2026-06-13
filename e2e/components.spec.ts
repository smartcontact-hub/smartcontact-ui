import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Diff visual de la Mitad B, por componente:
 *  - Métricas computadas (getComputedStyle) contra los valores del Kit ya
 *    verificados por tokens:parity — la misma vara que el smoke del tema.
 *    Como los wrappers son finos (sin SCSS propio), "no-layout-shift" = el
 *    wrapper renderiza EXACTAMENTE igual que el primitivo PrimeNG verificado.
 *  - Baseline de screenshot por página (solo local: los baselines de
 *    Playwright son por-plataforma; en CI mandan las métricas).
 */

const styleOf = (locator: Locator, props: string[]) =>
  locator.evaluate((el, propList) => {
    const s = getComputedStyle(el);
    return Object.fromEntries(propList.map((p) => [p, s.getPropertyValue(p)]));
  }, props);

const gotoPage = async (page: Page, path: string) => {
  await page.goto(`/#/components/${path}`);
  await page.waitForLoadState('networkidle');
};

const screenshotBaseline = async (page: Page, name: string) => {
  if (process.env['CI']) return;
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, animations: 'disabled' });
};

test('el índice de componentes lista las páginas', async ({ page }) => {
  await page.goto('/#/components');
  await expect(page.getByRole('heading', { name: 'Componentes' })).toBeVisible();
});

test.describe('sc-button', () => {
  test('métrica del Kit en md/sm/lg e icon-only', async ({ page }) => {
    await gotoPage(page, 'button');
    const md = page.getByTestId('sc-btn-md').locator('button');
    expect(await styleOf(md, ['padding-left', 'padding-top', 'border-radius', 'font-size', 'gap'])).toEqual({
      'padding-left': '10.5px',
      'padding-top': '7px',
      'border-radius': '6px',
      'font-size': '14px',
      gap: '7px',
    });
    const sm = page.getByTestId('sc-btn-sm').locator('button');
    expect(await styleOf(sm, ['padding-left', 'padding-top', 'font-size'])).toEqual({
      'padding-left': '8.75px',
      'padding-top': '5.25px',
      'font-size': '12px',
    });
    const lg = page.getByTestId('sc-btn-lg').locator('button');
    expect(await styleOf(lg, ['padding-left', 'padding-top', 'font-size'])).toEqual({
      'padding-left': '12.25px',
      'padding-top': '8.75px',
      'font-size': '16px',
    });
    const iconOnly = page.getByTestId('sc-btn-icononly').locator('button');
    expect((await styleOf(iconOnly, ['width']))['width']).toBe('35px');
  });

  test('el resolver mapea iconos legacy pi a Material', async ({ page }) => {
    await gotoPage(page, 'button');
    const icon = page.getByTestId('sc-btn-legacy-icon').locator('.sc-icon-font--delete');
    await expect(icon).toBeVisible();
    await screenshotBaseline(page, 'button');
  });
});

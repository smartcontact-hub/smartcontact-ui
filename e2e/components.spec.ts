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

test.describe('sc-badge', () => {
  test('métrica del Kit (md/sm/xl)', async ({ page }) => {
    await gotoPage(page, 'badge');
    const md = page.getByTestId('sc-badge-md').locator('.p-badge');
    // border-radius no se aserta en md: PrimeNG aplica 50% estructural (circle)
    // al badge de un carácter; el slot del Kit (6) aplica al resto.
    expect(await styleOf(md, ['height', 'min-width', 'font-size'])).toEqual({
      height: '21px',
      'min-width': '21px',
      'font-size': '10.5px',
    });
    const sm = page.getByTestId('sc-badge-sm').locator('.p-badge');
    expect((await styleOf(sm, ['font-size']))['font-size']).toBe('8.75px');
    const xl = page.getByTestId('sc-badge-xl').locator('.p-badge');
    expect((await styleOf(xl, ['font-size']))['font-size']).toBe('14px');
    await screenshotBaseline(page, 'badge');
  });
});

test.describe('sc-card', () => {
  test('métrica del Kit (body 17.5, radio 12)', async ({ page }) => {
    await gotoPage(page, 'card');
    const card = page.getByTestId('sc-card').locator('.p-card');
    expect((await styleOf(card, ['border-radius']))['border-radius']).toBe('12px');
    const body = page.getByTestId('sc-card').locator('.p-card-body');
    expect(await styleOf(body, ['padding-left', 'gap'])).toEqual({
      'padding-left': '17.5px',
      gap: '7px',
    });
    await screenshotBaseline(page, 'card');
  });
});

test.describe('sc-chip', () => {
  test('métrica del Kit (10.5/7, radio 16, gap 7)', async ({ page }) => {
    await gotoPage(page, 'chip');
    const chip = page.getByTestId('sc-chip').locator('.p-chip');
    expect(await styleOf(chip, ['padding-left', 'padding-top', 'border-radius', 'gap'])).toEqual({
      'padding-left': '10.5px',
      'padding-top': '7px',
      'border-radius': '16px',
      gap: '7px',
    });
    await expect(page.getByTestId('sc-chip-removable').locator('.p-chip-remove-icon')).toBeVisible();
    await screenshotBaseline(page, 'chip');
  });
});

test.describe('sc-tag', () => {
  test('métrica del Kit (7/3.5, font 12/700, radio 6)', async ({ page }) => {
    await gotoPage(page, 'tag');
    const tag = page.getByTestId('sc-tag').locator('.p-tag');
    expect(
      await styleOf(tag, ['padding-left', 'padding-top', 'font-size', 'font-weight', 'border-radius']),
    ).toEqual({
      'padding-left': '7px',
      'padding-top': '3.5px',
      'font-size': '12px',
      'font-weight': '700',
      'border-radius': '6px',
    });
    await screenshotBaseline(page, 'tag');
  });
});

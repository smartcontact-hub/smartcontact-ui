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

test.describe('sc-message', () => {
  test('métrica del Kit (10.5/7, radio 6, font 14)', async ({ page }) => {
    await gotoPage(page, 'message');
    // variant por defecto = simple → content.padding 0 (Kit:
    // message.simple.content.padding = 0); el 10.5/7 aplica a outlined.
    const content = page.getByTestId('sc-message').locator('.p-message-content');
    expect((await styleOf(content, ['padding-left']))['padding-left']).toBe('0px');
    const outlined = page.getByTestId('sc-message-outlined').locator('.p-message-content');
    expect(await styleOf(outlined, ['padding-left', 'padding-top'])).toEqual({
      'padding-left': '10.5px',
      'padding-top': '7px',
    });
    const msg = page.getByTestId('sc-message').locator('.p-message');
    expect((await styleOf(msg, ['border-radius']))['border-radius']).toBe('6px');
    const text = page.getByTestId('sc-message').locator('.p-message-text').first();
    expect(await styleOf(text, ['font-size', 'font-weight'])).toEqual({
      'font-size': '14px',
      'font-weight': '500',
    });
    await screenshotBaseline(page, 'message');
  });
});

test.describe('sc-panel', () => {
  test('métrica del Kit (header 15.75, radio 6)', async ({ page }) => {
    await gotoPage(page, 'panel');
    const panel = page.getByTestId('sc-panel').locator('.p-panel');
    expect((await styleOf(panel, ['border-radius']))['border-radius']).toBe('6px');
    const header = page.getByTestId('sc-panel').locator('.p-panel-header');
    expect((await styleOf(header, ['padding-left']))['padding-left']).toBe('15.75px');
    await screenshotBaseline(page, 'panel');
  });
});

test.describe('sc-skeleton', () => {
  test('radio del Kit (6) y animación', async ({ page }) => {
    await gotoPage(page, 'skeleton');
    const sk = page.getByTestId('sc-skeleton').locator('.p-skeleton');
    expect((await styleOf(sk, ['border-radius']))['border-radius']).toBe('6px');
    await screenshotBaseline(page, 'skeleton');
  });
});

test.describe('sc-textarea', () => {
  test('métrica de form field (10.5/7, radio 6, font 14; sm 12)', async ({ page }) => {
    await gotoPage(page, 'textarea');
    const ta = page.getByTestId('sc-textarea').locator('textarea');
    expect(await styleOf(ta, ['padding-left', 'padding-top', 'border-radius', 'font-size'])).toEqual({
      'padding-left': '10.5px',
      'padding-top': '7px',
      'border-radius': '6px',
      'font-size': '14px',
    });
    const sm = page.getByTestId('sc-textarea-sm').locator('textarea');
    expect((await styleOf(sm, ['font-size']))['font-size']).toBe('12px');
    await screenshotBaseline(page, 'textarea');
  });
});

test.describe('sc-drawer', () => {
  test('abre, renderiza cabecera del Kit (17.5, título 20/600) y cierra', async ({ page }) => {
    await gotoPage(page, 'drawer');
    await page.getByTestId('open-drawer').locator('button').click();
    const drawer = page.locator('.p-drawer');
    await expect(drawer).toBeVisible();
    const header = page.locator('.p-drawer-header');
    expect((await styleOf(header, ['padding-left']))['padding-left']).toBe('17.5px');
    const title = page.locator('.p-drawer-title');
    expect(await styleOf(title, ['font-size', 'font-weight'])).toEqual({
      'font-size': '20px',
      'font-weight': '600',
    });
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });
});

test.describe('sc-progressbar', () => {
  test('métrica del Kit (alto 17.5, radio 6, label 12)', async ({ page }) => {
    await gotoPage(page, 'progressbar');
    const bar = page.getByTestId('sc-progressbar').locator('.p-progressbar');
    expect(await styleOf(bar, ['height', 'border-radius'])).toEqual({
      height: '17.5px',
      'border-radius': '6px',
    });
    const label = page.getByTestId('sc-progressbar').locator('.p-progressbar-label');
    expect((await styleOf(label, ['font-size']))['font-size']).toBe('12px');
    await screenshotBaseline(page, 'progressbar');
  });
});

test.describe('sc-progressspinner', () => {
  test('renderiza el spinner', async ({ page }) => {
    await gotoPage(page, 'progressspinner');
    await expect(page.getByTestId('sc-progressspinner').locator('svg')).toBeVisible();
  });
});

test.describe('sc-radiobutton', () => {
  test('métrica del Kit (caja 17.5; sm 14, lg 21) y selección', async ({ page }) => {
    await gotoPage(page, 'radiobutton');
    const md = page.getByTestId('sc-radio-md').locator('.p-radiobutton');
    expect(await styleOf(md, ['width', 'height'])).toEqual({ width: '17.5px', height: '17.5px' });
    const sm = page.getByTestId('sc-radio-sm').locator('.p-radiobutton');
    expect((await styleOf(sm, ['width']))['width']).toBe('14px');
    const lg = page.getByTestId('sc-radio-lg').locator('.p-radiobutton');
    expect((await styleOf(lg, ['width']))['width']).toBe('21px');
    await page.locator('#opt-b').click();
    await expect(page.getByTestId('sc-radio-md').locator('.p-radiobutton')).not.toHaveClass(/p-radiobutton-checked/);
    await screenshotBaseline(page, 'radiobutton');
  });
});

test.describe('sc-avatar', () => {
  test('spec del Kit: 28/42/56, radio 6, badge y grupo con offset -10.5', async ({ page }) => {
    await gotoPage(page, 'avatar');
    const md = page.getByTestId('sc-avatar-md').locator('.p-avatar');
    expect(await styleOf(md, ['width', 'height', 'font-size'])).toEqual({
      width: '28px',
      height: '28px',
      'font-size': '14px',
    });
    const lg = page.getByTestId('sc-avatar-lg').locator('.p-avatar');
    expect((await styleOf(lg, ['width']))['width']).toBe('42px');
    const xl = page.getByTestId('sc-avatar-xl').locator('.p-avatar');
    expect((await styleOf(xl, ['width']))['width']).toBe('56px');
    await expect(page.getByTestId('sc-avatar-badge').locator('.p-badge')).toBeVisible();
    const second = page.getByTestId('sc-avatargroup').locator('.p-avatar').nth(1);
    expect((await styleOf(second, ['margin-left']))['margin-left']).toBe('-10.5px');
    await screenshotBaseline(page, 'avatar');
  });
});

test.describe('sc-toast', () => {
  test('muestra el toast con tipografía del Kit (14/12)', async ({ page }) => {
    await gotoPage(page, 'toast');
    await page.getByTestId('toast-success').locator('button').click();
    const summary = page.locator('.p-toast-summary');
    await expect(summary).toBeVisible();
    expect((await styleOf(summary, ['font-size']))['font-size']).toBe('14px');
    const detail = page.locator('.p-toast-detail');
    expect((await styleOf(detail, ['font-size']))['font-size']).toBe('12px');
  });
});

test.describe('sc-divider', () => {
  test('métrica del Kit (margin 14, content padding 7) y variantes', async ({ page }) => {
    await gotoPage(page, 'divider');
    const h = page.getByTestId('sc-divider').locator('.p-divider');
    expect(await styleOf(h, ['margin-top', 'margin-bottom'])).toEqual({
      'margin-top': '14px',
      'margin-bottom': '14px',
    });
    const content = page.getByTestId('sc-divider-block').locator('.p-divider-content').first();
    expect((await styleOf(content, ['padding-left']))['padding-left']).toBe('7px');
    const v = page.getByTestId('sc-divider-v').locator('.p-divider');
    expect(await styleOf(v, ['margin-left', 'margin-right'])).toEqual({
      'margin-left': '14px',
      'margin-right': '14px',
    });
    await screenshotBaseline(page, 'divider');
  });
});

test.describe('sc-inputgroup', () => {
  test('compone input + addons con la métrica de form field', async ({ page }) => {
    await gotoPage(page, 'inputgroup');
    const input = page.getByTestId('ig-input');
    expect(await styleOf(input, ['padding-left', 'padding-top', 'font-size'])).toEqual({
      'padding-left': '10.5px',
      'padding-top': '7px',
      'font-size': '14px',
    });
    await expect(page.getByTestId('sc-inputgroup').locator('.p-inputgroupaddon').first()).toBeVisible();
    await screenshotBaseline(page, 'inputgroup');
  });
});

test.describe('sc-search', () => {
  test('chrome del Kit: campo 10.5/7/6/14, icono lupa, clear y CVA', async ({ page }) => {
    await gotoPage(page, 'search');
    const input = page.getByTestId('sc-search').locator('input');
    expect(await styleOf(input, ['padding-top', 'border-radius', 'font-size'])).toEqual({
      'padding-top': '7px',
      'border-radius': '6px',
      'font-size': '14px',
    });
    await expect(page.getByTestId('sc-search').locator('sc-icon').first()).toBeVisible();
    await input.fill('hola');
    await expect(page.getByText('Término: «hola»')).toBeVisible();
    await screenshotBaseline(page, 'search');
  });
});

test.describe('sc-datepicker', () => {
  test('chrome de campo (label/error) + métrica de form field y panel', async ({ page }) => {
    await gotoPage(page, 'datepicker');
    const input = page.getByTestId('sc-datepicker').locator('input');
    expect(await styleOf(input, ['padding-top', 'border-radius', 'font-size'])).toEqual({
      'padding-top': '7px',
      'border-radius': '6px',
      'font-size': '14px',
    });
    await expect(page.getByTestId('sc-datepicker-error').getByText('La fecha no es válida')).toBeVisible();
    await input.click();
    await expect(page.locator('.p-datepicker-panel')).toBeVisible();
    const panel = page.locator('.p-datepicker-panel');
    expect((await styleOf(panel, ['border-radius']))['border-radius']).toBe('6px');
    await page.keyboard.press('Escape');
    await screenshotBaseline(page, 'datepicker');
  });
});

test.describe('sc-inputnumber', () => {
  test('métrica de form field + chrome de error', async ({ page }) => {
    await gotoPage(page, 'inputnumber');
    const input = page.getByTestId('sc-inputnumber').locator('input');
    expect(await styleOf(input, ['padding-top', 'border-radius', 'font-size'])).toEqual({
      'padding-top': '7px',
      'border-radius': '6px',
      'font-size': '14px',
    });
    await expect(page.getByTestId('sc-inputnumber-error').getByText('Fuera de rango')).toBeVisible();
    await screenshotBaseline(page, 'inputnumber');
  });
});

test.describe('sc-multiselect', () => {
  test('métrica de form field, opciones primitivas y overlay del Kit', async ({ page }) => {
    await gotoPage(page, 'multiselect');
    const field = page.getByTestId('sc-multiselect').locator('.p-multiselect');
    expect((await styleOf(field, ['border-radius']))['border-radius']).toBe('6px');
    await field.click();
    const overlay = page.locator('.p-multiselect-overlay');
    await expect(overlay).toBeVisible();
    expect((await styleOf(overlay, ['border-radius']))['border-radius']).toBe('6px');
    const option = page.locator('.p-multiselect-option').first();
    expect(await styleOf(option, ['padding-top', 'padding-left'])).toEqual({
      'padding-top': '7px',
      'padding-left': '10.5px',
    });
    await option.click();
    await expect(page.getByTestId('sc-multiselect').getByText('Soporte')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('sc-multiselect-error').getByText('Selecciona al menos uno')).toBeVisible();
    await screenshotBaseline(page, 'multiselect');
  });
});

test.describe('sc-grouppopover', () => {
  test('conteo, popover en hover, límite 5 y cola «+N más»', async ({ page }) => {
    await gotoPage(page, 'grouppopover');
    const trigger = page.getByTestId('sc-grouppopover-many').locator('button, [role="button"], .sc-group-popover__trigger').first();
    await trigger.hover();
    const overlay = page.locator('.p-popover');
    await expect(overlay).toBeVisible();
    await expect(overlay.getByText('Soporte')).toBeVisible();
    await expect(overlay.getByText('+2 más')).toBeVisible();
    await screenshotBaseline(page, 'grouppopover');
  });
});

test.describe('sc-column-selector', () => {
  test('abre el popover, lista columnas y conmuta visibilidad', async ({ page }) => {
    await gotoPage(page, 'columnselector');
    await page.getByTestId('sc-column-selector').locator('button').first().click();
    const overlay = page.locator('.p-popover');
    await expect(overlay).toBeVisible();
    await expect(overlay.getByText('Nombre')).toBeVisible();
    await expect(overlay.getByText('Grupo')).toBeVisible();
    expect((await styleOf(overlay, ['border-radius']))['border-radius']).toBe('6px');
    await screenshotBaseline(page, 'columnselector');
  });
});

test.describe('sc-confirmdialog', () => {
  test('abre con métrica del Kit, resuelve la Promise y respeta tonos', async ({ page }) => {
    await gotoPage(page, 'confirmdialog');
    await page.getByTestId('confirm-danger').locator('button').click();
    const dialog = page.locator('.p-confirmdialog');
    await expect(dialog).toBeVisible();
    expect((await styleOf(dialog, ['border-radius']))['border-radius']).toBe('12px');
    await expect(dialog.getByText('¿Eliminar el agente?')).toBeVisible();
    await dialog.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByTestId('confirm-result')).toHaveText('aceptado');
    await page.getByTestId('confirm-primary').locator('button').click();
    await page.locator('.p-confirmdialog').getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByTestId('confirm-result')).toHaveText('rechazado');
  });
});

test.describe('sc-inputtext', () => {
  test('chrome de campo + métrica del Kit + CVA, ifta y fluid', async ({ page }) => {
    await gotoPage(page, 'inputtext');
    const input = page.getByTestId('sc-inputtext').locator('input');
    expect(await styleOf(input, ['padding-left', 'padding-top', 'border-radius', 'font-size'])).toEqual({
      'padding-left': '10.5px',
      'padding-top': '7px',
      'border-radius': '6px',
      'font-size': '14px',
    });
    await input.fill('hola');
    await expect(page.getByText('Valor: «hola»')).toBeVisible();
    await expect(page.getByTestId('sc-inputtext-error').getByText('El nombre no es válido')).toBeVisible();
    // ifta: label arriba-dentro del campo
    await expect(page.getByTestId('sc-inputtext-ifta').locator('.sc-inputtext__ifta-label')).toBeVisible();
    const sm = page.getByTestId('sc-inputtext-sm').locator('input');
    expect((await styleOf(sm, ['font-size']))['font-size']).toBe('12px');
    await screenshotBaseline(page, 'inputtext');
  });
});

test.describe('sc-select', () => {
  test('chrome + métrica del Kit, overlay, pTemplate y CVA', async ({ page }) => {
    await gotoPage(page, 'select');
    const field = page.getByTestId('sc-select').locator('.p-select');
    expect((await styleOf(field, ['border-radius']))['border-radius']).toBe('6px');
    await field.click();
    const overlay = page.locator('.p-select-overlay');
    await expect(overlay).toBeVisible();
    expect((await styleOf(overlay, ['border-radius']))['border-radius']).toBe('6px');
    const option = page.locator('.p-select-option').first();
    expect(await styleOf(option, ['padding-top', 'padding-left'])).toEqual({
      'padding-top': '7px',
      'padding-left': '10.5px',
    });
    await option.click();
    await expect(page.getByText('Valor: «Soporte»')).toBeVisible();
    // pTemplate re-proyectado: el item lleva el prefijo ★
    await page.getByTestId('sc-select-tmpl').locator('.p-select').click();
    await expect(page.locator('.p-select-option').filter({ hasText: '★ Alta' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('sc-select-error').getByText('Selecciona un grupo')).toBeVisible();
    await screenshotBaseline(page, 'select');
  });
});

test.describe('sc-toggleswitch', () => {
  test('métrica del Kit (35×21, handle 14), toggle y readonly', async ({ page }) => {
    await gotoPage(page, 'toggleswitch');
    const sw = page.getByTestId('sc-toggle').locator('.p-toggleswitch');
    expect(await styleOf(sw, ['width', 'height'])).toEqual({ width: '35px', height: '21px' });
    // toggle emite
    await sw.click();
    await expect(page.getByText('Estado: on')).toBeVisible();
    // readonly NO cambia el estado proyectado
    const ro = page.getByTestId('sc-toggle-ro').locator('.p-toggleswitch');
    await expect(ro).toHaveClass(/p-toggleswitch-checked/);
    await ro.click();
    await expect(ro).toHaveClass(/p-toggleswitch-checked/);
    await screenshotBaseline(page, 'toggleswitch');
  });
});

test.describe('sc-dialog', () => {
  test('card canónica: abre two-way, métrica del Kit (radio 12), header/footer y cierra', async ({ page }) => {
    await gotoPage(page, 'dialog');
    await page.getByTestId('open-dialog').locator('button').click();
    const dialog = page.locator('.sc-dialog');
    await expect(dialog).toBeVisible();
    // título + subtítulo + icono renderizados desde inputs
    await expect(dialog.getByText('¿Eliminar el agente?')).toBeVisible();
    await expect(dialog.getByText('Esta acción no se puede deshacer.')).toBeVisible();
    await expect(dialog.locator('sc-icon').first()).toBeVisible();
    // footer projection
    await expect(page.getByTestId('dialog-cancel')).toBeVisible();
    // la card canónica pinta su propio radio (Kit dialog = 12); el .p-dialog
    // host es transparente (showHeader=false).
    expect((await styleOf(dialog, ['border-radius']))['border-radius']).toBe('12px');
    // cierra con ESC → two-way baja a false
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('dynamic dialog: abre componente al vuelo y resuelve onClose', async ({ page }) => {
    await gotoPage(page, 'dialog');
    await page.getByTestId('open-dynamic').locator('button').click();
    await expect(page.getByTestId('dyn-content')).toBeVisible();
    await page.getByTestId('dyn-close').locator('button').click();
    await expect(page.getByTestId('dyn-result')).toHaveText('ok');
  });
});

test.describe('sc-checkbox', () => {
  test('tri-estado nativo: none/some/all, ciclo y aria-checked=mixed', async ({ page }) => {
    await gotoPage(page, 'checkbox');
    // estado inicial: 1 de 3 → header 'some' → input.indeterminate
    const header = page.getByTestId('sc-checkbox-header').locator('input');
    expect(await header.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);
    await expect(header).toHaveAttribute('aria-checked', 'mixed');
    // click en header con 'some' → cycle emite false → todas off → header 'none'
    await header.click();
    await expect(page.getByText('Cabecera (none)')).toBeVisible();
    expect(await header.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(false);
    expect(await header.evaluate((el: HTMLInputElement) => el.checked)).toBe(false);
    // click de nuevo con 'none' → true → todas on → header 'all' + checked
    await header.click();
    await expect(page.getByText('Cabecera (all)')).toBeVisible();
    expect(await header.evaluate((el: HTMLInputElement) => el.checked)).toBe(true);
    // base nativa: es un <input type=checkbox> real
    await expect(header).toHaveJSProperty('type', 'checkbox');
    await screenshotBaseline(page, 'checkbox');
  });
});

test.describe('sc-empty-state', () => {
  test('métrica del Kit + CTA condicional + gap v/14', async ({ page }) => {
    await gotoPage(page, 'emptystate');

    // variante sin CTA: título visible, sin botón de acción
    const plain = page.getByTestId('sc-emptystate-plain');
    await expect(plain.locator('.empty-state__title')).toHaveText('No hay agentes todavía');
    await expect(plain.locator('.empty-state__cta')).toHaveCount(0);

    // contenedor: min-height reservado (no-shift empty→poblado) + gap v/14
    // (--sc-spacing-1-125 = 1.125 × 14 = 15.75)
    const root = plain.locator('.empty-state');
    expect(await styleOf(root, ['min-height', 'gap'])).toEqual({
      'min-height': '320px',
      gap: '15.75px',
    });

    // icono circular 64×64 (radius pill clamp)
    const icon = plain.locator('.empty-state__icon');
    expect(await styleOf(icon, ['width', 'height', 'border-radius'])).toEqual({
      width: '64px',
      height: '64px',
      'border-radius': '9999px',
    });

    // título 16/600 (font-size-300 redondo, DD-13)
    const title = plain.locator('.empty-state__title');
    expect(await styleOf(title, ['font-size', 'font-weight'])).toEqual({
      'font-size': '16px',
      'font-weight': '600',
    });

    // variante con CTA: botón de acción visible
    const cta = page.getByTestId('sc-emptystate-cta');
    await expect(cta.locator('.empty-state__cta')).toBeVisible();

    await screenshotBaseline(page, 'emptystate');
  });
});

test.describe('sc-page-header', () => {
  test('chip 36² + tipografía subtitle-1 + slot de acción + variante mínima', async ({ page }) => {
    await gotoPage(page, 'pageheader');

    const full = page.getByTestId('sc-pageheader-full');

    // icono chip 36×36 (compact S59)
    const icon = full.locator('.page-header__icon');
    expect(await styleOf(icon, ['width', 'height'])).toEqual({ width: '36px', height: '36px' });

    // título subtitle-1 = font-size-300 (16) / semibold (600)
    const title = full.locator('.page-header__title');
    expect(await styleOf(title, ['font-size', 'font-weight'])).toEqual({
      'font-size': '16px',
      'font-weight': '600',
    });

    // eyebrow 12 mayúsculas
    const eyebrow = full.locator('.page-header__entity');
    expect(await styleOf(eyebrow, ['font-size', 'text-transform'])).toEqual({
      'font-size': '12px',
      'text-transform': 'uppercase',
    });

    // acción proyectada en [page-header-actions]
    await expect(full.locator('[page-header-actions]')).toBeVisible();

    // variante mínima: sin icono / eyebrow / subtítulo
    const min = page.getByTestId('sc-pageheader-min');
    await expect(min.locator('.page-header__icon')).toHaveCount(0);
    await expect(min.locator('.page-header__entity')).toHaveCount(0);
    await expect(min.locator('.page-header__subtitle')).toHaveCount(0);

    await screenshotBaseline(page, 'pageheader');
  });
});

test.describe('sc-form-section-nav', () => {
  test('chip 28² (32² flush), activo aria-current, punto de error, click controla', async ({ page }) => {
    await gotoPage(page, 'formsectionnav');

    const nav = page.getByTestId('sc-formnav-default');

    // 4 items
    await expect(nav.locator('.form-nav__item')).toHaveCount(4);

    // chip default 28×28
    const chip = nav.locator('.form-nav__icon').first();
    expect(await styleOf(chip, ['width', 'height'])).toEqual({ width: '28px', height: '28px' });

    // activo inicial = general → aria-current
    await expect(nav.locator('.form-nav__item--active')).toHaveAttribute('aria-current', 'true');

    // sección 'horario' con punto de error (required vacíos)
    await expect(nav.locator('.form-nav__item--has-error .form-nav__dot')).toHaveCount(1);

    // click en otra sección mueve el activo (controlado por el padre)
    await nav.locator('.form-nav__item').nth(1).click();
    await expect(nav.locator('.form-nav__item').nth(1)).toHaveClass(/form-nav__item--active/);

    // flush: chip 32×32 (Figma índice)
    const flushChip = page.getByTestId('sc-formnav-flush').locator('.form-nav__icon').first();
    expect(await styleOf(flushChip, ['width', 'height'])).toEqual({ width: '32px', height: '32px' });

    await screenshotBaseline(page, 'formsectionnav');
  });
});

test.describe('sc-bulk-edit-menu', () => {
  test('compone 2 sc-select + p-button; Aplicar emite commit', async ({ page }) => {
    await gotoPage(page, 'bulkeditmenu');
    const menu = page.getByTestId('sc-bulkedit');

    // dos selects (campo + valor)
    await expect(menu.locator('sc-select')).toHaveCount(2);

    // botón Aplicar (el effect inicializa field=estado / value=activo → habilitado)
    const apply = menu.locator('p-button button');
    await expect(apply).toBeEnabled();

    // click → emite commit con fieldLabel/valueLabel del consumidor
    await apply.click();
    const result = page.getByTestId('sc-bulkedit-result');
    await expect(result).toContainText('Estado');
    await expect(result).toContainText('Activo');

    await screenshotBaseline(page, 'bulkeditmenu');
  });
});

test.describe('sc-bulk-action-bar', () => {
  test('resumen pluralizado (sufijo colocado), acciones proyectadas, clear oculta', async ({ page }) => {
    await gotoPage(page, 'bulkactionbar');

    const bar = page.getByTestId('sc-bulkbar').locator('.bulk-bar');
    await expect(bar).toBeVisible();

    // resumen plural: "3 agentes seleccionados" (sufijo del dict colocado, es)
    await expect(bar.locator('.bulk-bar__summary')).toContainText('3 agentes seleccionados');

    // acciones proyectadas a la derecha
    await expect(bar.locator('.bulk-bar__actions')).toContainText('Editar');

    // clear → count 0 → barra desmontada (@if visible)
    await bar.locator('.bulk-bar__clear').click();
    await expect(page.getByTestId('sc-bulkbar').locator('.bulk-bar')).toHaveCount(0);

    await screenshotBaseline(page, 'bulkactionbar');
  });
});

test.describe('sc-form-danger-zone', () => {
  test('frame destructivo + botón danger dispara action', async ({ page }) => {
    await gotoPage(page, 'formdangerzone');

    const zone = page.getByTestId('sc-dangerzone');
    await expect(zone.locator('.danger-zone__title')).toHaveText('Zona de peligro');
    await expect(zone.locator('.danger-zone__description')).toContainText('permanente');

    // botón danger (p-button severity danger outlined) dispara la acción
    const btn = zone.locator('p-button button');
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.getByTestId('sc-dangerzone-fired')).toBeVisible();

    await screenshotBaseline(page, 'formdangerzone');
  });
});

test.describe('sc-sticky-form-header', () => {
  test('deprecated/retenido: el lápiz abre el rename inline + Save presente', async ({ page }) => {
    await gotoPage(page, 'stickyformheader');

    const edit = page.getByTestId('sc-sticky-edit');
    await expect(edit.locator('.sticky-header__name')).toHaveText('Soporte Ventas');

    // click en el lápiz → input de rename inline + check/close
    await edit.locator('.sticky-header__icon-btn').first().click();
    await expect(edit.locator('.sticky-header__name-input')).toBeVisible();

    // botón Save en el cluster de acciones
    await expect(edit.locator('.sticky-header__actions p-button button')).toBeVisible();

    await screenshotBaseline(page, 'stickyformheader');
  });
});

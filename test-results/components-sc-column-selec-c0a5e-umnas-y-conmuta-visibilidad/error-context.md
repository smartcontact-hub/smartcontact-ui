# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: components.spec.ts >> sc-column-selector >> abre el popover, lista columnas y conmuta visibilidad
- Location: e2e/components.spec.ts:397:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByTestId('sc-column-selector').locator('button').first()
    - locator resolved to <button type="button" class="trigger" title="Columnas" aria-label="Columnas" _ngcontent-ng-c123987838="">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <iframe src="about:blank" id="webpack-dev-server-client-overlay"></iframe> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <iframe src="about:blank" id="webpack-dev-server-client-overlay"></iframe> intercepts pointer events
    - retrying click action
      - waiting 100ms
    110 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <iframe src="about:blank" id="webpack-dev-server-client-overlay"></iframe> intercepts pointer events
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]: Smart Contact UI
      - navigation [ref=e5]:
        - link "Fundaciones" [ref=e6] [cursor=pointer]:
          - /url: "#/foundations"
        - link "Tema PrimeNG" [ref=e7] [cursor=pointer]:
          - /url: "#/theme"
        - link "Componentes" [ref=e8] [cursor=pointer]:
          - /url: "#/components"
      - button "Claro / oscuro" [ref=e9] [cursor=pointer]
    - main [ref=e10]:
      - generic [ref=e11]:
        - heading "sc-column-selector" [level=1] [ref=e12]
        - paragraph [ref=e13]: "Gestor de columnas sobre popover: visibilidad + reordenado por arrastre, persistido en localStorage."
        - button "Columnas" [ref=e16] [cursor=pointer]:
          - generic [ref=e18]: view_column
  - iframe [ref=e19]:
    - generic [ref=f1e2]:
      - generic [ref=f1e3]: "Compiled with problems:"
      - button "Dismiss" [ref=f1e4] [cursor=pointer]: ×
      - generic [ref=f1e5]:
        - generic [ref=f1e6]:
          - generic [ref=f1e7]: ERROR
          - generic [ref=f1e8]:
            - text: projects/ui-smartcontact/src/lib/components/column-selector/sc-column-selector.component.ts:14:84 - error
            - generic [ref=f1e9]:
              - text: "TS2307:"
              - generic [ref=f1e10]: "Cannot find module '@smartcontact/icons' or its corresponding type declarations. 14 import { SC_ICON_SIZE_LG, SC_ICON_SIZE_MD, SC_ICON_SIZE_SM, ScIconComponent } from '@smartcontact/icons'; ~~~~~~~~~~~~~~~~~~~~~"
        - generic [ref=f1e11]:
          - generic [ref=f1e12]: ERROR
          - generic [ref=f1e13]:
            - text: projects/ui-smartcontact/src/lib/components/column-selector/sc-column-selector.component.ts:57:35 - error
            - generic [ref=f1e14]:
              - text: "NG1010:"
              - generic [ref=f1e15]: "'imports' must be an array of components, directives, pipes, or NgModules. Value could not be determined statically. 57 imports: [CdkDrag, CdkDropList, ScIconComponent, PopoverModule], ~~~~~~~~~~~~~~~"
              - text: projects/ui-smartcontact/src/lib/components/column-selector/sc-column-selector.component.ts:57:35
              - generic [ref=f1e16]: "57 imports: [CdkDrag, CdkDropList, ScIconComponent, PopoverModule], ~~~~~~~~~~~~~~~"
              - text: Unknown reference.
        - generic [ref=f1e17]:
          - generic [ref=f1e18]: ERROR
          - generic [ref=f1e19]:
            - text: projects/ui-smartcontact/src/lib/components/search/sc-search.component.ts:20:72 - error
            - generic [ref=f1e20]:
              - text: "TS2307:"
              - generic [ref=f1e21]: "Cannot find module '@smartcontact/icons' or its corresponding type declarations. 20 import { SC_ICON_SIZE_DEFAULT, SC_ICON_SIZE_MD, ScIconComponent } from '@smartcontact/icons'; ~~~~~~~~~~~~~~~~~~~~~"
        - generic [ref=f1e22]:
          - generic [ref=f1e23]: ERROR
          - generic [ref=f1e24]:
            - text: projects/ui-smartcontact/src/lib/components/search/sc-search.component.ts:45:64 - error
            - generic [ref=f1e25]:
              - text: "NG1010:"
              - generic [ref=f1e26]: "'imports' must be an array of components, directives, pipes, or NgModules. Value could not be determined statically. 45 imports: [IconFieldModule, InputIconModule, InputTextModule, ScIconComponent, FormsModule], ~~~~~~~~~~~~~~~"
              - text: projects/ui-smartcontact/src/lib/components/search/sc-search.component.ts:45:64
              - generic [ref=f1e27]: "45 imports: [IconFieldModule, InputIconModule, InputTextModule, ScIconComponent, FormsModule], ~~~~~~~~~~~~~~~"
              - text: Unknown reference.
```

# Test source

```ts
  299 |   test('compone input + addons con la métrica de form field', async ({ page }) => {
  300 |     await gotoPage(page, 'inputgroup');
  301 |     const input = page.getByTestId('ig-input');
  302 |     expect(await styleOf(input, ['padding-left', 'padding-top', 'font-size'])).toEqual({
  303 |       'padding-left': '10.5px',
  304 |       'padding-top': '7px',
  305 |       'font-size': '14px',
  306 |     });
  307 |     await expect(page.getByTestId('sc-inputgroup').locator('.p-inputgroupaddon').first()).toBeVisible();
  308 |     await screenshotBaseline(page, 'inputgroup');
  309 |   });
  310 | });
  311 | 
  312 | test.describe('sc-search', () => {
  313 |   test('chrome del Kit: campo 10.5/7/6/14, icono lupa, clear y CVA', async ({ page }) => {
  314 |     await gotoPage(page, 'search');
  315 |     const input = page.getByTestId('sc-search').locator('input');
  316 |     expect(await styleOf(input, ['padding-top', 'border-radius', 'font-size'])).toEqual({
  317 |       'padding-top': '7px',
  318 |       'border-radius': '6px',
  319 |       'font-size': '14px',
  320 |     });
  321 |     await expect(page.getByTestId('sc-search').locator('sc-icon').first()).toBeVisible();
  322 |     await input.fill('hola');
  323 |     await expect(page.getByText('Término: «hola»')).toBeVisible();
  324 |     await screenshotBaseline(page, 'search');
  325 |   });
  326 | });
  327 | 
  328 | test.describe('sc-datepicker', () => {
  329 |   test('chrome de campo (label/error) + métrica de form field y panel', async ({ page }) => {
  330 |     await gotoPage(page, 'datepicker');
  331 |     const input = page.getByTestId('sc-datepicker').locator('input');
  332 |     expect(await styleOf(input, ['padding-top', 'border-radius', 'font-size'])).toEqual({
  333 |       'padding-top': '7px',
  334 |       'border-radius': '6px',
  335 |       'font-size': '14px',
  336 |     });
  337 |     await expect(page.getByTestId('sc-datepicker-error').getByText('La fecha no es válida')).toBeVisible();
  338 |     await input.click();
  339 |     await expect(page.locator('.p-datepicker-panel')).toBeVisible();
  340 |     const panel = page.locator('.p-datepicker-panel');
  341 |     expect((await styleOf(panel, ['border-radius']))['border-radius']).toBe('6px');
  342 |     await page.keyboard.press('Escape');
  343 |     await screenshotBaseline(page, 'datepicker');
  344 |   });
  345 | });
  346 | 
  347 | test.describe('sc-inputnumber', () => {
  348 |   test('métrica de form field + chrome de error', async ({ page }) => {
  349 |     await gotoPage(page, 'inputnumber');
  350 |     const input = page.getByTestId('sc-inputnumber').locator('input');
  351 |     expect(await styleOf(input, ['padding-top', 'border-radius', 'font-size'])).toEqual({
  352 |       'padding-top': '7px',
  353 |       'border-radius': '6px',
  354 |       'font-size': '14px',
  355 |     });
  356 |     await expect(page.getByTestId('sc-inputnumber-error').getByText('Fuera de rango')).toBeVisible();
  357 |     await screenshotBaseline(page, 'inputnumber');
  358 |   });
  359 | });
  360 | 
  361 | test.describe('sc-multiselect', () => {
  362 |   test('métrica de form field, opciones primitivas y overlay del Kit', async ({ page }) => {
  363 |     await gotoPage(page, 'multiselect');
  364 |     const field = page.getByTestId('sc-multiselect').locator('.p-multiselect');
  365 |     expect((await styleOf(field, ['border-radius']))['border-radius']).toBe('6px');
  366 |     await field.click();
  367 |     const overlay = page.locator('.p-multiselect-overlay');
  368 |     await expect(overlay).toBeVisible();
  369 |     expect((await styleOf(overlay, ['border-radius']))['border-radius']).toBe('6px');
  370 |     const option = page.locator('.p-multiselect-option').first();
  371 |     expect(await styleOf(option, ['padding-top', 'padding-left'])).toEqual({
  372 |       'padding-top': '7px',
  373 |       'padding-left': '10.5px',
  374 |     });
  375 |     await option.click();
  376 |     await expect(page.getByTestId('sc-multiselect').getByText('Soporte')).toBeVisible();
  377 |     await page.keyboard.press('Escape');
  378 |     await expect(page.getByTestId('sc-multiselect-error').getByText('Selecciona al menos uno')).toBeVisible();
  379 |     await screenshotBaseline(page, 'multiselect');
  380 |   });
  381 | });
  382 | 
  383 | test.describe('sc-grouppopover', () => {
  384 |   test('conteo, popover en hover, límite 5 y cola «+N más»', async ({ page }) => {
  385 |     await gotoPage(page, 'grouppopover');
  386 |     const trigger = page.getByTestId('sc-grouppopover-many').locator('button, [role="button"], .sc-group-popover__trigger').first();
  387 |     await trigger.hover();
  388 |     const overlay = page.locator('.p-popover');
  389 |     await expect(overlay).toBeVisible();
  390 |     await expect(overlay.getByText('Soporte')).toBeVisible();
  391 |     await expect(overlay.getByText('+2 más')).toBeVisible();
  392 |     await screenshotBaseline(page, 'grouppopover');
  393 |   });
  394 | });
  395 | 
  396 | test.describe('sc-column-selector', () => {
  397 |   test('abre el popover, lista columnas y conmuta visibilidad', async ({ page }) => {
  398 |     await gotoPage(page, 'columnselector');
> 399 |     await page.getByTestId('sc-column-selector').locator('button').first().click();
      |                                                                            ^ Error: locator.click: Test timeout of 60000ms exceeded.
  400 |     const overlay = page.locator('.p-popover');
  401 |     await expect(overlay).toBeVisible();
  402 |     await expect(overlay.getByText('Nombre')).toBeVisible();
  403 |     await expect(overlay.getByText('Grupo')).toBeVisible();
  404 |     expect((await styleOf(overlay, ['border-radius']))['border-radius']).toBe('6px');
  405 |     await screenshotBaseline(page, 'columnselector');
  406 |   });
  407 | });
  408 | 
  409 | test.describe('sc-confirmdialog', () => {
  410 |   test('abre con métrica del Kit, resuelve la Promise y respeta tonos', async ({ page }) => {
  411 |     await gotoPage(page, 'confirmdialog');
  412 |     await page.getByTestId('confirm-danger').locator('button').click();
  413 |     const dialog = page.locator('.p-confirmdialog');
  414 |     await expect(dialog).toBeVisible();
  415 |     expect((await styleOf(dialog, ['border-radius']))['border-radius']).toBe('12px');
  416 |     await expect(dialog.getByText('¿Eliminar el agente?')).toBeVisible();
  417 |     await dialog.getByRole('button', { name: 'Eliminar' }).click();
  418 |     await expect(page.getByTestId('confirm-result')).toHaveText('aceptado');
  419 |     await page.getByTestId('confirm-primary').locator('button').click();
  420 |     await page.locator('.p-confirmdialog').getByRole('button', { name: 'Cancelar' }).click();
  421 |     await expect(page.getByTestId('confirm-result')).toHaveText('rechazado');
  422 |   });
  423 | });
  424 | 
```
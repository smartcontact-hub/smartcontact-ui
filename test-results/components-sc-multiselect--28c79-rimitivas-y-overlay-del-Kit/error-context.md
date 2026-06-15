# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: components.spec.ts >> sc-multiselect >> métrica de form field, opciones primitivas y overlay del Kit
- Location: e2e/components.spec.ts:362:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "6px"
Received: "0px"
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]: Smart Contact UI
    - navigation [ref=e5]:
      - link "Fundaciones" [ref=e6] [cursor=pointer]:
        - /url: "#/foundations"
      - link "Tipografía" [ref=e7] [cursor=pointer]:
        - /url: "#/foundations-type"
      - link "Tema PrimeNG" [ref=e8] [cursor=pointer]:
        - /url: "#/theme"
      - link "Componentes" [ref=e9] [cursor=pointer]:
        - /url: "#/components"
    - button "Claro / oscuro" [ref=e10] [cursor=pointer]
  - main [ref=e11]:
    - generic [ref=e12]:
      - heading "sc-multiselect" [level=1] [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Grupos
          - generic [ref=e18] [cursor=pointer]:
            - generic [ref=e19]:
              - combobox "Grupos"
            - generic [ref=e21]: Selecciona grupos
            - img [ref=e23]
        - generic [ref=e25]:
          - generic [ref=e26]: Con chips
          - generic [ref=e28] [cursor=pointer]:
            - generic [ref=e29]:
              - combobox "Con chips"
            - img [ref=e32]
        - generic [ref=e34]:
          - generic [ref=e35]: Con filtro
          - generic [ref=e37] [cursor=pointer]:
            - generic [ref=e38]:
              - combobox "Con filtro"
            - img [ref=e41]
        - generic [ref=e43]:
          - generic [ref=e44]: Con error
          - generic [ref=e46] [cursor=pointer]:
            - generic [ref=e47]:
              - combobox "Con error"
            - img [ref=e50]
          - generic [ref=e52]: Selecciona al menos uno
```

# Test source

```ts
  265 | });
  266 | 
  267 | test.describe('sc-toast', () => {
  268 |   test('muestra el toast con tipografía del Kit (14/12)', async ({ page }) => {
  269 |     await gotoPage(page, 'toast');
  270 |     await page.getByTestId('toast-success').locator('button').click();
  271 |     const summary = page.locator('.p-toast-summary');
  272 |     await expect(summary).toBeVisible();
  273 |     expect((await styleOf(summary, ['font-size']))['font-size']).toBe('14px');
  274 |     const detail = page.locator('.p-toast-detail');
  275 |     expect((await styleOf(detail, ['font-size']))['font-size']).toBe('12px');
  276 |   });
  277 | });
  278 | 
  279 | test.describe('sc-divider', () => {
  280 |   test('métrica del Kit (margin 14, content padding 7) y variantes', async ({ page }) => {
  281 |     await gotoPage(page, 'divider');
  282 |     const h = page.getByTestId('sc-divider').locator('.p-divider');
  283 |     expect(await styleOf(h, ['margin-top', 'margin-bottom'])).toEqual({
  284 |       'margin-top': '14px',
  285 |       'margin-bottom': '14px',
  286 |     });
  287 |     const content = page.getByTestId('sc-divider-block').locator('.p-divider-content').first();
  288 |     expect((await styleOf(content, ['padding-left']))['padding-left']).toBe('7px');
  289 |     const v = page.getByTestId('sc-divider-v').locator('.p-divider');
  290 |     expect(await styleOf(v, ['margin-left', 'margin-right'])).toEqual({
  291 |       'margin-left': '14px',
  292 |       'margin-right': '14px',
  293 |     });
  294 |     await screenshotBaseline(page, 'divider');
  295 |   });
  296 | });
  297 | 
  298 | test.describe('sc-inputgroup', () => {
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
> 365 |     expect((await styleOf(field, ['border-radius']))['border-radius']).toBe('6px');
      |                                                                        ^ Error: expect(received).toBe(expected) // Object.is equality
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
  376 |     // Asserta sobre la label del campo (no un getByText global, que bajo carga
  377 |     // paralela casa también la opción del overlay aún abierto → strict violation).
  378 |     await expect(
  379 |       page.getByTestId('sc-multiselect').locator('.p-multiselect-label'),
  380 |     ).toContainText('Soporte');
  381 |     await page.keyboard.press('Escape');
  382 |     await expect(page.getByTestId('sc-multiselect-error').getByText('Selecciona al menos uno')).toBeVisible();
  383 |     await screenshotBaseline(page, 'multiselect');
  384 |   });
  385 | });
  386 | 
  387 | test.describe('sc-grouppopover', () => {
  388 |   test('conteo, popover en hover, límite 5 y cola «+N más»', async ({ page }) => {
  389 |     await gotoPage(page, 'grouppopover');
  390 |     const trigger = page.getByTestId('sc-grouppopover-many').locator('button, [role="button"], .sc-group-popover__trigger').first();
  391 |     await trigger.hover();
  392 |     const overlay = page.locator('.p-popover');
  393 |     await expect(overlay).toBeVisible();
  394 |     await expect(overlay.getByText('Soporte')).toBeVisible();
  395 |     await expect(overlay.getByText('+2 más')).toBeVisible();
  396 |     await screenshotBaseline(page, 'grouppopover');
  397 |   });
  398 | });
  399 | 
  400 | test.describe('sc-column-selector', () => {
  401 |   test('abre el popover, lista columnas y conmuta visibilidad', async ({ page }) => {
  402 |     await gotoPage(page, 'columnselector');
  403 |     await page.getByTestId('sc-column-selector').locator('button').first().click();
  404 |     const overlay = page.locator('.p-popover');
  405 |     await expect(overlay).toBeVisible();
  406 |     await expect(overlay.getByText('Nombre')).toBeVisible();
  407 |     await expect(overlay.getByText('Grupo')).toBeVisible();
  408 |     expect((await styleOf(overlay, ['border-radius']))['border-radius']).toBe('6px');
  409 |     await screenshotBaseline(page, 'columnselector');
  410 |   });
  411 | });
  412 | 
  413 | test.describe('sc-confirmdialog', () => {
  414 |   test('abre con métrica del Kit, resuelve la Promise y respeta tonos', async ({ page }) => {
  415 |     await gotoPage(page, 'confirmdialog');
  416 |     await page.getByTestId('confirm-danger').locator('button').click();
  417 |     const dialog = page.locator('.p-confirmdialog');
  418 |     await expect(dialog).toBeVisible();
  419 |     expect((await styleOf(dialog, ['border-radius']))['border-radius']).toBe('12px');
  420 |     await expect(dialog.getByText('¿Eliminar el agente?')).toBeVisible();
  421 |     await dialog.getByRole('button', { name: 'Eliminar' }).click();
  422 |     await expect(page.getByTestId('confirm-result')).toHaveText('aceptado');
  423 |     await page.getByTestId('confirm-primary').locator('button').click();
  424 |     await page.locator('.p-confirmdialog').getByRole('button', { name: 'Cancelar' }).click();
  425 |     await expect(page.getByTestId('confirm-result')).toHaveText('rechazado');
  426 |   });
  427 | });
  428 | 
  429 | test.describe('sc-inputtext', () => {
  430 |   test('chrome de campo + métrica del Kit + CVA, ifta y fluid', async ({ page }) => {
  431 |     await gotoPage(page, 'inputtext');
  432 |     const input = page.getByTestId('sc-inputtext').locator('input');
  433 |     expect(await styleOf(input, ['padding-left', 'padding-top', 'border-radius', 'font-size'])).toEqual({
  434 |       'padding-left': '10.5px',
  435 |       'padding-top': '7px',
  436 |       'border-radius': '6px',
  437 |       'font-size': '14px',
  438 |     });
  439 |     await input.fill('hola');
  440 |     await expect(page.getByText('Valor: «hola»')).toBeVisible();
  441 |     await expect(page.getByTestId('sc-inputtext-error').getByText('El nombre no es válido')).toBeVisible();
  442 |     // ifta: label arriba-dentro del campo
  443 |     await expect(page.getByTestId('sc-inputtext-ifta').locator('.sc-inputtext__ifta-label')).toBeVisible();
  444 |     const sm = page.getByTestId('sc-inputtext-sm').locator('input');
  445 |     expect((await styleOf(sm, ['font-size']))['font-size']).toBe('12px');
  446 |     await screenshotBaseline(page, 'inputtext');
  447 |   });
  448 | });
  449 | 
  450 | test.describe('sc-select', () => {
  451 |   test('chrome + métrica del Kit, overlay, pTemplate y CVA', async ({ page }) => {
  452 |     await gotoPage(page, 'select');
  453 |     const field = page.getByTestId('sc-select').locator('.p-select');
  454 |     expect((await styleOf(field, ['border-radius']))['border-radius']).toBe('6px');
  455 |     await field.click();
  456 |     const overlay = page.locator('.p-select-overlay');
  457 |     await expect(overlay).toBeVisible();
  458 |     expect((await styleOf(overlay, ['border-radius']))['border-radius']).toBe('6px');
  459 |     const option = page.locator('.p-select-option').first();
  460 |     expect(await styleOf(option, ['padding-top', 'padding-left'])).toEqual({
  461 |       'padding-top': '7px',
  462 |       'padding-left': '10.5px',
  463 |     });
  464 |     await option.click();
  465 |     await expect(page.getByText('Valor: «Soporte»')).toBeVisible();
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: components.spec.ts >> sc-select >> chrome + métrica del Kit, overlay, pTemplate y CVA
- Location: e2e/components.spec.ts:451:7

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
      - heading "sc-select" [level=1] [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Grupo
          - generic [ref=e18] [cursor=pointer]:
            - combobox "Selecciona" [ref=e19]
            - button "dropdown trigger" [ref=e20]:
              - img [ref=e21]
        - generic [ref=e23]:
          - generic [ref=e24]: Prioridad (objetos + pTemplate)
          - generic [ref=e26] [cursor=pointer]:
            - combobox "Elige prioridad" [ref=e27]
            - button "dropdown trigger" [ref=e28]:
              - img [ref=e29]
        - generic [ref=e31]:
          - generic [ref=e32]: Con clear + filtro
          - generic [ref=e34] [cursor=pointer]:
            - combobox "Buscar…" [ref=e35]
            - button "dropdown trigger" [ref=e36]:
              - img [ref=e37]
        - generic [ref=e39]:
          - generic [ref=e40]: Con error
          - generic [ref=e42] [cursor=pointer]:
            - combobox [ref=e43]
            - button "dropdown trigger" [ref=e44]:
              - img [ref=e45]
          - generic [ref=e47]: Selecciona un grupo
        - generic [ref=e48]:
          - generic [ref=e49]: Small
          - generic [ref=e51] [cursor=pointer]:
            - combobox "sm" [ref=e52]
            - button "dropdown trigger" [ref=e53]:
              - img [ref=e54]
        - generic [ref=e56]:
          - generic [ref=e57]: Deshabilitado
          - generic [ref=e58]:
            - generic:
              - combobox "off" [disabled]
              - button "dropdown trigger":
                - img
      - paragraph [ref=e59]: "Valor: «»"
```

# Test source

```ts
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
> 454 |     expect((await styleOf(field, ['border-radius']))['border-radius']).toBe('6px');
      |                                                                        ^ Error: expect(received).toBe(expected) // Object.is equality
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
  466 |     // pTemplate re-proyectado: el item lleva el prefijo ★
  467 |     await page.getByTestId('sc-select-tmpl').locator('.p-select').click();
  468 |     await expect(page.locator('.p-select-option').filter({ hasText: '★ Alta' })).toBeVisible();
  469 |     await page.keyboard.press('Escape');
  470 |     await expect(page.getByTestId('sc-select-error').getByText('Selecciona un grupo')).toBeVisible();
  471 |     await screenshotBaseline(page, 'select');
  472 |   });
  473 | });
  474 | 
  475 | test.describe('sc-toggleswitch', () => {
  476 |   test('métrica del Kit (35×21, handle 14), toggle y readonly', async ({ page }) => {
  477 |     await gotoPage(page, 'toggleswitch');
  478 |     const sw = page.getByTestId('sc-toggle').locator('.p-toggleswitch');
  479 |     expect(await styleOf(sw, ['width', 'height'])).toEqual({ width: '35px', height: '21px' });
  480 |     // toggle emite
  481 |     await sw.click();
  482 |     await expect(page.getByText('Estado: on')).toBeVisible();
  483 |     // readonly NO cambia el estado proyectado
  484 |     const ro = page.getByTestId('sc-toggle-ro').locator('.p-toggleswitch');
  485 |     await expect(ro).toHaveClass(/p-toggleswitch-checked/);
  486 |     await ro.click();
  487 |     await expect(ro).toHaveClass(/p-toggleswitch-checked/);
  488 |     await screenshotBaseline(page, 'toggleswitch');
  489 |   });
  490 | });
  491 | 
  492 | test.describe('sc-dialog', () => {
  493 |   test('card canónica: abre two-way, métrica del Kit (radio 12), header/footer y cierra', async ({ page }) => {
  494 |     await gotoPage(page, 'dialog');
  495 |     await page.getByTestId('open-dialog').locator('button').click();
  496 |     const dialog = page.locator('.sc-dialog');
  497 |     await expect(dialog).toBeVisible();
  498 |     // título + subtítulo + icono renderizados desde inputs
  499 |     await expect(dialog.getByText('¿Eliminar el agente?')).toBeVisible();
  500 |     await expect(dialog.getByText('Esta acción no se puede deshacer.')).toBeVisible();
  501 |     await expect(dialog.locator('sc-icon').first()).toBeVisible();
  502 |     // footer projection
  503 |     await expect(page.getByTestId('dialog-cancel')).toBeVisible();
  504 |     // la card canónica pinta su propio radio (Kit dialog = 12); el .p-dialog
  505 |     // host es transparente (showHeader=false).
  506 |     expect((await styleOf(dialog, ['border-radius']))['border-radius']).toBe('12px');
  507 |     // cierra con ESC → two-way baja a false
  508 |     await page.keyboard.press('Escape');
  509 |     await expect(dialog).toBeHidden();
  510 |   });
  511 | 
  512 |   test('dynamic dialog: abre componente al vuelo y resuelve onClose', async ({ page }) => {
  513 |     await gotoPage(page, 'dialog');
  514 |     await page.getByTestId('open-dynamic').locator('button').click();
  515 |     await expect(page.getByTestId('dyn-content')).toBeVisible();
  516 |     await page.getByTestId('dyn-close').locator('button').click();
  517 |     await expect(page.getByTestId('dyn-result')).toHaveText('ok');
  518 |   });
  519 | });
  520 | 
  521 | test.describe('sc-checkbox', () => {
  522 |   test('tri-estado nativo: none/some/all, ciclo y aria-checked=mixed', async ({ page }) => {
  523 |     await gotoPage(page, 'checkbox');
  524 |     // estado inicial: 1 de 3 → header 'some' → input.indeterminate
  525 |     const header = page.getByTestId('sc-checkbox-header').locator('input');
  526 |     expect(await header.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);
  527 |     await expect(header).toHaveAttribute('aria-checked', 'mixed');
  528 |     // click en header con 'some' → cycle emite false → todas off → header 'none'
  529 |     await header.click();
  530 |     await expect(page.getByText('Cabecera (none)')).toBeVisible();
  531 |     expect(await header.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(false);
  532 |     expect(await header.evaluate((el: HTMLInputElement) => el.checked)).toBe(false);
  533 |     // click de nuevo con 'none' → true → todas on → header 'all' + checked
  534 |     await header.click();
  535 |     await expect(page.getByText('Cabecera (all)')).toBeVisible();
  536 |     expect(await header.evaluate((el: HTMLInputElement) => el.checked)).toBe(true);
  537 |     // base nativa: es un <input type=checkbox> real
  538 |     await expect(header).toHaveJSProperty('type', 'checkbox');
  539 |     await screenshotBaseline(page, 'checkbox');
  540 |   });
  541 | });
  542 | 
  543 | test.describe('sc-empty-state', () => {
  544 |   test('métrica del Kit + CTA condicional + gap v/14', async ({ page }) => {
  545 |     await gotoPage(page, 'emptystate');
  546 | 
  547 |     // variante sin CTA: título visible, sin botón de acción
  548 |     const plain = page.getByTestId('sc-emptystate-plain');
  549 |     await expect(plain.locator('.empty-state__title')).toHaveText('No hay agentes todavía');
  550 |     await expect(plain.locator('.empty-state__cta')).toHaveCount(0);
  551 | 
  552 |     // contenedor: min-height reservado (no-shift empty→poblado) + gap v/14
  553 |     // (--sc-spacing-1-125 = 1.125 × 14 = 15.75)
  554 |     const root = plain.locator('.empty-state');
```
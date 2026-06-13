# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: components.spec.ts >> sc-grouppopover >> conteo, popover en hover, límite 5 y cola «+N más»
- Location: e2e/components.spec.ts:384:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.hover: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByTestId('sc-grouppopover-many').locator('button, [role="button"], .sc-group-popover__trigger').first()

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
    - main [ref=e10]
  - iframe [ref=e11]:
    - generic [ref=f1e2]:
      - generic [ref=f1e3]: "Compiled with problems:"
      - button "Dismiss" [ref=f1e4] [cursor=pointer]: ×
      - generic [ref=f1e5]:
        - generic [ref=f1e6]:
          - generic [ref=f1e7]: ERROR
          - generic [ref=f1e8]:
            - text: projects/sc-demo/src/app/pages/components/grouppopover/grouppopover-demo.component.html:6:22 - error
            - generic [ref=f1e9]:
              - text: "TS2322:"
              - generic [ref=f1e10]: "Type '{ id: string; name: string; }[]' is not assignable to type 'readonly GroupRef[]'. Property 'active' is missing in type '{ id: string; name: string; }' but required in type 'GroupRef'. 6 <sc-group-popover [groups]=\"few\" data-testid=\"sc-grouppopover-few\" /> ~~~~~~"
              - text: projects/sc-demo/src/app/pages/components/grouppopover/grouppopover-demo.component.ts:8:16
              - generic [ref=f1e11]: "8 templateUrl: './grouppopover-demo.component.html', ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
              - text: Error occurs in the template of component GroupPopoverDemoComponent.
        - generic [ref=f1e12]:
          - generic [ref=f1e13]: ERROR
          - generic [ref=f1e14]:
            - text: projects/sc-demo/src/app/pages/components/grouppopover/grouppopover-demo.component.html:7:22 - error
            - generic [ref=f1e15]:
              - text: "TS2322:"
              - generic [ref=f1e16]: "Type '{ id: string; name: string; }[]' is not assignable to type 'readonly GroupRef[]'. Property 'active' is missing in type '{ id: string; name: string; }' but required in type 'GroupRef'. 7 <sc-group-popover [groups]=\"many\" data-testid=\"sc-grouppopover-many\" /> ~~~~~~"
              - text: projects/sc-demo/src/app/pages/components/grouppopover/grouppopover-demo.component.ts:8:16
              - generic [ref=f1e17]: "8 templateUrl: './grouppopover-demo.component.html', ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
              - text: Error occurs in the template of component GroupPopoverDemoComponent.
```

# Test source

```ts
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
> 387 |     await trigger.hover();
      |                   ^ Error: locator.hover: Test timeout of 60000ms exceeded.
  388 |     const overlay = page.locator('.p-popover');
  389 |     await expect(overlay).toBeVisible();
  390 |     await expect(overlay.getByText('Soporte')).toBeVisible();
  391 |     await expect(overlay.getByText('+2 más')).toBeVisible();
  392 |     await screenshotBaseline(page, 'grouppopover');
  393 |   });
  394 | });
  395 | 
```
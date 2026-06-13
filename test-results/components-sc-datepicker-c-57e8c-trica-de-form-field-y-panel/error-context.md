# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: components.spec.ts >> sc-datepicker >> chrome de campo (label/error) + métrica de form field y panel
- Location: e2e/components.spec.ts:329:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByTestId('sc-datepicker').locator('input')
    - locator resolved to <input pc9="" pc10="" data-p="" type="text" pinputtext="" role="combobox" autofocus="true" data-p-maskable="" autocomplete="off" id="sc-datepicker-1" aria-expanded="false" aria-haspopup="dialog" data-pc-section="root" aria-autocomplete="none" placeholder="dd/mm/aaaa" data-pc-name="pcinputtext" data-pc-extend="inputtext" class="p-datepicker-input p-component p-inputtext"/>
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
    109 × waiting for element to be visible, enabled and stable
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
        - heading "sc-datepicker" [level=1] [ref=e12]
        - generic [ref=e13]:
          - generic [ref=e14]:
            - generic [ref=e15]: Fecha de inicio
            - generic [ref=e16]:
              - combobox "Fecha de inicio" [ref=e17]
              - img [ref=e19] [cursor=pointer]
          - generic [ref=e21]:
            - generic [ref=e22]:
              - text: Obligatoria
              - generic [ref=e23]: "*"
            - generic [ref=e24]:
              - combobox "Obligatoria" [ref=e25]
              - img [ref=e27] [cursor=pointer]
          - generic [ref=e29]:
            - generic [ref=e30]: Con error
            - generic [ref=e31]:
              - combobox "Con error" [ref=e32]
              - img [ref=e34] [cursor=pointer]
            - generic [ref=e36]: La fecha no es válida
          - generic [ref=e37]:
            - generic [ref=e38]: Deshabilitada
            - generic [ref=e39]:
              - combobox "Deshabilitada" [disabled] [ref=e40]
              - img [ref=e42]
  - iframe [ref=e44]:
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
  238 |     expect((await styleOf(sm, ['width']))['width']).toBe('14px');
  239 |     const lg = page.getByTestId('sc-radio-lg').locator('.p-radiobutton');
  240 |     expect((await styleOf(lg, ['width']))['width']).toBe('21px');
  241 |     await page.locator('#opt-b').click();
  242 |     await expect(page.getByTestId('sc-radio-md').locator('.p-radiobutton')).not.toHaveClass(/p-radiobutton-checked/);
  243 |     await screenshotBaseline(page, 'radiobutton');
  244 |   });
  245 | });
  246 | 
  247 | test.describe('sc-avatar', () => {
  248 |   test('spec del Kit: 28/42/56, radio 6, badge y grupo con offset -10.5', async ({ page }) => {
  249 |     await gotoPage(page, 'avatar');
  250 |     const md = page.getByTestId('sc-avatar-md').locator('.p-avatar');
  251 |     expect(await styleOf(md, ['width', 'height', 'font-size'])).toEqual({
  252 |       width: '28px',
  253 |       height: '28px',
  254 |       'font-size': '14px',
  255 |     });
  256 |     const lg = page.getByTestId('sc-avatar-lg').locator('.p-avatar');
  257 |     expect((await styleOf(lg, ['width']))['width']).toBe('42px');
  258 |     const xl = page.getByTestId('sc-avatar-xl').locator('.p-avatar');
  259 |     expect((await styleOf(xl, ['width']))['width']).toBe('56px');
  260 |     await expect(page.getByTestId('sc-avatar-badge').locator('.p-badge')).toBeVisible();
  261 |     const second = page.getByTestId('sc-avatargroup').locator('.p-avatar').nth(1);
  262 |     expect((await styleOf(second, ['margin-left']))['margin-left']).toBe('-10.5px');
  263 |     await screenshotBaseline(page, 'avatar');
  264 |   });
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
> 338 |     await input.click();
      |                 ^ Error: locator.click: Test timeout of 60000ms exceeded.
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
  399 |     await page.getByTestId('sc-column-selector').locator('button').first().click();
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
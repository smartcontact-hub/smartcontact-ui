# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: components.spec.ts >> sc-inputgroup >> compone input + addons con la métrica de form field
- Location: e2e/components.spec.ts:299:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('sc-inputgroup').locator('.p-inputgroup-addon').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('sc-inputgroup').locator('.p-inputgroup-addon').first()

```

```yaml
- banner:
  - text: Smart Contact UI
  - navigation:
    - link "Fundaciones":
      - /url: "#/foundations"
    - link "Tema PrimeNG":
      - /url: "#/theme"
    - link "Componentes":
      - /url: "#/components"
  - button "Claro / oscuro"
- main:
  - heading "sc-inputgroup" [level=1]
  - text: $
  - textbox "Precio"
  - text: .00 @
  - textbox "Usuario (sm)"
```

# Test source

```ts
  207 |     await expect(drawer).toBeHidden();
  208 |   });
  209 | });
  210 | 
  211 | test.describe('sc-progressbar', () => {
  212 |   test('métrica del Kit (alto 17.5, radio 6, label 12)', async ({ page }) => {
  213 |     await gotoPage(page, 'progressbar');
  214 |     const bar = page.getByTestId('sc-progressbar').locator('.p-progressbar');
  215 |     expect(await styleOf(bar, ['height', 'border-radius'])).toEqual({
  216 |       height: '17.5px',
  217 |       'border-radius': '6px',
  218 |     });
  219 |     const label = page.getByTestId('sc-progressbar').locator('.p-progressbar-label');
  220 |     expect((await styleOf(label, ['font-size']))['font-size']).toBe('12px');
  221 |     await screenshotBaseline(page, 'progressbar');
  222 |   });
  223 | });
  224 | 
  225 | test.describe('sc-progressspinner', () => {
  226 |   test('renderiza el spinner', async ({ page }) => {
  227 |     await gotoPage(page, 'progressspinner');
  228 |     await expect(page.getByTestId('sc-progressspinner').locator('svg')).toBeVisible();
  229 |   });
  230 | });
  231 | 
  232 | test.describe('sc-radiobutton', () => {
  233 |   test('métrica del Kit (caja 17.5; sm 14, lg 21) y selección', async ({ page }) => {
  234 |     await gotoPage(page, 'radiobutton');
  235 |     const md = page.getByTestId('sc-radio-md').locator('.p-radiobutton');
  236 |     expect(await styleOf(md, ['width', 'height'])).toEqual({ width: '17.5px', height: '17.5px' });
  237 |     const sm = page.getByTestId('sc-radio-sm').locator('.p-radiobutton');
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
> 307 |     await expect(page.getByTestId('sc-inputgroup').locator('.p-inputgroup-addon').first()).toBeVisible();
      |                                                                                            ^ Error: expect(locator).toBeVisible() failed
  308 |     await screenshotBaseline(page, 'inputgroup');
  309 |   });
  310 | });
  311 | 
```
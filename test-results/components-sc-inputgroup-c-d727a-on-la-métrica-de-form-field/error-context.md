# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: components.spec.ts >> sc-inputgroup >> compone input + addons con la métrica de form field
- Location: e2e/components.spec.ts:299:7

# Error details

```
Error: expect(page).toHaveScreenshot(expected) failed

  826603 pixels (ratio 0.90 of all image pixels) are different.

  Snapshot: inputgroup.png

Call log:
  - Expect "toHaveScreenshot(inputgroup.png)" with timeout 5000ms
    - verifying given screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - 826603 pixels (ratio 0.90 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - captured a stable screenshot
  - 826603 pixels (ratio 0.90 of all image pixels) are different.

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
        - heading "sc-inputgroup" [level=1] [ref=e12]
        - generic [ref=e13]:
          - generic [ref=e15]:
            - generic [ref=e16]: $
            - textbox "Precio" [ref=e17]
            - generic [ref=e18]: ".00"
          - generic [ref=e20]:
            - generic [ref=e21]: "@"
            - textbox "Usuario (sm)" [ref=e22]
  - iframe [ref=e23]:
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
  1   | import { expect, test, type Locator, type Page } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Diff visual de la Mitad B, por componente:
  5   |  *  - Métricas computadas (getComputedStyle) contra los valores del Kit ya
  6   |  *    verificados por tokens:parity — la misma vara que el smoke del tema.
  7   |  *    Como los wrappers son finos (sin SCSS propio), "no-layout-shift" = el
  8   |  *    wrapper renderiza EXACTAMENTE igual que el primitivo PrimeNG verificado.
  9   |  *  - Baseline de screenshot por página (solo local: los baselines de
  10  |  *    Playwright son por-plataforma; en CI mandan las métricas).
  11  |  */
  12  | 
  13  | const styleOf = (locator: Locator, props: string[]) =>
  14  |   locator.evaluate((el, propList) => {
  15  |     const s = getComputedStyle(el);
  16  |     return Object.fromEntries(propList.map((p) => [p, s.getPropertyValue(p)]));
  17  |   }, props);
  18  | 
  19  | const gotoPage = async (page: Page, path: string) => {
  20  |   await page.goto(`/#/components/${path}`);
  21  |   await page.waitForLoadState('networkidle');
  22  | };
  23  | 
  24  | const screenshotBaseline = async (page: Page, name: string) => {
  25  |   if (process.env['CI']) return;
> 26  |   await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, animations: 'disabled' });
      |                      ^ Error: expect(page).toHaveScreenshot(expected) failed
  27  | };
  28  | 
  29  | test('el índice de componentes lista las páginas', async ({ page }) => {
  30  |   await page.goto('/#/components');
  31  |   await expect(page.getByRole('heading', { name: 'Componentes' })).toBeVisible();
  32  | });
  33  | 
  34  | test.describe('sc-button', () => {
  35  |   test('métrica del Kit en md/sm/lg e icon-only', async ({ page }) => {
  36  |     await gotoPage(page, 'button');
  37  |     const md = page.getByTestId('sc-btn-md').locator('button');
  38  |     expect(await styleOf(md, ['padding-left', 'padding-top', 'border-radius', 'font-size', 'gap'])).toEqual({
  39  |       'padding-left': '10.5px',
  40  |       'padding-top': '7px',
  41  |       'border-radius': '6px',
  42  |       'font-size': '14px',
  43  |       gap: '7px',
  44  |     });
  45  |     const sm = page.getByTestId('sc-btn-sm').locator('button');
  46  |     expect(await styleOf(sm, ['padding-left', 'padding-top', 'font-size'])).toEqual({
  47  |       'padding-left': '8.75px',
  48  |       'padding-top': '5.25px',
  49  |       'font-size': '12px',
  50  |     });
  51  |     const lg = page.getByTestId('sc-btn-lg').locator('button');
  52  |     expect(await styleOf(lg, ['padding-left', 'padding-top', 'font-size'])).toEqual({
  53  |       'padding-left': '12.25px',
  54  |       'padding-top': '8.75px',
  55  |       'font-size': '16px',
  56  |     });
  57  |     const iconOnly = page.getByTestId('sc-btn-icononly').locator('button');
  58  |     expect((await styleOf(iconOnly, ['width']))['width']).toBe('35px');
  59  |   });
  60  | 
  61  |   test('el resolver mapea iconos legacy pi a Material', async ({ page }) => {
  62  |     await gotoPage(page, 'button');
  63  |     const icon = page.getByTestId('sc-btn-legacy-icon').locator('.sc-icon-font--delete');
  64  |     await expect(icon).toBeVisible();
  65  |     await screenshotBaseline(page, 'button');
  66  |   });
  67  | });
  68  | 
  69  | test.describe('sc-badge', () => {
  70  |   test('métrica del Kit (md/sm/xl)', async ({ page }) => {
  71  |     await gotoPage(page, 'badge');
  72  |     const md = page.getByTestId('sc-badge-md').locator('.p-badge');
  73  |     // border-radius no se aserta en md: PrimeNG aplica 50% estructural (circle)
  74  |     // al badge de un carácter; el slot del Kit (6) aplica al resto.
  75  |     expect(await styleOf(md, ['height', 'min-width', 'font-size'])).toEqual({
  76  |       height: '21px',
  77  |       'min-width': '21px',
  78  |       'font-size': '10.5px',
  79  |     });
  80  |     const sm = page.getByTestId('sc-badge-sm').locator('.p-badge');
  81  |     expect((await styleOf(sm, ['font-size']))['font-size']).toBe('8.75px');
  82  |     const xl = page.getByTestId('sc-badge-xl').locator('.p-badge');
  83  |     expect((await styleOf(xl, ['font-size']))['font-size']).toBe('14px');
  84  |     await screenshotBaseline(page, 'badge');
  85  |   });
  86  | });
  87  | 
  88  | test.describe('sc-card', () => {
  89  |   test('métrica del Kit (body 17.5, radio 12)', async ({ page }) => {
  90  |     await gotoPage(page, 'card');
  91  |     const card = page.getByTestId('sc-card').locator('.p-card');
  92  |     expect((await styleOf(card, ['border-radius']))['border-radius']).toBe('12px');
  93  |     const body = page.getByTestId('sc-card').locator('.p-card-body');
  94  |     expect(await styleOf(body, ['padding-left', 'gap'])).toEqual({
  95  |       'padding-left': '17.5px',
  96  |       gap: '7px',
  97  |     });
  98  |     await screenshotBaseline(page, 'card');
  99  |   });
  100 | });
  101 | 
  102 | test.describe('sc-chip', () => {
  103 |   test('métrica del Kit (10.5/7, radio 16, gap 7)', async ({ page }) => {
  104 |     await gotoPage(page, 'chip');
  105 |     const chip = page.getByTestId('sc-chip').locator('.p-chip');
  106 |     expect(await styleOf(chip, ['padding-left', 'padding-top', 'border-radius', 'gap'])).toEqual({
  107 |       'padding-left': '10.5px',
  108 |       'padding-top': '7px',
  109 |       'border-radius': '16px',
  110 |       gap: '7px',
  111 |     });
  112 |     await expect(page.getByTestId('sc-chip-removable').locator('.p-chip-remove-icon')).toBeVisible();
  113 |     await screenshotBaseline(page, 'chip');
  114 |   });
  115 | });
  116 | 
  117 | test.describe('sc-tag', () => {
  118 |   test('métrica del Kit (7/3.5, font 12/700, radio 6)', async ({ page }) => {
  119 |     await gotoPage(page, 'tag');
  120 |     const tag = page.getByTestId('sc-tag').locator('.p-tag');
  121 |     expect(
  122 |       await styleOf(tag, ['padding-left', 'padding-top', 'font-size', 'font-weight', 'border-radius']),
  123 |     ).toEqual({
  124 |       'padding-left': '7px',
  125 |       'padding-top': '3.5px',
  126 |       'font-size': '12px',
```
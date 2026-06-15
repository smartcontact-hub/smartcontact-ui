# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: components.spec.ts >> sc-button >> métrica del Kit en md/sm/lg e icon-only
- Location: e2e/components.spec.ts:35:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 1

  Object {
-   "border-radius": "6px",
+   "border-radius": "0px",
    "font-size": "14px",
    "gap": "7px",
    "padding-left": "10.5px",
    "padding-top": "7px",
  }
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
      - heading "sc-button" [level=1] [ref=e13]
      - heading "Variantes" [level=2] [ref=e14]
      - generic [ref=e15]:
        - button "Primario" [ref=e18] [cursor=pointer]:
          - generic [ref=e19]: Primario
        - button "Secundario" [ref=e22] [cursor=pointer]:
          - generic [ref=e23]: Secundario
        - button "Success" [ref=e26] [cursor=pointer]:
          - generic [ref=e27]: Success
        - button "Info" [ref=e30] [cursor=pointer]:
          - generic [ref=e31]: Info
        - button "Warn" [ref=e34] [cursor=pointer]:
          - generic [ref=e35]: Warn
        - button "Danger" [ref=e38] [cursor=pointer]:
          - generic [ref=e39]: Danger
        - button "Contrast" [ref=e42] [cursor=pointer]:
          - generic [ref=e43]: Contrast
      - heading "Apariencias" [level=2] [ref=e44]
      - generic [ref=e45]:
        - button "Filled" [ref=e48] [cursor=pointer]:
          - generic [ref=e49]: Filled
        - button "Outlined" [ref=e52] [cursor=pointer]:
          - generic [ref=e53]: Outlined
        - button "Text" [ref=e56] [cursor=pointer]:
          - generic [ref=e57]: Text
        - button "Link" [ref=e60] [cursor=pointer]:
          - generic [ref=e61]: Link
      - heading "Tamaños" [level=2] [ref=e62]
      - generic [ref=e63]:
        - button "Small" [ref=e66] [cursor=pointer]:
          - generic [ref=e67]: Small
        - button "Medium" [ref=e70] [cursor=pointer]:
          - generic [ref=e71]: Medium
        - button "Large" [ref=e74] [cursor=pointer]:
          - generic [ref=e75]: Large
      - heading "Iconos y estados" [level=2] [ref=e76]
      - generic [ref=e77]:
        - button "Con icono" [ref=e80] [cursor=pointer]:
          - generic [ref=e81]: check
          - generic [ref=e82]: Con icono
        - button "Confirmar" [ref=e85] [cursor=pointer]:
          - img "Confirmar" [ref=e86]: check
        - button "Legacy pi" [ref=e89] [cursor=pointer]:
          - generic [ref=e90]: delete
          - generic [ref=e91]: Legacy pi
        - button "Cargando" [disabled] [ref=e94]:
          - img [ref=e95]
          - generic [ref=e98]: Cargando
        - button "Deshabilitado" [disabled] [ref=e101]:
          - generic [ref=e102]: Deshabilitado
        - button "Full width" [ref=e105] [cursor=pointer]:
          - generic [ref=e106]: Full width
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
  26  |   await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, animations: 'disabled' });
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
> 38  |     expect(await styleOf(md, ['padding-left', 'padding-top', 'border-radius', 'font-size', 'gap'])).toEqual({
      |                                                                                                     ^ Error: expect(received).toEqual(expected) // deep equality
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
  127 |       'font-weight': '700',
  128 |       'border-radius': '6px',
  129 |     });
  130 |     await screenshotBaseline(page, 'tag');
  131 |   });
  132 | });
  133 | 
  134 | test.describe('sc-message', () => {
  135 |   test('métrica del Kit (10.5/7, radio 6, font 14)', async ({ page }) => {
  136 |     await gotoPage(page, 'message');
  137 |     // variant por defecto = simple → content.padding 0 (Kit:
  138 |     // message.simple.content.padding = 0); el 10.5/7 aplica a outlined.
```
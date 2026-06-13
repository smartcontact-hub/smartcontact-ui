# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> el modo oscuro flipa los tokens bajo .sc-dark
- Location: e2e/smoke.spec.ts:51:5

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Claro / oscuro' })
    - locator resolved to <button type="button" _ngcontent-ng-c1735879="" class="demo-header__dark-toggle"> Claro / oscuro </button>
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
    113 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <iframe src="about:blank" id="webpack-dev-server-client-overlay"></iframe> intercepts pointer events
      - retrying click action
        - waiting 500ms
    - waiting for element to be visible, enabled and stable

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
        - heading "Fundaciones" [level=1] [ref=e12]
        - paragraph [ref=e13]:
          - text: Tokens
          - code [ref=e14]: "--sc-*"
          - text: del paquete
          - code [ref=e15]: "@smartcontact/styles"
          - text: . Cada valor es trazable al export del Kit y se verifica en CI (
          - code [ref=e16]: tokens:gen
          - text: ·
          - code [ref=e17]: tokens:parity
          - text: ).
        - heading "Escala 14-base" [level=2] [ref=e18]
        - table [ref=e19]:
          - rowgroup [ref=e20]:
            - row "Token Diseño (px)" [ref=e21]:
              - columnheader "Token" [ref=e22]
              - columnheader "Diseño (px)" [ref=e23]
              - columnheader [ref=e24]
          - rowgroup [ref=e25]:
            - row "--sc-scale-0-25 3.5" [ref=e26]:
              - cell "--sc-scale-0-25" [ref=e27]:
                - code [ref=e28]: "--sc-scale-0-25"
              - cell "3.5" [ref=e29]
              - cell [ref=e30]
            - row "--sc-scale-0-5 7" [ref=e32]:
              - cell "--sc-scale-0-5" [ref=e33]:
                - code [ref=e34]: "--sc-scale-0-5"
              - cell "7" [ref=e35]
              - cell [ref=e36]
            - row "--sc-scale-0-75 10.5" [ref=e38]:
              - cell "--sc-scale-0-75" [ref=e39]:
                - code [ref=e40]: "--sc-scale-0-75"
              - cell "10.5" [ref=e41]
              - cell [ref=e42]
            - row "--sc-scale-1 14" [ref=e44]:
              - cell "--sc-scale-1" [ref=e45]:
                - code [ref=e46]: "--sc-scale-1"
              - cell "14" [ref=e47]
              - cell [ref=e48]
            - row "--sc-scale-1-5 21" [ref=e50]:
              - cell "--sc-scale-1-5" [ref=e51]:
                - code [ref=e52]: "--sc-scale-1-5"
              - cell "21" [ref=e53]
              - cell [ref=e54]
            - row "--sc-scale-2 28" [ref=e56]:
              - cell "--sc-scale-2" [ref=e57]:
                - code [ref=e58]: "--sc-scale-2"
              - cell "28" [ref=e59]
              - cell [ref=e60]
            - row "--sc-scale-3 42" [ref=e62]:
              - cell "--sc-scale-3" [ref=e63]:
                - code [ref=e64]: "--sc-scale-3"
              - cell "42" [ref=e65]
              - cell [ref=e66]
            - row "--sc-scale-4 56" [ref=e68]:
              - cell "--sc-scale-4" [ref=e69]:
                - code [ref=e70]: "--sc-scale-4"
              - cell "56" [ref=e71]
              - cell [ref=e72]
        - heading "Color primitivo" [level=2] [ref=e74]
        - generic [ref=e75]:
          - generic [ref=e76]: Blue (marca)
          - generic "--sc-color-blue-50" [ref=e77]
          - generic "--sc-color-blue-100" [ref=e78]
          - generic "--sc-color-blue-300" [ref=e79]
          - generic "--sc-color-blue-500" [ref=e80]
          - generic "--sc-color-blue-700" [ref=e81]
          - generic "--sc-color-blue-900" [ref=e82]
        - generic [ref=e83]:
          - generic [ref=e84]: Gray (neutros)
          - generic "--sc-color-gray-50" [ref=e85]
          - generic "--sc-color-gray-100" [ref=e86]
          - generic "--sc-color-gray-300" [ref=e87]
          - generic "--sc-color-gray-500" [ref=e88]
          - generic "--sc-color-gray-700" [ref=e89]
          - generic "--sc-color-gray-900" [ref=e90]
        - generic [ref=e91]:
          - generic [ref=e92]: Electric blue (info)
          - generic "--sc-color-electric-blue-50" [ref=e93]
          - generic "--sc-color-electric-blue-100" [ref=e94]
          - generic "--sc-color-electric-blue-300" [ref=e95]
          - generic "--sc-color-electric-blue-500" [ref=e96]
          - generic "--sc-color-electric-blue-700" [ref=e97]
          - generic "--sc-color-electric-blue-900" [ref=e98]
        - generic [ref=e99]:
          - generic [ref=e100]: Green (success)
          - generic "--sc-color-green-50" [ref=e101]
          - generic "--sc-color-green-100" [ref=e102]
          - generic "--sc-color-green-300" [ref=e103]
          - generic "--sc-color-green-500" [ref=e104]
          - generic "--sc-color-green-700" [ref=e105]
          - generic "--sc-color-green-900" [ref=e106]
        - generic [ref=e107]:
          - generic [ref=e108]: Amber (warning)
          - generic "--sc-color-amber-50" [ref=e109]
          - generic "--sc-color-amber-100" [ref=e110]
          - generic "--sc-color-amber-300" [ref=e111]
          - generic "--sc-color-amber-500" [ref=e112]
          - generic "--sc-color-amber-700" [ref=e113]
          - generic "--sc-color-amber-900" [ref=e114]
        - generic [ref=e115]:
          - generic [ref=e116]: Red (danger)
          - generic "--sc-color-red-50" [ref=e117]
          - generic "--sc-color-red-100" [ref=e118]
          - generic "--sc-color-red-300" [ref=e119]
          - generic "--sc-color-red-500" [ref=e120]
          - generic "--sc-color-red-700" [ref=e121]
          - generic "--sc-color-red-900" [ref=e122]
  - iframe [ref=e123]:
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
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Smoke de fundaciones: la demo levanta y el puente --p-* → --sc-* RENDERIZA
  5  |  * la métrica del Kit al pixel (computed styles, no sólo CSS estático).
  6  |  * Valores esperados = export del Kit (verificados también por tokens:parity).
  7  |  */
  8  | 
  9  | test('la demo levanta y renderiza las fundaciones', async ({ page }) => {
  10 |   await page.goto('/#/foundations');
  11 |   await expect(page.getByRole('heading', { name: 'Fundaciones' })).toBeVisible();
  12 |   // La escala resuelve: la barra de --sc-scale-1 mide 14px de ancho.
  13 |   const bar = page.locator('tr', { hasText: '--sc-scale-1' }).first().locator('.scale-bar');
  14 |   await expect(bar).toBeVisible();
  15 |   const width = await bar.evaluate((el) => getComputedStyle(el).width);
  16 |   expect(width).toBe('14px');
  17 | });
  18 | 
  19 | test('el preset pinta el botón con la métrica del Kit (10.5/7, radio 6)', async ({ page }) => {
  20 |   await page.goto('/#/theme');
  21 |   const btn = page.getByTestId('btn-md').locator('button');
  22 |   await expect(btn).toBeVisible();
  23 |   const styles = await btn.evaluate((el) => {
  24 |     const s = getComputedStyle(el);
  25 |     return {
  26 |       paddingLeft: s.paddingLeft,
  27 |       paddingTop: s.paddingTop,
  28 |       borderRadius: s.borderRadius,
  29 |       fontSize: s.fontSize,
  30 |     };
  31 |   });
  32 |   expect(styles.paddingLeft).toBe('10.5px');
  33 |   expect(styles.paddingTop).toBe('7px');
  34 |   expect(styles.borderRadius).toBe('6px');
  35 |   expect(styles.fontSize).toBe('14px');
  36 | });
  37 | 
  38 | test('el form field hereda padding y radio del Kit', async ({ page }) => {
  39 |   await page.goto('/#/theme');
  40 |   const input = page.getByTestId('input-md');
  41 |   await expect(input).toBeVisible();
  42 |   const styles = await input.evaluate((el) => {
  43 |     const s = getComputedStyle(el);
  44 |     return { paddingLeft: s.paddingLeft, paddingTop: s.paddingTop, borderRadius: s.borderRadius };
  45 |   });
  46 |   expect(styles.paddingLeft).toBe('10.5px');
  47 |   expect(styles.paddingTop).toBe('7px');
  48 |   expect(styles.borderRadius).toBe('6px');
  49 | });
  50 | 
  51 | test('el modo oscuro flipa los tokens bajo .sc-dark', async ({ page }) => {
  52 |   await page.goto('/#/foundations');
  53 |   const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
> 54 |   await page.getByRole('button', { name: 'Claro / oscuro' }).click();
     |                                                              ^ Error: locator.click: Test timeout of 60000ms exceeded.
  55 |   const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  56 |   expect(after).not.toBe(before);
  57 | });
  58 | 
```
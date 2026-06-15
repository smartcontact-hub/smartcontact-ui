# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: components.spec.ts >> sc-textarea >> métrica de form field (10.5/7, radio 6, font 14; sm 12)
- Location: e2e/components.spec.ts:178:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 1

  Object {
-   "border-radius": "6px",
+   "border-radius": "0px",
    "font-size": "14px",
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
      - heading "sc-textarea" [level=1] [ref=e13]
      - generic [ref=e14]:
        - textbox "Escribe aquí…" [ref=e16]
        - textbox "Auto-resize" [ref=e18]
        - textbox "Small" [ref=e20]
        - textbox "Large" [ref=e22]
        - textbox "Inválido" [ref=e24]
        - textbox "Deshabilitado" [disabled] [ref=e26]
        - textbox "Fluid" [ref=e28]
```

# Test source

```ts
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
  139 |     const content = page.getByTestId('sc-message').locator('.p-message-content');
  140 |     expect((await styleOf(content, ['padding-left']))['padding-left']).toBe('0px');
  141 |     const outlined = page.getByTestId('sc-message-outlined').locator('.p-message-content');
  142 |     expect(await styleOf(outlined, ['padding-left', 'padding-top'])).toEqual({
  143 |       'padding-left': '10.5px',
  144 |       'padding-top': '7px',
  145 |     });
  146 |     const msg = page.getByTestId('sc-message').locator('.p-message');
  147 |     expect((await styleOf(msg, ['border-radius']))['border-radius']).toBe('6px');
  148 |     const text = page.getByTestId('sc-message').locator('.p-message-text').first();
  149 |     expect(await styleOf(text, ['font-size', 'font-weight'])).toEqual({
  150 |       'font-size': '14px',
  151 |       'font-weight': '500',
  152 |     });
  153 |     await screenshotBaseline(page, 'message');
  154 |   });
  155 | });
  156 | 
  157 | test.describe('sc-panel', () => {
  158 |   test('métrica del Kit (header 15.75, radio 6)', async ({ page }) => {
  159 |     await gotoPage(page, 'panel');
  160 |     const panel = page.getByTestId('sc-panel').locator('.p-panel');
  161 |     expect((await styleOf(panel, ['border-radius']))['border-radius']).toBe('6px');
  162 |     const header = page.getByTestId('sc-panel').locator('.p-panel-header');
  163 |     expect((await styleOf(header, ['padding-left']))['padding-left']).toBe('15.75px');
  164 |     await screenshotBaseline(page, 'panel');
  165 |   });
  166 | });
  167 | 
  168 | test.describe('sc-skeleton', () => {
  169 |   test('radio del Kit (6) y animación', async ({ page }) => {
  170 |     await gotoPage(page, 'skeleton');
  171 |     const sk = page.getByTestId('sc-skeleton').locator('.p-skeleton');
  172 |     expect((await styleOf(sk, ['border-radius']))['border-radius']).toBe('6px');
  173 |     await screenshotBaseline(page, 'skeleton');
  174 |   });
  175 | });
  176 | 
  177 | test.describe('sc-textarea', () => {
  178 |   test('métrica de form field (10.5/7, radio 6, font 14; sm 12)', async ({ page }) => {
  179 |     await gotoPage(page, 'textarea');
  180 |     const ta = page.getByTestId('sc-textarea').locator('textarea');
> 181 |     expect(await styleOf(ta, ['padding-left', 'padding-top', 'border-radius', 'font-size'])).toEqual({
      |                                                                                              ^ Error: expect(received).toEqual(expected) // deep equality
  182 |       'padding-left': '10.5px',
  183 |       'padding-top': '7px',
  184 |       'border-radius': '6px',
  185 |       'font-size': '14px',
  186 |     });
  187 |     const sm = page.getByTestId('sc-textarea-sm').locator('textarea');
  188 |     expect((await styleOf(sm, ['font-size']))['font-size']).toBe('12px');
  189 |     await screenshotBaseline(page, 'textarea');
  190 |   });
  191 | });
  192 | 
  193 | test.describe('sc-drawer', () => {
  194 |   test('abre, renderiza cabecera del Kit (17.5, título 20/600) y cierra', async ({ page }) => {
  195 |     await gotoPage(page, 'drawer');
  196 |     await page.getByTestId('open-drawer').locator('button').click();
  197 |     const drawer = page.locator('.p-drawer');
  198 |     await expect(drawer).toBeVisible();
  199 |     const header = page.locator('.p-drawer-header');
  200 |     expect((await styleOf(header, ['padding-left']))['padding-left']).toBe('17.5px');
  201 |     const title = page.locator('.p-drawer-title');
  202 |     expect(await styleOf(title, ['font-size', 'font-weight'])).toEqual({
  203 |       'font-size': '20px',
  204 |       'font-weight': '600',
  205 |     });
  206 |     await page.keyboard.press('Escape');
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
```
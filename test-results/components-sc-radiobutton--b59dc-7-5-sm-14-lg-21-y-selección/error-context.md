# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: components.spec.ts >> sc-radiobutton >> métrica del Kit (caja 17.5; sm 14, lg 21) y selección
- Location: e2e/components.spec.ts:233:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('#opt-b')
    - locator resolved to <input pc4="" id="opt-b" name="demo" type="radio" value="false" autofocus="true" aria-checked="false" data-pc-section="input" class="p-radiobutton-input"/>
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
        - heading "sc-radiobutton" [level=1] [ref=e12]
        - generic [ref=e13]:
          - radio "Opción A" [checked] [ref=e16] [cursor=pointer]
          - generic [ref=e19]: Opción A
          - radio "Opción B" [ref=e22] [cursor=pointer]
          - generic [ref=e25]: Opción B
        - heading "Tamaños" [level=2] [ref=e26]
        - generic [ref=e27]:
          - radio [ref=e30] [cursor=pointer]
          - radio [ref=e35] [cursor=pointer]
          - radio [ref=e40] [cursor=pointer]
  - iframe [ref=e43]:
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
  181 |     expect(await styleOf(ta, ['padding-left', 'padding-top', 'border-radius', 'font-size'])).toEqual({
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
> 241 |     await page.locator('#opt-b').click();
      |                                  ^ Error: locator.click: Test timeout of 60000ms exceeded.
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
  338 |     await input.click();
  339 |     await expect(page.locator('.p-datepicker-panel')).toBeVisible();
  340 |     const panel = page.locator('.p-datepicker-panel');
  341 |     expect((await styleOf(panel, ['border-radius']))['border-radius']).toBe('6px');
```
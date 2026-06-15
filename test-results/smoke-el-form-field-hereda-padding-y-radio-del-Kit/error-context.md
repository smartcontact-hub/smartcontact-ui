# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> el form field hereda padding y radio del Kit
- Location: e2e/smoke.spec.ts:38:5

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
      - heading "Tema PrimeNG" [level=1] [ref=e13]
      - paragraph [ref=e14]:
        - text: Primitivos PrimeNG estilados por el preset (cada slot resuelve a
        - code [ref=e15]: var(--sc-*)
        - text: ).
      - generic [ref=e16]:
        - heading "Button" [level=2] [ref=e17]
        - generic [ref=e18]:
          - button "Primario" [ref=e20] [cursor=pointer]:
            - generic [ref=e21]: Primario
          - button "Small" [ref=e23] [cursor=pointer]:
            - generic [ref=e24]: Small
          - button "Large" [ref=e26] [cursor=pointer]:
            - generic [ref=e27]: Large
          - button "Secundario" [ref=e29] [cursor=pointer]:
            - generic [ref=e30]: Secundario
          - button "Peligro" [ref=e32] [cursor=pointer]:
            - generic [ref=e33]: Peligro
          - button "Info" [ref=e35] [cursor=pointer]:
            - generic [ref=e36]: Info
          - button "Texto" [ref=e38] [cursor=pointer]:
            - generic [ref=e39]: Texto
          - button "Outlined" [ref=e41] [cursor=pointer]:
            - generic [ref=e42]: Outlined
      - separator
      - generic [ref=e43]:
        - heading "Form field" [level=2] [ref=e44]
        - generic [ref=e45]:
          - textbox "Escribe algo…" [ref=e46]
          - generic [ref=e47]:
            - checkbox "Checkbox" [checked] [ref=e48] [cursor=pointer]
            - img [ref=e50]
          - generic [ref=e52]: Checkbox
      - separator
      - generic [ref=e53]:
        - heading "Feedback" [level=2] [ref=e54]
        - generic [ref=e55]:
          - generic [ref=e57]: Etiqueta
          - generic [ref=e59]: Success
          - generic [ref=e61]: Warn
          - alert [ref=e62]:
            - generic [ref=e65]: Mensaje informativo del tema.
          - generic [ref=e66]: Hover para tooltip
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
> 48 |   expect(styles.borderRadius).toBe('6px');
     |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  49 | });
  50 | 
  51 | test('el modo oscuro flipa los tokens bajo .sc-dark', async ({ page }) => {
  52 |   await page.goto('/#/foundations');
  53 |   const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  54 |   await page.getByRole('button', { name: 'Claro / oscuro' }).click();
  55 |   const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  56 |   expect(after).not.toBe(before);
  57 | });
  58 | 
```
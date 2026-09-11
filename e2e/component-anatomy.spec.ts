import { expect, test } from '@playwright/test';

/**
 * LA ANATOMÍA QUE ENSEÑA LA DOC ES LA QUE EL NAVEGADOR RENDERIZA.
 *
 * Por qué existe (2026-09-11). Rafa miró `/#/components/button` y preguntó si el código que
 * enseña sc-docs está basado de verdad en PrimeNG: la doc contaba solo la API pública
 * (`<sc-button label=… />`) mientras su equipo, depurando, tiene delante
 * `sc-button > p-button > button.p-button`. La ficha ahora lo enseña, y lo LEE del DOM ya
 * pintado (`storybook/story-anatomy.component.ts`) en vez de llevarlo escrito.
 *
 * Este spec es el control de que ese mecanismo funciona en el navegador de verdad, que es lo
 * único que un gate estático no puede ver: que el bloque aparece, que nombra el wrapper de
 * PrimeNG y que las clases `.p-*` que enseña son las que el elemento lleva puestas. Si algún día
 * el wrapper deja de envolver a PrimeNG, o `afterNextRender` deja de encontrar el nodo, esto se
 * pone rojo en vez de enseñar una caja vacía.
 */

/** Componentes con wrapper de PrimeNG dentro, y lo que su anatomía tiene que nombrar. */
const CASOS = [
  { ruta: 'button', tag: 'sc-button', dentro: 'p-button', clase: 'p-button' },
  { ruta: 'inputtext', tag: 'sc-inputtext', dentro: 'input', clase: 'p-inputtext' },
  { ruta: 'select', tag: 'sc-select', dentro: 'p-select', clase: 'p-select' },
] as const;

for (const { ruta, tag, dentro, clase } of CASOS) {
  test(`${tag} · la anatomía se lee del DOM y nombra su PrimeNG`, async ({ page }) => {
    await page.goto(`/#/components/${ruta}`);
    const bloque = page.getByTestId('sb-anatomy');
    await expect(bloque).toBeVisible();

    const texto = (await bloque.locator('pre').innerText()).trim();
    expect(texto, 'la anatomía no puede salir vacía: si sale, no encontró el nodo').not.toBe('');
    expect(texto.split('\n')[0], 'la primera línea es el propio componente').toContain(tag);
    expect(texto, `debería enseñar el ${dentro} de dentro`).toContain(dentro);
    expect(texto, `debería enseñar la clase ${clase}`).toContain(`.${clase}`);

    // Y lo que dice tiene que ser verdad: cada clase `.p-*` que nombra la lleva de verdad algún
    // elemento del componente. Sin esto, el bloque podría inventar y seguir pareciendo correcto.
    const clases = [...texto.matchAll(/\.(p-[a-z0-9-]+)/g)].map((m) => m[1]);
    expect(clases.length, 'la anatomía debería nombrar al menos una clase de PrimeNG').toBeGreaterThan(0);
    const reales = await page.locator(tag).first().evaluate((el: HTMLElement) => {
      const out = new Set<string>();
      for (const n of [el, ...el.querySelectorAll('*')]) {
        for (const c of (n as HTMLElement).classList) if (c.startsWith('p-')) out.add(c);
      }
      return [...out];
    });
    for (const c of clases) {
      expect(reales, `la anatomía nombra .${c} y ningún elemento la lleva`).toContain(c);
    }
  });
}

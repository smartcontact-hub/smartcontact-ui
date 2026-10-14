import { expect, test } from '@playwright/test';

/**
 * LA PÁGINA «PRIMENG» DE SC-DOCS: los componentes de PrimeNG por familias.
 *
 * El contenido sale de un artefacto que escribe `audit:primeng-catalog` (y que el mismo gate vigila); esto prueba que la
 * página lo pinta y que se usa como se usa: se busca un caso y se filtra por estado. Con el estímulo real (teclear,
 * pulsar), no llamando al código.
 */
test.describe('sc-docs · PrimeNG por familias', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/primeng');
    await page.locator('section.familia').first().waitFor();
  });

  test('pinta todas las familias, cada componente con su estado y su enlace a primeng.dev', async ({ page }) => {
    await expect(page.locator('section.familia')).toHaveCount(17);
    await expect(page.locator('.cuenta')).toContainText('109 de 109');
    const select = page.locator('section.familia tbody tr').filter({ hasText: 'Uno de una lista cerrada' });
    await expect(select.locator('a.tabla__nombre')).toHaveAttribute('href', 'https://primeng.dev/select');
    await expect(select.locator('sc-tag')).toHaveText('En el DS');
  });

  test('buscar un caso deja a los hermanos que lo resuelven', async ({ page }) => {
    await page.getByLabel('Buscar en el catálogo').fill('árbol');
    await expect(page.locator('section.familia tbody th .tabla__nombre')).toHaveText([
      /TreeSelect/,
      /^Tree\b/,
      /TreeTable/,
    ]);
  });

  test('el filtro de obsoletos deja solo lo que PrimeNG retira, cada uno con su marca', async ({ page }) => {
    await page.locator('sc-selectbutton').getByText('Obsoletos').click();
    await expect(page.locator('.cuenta')).toContainText('11 de 109');
    await expect(page.locator('section.familia tbody tr')).toHaveCount(11);
    await expect(page.locator('section.familia tbody tr').filter({ hasNotText: 'Obsoleto' })).toHaveCount(0);
  });
});

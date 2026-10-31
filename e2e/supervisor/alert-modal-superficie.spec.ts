import { expect, type Locator, type Page, test } from '@playwright/test';
import { goto } from './helpers';

/**
 * Confirmar lo que decide el usuario no tiñe el modal (DD-242): borrar y descartar cambios abren `sc-alert-modal` con la
 * superficie blanca (`surface: 'plain'`), con el fondo y el borde del modal neutro y solo el icono en el color de la
 * variante. El tinte queda para los errores del sistema (lo mide `components.spec.ts`, en sc-docs).
 */
test.use({ storageState: { cookies: [], origins: [] } });

/** El color que resuelve un token, pintado en una sonda: así se compara con lo que pinta el modal. */
const colorDe = (page: Page, token: string, prop: 'background-color' | 'color' | 'border-top-color') =>
  page.evaluate(
    ([t, p]) => {
      const sonda = document.createElement('div');
      if (p === 'background-color') sonda.style.background = `var(${t})`;
      else if (p === 'color') sonda.style.color = `var(${t})`;
      else sonda.style.border = `1px solid var(${t})`;
      document.body.appendChild(sonda);
      const v = getComputedStyle(sonda).getPropertyValue(p);
      sonda.remove();
      return v;
    },
    [token, prop] as const,
  );

const estilo = (locator: Locator, prop: string) =>
  locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

/** La superficie mide el fondo y el borde del modal neutro y no los teñidos de la variante; el icono, el de la variante. */
async function esperaBlanca(page: Page, aviso: Locator, kit: 'error' | 'warn'): Promise<void> {
  const superficie = aviso.locator('.sc-custom-modal');
  await expect(superficie).toBeVisible();
  const fondoNeutro = await colorDe(page, '--sc-dialog-bg', 'background-color');
  const fondoTenido = await colorDe(page, `--sc-cmp-message-${kit}-background`, 'background-color');
  // Sin esto la sonda no prueba nada: el tinte tiene que ser OTRO color que el neutro.
  expect(fondoTenido).not.toBe(fondoNeutro);
  expect(await estilo(superficie, 'background-color')).toBe(fondoNeutro);
  expect(await estilo(superficie, 'border-top-color')).toBe(
    await colorDe(page, '--sc-custom-modal-border-color', 'border-top-color'),
  );
  expect(await estilo(superficie.locator('.sc-custom-modal__icon'), 'color')).toBe(
    await colorDe(page, `--sc-cmp-message-${kit}-color`, 'color'),
  );
}

test('borrar una agenda pregunta con la superficie blanca: fondo neutro, icono rojo (DD-242)', async ({ page }) => {
  await goto(page, 'admin/agendas');
  await page.getByTestId('repo-table').locator('tbody tr', { hasText: 'Soporte Premium' }).first().getByLabel('Más acciones').click();
  await page.getByRole('menuitem', { name: 'Eliminar' }).click();
  const aviso = page.getByRole('alertdialog', { name: '¿Eliminar la agenda «Soporte Premium»?' });
  await esperaBlanca(page, aviso, 'error');
  await aviso.getByRole('button', { name: 'Cancelar' }).click();
  await expect(aviso).toHaveCount(0);
});

test('descartar cambios pregunta con la superficie blanca: fondo neutro, icono ámbar (DD-242)', async ({ page }) => {
  await goto(page, 'admin/agendas/crear');
  await page.locator('#agenda-name').fill('Agenda de prueba');
  await page.getByRole('link', { name: 'Agendas', exact: true }).first().click();
  const aviso = page.getByRole('alertdialog', { name: '¿Descartar cambios?' });
  await esperaBlanca(page, aviso, 'warn');
});

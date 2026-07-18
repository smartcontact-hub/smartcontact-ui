import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, openKebabAction, pickSelectOption } from './helpers';

/**
 * Journeys del flujo de reglas — la joya de la app y lo que más se toca.
 *
 * Cubre en particular lo arreglado en F1, para que no vuelva a romperse:
 *  - condición de "Categoría IA" con opciones reales (antes: lista vacía →
 *    condición incompleta → Guardar bloqueado sin salida),
 *  - operador "no es",
 *  - cross-link categoría → regla con preselección (`?categoria=`),
 *  - aviso cuando no queda ninguna regla activa.
 *
 * OJO: `RulesStore`/`CategoriesStore` viven EN MEMORIA (sin localStorage). Nada
 * de `page.reload()` a mitad de journey: se navega por la SPA.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('crear una regla con condición de Categoría IA y operador "no es"', async ({ page }) => {
  await goto(page, 'conversaciones/reglas/nueva?type=classification');

  const name = `E2E Clasificación ${Date.now()}`;
  await page.locator('sc-inputtext input').first().fill(name);

  // Campo → Categoría IA. El value-picker se auto-abre al elegir un campo lista.
  await pickSelectOption(page, page.locator('.cond-row__field').first(), 'Categoría IA');

  // El picker DEBE tener opciones (esto es exactamente lo que estaba roto).
  const options = page.locator('.vpick__panel .vpick__opt');
  await expect(options.first()).toBeVisible();
  const optionCount = await options.count();
  expect(optionCount).toBeGreaterThan(0);

  const firstLabel = (await options.first().locator('.vpick__opt-main').innerText()).trim();
  await options.first().click();

  // Operador "no es" (la UI antes solo mostraba un "es" estático).
  await pickSelectOption(page, page.locator('.cond-row__op').first(), /^no es$/);

  // El resumen en prosa resuelve el NOMBRE de la categoría, no su id.
  const scope = page.locator('.scope-desc');
  await expect(scope).toContainText('no es');
  await expect(scope).toContainText(firstLabel);

  await page.getByRole('button', { name: /crear regla|guardar cambios/i }).click();

  // Guardó y volvió al listado, con su prosa de alcance.
  await expect(page).toHaveURL(/conversaciones\/reglas$/);
  const row = page.locator('tbody tr', { hasText: name });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('no es');
});

test('el modal de categoría enlaza a crear regla en el mismo tab y con contexto', async ({
  page,
}) => {
  await goto(page, 'conversaciones/categorias');
  await page.locator('.rules-kebab-btn').first().click();
  await page.locator('.p-menu-overlay .p-menu-item-link', { hasText: /editar/i }).first().click();

  // Los enlaces a reglas del modal ya no abren pestañas sueltas.
  const ruleLinks = page.locator('.category-form__link-item-body, .category-form__link-create-btn');
  await expect(ruleLinks.first()).toBeVisible();
  const count = await ruleLinks.count();
  for (let i = 0; i < count; i += 1) {
    await expect(ruleLinks.nth(i)).toHaveAttribute('href', /conversaciones\/reglas/);
  }
});

test('cross-link: la categoría llega preseleccionada al constructor y queda vinculada', async ({
  page,
}) => {
  // Se entra por la MISMA URL que produce el CTA del modal (`?categoria=<id>`).
  // No se navega desde el modal porque llegar a su variante "aún no hay reglas"
  // exigiría borrar las 4 del seed y luego recargar — y los stores de memory
  // viven en RAM: la recarga los repone. El contrato que importa (el builder
  // honra el parámetro y la vinculación se deriva al guardar) sí se cubre aquí.
  // Primera categoría del seed (`categories-mock.ts`): id estable, nombre leído
  // de la propia tabla para que el test no fije el copy.
  const categoryId = 'cat_queja_facturacion';
  await goto(page, 'conversaciones/categorias');
  const categoryName = (await page.locator('tbody tr td').first().innerText()).split('·')[0].trim();

  await goto(page, `conversaciones/reglas/nueva?type=classification&categoria=${categoryId}`);

  // Preselección: análisis IA encendido y la categoría ya elegida.
  await expect(page.locator('.rule-builder__ai-categories')).toContainText(categoryName);

  const name = `E2E Cross-link ${Date.now()}`;
  await page.locator('sc-inputtext input').first().fill(name);
  await page.locator('[aria-label="Eliminar condición"]').first().click();
  await page.getByRole('button', { name: /crear regla/i }).click();
  await expect(page).toHaveURL(/conversaciones\/reglas$/);

  // Reabrir la regla (navegación SPA, sin recargar) y comprobar que guardó la
  // categoría: `Rule.categorias` es justo de donde el modal deriva el vínculo.
  await page.locator('.rules-table__name', { hasText: name }).click();
  await expect(page.locator('.rule-builder__ai-categories')).toContainText(categoryName);
});

test('sin reglas activas se avisa en el listado', async ({ page }) => {
  await goto(page, 'conversaciones/reglas');

  // Desactivar todas las activas por el kebab.
  const activeRows = page.locator('tbody tr', { has: page.locator('.rules-status--active') });
  for (let remaining = await activeRows.count(); remaining > 0; remaining -= 1) {
    const label = (await activeRows.first().locator('.rules-table__name').innerText()).trim();
    await openKebabAction(page, label, /desactivar/i);
    await expect(activeRows).toHaveCount(remaining - 1);
  }

  await expect(page.locator('.rules-no-active')).toBeVisible();
  await expect(page.locator('.rules-no-active')).toContainText(/ninguna regla/i);
});

test('el vacío ofrece elegir el tipo de regla', async ({ page }) => {
  await goto(page, 'conversaciones/reglas');

  const rows = page.locator('tbody tr');
  for (let remaining = await rows.count(); remaining > 0; remaining -= 1) {
    const label = (await rows.first().locator('.rules-table__name').innerText()).trim();
    await openKebabAction(page, label, /eliminar/i);
    await page.locator('.p-confirmdialog').getByRole('button', { name: /eliminar|confirmar/i }).click();
    await expect(rows).toHaveCount(remaining - 1);
  }

  await page.locator('.empty-state__cta').click();
  // El CTA abre el menú de tipos (antes saltaba directo a transcripción).
  const menu = page.locator('.rules-new-menu .p-menu-item-link');
  await expect(menu).toHaveCount(2);
  await expect(menu.first()).toContainText(/transcripción/i);
});

import { expect, test } from '@playwright/test';

const HOME = '/#/private/cuscare/tickets?lang=es';

// Fase 1: Match expresa una condición seleccionada, nunca un atributo de todo el catálogo.
test('Match requiere ambos orígenes y un tipo seleccionado', async ({ page }) => {
  await page.goto(HOME);
  const trigger = page.getByRole('button', { name: 'Filtrar por Tipo de solicitud', exact: true });
  const clear = page.getByRole('button', { name: 'Borrar el filtro de Tipo de solicitud', exact: true });
  await trigger.click();
  const panel = page.getByRole('dialog');
  const ai = panel.getByRole('button', { name: 'IA', exact: true });
  const agent = panel.getByRole('button', { name: 'Agente', exact: true });
  const baja = panel.getByRole('option', { name: 'Baja', exact: true });
  const refund = panel.getByRole('option', { name: 'Devolución', exact: true });
  await expect(ai).toHaveAttribute('aria-pressed', 'false');
  await expect(agent).toHaveAttribute('aria-pressed', 'false');
  await ai.click();
  await agent.click();
  await expect(panel.getByText('Match', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await expect(clear).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Eliminar filtros', exact: true })).toHaveCount(0);
  await baja.click();
  await expect(baja.getByText('Match', { exact: true })).toBeVisible();
  await expect(refund.getByText('Match', { exact: true })).toBeHidden();
  await expect(trigger).toHaveText('1 tipo');
  await refund.click();
  await expect(panel.getByText('Match', { exact: true }).filter({ visible: true })).toHaveCount(2);
  await baja.click();
  await expect(baja.getByText('Match', { exact: true })).toBeHidden();
  await expect(refund.getByText('Match', { exact: true })).toBeVisible();
  await agent.click();
  await expect(refund).toHaveAttribute('aria-selected', 'true');
  await expect(refund.getByText('Match', { exact: true })).toBeHidden();
  await agent.click();
  await expect(refund.getByText('Match', { exact: true })).toBeVisible();
  await clear.click();
  await expect(trigger).toHaveText('—');
  await expect(clear).toHaveCount(0);
});

test('seleccionar todos y retirar un tipo actualiza Match solo en las opciones elegidas', async ({ page }) => {
  await page.goto(HOME);
  await page.getByRole('button', { name: 'Filtrar por Tipo de solicitud', exact: true }).click();
  const panel = page.getByRole('dialog');
  const options = panel.getByRole('option');
  await expect(options.first()).toBeVisible();
  const total = await options.count();
  await panel.getByRole('button', { name: 'Agente', exact: true }).click();
  const all = panel.locator('.p-listbox-header').getByRole('checkbox');
  await all.check();
  await expect(panel.getByRole('option', { selected: true })).toHaveCount(total);
  await expect(panel.getByText('Match', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await panel.getByRole('button', { name: 'IA', exact: true }).click();
  await expect(panel.getByText('Match', { exact: true }).filter({ visible: true })).toHaveCount(total);
  await panel.getByRole('option', { name: 'Baja', exact: true }).click();
  await expect(panel.getByText('Match', { exact: true }).filter({ visible: true })).toHaveCount(total - 1);
  await all.check();
  await all.uncheck();
  await expect(panel.getByText('Match', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await expect(panel.getByRole('option', { selected: true })).toHaveCount(0);
});

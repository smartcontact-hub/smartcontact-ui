import { expect, Page, test } from '@playwright/test';

const HOME = '/#/private/cuscare/tickets?lang=es';

/*
 * Regla del filtro (decisión de producto y desarrollo del 2026-10-06):
 * IA (alguno de los tipos) Y Agente (alguno de los tipos). O dentro de cada origen, Y entre
 * orígenes; no hace falta que los dos pongan el MISMO tipo. Sin origen no se filtra.
 * Las filas de la semilla que se usan:
 *   2050493 → IA Devolución, Agente Baja (discrepan: solo sale con la regla nueva)
 *   2050559 → IA Baja y Devolución, Agente Baja (coinciden en Baja)
 *   2050547 → solo Agente Baja
 *   2050567 → solo Agente, Devolución e Información
 */

async function openFilter(page: Page) {
  await page.goto(HOME);
  const trigger = page.getByRole('button', { name: 'Filtrar por Tipo de solicitud', exact: true });
  await trigger.click();
  const panel = page.getByRole('dialog');
  return {
    trigger,
    panel,
    ai: panel.getByRole('button', { name: 'IA', exact: true }),
    agent: panel.getByRole('button', { name: 'Agente', exact: true }),
    baja: panel.getByRole('option', { name: 'Baja', exact: true }),
    refund: panel.getByRole('option', { name: 'Devolución', exact: true }),
  };
}

const row = (page: Page, id: string) => page.locator('tbody tr').filter({ has: page.getByRole('link', { name: id, exact: true }) });

test('sin un origen encendido la lista de tipos no filtra', async ({ page }) => {
  const { trigger, panel, ai, baja } = await openFilter(page);
  const list = panel.getByRole('listbox', { name: 'Tipo de solicitud', exact: true });
  const search = panel.getByRole('searchbox', { name: 'Buscar tipo' });
  await expect(ai).toHaveAttribute('aria-pressed', 'false');
  // Desactivada de verdad: no se clica (Playwright esperaría a que lo fuera) ni se escribe.
  await expect(list).toHaveAttribute('aria-disabled', 'true');
  await expect(search).toBeDisabled();
  await expect(baja.click({ timeout: 1_000 })).rejects.toThrow();
  await expect(baja).toHaveAttribute('aria-selected', 'false');
  await expect(trigger).toHaveText('—');
  await ai.click();
  await expect(list).not.toHaveAttribute('aria-disabled', 'true');
  await expect(search).toBeEnabled();
  await baja.click();
  await expect(trigger).toHaveText('1 tipo');
});

test('IA y Agente: cada origen con alguno de los tipos, no necesariamente el mismo', async ({ page }) => {
  const { trigger, panel, ai, agent, baja, refund } = await openFilter(page);
  await ai.click();
  await agent.click();
  await baja.click();
  await refund.click();
  await expect(trigger).toHaveText('2 tipos');
  // El Match de las opciones se retiró: ya no describe la regla.
  await expect(panel.getByText('Match', { exact: true })).toHaveCount(0);
  await page.getByRole('heading', { name: 'Tickets', exact: true }).click();
  await expect(panel).toBeHidden();
  await expect(row(page, '2050493')).toBeVisible();
  await expect(row(page, '2050559')).toBeVisible();
  await expect(row(page, '2050547')).toHaveCount(0);
  await expect(row(page, '2050567')).toHaveCount(0);
  // La marca de coincidencia de la tabla se queda (fase 2): la lleva quien coincide, no quien discrepa.
  await expect(row(page, '2050559').locator('.rt-match')).toHaveCount(1);
  await expect(row(page, '2050493').locator('.rt-match')).toHaveCount(0);
});

test('un solo origen: lo que puso ese origen, diga lo que diga el otro', async ({ page }) => {
  const { trigger, agent, baja, refund } = await openFilter(page);
  await agent.click();
  await baja.click();
  await refund.click();
  await page.getByRole('heading', { name: 'Tickets', exact: true }).click();
  await expect(trigger).toHaveText('2 tipos');
  await expect(row(page, '2050547')).toBeVisible();
  await expect(row(page, '2050567')).toBeVisible();
  await expect(row(page, '2050493')).toBeVisible();
});

test('apagar el último origen deja de filtrar sin perder los tipos; cerrar así vuelve al inicio', async ({ page }) => {
  const { trigger, panel, ai, agent, baja } = await openFilter(page);
  await ai.click();
  await baja.click();
  await expect(trigger).toHaveText('1 tipo');
  await expect(page.locator('.tickets__count')).toContainText('filtrado de 3280');
  await ai.click();
  await expect(trigger).toHaveText('—');
  await expect(baja).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.tickets__count')).toHaveText('1–10 de 3280 resultados');
  await agent.click();
  await expect(trigger).toHaveText('1 tipo');
  await agent.click();
  await page.getByRole('heading', { name: 'Tickets', exact: true }).click();
  await expect(panel).toBeHidden();
  await trigger.click();
  await expect(baja).toHaveAttribute('aria-selected', 'false');
  await expect(agent).toHaveAttribute('aria-pressed', 'false');
});

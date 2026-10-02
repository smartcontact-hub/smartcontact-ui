import { expect, test, type Page } from '@playwright/test';
import { disableAnimations, forceLightTheme, goto, irASeccion, pickSelectOption } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => { await forceLightTheme(page); await disableAnimations(page); });

async function seed(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('sc-groups')) return;
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify([{ id: 11, code: '20011', name: 'Habilitación por grupo', phone: '917945449', priority: 'Baja', channels: ['phone', 'chat', 'whatsapp'], strategy: 'Niveles', chatStrategy: 'Niveles' }]));
    localStorage.setItem('sc-group-agent-links-v', '1');
    localStorage.setItem('sc-group-agent-links', JSON.stringify([
      { agentId: 1, groupId: 11, channels: ['phone', 'chat'], active: false, levels: { phone: 1, chat: 10 } },
      { agentId: 3, groupId: 11, channels: ['phone', 'chat'], active: true, levels: { phone: 10, chat: 1 } },
      { agentId: 11, groupId: 11, channels: ['phone', 'chat'], active: true },
      { agentId: 1, groupId: 12, channels: ['phone'], active: true },
    ]));
  });
}

async function expectRuleMembers(page: Page, count: number) {
  await goto(page, 'conversaciones/reglas/nueva?type=classification');
  await irASeccion(page, 'Alcance');
  await pickSelectOption(page, page.locator('.cond-row__field').first(), 'Agente');
  await expect(page.locator('.vpick__opt', { hasText: 'Soporte Online' })).toContainText(`${count} agentes habilitados`);
}

for (const surface of ['ficha', 'panel'] as const) {
  test(`${surface}: habilitar cambia solo el enlace y conserva presencia, canales y niveles`, async ({ page }) => {
    await seed(page);
    await expectRuleMembers(page, 2);
    await goto(page, surface === 'ficha' ? 'admin/grupos/editar/11?seccion=agentes' : 'admin/grupos');
    if (surface === 'panel') await page.getByRole('button', { name: 'Asignar agentes de Habilitación por grupo' }).click();
    const table = page.locator('sc-agent-channel-table');
    const tom = table.locator('tbody tr', { hasText: 'Tom Hanks' });
    const denzel = table.locator('tbody tr', { hasText: 'Denzel Washington' });
    await expect(table.getByRole('columnheader', { name: 'Habilitado', exact: true })).toBeVisible();
    await expect(tom.locator('sc-tag')).toHaveText('Disponible');
    await expect(denzel.locator('sc-tag')).toHaveText('Comida');
    const enabled = tom.getByRole('switch', { name: 'Habilitado en este grupo: Tom Hanks' });
    await expect(enabled).not.toBeChecked();
    if (surface === 'ficha') {
      await expect(page.locator('sc-group-summary')).toContainText('Agentes habilitados');
      await expect(page.locator('sc-group-summary')).toContainText('1 deshabilitados');
    }
    await enabled.click();
    await expect(tom.locator('sc-tag')).toHaveText('Disponible');
    await page.getByRole('button', { name: surface === 'ficha' ? 'Guardar' : 'Guardar (1)', exact: true }).click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!).find((l: { agentId: number; groupId: number }) => l.agentId === 1 && l.groupId === 11)?.active)).toBe(true);
    const links = await page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!));
    expect(links.find((l: { agentId: number; groupId: number }) => l.agentId === 1 && l.groupId === 11)).toEqual({ agentId: 1, groupId: 11, channels: ['phone', 'chat'], active: true, levels: { phone: 1, chat: 10 } });
    expect(links.find((l: { groupId: number }) => l.groupId === 12).active).toBe(true);
    await goto(page, 'admin/agentes');
    await expect(page.locator('tbody tr', { hasText: 'Tom Hanks' }).first()).toContainText('Disponible');
    await goto(page, 'admin/agentes/editar/1');
    await expect(page.locator('sc-summary-kpi')).toContainText('Habilitado en grupos');
    await expectRuleMembers(page, 3);
  });
}

for (const theme of ['light', 'dark'] as const) for (const width of [1024, 1440]) {
  test(`${theme} ${width}: presencia y Habilitado caben con ambos niveles`, async ({ page }) => {
    await seed(page);
    await page.setViewportSize({ width, height: 900 });
    if (theme === 'dark') await page.addInitScript(() => localStorage.setItem('sc-theme', 'dark'));
    for (const surface of ['ficha', 'panel'] as const) {
      await goto(page, surface === 'ficha' ? 'admin/grupos/editar/11?seccion=agentes' : 'admin/grupos');
      if (surface === 'panel') await page.getByRole('button', { name: 'Asignar agentes de Habilitación por grupo' }).click();
      const table = page.locator('sc-agent-channel-table');
      await expect(table.getByRole('columnheader', { name: 'Habilitado', exact: true })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: 'Nivel · Teléfono', exact: true })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: 'Nivel · Chat', exact: true })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const metrics = await table.locator('tbody tr').first().evaluate(row => ({ name: row.querySelector('.assign__name-label')!.getBoundingClientRect().width, tag: row.querySelector('sc-tag')!.getBoundingClientRect().width, cell: row.querySelector('.assign__name')!.closest('td')!.getBoundingClientRect().width }));
      expect(metrics.name).toBeGreaterThan(50);
      const clipped = await table.locator('.assign__name-label').evaluateAll(names => names.filter(name => name.scrollWidth > name.clientWidth + 1).map(name => name.textContent));
      expect(clipped, 'la presencia no recorta estos nombres de la semilla').toEqual([]);
      expect(metrics.tag).toBeGreaterThan(50);
      expect(metrics.cell).toBeGreaterThanOrEqual(200);
      await page.screenshot({ path: `/tmp/e2-${theme}-${width}-${surface}.png`, fullPage: true });
      const control = table.getByRole('switch').first();
      await control.focus();
      await expect(control).toBeInViewport();
      await page.screenshot({ path: `/tmp/e2-${theme}-${width}-${surface}-habilitado.png`, fullPage: true });
      if (surface === 'panel') await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    }
  });
}

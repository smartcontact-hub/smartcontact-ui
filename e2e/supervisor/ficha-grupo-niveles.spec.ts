import { expect, test, type Page } from '@playwright/test';
import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => { await forceLightTheme(page); await disableAnimations(page); });

async function seed(page: Page, phone = true, chat = true) {
  await page.addInitScript(({ phone, chat }) => {
    if (localStorage.getItem('sc-groups')) return;
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify([{ id: 11, code: '20011', name: 'Niveles independientes', phone: '917945449', priority: 'Baja', channels: ['phone', 'chat', 'whatsapp'], strategy: phone ? 'Niveles' : 'Balanceada', chatStrategy: chat ? 'Niveles' : 'Balanceada', chatSubStrategy: 'Menos chats activos' }]));
    localStorage.setItem('sc-group-agent-links-v', '1');
    localStorage.setItem('sc-group-agent-links', JSON.stringify([
      { agentId: 1, groupId: 11, channels: ['phone', 'whatsapp'], active: true, level: 5, levels: { chat: 10 } },
      { agentId: 2, groupId: 11, channels: ['phone', 'chat'], active: false, level: 5, levels: { phone: 1, chat: 10 } },
      { agentId: 3, groupId: 12, channels: ['phone'], active: true, level: 10 },
    ]));
  }, { phone, chat });
}
const level = (page: Page, family: string) => page.getByRole('combobox', { name: `Nivel de Tom Hanks — ${family}`, exact: true });

for (const panel of [false, true]) {
  for (const families of [['Teléfono'], ['Chat'], ['Teléfono', 'Chat']]) {
    test(`${panel ? 'panel' : 'ficha'} guarda niveles independientes: ${families.join(' y ')}`, async ({ page }) => {
      await seed(page, families.includes('Teléfono'), families.includes('Chat'));
      await goto(page, panel ? 'admin/grupos' : 'admin/grupos/editar/11?seccion=agentes');
      if (panel) await page.getByRole('button', { name: 'Asignar agentes de Niveles independientes' }).click();
      const table = page.locator('sc-agent-channel-table');
      for (const family of ['Teléfono', 'Chat']) {
        await expect(table.getByRole('columnheader', { name: `Nivel ${family}`, exact: true })).toHaveCount(families.includes(family) ? 1 : 0);
      }
      for (const family of families) {
        await expect(level(page, family)).toHaveText(family === 'Teléfono' ? '5' : '10');
        await level(page, family).click();
        await expect(page.getByRole('option').first()).toBeVisible();
        await expect(page.getByRole('option')).toHaveText(Array.from({ length: 10 }, (_, i) => String(i + 1)));
        await page.keyboard.press('Escape');
        await pickSelectOption(page, level(page, family), family === 'Teléfono' ? '10' : '1');
        if (panel) await expect(page.getByRole('button', { name: 'Guardar (1)', exact: true })).toBeEnabled();
      }
      await page.getByRole('button', { name: panel ? 'Guardar (1)' : 'Guardar', exact: true }).click();
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!)[0]?.level)).toBeUndefined();
      const saved = await page.evaluate(() => ({ version: localStorage.getItem('sc-group-agent-links-v'), links: JSON.parse(localStorage.getItem('sc-group-agent-links')!) }));
      expect(saved.version).toBe('1');
      expect(saved.links.find((l: { agentId: number }) => l.agentId === 1)).toMatchObject({ channels: ['phone', 'chat'], levels: { phone: families.includes('Teléfono') ? 10 : 5, chat: families.includes('Chat') ? 1 : 10 } });
      expect(saved.links.find((l: { agentId: number }) => l.agentId === 2)).toMatchObject({ active: false, levels: { phone: 1, chat: 10 } });
      expect(saved.links.find((l: { agentId: number }) => l.agentId === 3)).toMatchObject({ groupId: 12, levels: { phone: 10 } });
    });
  }
}

test('Chat normaliza y guarda Dentro de cada nivel; Contact Center excluye Niveles', async ({ page }) => {
  await seed(page);
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const sub = page.locator('#group-chat-sub-strategy');
  await expect(sub).toHaveText('Menos conversaciones activas');
  await sub.click();
  await expect(page.getByRole('option').first()).toBeVisible();
  await expect(page.getByRole('option')).toHaveText(['Rotativa (por turnos)', 'Menos conversaciones activas', 'Balanceada']);
  // Elegir en el menú ya abierto evita reabrirlo mientras termina el cierre nativo.
  await page.getByRole('option', { name: 'Balanceada', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-groups')!)[0].chatSubStrategy)).toBe('Balanceada');
  await goto(page, 'config/aed/grupos');
  for (const id of ['#grupos-strategy', '#grupos-chat-strategy']) {
    await page.locator(id).click();
    await expect(page.getByRole('option').first()).toBeVisible();
    await expect(page.getByRole('option', { name: 'Niveles', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
  }
});

for (const theme of ['light', 'dark']) {
  for (const width of [1024, 1440]) {
    test(`columnas y ancho con ambos niveles: ${theme} ${width}`, async ({ page }) => {
      await seed(page);
      await page.addInitScript((theme) => localStorage.setItem('sc-theme', theme), theme);
      await page.setViewportSize({ width, height: 900 });
      await goto(page, 'admin/grupos/editar/11?seccion=agentes');
      const table = page.locator('sc-agent-channel-table');
      for (const panel of [false, true]) {
        if (panel) {
          await goto(page, 'admin/grupos');
          await page.getByRole('button', { name: 'Asignar agentes de Niveles independientes' }).click();
        }
        await page.evaluate(() => document.fonts.ready);
        for (const family of ['Teléfono', 'Chat']) await expect(level(page, family)).toBeVisible();
        const geometry = await table.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return { left: rect.left, right: rect.right, overflow: el.scrollWidth - el.clientWidth,
            cells: [...el.querySelectorAll('tbody tr')].map((row) => row.children.length),
            nameWidth: el.querySelector('.assign__name')!.closest('td')!.getBoundingClientRect().width,
            headers: el.querySelectorAll('thead th').length };
        });
        expect(geometry.nameWidth, 'el nombre no colapsa bajo las columnas de nivel').toBeGreaterThanOrEqual(180);
        expect(geometry.left).toBeGreaterThanOrEqual(0);
        expect(geometry.right).toBeLessThanOrEqual(width);
        expect(geometry.overflow).toBeLessThanOrEqual(1);
        expect(geometry.cells.every((n) => n === geometry.headers)).toBe(true);
        await page.screenshot({ path: `/tmp/e1b-visual-${theme}-${width}-${panel ? 'panel' : 'ficha'}.png` });
      }
    });
  }
}

test('la fila vacía abarca las columnas de ambas familias y selección', async ({ page }) => {
  await seed(page);
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  await page.locator('sc-agent-channel-table sc-search input').fill('Sin coincidencias');
  const table = page.locator('sc-agent-channel-table');
  await expect(table.locator('tbody td[colspan]')).toHaveAttribute('colspan', String(await table.locator('thead th').count()));
});

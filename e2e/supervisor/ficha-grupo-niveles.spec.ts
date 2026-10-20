import { expect, test, type Page } from '@playwright/test';
import { disableAnimations, forceLightTheme, goto } from './helpers';

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
/** El nivel es un desplegable del 1 al 10 en la columna de su canal (SISMAC-4058, 2026-10-20; antes, un número con − y +). */
const level = (page: Page, family: string) => page.getByRole('combobox', { name: `Nivel de Tom Hanks — ${family}`, exact: true });
const elegirNivel = async (page: Page, family: string, valor: string) => {
  await level(page, family).click();
  await page.locator('.p-select-overlay').getByRole('option', { name: valor, exact: true }).click();
  await expect(level(page, family)).toHaveText(valor);
};

// La tabla es la misma en la ficha y en el panel del Monitor; desde el 2026-10-20 el panel ya no se abre desde el listado
// de grupos (SISMAC-4056), y se mide en la ficha.
{
  for (const families of [['Teléfono'], ['Chat'], ['Teléfono', 'Chat']]) {
    test(`la ficha guarda niveles independientes: ${families.join(' y ')}`, async ({ page }) => {
      await seed(page, families.includes('Teléfono'), families.includes('Chat'));
      await goto(page, 'admin/grupos/editar/11?seccion=agentes');
      const table = page.locator('sc-agent-channel-table');
      for (const family of ['Teléfono', 'Chat']) {
        await expect(table.getByRole('columnheader', { name: `Nivel ${family}`, exact: true })).toHaveCount(families.includes(family) ? 1 : 0);
      }
      for (const family of families) {
        await expect(level(page, family)).toHaveText(family === 'Teléfono' ? '5' : '10');
        await elegirNivel(page, family, family === 'Teléfono' ? '10' : '1');
      }
      await page.getByRole('button', { name: 'Guardar', exact: true }).click();
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
  await expect(sub).toHaveText('Menos conversaciones atendidas');
  await sub.click();
  await expect(page.getByRole('option').first()).toBeVisible();
  await expect(page.getByRole('option')).toHaveText(['Menos conversaciones atendidas', 'Balanceada']);
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

test('Email reparte por Niveles como Teléfono: su «Dentro de cada nivel» y su columna en Agentes asignados', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('sc-groups')) return;
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify([{ id: 11, code: '20011', name: 'Niveles en Email', phone: '917945449', priority: 'Baja', channels: ['phone', 'email'], strategy: 'Balanceada', emailStrategy: 'Niveles' }]));
    localStorage.setItem('sc-group-agent-links-v', '1');
    localStorage.setItem('sc-group-agent-links', JSON.stringify([{ agentId: 1, groupId: 11, channels: ['phone', 'email'], active: true, levels: { phone: 5, email: 3 } }]));
  });
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await expect(page.locator('#group-email-sub-strategy')).toBeVisible();
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const table = page.locator('sc-agent-channel-table');
  await expect(table.getByRole('columnheader', { name: 'Nivel Email', exact: true })).toHaveCount(1);
  await expect(table.getByRole('columnheader', { name: 'Nivel Teléfono', exact: true })).toHaveCount(0);
  await expect(level(page, 'Email')).toHaveText('3');
  await elegirNivel(page, 'Email', '7');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!)[0].levels.email)).toBe(7);
});

for (const theme of ['light', 'dark']) {
  for (const width of [1024, 1440]) {
    test(`columnas y ancho con ambos niveles: ${theme} ${width}`, async ({ page }) => {
      await seed(page);
      await page.addInitScript((theme) => localStorage.setItem('sc-theme', theme), theme);
      await page.setViewportSize({ width, height: 900 });
      await goto(page, 'admin/grupos/editar/11?seccion=agentes');
      const table = page.locator('sc-agent-channel-table');
      for (const panel of [false] as const) {
        await page.evaluate(() => document.fonts.ready);
        for (const family of ['Teléfono', 'Chat']) await expect(level(page, family)).toBeVisible();
        const geometry = await table.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return { left: rect.left, right: rect.right, overflow: el.scrollWidth - el.clientWidth,
            cells: [...el.querySelectorAll('tbody tr')].map((row) => row.children.length),
            nameWidth: el.querySelector('.assign__name')!.closest('td, th')!.getBoundingClientRect().width,
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

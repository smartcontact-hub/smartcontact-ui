import { expect, test, type Page } from '@playwright/test';
import { disableAnimations, forceLightTheme, goto } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => { await forceLightTheme(page); await disableAnimations(page); });

async function seed(page: Page, restricted = false) {
  await page.addInitScript(({ restricted }) => {
    if (localStorage.getItem('sc-agents')) return;
    const permissions = { manageDevices: true, selfActivate: true, externalDevices: true, callsEnabled: true, transfersEnabled: true, callsDestFixed: true, callsDestMobile: true, callsDestInternational: true, callsDestSpecial: false, transfersDestFixed: true, transfersDestMobile: true, transfersDestInternational: true, transfersDestSpecial: false, recording: false };
    localStorage.setItem('sc-agents-v', '3');
    localStorage.setItem('sc-agents', JSON.stringify([
      { id: 1, code: '10001', name: 'Agente Chat', extension: '122', extensionType: 'webrtc', agentType: 'normal', status: 'active', presenceStatus: 'disponible', permissions, ...(restricted ? { allowedChannels: ['chat'] } : {}) },
      { id: 2, code: '10002', name: 'Agente Email', extension: '124', extensionType: 'webrtc', agentType: 'normal', status: 'active', presenceStatus: 'comida', permissions, allowedChannels: ['email'] },
    ]));
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify([
      { id: 11, code: '20011', name: 'Grupo mixto', phone: '917945449', priority: 'Baja', channels: ['phone', 'whatsapp'], strategy: 'Niveles', chatStrategy: 'Niveles' },
      { id: 12, code: '20012', name: 'Grupo telefónico', phone: '917945449', priority: 'Baja', channels: ['phone'], strategy: 'Balanceada' },
    ]));
    localStorage.setItem('sc-group-agent-links-v', '1');
    localStorage.setItem('sc-group-agent-links', JSON.stringify([
      { agentId: 1, groupId: 11, channels: ['phone', 'chat'], active: true, levels: { phone: 1, chat: 10 } },
      { agentId: 1, groupId: 12, channels: ['phone'], active: false },
    ]));
  }, { restricted });
}

for (const surface of ['ficha', 'panel'] as const) {
  test(`${surface}: solo Chat bloquea Teléfono, enlaza a permisos y no permite añadir a quien solo tiene Email`, async ({ page }) => {
    await seed(page, true);
    await goto(page, surface === 'ficha' ? 'admin/grupos/editar/11?seccion=agentes' : 'admin/grupos');
    if (surface === 'panel') await page.getByRole('button', { name: 'Asignar agentes de Grupo mixto' }).click();
    const table = page.locator('sc-agent-channel-table');
    const row = table.locator('tbody tr', { hasText: 'Agente Chat' });
    const blocked = row.getByRole('checkbox', { name: /Agente Chat.*Teléfono.*no permitido/i });
    await expect(blocked).toBeDisabled();
    await expect(blocked).not.toBeChecked();
    await expect(row.getByRole('link', { name: /permisos.*Agente Chat/i })).toHaveAttribute('href', '/admin/agentes/editar/1?seccion=permisos');
    await table.getByRole('combobox', { name: 'Añadir agente al grupo' }).click();
    await expect(page.getByRole('option', { name: /Agente Email.*sin canales compatibles/i })).toHaveAttribute('aria-disabled', 'true');
  });
}

test('quitar un permiso avisa de sus grupos y solo recorta los enlaces al guardar; cancelar conserva los datos', async ({ page }) => {
  await seed(page);
  await goto(page, 'admin/agentes/editar/1?seccion=permisos');
  const permissions = page.getByRole('region', { name: 'Canales permitidos', exact: true });
  for (const name of ['Teléfono', 'Chat', 'Email']) await expect(permissions.getByRole('checkbox', { name, exact: true })).toBeChecked();
  await permissions.getByRole('checkbox', { name: 'Teléfono', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Quitar canales permitidos' });
  await expect(dialog).toContainText('Grupo mixto');
  await expect(dialog).toContainText('Grupo telefónico');
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!)[0].channels)).toEqual(['phone', 'chat']);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await dialog.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-agents')!)[0].allowedChannels)).toEqual(['chat', 'email']);
  const links = await page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!));
  expect(links).toEqual([
    { agentId: 1, groupId: 11, channels: ['chat'], active: true, levels: { phone: 1, chat: 10 } },
    { agentId: 1, groupId: 12, channels: [], active: false },
  ]);
  await page.reload();
  await expect(permissions.getByRole('checkbox', { name: 'Teléfono', exact: true })).not.toBeChecked();
});

test('Contact Center guarda canales permitidos y el alta hereda Chat sin alterar los agentes existentes', async ({ page }) => {
  await seed(page);
  await goto(page, 'config/aed/agentes');
  const permissions = page.getByRole('region', { name: 'Canales permitidos', exact: true });
  for (const name of ['Teléfono', 'Chat', 'Email']) await expect(permissions.getByRole('checkbox', { name, exact: true })).toBeChecked();
  await permissions.getByRole('checkbox', { name: 'Teléfono', exact: true }).uncheck();
  await permissions.getByRole('checkbox', { name: 'Email', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-agent-defaults')!)[0].allowedChannels)).toEqual(['chat']);
  await goto(page, 'admin/agentes/crear');
  await page.getByRole('link', { name: 'Permisos', exact: true }).click();
  await expect(permissions.getByRole('checkbox', { name: 'Chat', exact: true })).toBeChecked();
  await expect(permissions.getByRole('checkbox', { name: 'Teléfono', exact: true })).not.toBeChecked();
  await expect(permissions.getByRole('checkbox', { name: 'Email', exact: true })).not.toBeChecked();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sc-agents')!)[0].allowedChannels)).toBeUndefined();
});

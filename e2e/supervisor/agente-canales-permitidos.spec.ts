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
    await table.getByRole('button', { name: 'Todos', exact: true }).click();
    const incompatible = table.locator('tbody tr', { hasText: 'Agente Email' });
    await expect(incompatible).toContainText('Sin canales compatibles');
    await expect(incompatible.getByRole('checkbox', { name: /^Asignado —/ })).toBeDisabled();
    await expect(incompatible.getByRole('checkbox', { name: /^Asignado —/ })).not.toBeChecked();
  });
}

test('quitar un permiso avisa de sus grupos y solo recorta los enlaces al guardar; cancelar conserva los datos', async ({ page }) => {
  await seed(page);
  await goto(page, 'admin/agentes/editar/1?seccion=permisos');
  const permissions = page.getByRole('region', { name: 'Canales permitidos', exact: true });
  for (const name of ['Teléfono', 'Chat', 'Email']) await expect(permissions.getByRole('checkbox', { name, exact: true })).toBeChecked();
  await permissions.getByRole('checkbox', { name: 'Teléfono', exact: true }).click();
  await expect(permissions.getByRole('checkbox', { name: 'Teléfono', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Quitar canales permitidos' });
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
  await permissions.getByRole('checkbox', { name: 'Teléfono', exact: true }).click();
  await expect(permissions.getByRole('checkbox', { name: 'Teléfono', exact: true })).not.toBeChecked();
  await permissions.getByRole('checkbox', { name: 'Email', exact: true }).click();
  await expect(permissions.getByRole('checkbox', { name: 'Email', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-agent-defaults') ?? '[]')[0]?.allowedChannels)).toEqual(['chat']);
  await goto(page, 'admin/agentes/crear');
  await page.getByRole('link', { name: 'Permisos', exact: true }).click();
  await expect(permissions.getByRole('checkbox', { name: 'Chat', exact: true })).toBeChecked();
  await expect(permissions.getByRole('checkbox', { name: 'Teléfono', exact: true })).not.toBeChecked();
  await expect(permissions.getByRole('checkbox', { name: 'Email', exact: true })).not.toBeChecked();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sc-agents')!)[0].allowedChannels)).toBeUndefined();
});


test('tabla, resúmenes y listado solo cuentan las familias permitidas, aunque el enlace guardado contenga otras', async ({ page }) => {
  await seed(page, true);
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const summary = page.getByRole('region', { name: 'Resumen', exact: true });
  await expect(summary.locator('.resumen__channel', { hasText: 'Teléfono' })).toContainText('Sin agentes');
  await expect(summary.locator('.resumen__channel', { hasText: 'Chat' }).locator('.resumen__digits')).toHaveText('1');
  await goto(page, 'admin/agentes/editar/1?seccion=grupos');
  const row = page.locator('sc-group-assignment-table tbody tr', { hasText: 'Grupo mixto' });
  await expect(row.getByRole('checkbox', { name: /Teléfono.*no permitido/i })).toBeDisabled();
  await expect(row.getByRole('checkbox', { name: /Teléfono.*no permitido/i })).not.toBeChecked();
  // Los datos sueltos van en filas `sc-fact-row` (DD-186): la fila de Canales, con su valor en su `dd`.
  await expect(summary.locator('.resumen__pair', { hasText: 'Canales' }).locator('dd')).toHaveText('Chat');
  await goto(page, 'admin/agentes');
  const listed = page.locator('tbody tr', { hasText: 'Agente Chat' });
  await expect(listed.getByRole('img', { name: 'Chat', exact: true })).toHaveCount(1);
  await expect(listed.getByRole('img', { name: 'Teléfono', exact: true })).toHaveCount(0);
});

test('sin canales permitidos se conserva vacío al guardar y recargar, sin recuperar los tres por defecto', async ({ page }) => {
  await seed(page);
  await goto(page, 'config/aed/agentes');
  const permissions = page.getByRole('region', { name: 'Canales permitidos', exact: true });
  for (const name of ['Teléfono', 'Chat', 'Email']) {
    await permissions.getByRole('checkbox', { name, exact: true }).click();
    await expect(permissions.getByRole('checkbox', { name, exact: true })).not.toBeChecked();
  }
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-agent-defaults') ?? '[]')[0]?.allowedChannels)).toEqual([]);
  await page.reload();
  for (const name of ['Teléfono', 'Chat', 'Email']) await expect(permissions.getByRole('checkbox', { name, exact: true })).not.toBeChecked();
});


test('la ficha del agente tampoco permite asignar un grupo sin ninguna familia compatible', async ({ page }) => {
  await seed(page);
  await goto(page, 'admin/agentes/editar/2?seccion=grupos');
  const table = page.locator('sc-group-assignment-table');
  await table.getByRole('combobox').click();
  const incompatible = page.getByRole('option', { name: /Grupo telefónico.*Sin canales compatibles/i });
  await expect(incompatible).toHaveAttribute('data-p-disabled', 'true');
  await incompatible.click({ force: true });
  await expect(table.locator('tbody tr', { hasText: 'Grupo telefónico' })).toHaveCount(0);
});

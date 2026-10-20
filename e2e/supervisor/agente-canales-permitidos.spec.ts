import { expect, test, type Page } from '@playwright/test';
import { columnasACadaAncho, disableAnimations, forceLightTheme, goto } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => { await forceLightTheme(page); await disableAnimations(page); });

async function seed(page: Page, restricted = false) {
  await page.addInitScript(({ restricted }) => {
    if (localStorage.getItem('sc-agents')) return;
    const permissions = { manageDevices: true, selfActivate: true, externalDevices: true, callsEnabled: true, transfersEnabled: true, callsDestFixed: true, callsDestMobile: true, callsDestInternational: true, callsDestSpecial: false, transfersDestFixed: true, transfersDestMobile: true, transfersDestInternational: true, transfersDestSpecial: false, recording: false };
    localStorage.setItem('sc-agents-v', '3');
    localStorage.setItem('sc-agents', JSON.stringify([
      { id: 1, code: '10001', name: 'Agente Chat', email: 'agente.chat@example.com', extension: '122', extensionType: 'webrtc', agentType: 'normal', status: 'active', presenceStatus: 'disponible', permissions, ...(restricted ? { allowedChannels: ['chat'] } : {}) },
      { id: 2, code: '10002', name: 'Agente Email', email: 'agente.email@example.com', extension: '124', extensionType: 'webrtc', agentType: 'normal', status: 'active', presenceStatus: 'comida', permissions, allowedChannels: ['email'] },
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

// La tabla es la misma en la ficha y en el panel del Monitor; desde el 2026-10-20 el panel ya no se abre desde el listado
// de grupos (SISMAC-4056), y se mide en la ficha.
{
  test('solo Chat bloquea Teléfono, enlaza a sus canales y no permite añadir a quien solo tiene Email', async ({ page }) => {
    await seed(page, true);
    await goto(page, 'admin/grupos/editar/11?seccion=agentes');
    const table = page.locator('sc-agent-channel-table');
    const row = table.locator('tbody tr', { hasText: 'Agente Chat' });
    const blocked = row.getByRole('checkbox', { name: /Agente Chat.*Teléfono.*no está entre los canales/i });
    await expect(blocked).toBeDisabled();
    await expect(blocked).not.toBeChecked();
    // Sus canales están en General desde DD-187 (antes, en Permisos).
    await expect(row.getByRole('link', { name: /canales de Agente Chat/i })).toHaveAttribute('href', '/admin/agentes/editar/1?seccion=general');
    await table.getByRole('button', { name: 'Todos', exact: true }).click();
    const incompatible = table.locator('tbody tr', { hasText: 'Agente Email' });
    await expect(incompatible).toContainText('Sin canales compatibles');
    await expect(incompatible.getByRole('checkbox', { name: /^Asignado —/ })).toBeDisabled();
    await expect(incompatible.getByRole('checkbox', { name: /^Asignado —/ })).not.toBeChecked();
  });
}

test('quitar un permiso avisa de sus grupos y solo recorta los enlaces al guardar; cancelar conserva los datos', async ({ page }) => {
  await seed(page);
  await goto(page, 'admin/agentes/editar/1?seccion=general');
  const permissions = page.getByRole('group', { name: 'Canales', exact: true });
  for (const name of ['Teléfono', 'Chat', 'Email']) await expect(permissions.getByRole('checkbox', { name, exact: true })).toBeChecked();
  await permissions.getByRole('checkbox', { name: 'Teléfono', exact: true }).click();
  await expect(permissions.getByRole('checkbox', { name: 'Teléfono', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  // Quitar canales hace lo mismo que en la ficha de grupo (DD-187 §3): el grupo que se queda sin ninguno sale al guardar.
  const dialog = page.getByRole('alertdialog', { name: 'Vas a quitar canales' });
  await expect(dialog).toContainText('Grupo telefónico');
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!)[0].channels)).toEqual(['phone', 'chat']);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await dialog.getByRole('button', { name: 'Sí, quitar', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-agents')!)[0].allowedChannels)).toEqual(['chat', 'email']);
  const links = await page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!));
  expect(links).toEqual([{ agentId: 1, groupId: 11, channels: ['chat'], active: true, levels: { phone: 1, chat: 10 } }]);
  await page.reload();
  await expect(permissions.getByRole('checkbox', { name: 'Teléfono', exact: true })).not.toBeChecked();
});

test('Contact Center guarda canales permitidos y el alta hereda Chat sin alterar los agentes existentes', async ({ page }) => {
  await seed(page);
  await goto(page, 'config/aed/agentes');
  const permissions = page.getByRole('region', { name: 'Canales', exact: true });
  for (const name of ['Teléfono', 'Chat', 'Email']) await expect(permissions.getByRole('checkbox', { name, exact: true })).toBeChecked();
  await permissions.getByRole('checkbox', { name: 'Teléfono', exact: true }).click();
  await expect(permissions.getByRole('checkbox', { name: 'Teléfono', exact: true })).not.toBeChecked();
  await permissions.getByRole('checkbox', { name: 'Email', exact: true }).click();
  await expect(permissions.getByRole('checkbox', { name: 'Email', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-agent-defaults') ?? '[]')[0]?.allowedChannels)).toEqual(['chat']);
  // En el alta, los canales están en General, la sección con la que abre (DD-187).
  await goto(page, 'admin/agentes/crear');
  const alta = page.getByRole('group', { name: 'Canales', exact: true });
  await expect(alta.getByRole('checkbox', { name: 'Chat', exact: true })).toBeChecked();
  await expect(alta.getByRole('checkbox', { name: 'Teléfono', exact: true })).not.toBeChecked();
  await expect(alta.getByRole('checkbox', { name: 'Email', exact: true })).not.toBeChecked();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sc-agents')!)[0].allowedChannels)).toBeUndefined();
});


test('tabla, resúmenes y listado solo cuentan las familias permitidas, aunque el enlace guardado contenga otras', async ({ page }) => {
  await seed(page, true);
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const summary = page.getByRole('region', { name: 'Resumen', exact: true });
  // Un canal sin nadie que lo atienda dice 0, sin aviso amarillo (DD-217).
  await expect(summary.locator('.resumen__channel', { hasText: 'Teléfono' }).locator('.resumen__digits')).toHaveText('0');
  await expect(summary.locator('.resumen__channel', { hasText: 'Chat' }).locator('.resumen__digits')).toHaveText('1');
  await goto(page, 'admin/agentes/editar/1?seccion=grupos');
  const row = page.locator('sc-group-assignment-table tbody tr', { hasText: 'Grupo mixto' });
  await expect(row.getByRole('checkbox', { name: /Teléfono.*no está entre los canales/i })).toBeDisabled();
  await expect(row.getByRole('checkbox', { name: /Teléfono.*no está entre los canales/i })).not.toBeChecked();
  // Los datos sueltos van en filas `sc-fact-row` (DD-186): «Canales», con el icono de cada uno en su `dd`, como la lista.
  const canales = summary.locator('.resumen__pair', { hasText: 'Canales' }).locator('dd');
  await expect(canales.getByRole('img', { name: 'Chat', exact: true })).toHaveCount(1);
  await expect(canales.getByRole('img', { name: 'Teléfono', exact: true })).toHaveCount(0);
  await goto(page, 'admin/agentes');
  const listed = page.locator('tbody tr', { hasText: 'Agente Chat' });
  await expect(listed.getByRole('img', { name: 'Chat', exact: true })).toHaveCount(1);
  await expect(listed.getByRole('img', { name: 'Teléfono', exact: true })).toHaveCount(0);
});

test('sin canales permitidos se conserva vacío al guardar y recargar, sin recuperar los tres por defecto', async ({ page }) => {
  await seed(page);
  await goto(page, 'config/aed/agentes');
  const permissions = page.getByRole('region', { name: 'Canales', exact: true });
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
  // La tabla de grupos es la del grupo, al revés (DD-187 §2): el grupo sin familia compatible sale, con su motivo y su
  // casilla de asignar apagada.
  const table = page.locator('sc-group-assignment-table');
  await table.getByRole('button', { name: 'Todos', exact: true }).click();
  const incompatible = table.locator('tbody tr', { hasText: 'Grupo telefónico' });
  await expect(incompatible).toContainText('Sin canales compatibles');
  await expect(incompatible.getByRole('checkbox', { name: /^Asignado —/ })).toBeDisabled();
});

test('en General, los canales caen en las tres columnas de los campos de encima, en cualquier ancho', async ({ page }) => {
  // Las dos rejillas de campos (`.grid--3`) pasan a una columna por debajo de 720; la de los canales seguía en tres.
  await goto(page, 'admin/agentes/editar/1');
  const sel = '#agent-section-general .grid--3, #agent-section-general .checkbox-grid--3';
  for (const { ancho, columnas } of await columnasACadaAncho(page, sel)) {
    expect(columnas, `${ancho}: dos rejillas de campos y la de los canales`).toHaveLength(3);
    expect(columnas[0], `${ancho}: las columnas de los campos`).toHaveLength(ancho > 720 ? 3 : 1);
    for (const otra of columnas.slice(1)) expect(otra, `${ancho}: en las columnas de los campos`).toEqual(columnas[0]);
  }
});

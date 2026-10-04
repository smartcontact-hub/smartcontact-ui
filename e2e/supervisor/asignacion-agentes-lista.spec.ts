import { expect, test, type Page } from '@playwright/test';
import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => { await forceLightTheme(page); await disableAnimations(page); });

async function seed(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('sc-agents')) return;
    const names = ['Ana Mixta', 'Bruno Teléfono', 'Carla Chat', 'Darío Email', 'Elena Mixta', 'Fabio Chat'];
    const allowed = [['phone', 'chat'], ['phone'], ['chat'], ['email'], ['phone', 'chat'], ['chat']];
    localStorage.setItem('sc-agents-v', '3');
    localStorage.setItem('sc-agents', JSON.stringify(names.map((name, index) => ({
      id: index + 1, name, email: `persona${index + 1}@equipo.test`, code: `1000${index + 1}`,
      extension: '122', extensionType: 'webrtc', agentType: 'normal', status: 'active',
      presenceStatus: 'disponible', allowedChannels: allowed[index],
    }))));
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify([{ id: 11, code: '20011', name: 'Grupo mixto', phone: '917945449', priority: 'Baja', channels: ['phone', 'whatsapp'], strategy: 'Niveles', chatStrategy: 'Niveles' }]));
    localStorage.setItem('sc-group-agent-links-v', '1');
    localStorage.setItem('sc-group-agent-links', JSON.stringify([
      { agentId: 1, groupId: 11, channels: ['phone', 'chat'], active: false, levels: { phone: 1, chat: 10 } },
      { agentId: 2, groupId: 11, channels: ['phone'], active: true },
      { agentId: 5, groupId: 11, channels: ['phone', 'chat'], active: true },
    ]));
  });
}

for (const surface of ['ficha', 'panel'] as const) {
  test(`${surface}: filtro de asignación, búsqueda por email y filas estables al asignar`, async ({ page }) => {
    await seed(page);
    await goto(page, surface === 'ficha' ? 'admin/grupos/editar/11?seccion=agentes' : 'admin/grupos');
    if (surface === 'panel') await page.getByRole('button', { name: 'Asignar agentes de Grupo mixto' }).click();
    const table = page.locator('sc-agent-channel-table');
    await expect(table.getByRole('button', { name: 'Asignados', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(table.locator('tbody tr')).toHaveCount(3);
    await table.getByRole('button', { name: 'Todos', exact: true }).click();
    await expect(table.locator('tbody tr')).toHaveCount(6);
    await expect(table.locator('sc-multiselect')).toHaveCount(0);
    const incompatible = table.locator('tbody tr', { hasText: 'Darío Email' });
    await expect(incompatible.getByRole('checkbox', { name: /^Asignado —/ })).toBeDisabled();
    await expect(incompatible).toContainText('Sin canales compatibles');
    await table.getByRole('button', { name: 'Sin asignar', exact: true }).click();
    const carla = table.locator('tbody tr', { hasText: 'Carla Chat' });
    await carla.getByRole('checkbox', { name: /^Asignado —/ }).click();
    await expect(carla.getByRole('checkbox', { name: /^Asignado —/ })).toBeChecked();
    await expect(table.locator('tbody tr')).toHaveCount(3);
    const search = table.getByRole('searchbox');
    await search.fill('persona3@equipo.test');
    await table.getByRole('button', { name: 'Asignados', exact: true }).click();
    await expect(search).toHaveValue('persona3@equipo.test');
    await expect(table.locator('tbody tr')).toHaveCount(1);
    await expect(carla).toBeVisible();
    await page.getByRole('button', { name: /^Guardar(?: \(\d+\))?$/ }).click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!).find((link: { agentId: number }) => link.agentId === 3)?.channels)).toEqual(['chat']);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!).find((link: { agentId: number }) => link.agentId === 1))).toMatchObject({ active: false, levels: { phone: 1, chat: 10 } });
  });
}

test('la cabecera confirma dos cambios, permite cancelar y solo modifica los agentes filtrados', async ({ page }) => {
  await seed(page);
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const table = page.locator('sc-agent-channel-table');
  await table.getByRole('button', { name: 'Todos', exact: true }).click();
  await table.getByRole('searchbox').fill('Chat');
  const all = table.getByRole('columnheader', { name: 'Asignado', exact: true }).getByRole('checkbox');
  await all.click();
  const dialog = page.getByRole('alertdialog', { name: 'Confirmar cambios colectivos' });
  await expect(dialog).toContainText('2');
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(table.locator('tbody').getByRole('checkbox', { name: /^Asignado —/ }).first()).not.toBeChecked();
  await all.click();
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  for (const checkbox of await table.locator('tbody').getByRole('checkbox', { name: /^Asignado —/ }).all()) await expect(checkbox).toBeChecked();
  await page.getByRole('button', { name: /^Guardar(?: \(\d+\))?$/ }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!).map((link: { agentId: number }) => link.agentId).sort())).toEqual([1, 2, 3, 5, 6]);
});

test('la cabecera de canal conserva el último canal y confirma solo los dos cambios posibles', async ({ page }) => {
  await seed(page);
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const table = page.locator('sc-agent-channel-table');
  await table.getByRole('columnheader', { name: 'Teléfono', exact: true }).getByRole('checkbox').click();
  const dialog = page.getByRole('alertdialog', { name: 'Confirmar cambios colectivos' });
  await expect(dialog).toContainText('2');
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(table.locator('tbody tr', { hasText: 'Bruno Teléfono' }).getByRole('checkbox', { name: /^Bruno Teléfono — Teléfono/ })).toBeChecked();
  await page.getByRole('button', { name: /^Guardar(?: \(\d+\))?$/ }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!).map((link: { channels: string[] }) => link.channels))).toEqual([['chat'], ['phone'], ['chat']]);
});

test('una acción sobre un solo agente no pregunta; desasignar mantiene la fila hasta cambiar el filtro', async ({ page }) => {
  await seed(page);
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const table = page.locator('sc-agent-channel-table');
  await table.getByRole('searchbox').fill('persona1@equipo.test');
  await table.getByRole('columnheader', { name: 'Asignado', exact: true }).getByRole('checkbox').click();
  await expect(table.getByRole('checkbox', { name: 'Asignado — Ana Mixta', exact: true })).not.toBeChecked();
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByRole('alertdialog', { name: 'Confirmar cambios colectivos' })).toHaveCount(0);
  await table.getByRole('searchbox').fill('persona1');
  await expect(table.locator('tbody')).toContainText('No hay agentes');
});

test('la cabecera incluye otras páginas y excluye agentes incompatibles; el panel confirma y guarda', async ({ page }) => {
  await seed(page);
  await page.addInitScript(() => {
    const agents = JSON.parse(localStorage.getItem('sc-agents')!);
    if (agents.length > 6) return;
    for (let id = 7; id <= 31; id++) agents.push({ ...agents[2], id, name: `Chat adicional ${id}`, email: `extra${id}@equipo.test` });
    localStorage.setItem('sc-agents', JSON.stringify(agents));
  });
  await goto(page, 'admin/grupos');
  await page.getByRole('button', { name: 'Asignar agentes de Grupo mixto' }).click();
  const table = page.locator('sc-agent-channel-table');
  await table.getByRole('button', { name: 'Sin asignar', exact: true }).click();
  await expect(table.locator('tbody tr')).toHaveCount(10);
  await table.getByRole('columnheader', { name: 'Asignado', exact: true }).getByRole('checkbox').click();
  const dialog = page.getByRole('alertdialog', { name: 'Confirmar cambios colectivos' });
  await expect(dialog).toContainText('27 agentes');
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar (27)', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!).length)).toBe(30);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!).some((link: { agentId: number }) => link.agentId === 4))).toBe(false);
});

test('el alta muestra Todos y pagina los 500 agentes disponibles sin asignarlos', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Grupo de prueba');
  // Sin teléfono saliente no se pasa de Distribución y colas (DD-158).
  await page.locator('sc-form-section-nav').getByText('Distribución y colas', { exact: true }).click();
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#group-phone') }), /./);
  await page.locator('sc-form-section-nav').getByText('Agentes', { exact: true }).click();
  const table = page.locator('sc-agent-channel-table');
  await expect(table.getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(table.locator('tbody tr')).toHaveCount(10);
  for (const checkbox of await table.locator('tbody').getByRole('checkbox', { name: /^Asignado —/ }).all()) await expect(checkbox).not.toBeChecked();
  await table.getByRole('searchbox').fill('persona inexistente');
  await expect(table.locator('tbody')).toContainText('No hay agentes');
});

test('quitar dos asignados desde cabecera confirma y conserva los ocultos; cancelar no cambia el borrador', async ({ page }) => {
  await seed(page);
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const table = page.locator('sc-agent-channel-table');
  await table.getByRole('searchbox').fill('Mixta');
  const header = table.getByRole('columnheader', { name: 'Asignado', exact: true }).getByRole('checkbox');
  await header.click();
  const dialog = page.getByRole('alertdialog', { name: 'Confirmar cambios colectivos' });
  await expect(dialog).toContainText('Quitar del grupo: 2 agentes');
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(header).toBeChecked();
  await header.click();
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(table.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!).map((link: { agentId: number }) => link.agentId))).toEqual([2]);
});

test('buscar desde otra página vuelve a mostrar el resultado y conserva el filtro', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const table = page.locator('sc-agent-channel-table');
  await table.getByRole('button', { name: 'Todos', exact: true }).click();
  await table.locator('.p-paginator-next').click();
  await expect(table.locator('tbody tr', { hasText: 'Tom Hanks' })).toHaveCount(0);
  await table.getByRole('searchbox').fill('Tom Hanks');
  await expect(table.locator('tbody tr', { hasText: 'Tom Hanks' })).toHaveCount(1);
  await expect(table.getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

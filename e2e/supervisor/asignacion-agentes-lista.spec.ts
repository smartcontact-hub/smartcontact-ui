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
    // Con sus permisos, como todo agente: la tabla del grupo lee de ellos la «Activación por grupo» (DD-187 §2). Sin
    // ella, Habilitado es el interruptor de siempre.
    localStorage.setItem('sc-agents', JSON.stringify(names.map((name, index) => ({
      id: index + 1, name, email: `persona${index + 1}@equipo.test`, code: `1000${index + 1}`,
      extension: '122', extensionType: 'webrtc', agentType: 'normal', status: 'active',
      presenceStatus: 'disponible', allowedChannels: allowed[index], permissions: { selfActivate: false },
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

/* Cada columna se marca o desmarca entera (DD-181, enmienda DD-176 §4): Asignado, cada canal y Habilitado llevan su
 * casilla de «todos». En el grupo mixto, Ana y Elena tienen Teléfono y Chat; Bruno, solo Teléfono (no puede Chat);
 * Ana está deshabilitada. */
test('cada columna lleva su casilla de todos: un canal nunca se lleva el último de una fila, y Habilitado cambia a todos (DD-181)', async ({ page }) => {
  await seed(page);
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const table = page.locator('sc-agent-channel-table');
  const cabecera = (nombre: string) => table.getByRole('columnheader', { name: nombre, exact: true }).getByRole('checkbox');
  for (const nombre of ['Asignado', 'Teléfono', 'Chat', 'Habilitado']) await expect(cabecera(nombre), nombre).toHaveCount(1);
  const dialog = page.getByRole('alertdialog', { name: 'Confirmar cambios colectivos' });

  // Chat: Ana y Elena lo tienen, y Bruno no puede. Desmarcarla les quita Chat a las dos.
  await expect(cabecera('Chat')).toBeChecked();
  await cabecera('Chat').click();
  await expect(dialog).toContainText('Quitar Chat: 2 agentes.');
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  for (const nombre of ['Ana Mixta', 'Elena Mixta']) await expect(table.getByRole('checkbox', { name: `${nombre} — Chat`, exact: true })).not.toBeChecked();

  // Teléfono: ahora es el último canal de las tres filas, y no se puede quitar desde la cabecera.
  await expect(cabecera('Teléfono')).toBeDisabled();

  // Habilitado: Ana estaba deshabilitada, así que marca la que falta (un cambio, sin preguntar) y luego quita las tres.
  await cabecera('Habilitado').click();
  await expect(dialog).toHaveCount(0);
  await expect(cabecera('Habilitado')).toBeChecked();
  await cabecera('Habilitado').click();
  await expect(dialog).toContainText('Deshabilitar: 3 agentes.');
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(cabecera('Habilitado')).not.toBeChecked();

  await page.getByRole('button', { name: /^Guardar(?: \(\d+\))?$/ }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!)
    .map((l: { agentId: number; channels: string[]; active: boolean }) => [l.agentId, l.channels.join('+'), l.active]))).toEqual([
    [1, 'phone', false], [2, 'phone', false], [5, 'phone', false],
  ]);
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

test('la cabecera actúa sobre todo el filtro y excluye agentes incompatibles; el panel confirma y guarda', async ({ page }) => {
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
  // Sin páginas (DD-176): los 28 sin asignar, todos en la tabla.
  await expect(table.locator('tbody tr')).toHaveCount(28);
  await expect(table.locator('.p-paginator')).toHaveCount(0);
  await table.getByRole('columnheader', { name: 'Asignado', exact: true }).getByRole('checkbox').click();
  const dialog = page.getByRole('alertdialog', { name: 'Confirmar cambios colectivos' });
  await expect(dialog).toContainText('27 agentes');
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar (27)', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!).length)).toBe(30);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links')!).some((link: { agentId: number }) => link.agentId === 4))).toBe(false);
});

test('el alta muestra Todos con los 500 agentes disponibles, sin páginas y sin asignarlos', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Grupo de prueba');
  // Sin teléfono saliente no se pasa de Distribución y colas (DD-158).
  await page.locator('sc-form-section-nav').getByText('Distribución y colas', { exact: true }).click();
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#group-phone') }), /./);
  await page.locator('sc-form-section-nav').getByText('Agentes', { exact: true }).click();
  const table = page.locator('sc-agent-channel-table');
  await expect(table.getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // Sin páginas (DD-176): con más de 100, la tabla pinta solo las filas que se ven (DD-95), y se ven filas.
  await expect(table.locator('.p-paginator')).toHaveCount(0);
  await expect.poll(() => table.locator('tbody tr').count()).toBeGreaterThan(10);
  expect(await table.locator('tbody tr').count(), 'pinta solo las que se ven, no las 500').toBeLessThan(100);
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

test('buscar después de bajar por la tabla muestra el resultado y conserva el filtro', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const table = page.locator('sc-agent-channel-table');
  await table.getByRole('button', { name: 'Todos', exact: true }).click();
  await expect.poll(() => table.locator('tbody tr').count()).toBeGreaterThan(10);
  // Abajo del todo de la tabla: Tom Hanks, el primero, ya no se pinta (la tabla pinta solo lo que se ve).
  await table.locator('.p-virtualscroller').evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(table.locator('tbody tr', { hasText: 'Tom Hanks' })).toHaveCount(0);
  await table.getByRole('searchbox').fill('Tom Hanks');
  await expect(table.locator('tbody tr', { hasText: 'Tom Hanks' })).toHaveCount(1);
  await expect(table.getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

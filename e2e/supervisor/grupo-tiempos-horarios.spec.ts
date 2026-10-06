import { expect, test, type Page } from '@playwright/test';
import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

test.beforeEach(async ({ page }) => { await forceLightTheme(page); await disableAnimations(page); });

for (const surface of ['ficha', 'defaults'] as const) {
  const prefix = surface === 'ficha' ? 'group' : 'grupos';
  const route = surface === 'ficha' ? 'admin/grupos/editar/11?seccion=distribucion' : 'config/aed/grupos';
  test(`${surface}: tiempos fijos con unidad y guardado en segundos; inactividad en minutos`, async ({ page }) => {
    await goto(page, route);
    const transfer = page.locator(`#${prefix}-phone-transfer`);
    await expect(transfer).toHaveAttribute('role', 'combobox');
    await transfer.click();
    await expect(page.getByRole('option')).toHaveText(['5 s', '10 s', '15 s', '20 s', '25 s', '30 s', '1 min', '1,5 min', '2 min', '3 min', '4 min', '5 min', '10 min', '15 min', '30 min']);
    await page.getByRole('option', { name: '1,5 min', exact: true }).click();
    const inactivity = surface === 'ficha' ? page.getByRole('switch', { name: 'Caducar sesión', exact: true }) : page.locator('#grupos-chat-inactivity-on');
    if (!await inactivity.isChecked()) await inactivity.click();
    if (surface === 'ficha') {
      // Los minutos se escriben, como en Voice.
      await page.locator('#group-chat-inactivity').fill('30');
      await page.locator('#group-chat-inactivity').press('Tab');
    } else {
      await page.locator(`#${prefix}-chat-inactivity`).click();
      await expect(page.getByRole('option')).toHaveText(['5 min', '10 min', '15 min', '30 min', '60 min']);
      await page.getByRole('option', { name: '30 min', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect.poll(() => stored(page, surface)).toMatchObject({ phoneQueue: { transferSec: 90 }, chat: { inactivityMinutes: 30 } });
  });

  test(`${surface}: cola Variable nace en 2, admite enteros hasta 10 y Fija no tiene tope`, async ({ page }) => {
    await goto(page, route);
    const type = page.locator(`#${prefix}-phone-queue-type`);
    await pickSelectOption(page, type, 'Variable');
    const size = page.locator(`#${prefix}-phone-queue-size`);
    await expect(size).toHaveValue('2');
    await expect(size).toHaveAttribute('max', '10');
    await size.fill('2.5'); await size.press('Tab');
    await expect(size).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeDisabled();
    await size.fill('11'); await size.press('Tab');
    await expect(size).toHaveValue('10');
    await pickSelectOption(page, type, 'Fija');
    await expect(size).not.toHaveAttribute('max', /./);
    await size.fill('125'); await size.press('Tab');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect.poll(() => stored(page, surface)).toMatchObject({ phoneQueue: { queueSizeType: 'fixed', queueSize: 125 } });
  });
}

async function stored(page: Page, surface: 'ficha' | 'defaults') {
  return page.evaluate(s => {
    const data = JSON.parse(localStorage.getItem(s === 'ficha' ? 'sc-groups' : 'sc-group-defaults') ?? '[]');
    return s === 'ficha' ? data.find((g: { id: number }) => g.id === 11) : data[0];
  }, surface);
}

test('los tiempos guardados fuera del catálogo permanecen al editar otro campo, sin borrar agendas ni enlaces', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('d3-seeded')) return;
    sessionStorage.setItem('d3-seeded', '1');
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify([{ id: 11, code: '20011', name: 'Tiempos anteriores', phone: '917945449', priority: 'Baja', channels: ['phone', 'chat', 'whatsapp'], strategy: 'Balanceada', schedules: [2], advanced: { transferSec: 11, maxQueueWaitSec: 99, serviceLevelSec: 33, wrapUpSec: 0 }, chat: { closeOnInactivity: true, inactivityMinutes: 17 } }]));
    localStorage.setItem('sc-group-agent-links-v', '1');
    localStorage.setItem('sc-group-agent-links', JSON.stringify([{ agentId: 1, groupId: 11, channels: ['phone', 'chat'], active: false, levels: { phone: 10, chat: 1 } }]));
  });
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await expect(page.locator('#group-phone-transfer')).toHaveText('11 s');
  await expect(page.locator('#group-phone-max-wait')).toHaveText('99 s');
  await expect(page.locator('#group-wrap-up')).toHaveText('0 s');
  await expect(page.locator('#group-chat-inactivity')).toHaveValue(/^17/);
  await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeDisabled();
  await pickSelectOption(page, page.locator('#group-phone-transfer'), '20 s');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => stored(page, 'ficha')).toMatchObject({ schedules: [2], phoneQueue: { transferSec: 20, maxQueueWaitSec: 99, serviceLevelSec: 33 }, chat: { inactivityMinutes: 17 }, advanced: { wrapUpSec: 0 } });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sc-group-agent-links') ?? '[]'))).toEqual([{ agentId: 1, groupId: 11, channels: ['phone', 'chat'], active: false, levels: { phone: 10, chat: 1 } }]);
  expect(await page.evaluate(() => [localStorage.getItem('sc-groups-v'), localStorage.getItem('sc-group-agent-links-v')])).toEqual(['4', '1']);
});

test('Web Chat y WhatsApp guardan horarios independientes y solo ofrecen los activos', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  // Sin número, WhatsApp no pinta su horario (revisión de grupos, 2026-10-06).
  await pickSelectOption(page, page.locator('#group-chat-whatsapp'), '+34 900 100 200');
  for (const channel of ['chat', 'whatsapp']) {
    const select = page.locator(`#group-${channel}-schedule`);
    await expect(select).toHaveText('Siempre');
    await select.click();
    await expect(page.getByRole('option', { name: 'Horario Verano', exact: true })).toHaveCount(0);
    await page.getByRole('option', { name: channel === 'chat' ? 'Turno Mañana' : 'Turno Tarde', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => stored(page, 'ficha')).toMatchObject({ chat: { attendanceScheduleIds: { chat: 2, whatsapp: 3 } } });
  await page.reload();
  await expect(page.locator('#group-chat-schedule')).toHaveText('Turno Mañana');
  await pickSelectOption(page, page.locator('#group-whatsapp-schedule'), 'Siempre');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => stored(page, 'ficha')).toMatchObject({ chat: { attendanceScheduleIds: { chat: 2, whatsapp: null } } });
});

test('música: elegir, cambiar y quitar mantiene un solo nombre y recupera la predeterminada', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const music = page.getByRole('group', { name: 'Música de espera/Transferencia', exact: true });
  await expect(music.getByText('Música por defecto', { exact: true })).toBeVisible();
  const input = page.locator('#group-hold-music-upload input[type="file"]');
  await input.setInputFiles({ name: 'espera.wav', mimeType: 'audio/wav', buffer: Buffer.from('RIFFdemo') });
  await expect(music.getByText('espera.wav', { exact: true })).toHaveCount(1);
  // La zona de subir sigue ahí con el archivo ya elegido: el nombre se ve una vez, en el campo.
  await expect(music.getByRole('button', { name: 'Elegir .wav' })).toBeVisible();
  await input.setInputFiles({ name: 'otra.wav', mimeType: 'audio/wav', buffer: Buffer.from('RIFFdemo') });
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => stored(page, 'ficha')).toMatchObject({ announcements: { holdMusicFile: 'otra.wav' } });
  await music.getByRole('button', { name: 'Quitar', exact: true }).click();
  await expect(music.getByText('Música por defecto', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => stored(page, 'ficha')).toMatchObject({ announcements: { holdMusicFile: null } });
});


test('una cola Variable antigua fuera de rango se conserva al abrir y exige corregirla antes de guardar', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('d3-invalid')) return;
    sessionStorage.setItem('d3-invalid', '1');
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify([{ id: 11, code: '20011', name: 'Cola anterior', phone: '917945449', priority: 'Baja', channels: ['phone'], strategy: 'Balanceada', phoneQueue: { queueSizeType: 'per_agent', queueSize: 25, transferSec: 10, maxQueueWaitSec: 30, serviceLevelSec: 20 } }]));
  });
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const size = page.locator('#group-phone-queue-size');
  await expect(size).toHaveValue('25');
  await expect(size).toHaveAttribute('aria-invalid', 'true');
  await pickSelectOption(page, page.locator('#group-phone-transfer'), '20 s');
  await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeDisabled();
  expect(await stored(page, 'ficha')).toMatchObject({ phoneQueue: { queueSize: 25, transferSec: 10 } });
  await size.fill('10'); await size.press('Tab');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => stored(page, 'ficha')).toMatchObject({ phoneQueue: { queueSize: 10, transferSec: 20 } });
});

import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

/**
 * LA REVISIÓN DE GRUPOS DEL EQUIPO (2026-10-06): lo que fija.
 *   1. Skills no está entre las estrategias de teléfono, ni Rotativa entre las de chat.
 *   2. Ring All lleva SIEMPRE su aviso de costes y su campo se llama «Nº agentes simultáneos».
 *   3. Sin número de WhatsApp no hay mensajes ni horario de WhatsApp; con él, sí.
 *   4. Los mensajes de horario de un subcanal solo aparecen con un horario elegido.
 *   5. Los tiempos admiten más de dos minutos.
 */

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('las estrategias no traen Skills ni Rotativa', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await page.locator('#group-strategy').click();
  await expect(page.getByRole('option')).toHaveText([
    'Balanceada',
    'Menos conversaciones atendidas',
    'Más tiempo inactivo',
    'Niveles',
    'Ring All',
    'Agente exclusivo',
  ]);
  await page.keyboard.press('Escape');
  await page.locator('#group-chat-strategy').click();
  await expect(page.getByRole('option')).toHaveText(['Menos conversaciones atendidas', 'Balanceada', 'Niveles']);
});

test('Ring All: «Nº agentes simultáneos» y el aviso de costes a partir de 3, que se cierra', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const telefono = page.locator('#group-channel-phone');
  await expect(telefono.getByText('Esta estrategia puede generar costes adicionales')).toHaveCount(0);
  await pickSelectOption(page, page.locator('#group-strategy'), 'Ring All');
  await expect(telefono.locator('label[for="group-ring-all"]')).toHaveText('Nº agentes simultáneos');
  // Con 2 no hay aviso; con 3 o más aparece junto al campo que lo causa, y el usuario lo cierra.
  const aviso = telefono.getByText('Esta estrategia puede generar costes adicionales al multiplicar el número de llamadas salientes.');
  await expect(aviso).toHaveCount(0);
  await pickSelectOption(page, page.locator('#group-ring-all'), /^\s*3\s*$/);
  await expect(aviso).toBeVisible();
  await expect(telefono.locator('.field', { has: page.locator('#group-ring-all') }).getByText('Esta estrategia puede')).toBeVisible();
  await telefono.getByRole('button', { name: /cerrar|close/i }).click();
  await expect(aviso).toHaveCount(0);
});

test('WhatsApp: sin número no hay mensajes ni horario; Web Chat: los mensajes de horario piden un horario', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const chat = page.locator('#group-channel-chat');
  await expect(chat.getByText('Mensajes de WhatsApp')).toHaveCount(0);
  await expect(chat.getByText('Horario de WhatsApp')).toHaveCount(0);
  await pickSelectOption(page, page.locator('#group-chat-whatsapp'), '+34 900 100 200');
  await expect(chat.getByText('Mensajes de WhatsApp')).toBeVisible();
  await expect(chat.getByText('Horario de WhatsApp')).toBeVisible();

  await expect(chat.getByText('Mensaje de horario', { exact: true })).toHaveCount(0);
  await pickSelectOption(page, page.locator('#group-chat-schedule'), 'Turno Mañana');
  await expect(chat.getByText('Mensaje de horario', { exact: true })).toBeVisible();
  await expect(chat.getByText('Mensaje de día no valorable', { exact: true })).toBeVisible();
  await expect(chat.getByText('Mensaje durante la espera')).toHaveCount(0);
});

test('los tiempos llegan a 5 minutos y más', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await pickSelectOption(page, page.locator('#group-phone-max-wait'), /^\s*5 min\s*$/);
  await expect(page.locator('#group-phone-max-wait')).toHaveText('5 min');
});

test('subir audios: botón «Subir archivo», varios periódicos y rechazo de otros tipos', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const telefono = page.locator('#group-channel-phone');
  await expect(telefono.locator('#group-hold-music-upload').getByRole('button', { name: 'Subir archivo' })).toBeVisible();

  await telefono.getByRole('button', { name: /Mensajes en cola/ }).click();
  const periodicos = page.locator('#group-periodic-upload input[type="file"]');
  await periodicos.setInputFiles([
    { name: 'uno.wav', mimeType: 'audio/wav', buffer: Buffer.from('RIFFdemo') },
    { name: 'dos.wav', mimeType: 'audio/wav', buffer: Buffer.from('RIFFdemo') },
  ]);
  const lista = telefono.getByRole('group', { name: 'Mensajes periódicos' });
  await expect(lista.getByText('uno.wav', { exact: true })).toHaveCount(1);
  await expect(lista.getByText('dos.wav', { exact: true })).toHaveCount(1);

  await page.locator('#group-hold-music-upload input[type="file"]').setInputFiles({ name: 'voz.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('ID3') });
  await expect(telefono.getByText('tipo de archivo no válido', { exact: false })).toBeVisible();
  await expect(telefono.getByText('voz.mp3', { exact: false })).toHaveCount(1);
});

test('el estado se filtra desde la cabecera del agente y no hay columna «Estado»', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const tabla = page.locator('sc-agent-channel-table');
  await expect(tabla.getByRole('columnheader', { name: 'Estado' })).toHaveCount(0);
  const antes = await tabla.locator('tbody tr').count();
  await tabla.getByRole('button', { name: 'Filtrar por estado' }).click();
  await page.getByRole('checkbox', { name: 'Comida' }).click();
  await expect(tabla.locator('tbody tr'), 'con un estado marcado, solo los agentes en él').not.toHaveCount(antes);
  for (const estado of await tabla.locator('tbody tr sc-presence-avatar .visually-hidden').allTextContents()) {
    expect(estado.trim()).toBe('Comida');
  }
  await expect(tabla.getByText('1 estado', { exact: true })).toBeVisible();
});

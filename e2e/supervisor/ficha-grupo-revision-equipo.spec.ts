import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

/**
 * LA REVISIÓN DE GRUPOS DEL EQUIPO (2026-10-06): lo que fija.
 *   1. Skills no está entre las estrategias de teléfono, ni Rotativa entre las de chat.
 *   2. Ring All: su campo se llama «Nº agentes simultáneos», y tres o más a la vez los activa el administrador
 *      (revisión del 2026-10-15): elegirlos deja el campo en 2 y lo dice junto a él.
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

test('Ring All: «Nº agentes simultáneos»; 3 o más vuelve a 2 con «Opción no disponible», que se cierra', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const telefono = page.locator('#group-channel-phone');
  await pickSelectOption(page, page.locator('#group-strategy'), 'Ring All');
  await expect(telefono.locator('label[for="group-ring-all"]')).toHaveText('Nº agentes simultáneos');
  const campo = page.locator('#group-ring-all');
  const aviso = telefono.getByText('Opción no disponible. Para su activación consulte con su administrador.');
  // Con 2 no hay aviso; con 3 el campo vuelve a 2 y el aviso sale junto a él, y el usuario lo cierra.
  await expect(aviso).toHaveCount(0);
  await pickSelectOption(page, campo, /^\s*3\s*$/);
  await expect(campo).toHaveText(/^\s*2\s*$/);
  await expect(telefono.locator('.field', { has: campo }).getByText('Opción no disponible')).toBeVisible();
  await telefono.getByRole('button', { name: /cerrar|close/i }).click();
  await expect(aviso).toHaveCount(0);
  // El 2 se elige sin aviso.
  await pickSelectOption(page, campo, /^\s*2\s*$/);
  await expect(aviso).toHaveCount(0);
});

test('WhatsApp: sin número no hay mensajes ni horario; Web Chat: los mensajes de horario piden un horario', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const chat = page.locator('#group-channel-chat');
  const mensajesWhatsApp = chat.locator('[id^="group-chat-msg-whatsapp-"]');
  const horarioWhatsApp = chat.locator('#group-whatsapp-schedule');
  await expect(mensajesWhatsApp).toHaveCount(0);
  await expect(horarioWhatsApp).toHaveCount(0);
  await pickSelectOption(page, page.locator('#group-chat-whatsapp'), '+34 900 100 200');
  await expect(mensajesWhatsApp.first()).toBeVisible();
  await expect(horarioWhatsApp).toBeVisible();

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

test('subir audios: solo «Elegir», sin «Subir» ni «Cancelar», varios periódicos, .wav y .mp3, y rechazo de otros tipos', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const telefono = page.locator('#group-channel-phone');
  // `auto`, el modo nativo sin los dos botones: la ficha ya tiene «Guardar» (revisión del 2026-10-15).
  const botones = telefono.locator('#group-hold-music-upload').getByRole('button');
  await expect(botones).toHaveCount(1);
  await expect(botones).toHaveAccessibleName('Elegir');

  await telefono.getByRole('button', { name: /Mensajes en cola/ }).click();
  const periodicos = page.locator('#group-periodic-upload input[type="file"]');
  await periodicos.setInputFiles([
    { name: 'uno.wav', mimeType: 'audio/wav', buffer: Buffer.from('RIFFdemo') },
    { name: 'dos.wav', mimeType: 'audio/wav', buffer: Buffer.from('RIFFdemo') },
  ]);
  const lista = telefono.getByRole('group', { name: 'Mensajes periódicos' });
  await expect(lista.getByText('uno.wav', { exact: true })).toHaveCount(1);
  await expect(lista.getByText('dos.wav', { exact: true })).toHaveCount(1);

  // .wav y .mp3 entran (desarrollo, 2026-10-15); otro tipo se rechaza y lo dice.
  const musica = page.locator('#group-hold-music-upload');
  await musica.locator('input[type="file"]').setInputFiles({ name: 'voz.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('ID3') });
  await expect(musica.locator('.p-fileupload-file')).toContainText('voz.mp3');
  await musica.locator('input[type="file"]').setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('hola') });
  await expect(telefono.getByText('tipo de archivo no válido', { exact: false })).toBeVisible();
  await expect(telefono.getByText('Admite archivos .wav y .mp3.').first()).toBeVisible();
});

test('el estado se filtra desde la cabecera del agente, con los no disponibles juntos, y no hay columna «Estado»', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const tabla = page.locator('sc-agent-channel-table');
  await expect(tabla.getByRole('columnheader', { name: 'Estado' })).toHaveCount(0);
  const antes = await tabla.locator('tbody tr').count();
  await tabla.getByRole('button', { name: 'Filtrar por estado o equipo', exact: true }).click();
  // Desde DD-187 §4 el menú lleva dos grupos de casillas, Estado y Equipos. En Estado, cinco opciones, no ocho: Baño,
  // Comida y Formación van dentro de «No disponible» (DD-185).
  const filtros = page.locator('.assign__filters');
  await expect(filtros.getByRole('group', { name: 'Equipos', exact: true })).toBeVisible();
  const menu = filtros.getByRole('group', { name: 'Estado', exact: true });
  await expect(menu.getByRole('checkbox')).toHaveCount(5);
  await expect(menu.getByRole('checkbox', { name: 'Comida' })).toHaveCount(0);
  await menu.getByRole('checkbox', { name: 'No disponible' }).click();
  await expect(tabla.locator('tbody tr'), 'con un estado marcado, solo los agentes en él').not.toHaveCount(antes);
  const estados = await tabla.locator('tbody tr sc-presence-avatar .visually-hidden').allTextContents();
  expect(estados.length, 'quedan agentes').toBeGreaterThan(0);
  for (const estado of estados) expect(['No disponible', 'Baño', 'Comida', 'Formación']).toContain(estado.trim());
  // La cuenta suma estados y equipos: «1 filtro» (DD-187).
  await expect(tabla.getByText('1 filtro', { exact: true })).toBeVisible();
});

test('dominios del Web Chat con el InputTags nativo: minúsculas, uno por etiqueta y su ✕ en español (DD-195)', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const campo = page.locator('#group-chat-domain');
  await expect(campo).toHaveAccessibleName('Dominios permitidos');
  await expect(page.getByRole('button', { name: 'Añadir' })).toHaveCount(0);
  await campo.fill('Tienda.example.com, blog.example.com');
  await campo.press('Enter');
  const etiquetas = page.locator('sc-inputtags .p-chip');
  await expect(etiquetas).toHaveText(['tienda.example.com', 'blog.example.com']);
  await expect(etiquetas.first().getByRole('button', { name: 'Quitar' })).toBeVisible();
  await etiquetas.first().getByRole('button', { name: 'Quitar' }).click();
  await expect(etiquetas).toHaveText(['blog.example.com']);
});

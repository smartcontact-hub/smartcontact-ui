import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL AGENTE ATIENDE POR FAMILIA (DD-147): Teléfono, Chat o Email, y Chat es Web Chat y WhatsApp juntos. Así lo tiene
 * el AED en vivo, que por agente solo distingue Tlf / Chat / Email, y así lo pidió la revisión de producto del
 * 2026-10-01, que sacó WhatsApp de la tabla de agentes. El grupo sigue ofreciendo sus cuatro canales en General
 * (WhatsApp tiene su número y su «Salida»); lo que cambia es por dónde atiende cada agente:
 *   1. La tabla de agentes del grupo, el panel rápido y la tabla de grupos de la ficha del agente llevan una columna
 *      por familia: Teléfono · Chat · Email, sin «Web Chat» ni «WhatsApp».
 *   2. Lo guardado antes con WhatsApp se abre con Chat marcado, y lo siguiente que se guarda ya va con Chat.
 *   3. Quitar WhatsApp a un grupo que sigue con Web Chat no le quita nada a nadie, así que no pregunta; quitar Chat
 *      entero pregunta, y lo dice con su nombre.
 *   4. El resumen lleva una barra por familia, y el listado de agentes dice «Chat».
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Una casilla de canal de General, por su rótulo EXACTO: «Chat» no debe casar con «Web Chat». */
const canal = (page: Page, nombre: string) =>
  page.locator('#group-section-general sc-checkbox').filter({ hasText: new RegExp(`^\\s*${nombre}\\s*$`) });
const irA = (page: Page, seccion: string) =>
  page.locator('sc-form-section-nav').getByText(seccion, { exact: true }).click();

/** Lo que se guardó de los enlaces, tal cual está en el navegador. */
const enlacesGuardados = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('sc-group-agent-links') ?? '[]') as {
        agentId: number;
        groupId: number;
        channels: string[];
      }[],
  );

/** Enlaces de antes, con WhatsApp como canal del agente. Solo esos: el resto de grupos queda sin agentes. */
const sembrarEnlaces = (page: Page, enlaces: readonly object[]) =>
  page.addInitScript((datos) => {
    if (localStorage.getItem('sc-group-agent-links')) return;
    localStorage.setItem('sc-group-agent-links-v', '1');
    localStorage.setItem('sc-group-agent-links', JSON.stringify(datos));
  }, enlaces);

const columnas = async (tabla: ReturnType<Page['locator']>) => {
  for (const familia of ['Teléfono', 'Chat']) {
    await expect(tabla.getByRole('columnheader', { name: familia, exact: true }), familia).toHaveCount(1);
  }
  for (const canalSuelto of ['Web Chat', 'WhatsApp']) {
    await expect(tabla.getByRole('columnheader', { name: canalSuelto, exact: true }), canalSuelto).toHaveCount(0);
  }
};

test('la tabla de agentes del grupo lleva una columna por familia: Teléfono · Chat · Email', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  await irA(page, 'Agentes');
  const tabla = page.locator('.assign');
  await columnas(tabla);
  await expect(tabla.getByRole('columnheader', { name: 'Email', exact: true })).toHaveCount(1);
});

test('el panel rápido y la ficha del agente, con las mismas columnas', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await page.getByRole('button', { name: 'Asignar agentes de Reclamaciones' }).click();
  await columnas(page.locator('.agents-panel'));
  // Teléfono y Chat: las columnas de la tabla compacta y el marco suman 47,375rem (DD-176: cada columna, su rótulo; con
  // DD-156, 48).
  await expect.poll(() => page.locator('.p-drawer').evaluate((e) => e.getBoundingClientRect().width)).toBe(758);

  await goto(page, 'admin/agentes/editar/3?seccion=grupos');
  const tabla = page.locator('.assign');
  await columnas(tabla);
  await expect(tabla.getByRole('columnheader', { name: 'Email', exact: true })).toHaveCount(1);
});

test('lo guardado con WhatsApp se abre con Chat marcado, y se guarda con Chat', async ({ page }) => {
  await sembrarEnlaces(page, [{ agentId: 1, groupId: 12, channels: ['whatsapp'], active: true }]);
  await goto(page, 'admin/grupos/editar/12');
  await irA(page, 'Agentes');

  // Su único canal, así que va marcado y fijo.
  await expect(page.getByRole('checkbox', { name: /^Tom Hanks — Chat: único canal/ })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Tom Hanks — Teléfono', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Grupo "Reclamaciones" actualizado')).toBeVisible();

  const guardado = (await enlacesGuardados(page)).find((l) => l.agentId === 1 && l.groupId === 12);
  expect(guardado?.channels).toEqual(['phone', 'chat']);
  expect(await page.evaluate(() => localStorage.getItem('sc-group-agent-links-v'))).toBe('1');
});

test('quitar WhatsApp con Web Chat puesto no pregunta: nadie pierde nada', async ({ page }) => {
  await sembrarEnlaces(page, [{ agentId: 1, groupId: 11, channels: ['phone', 'whatsapp'], active: true }]);
  await goto(page, 'admin/grupos/editar/11');
  await canal(page, 'WhatsApp').click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();

  await expect(page.getByText('Grupo "Online Support" actualizado')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Vas a quitar canales' })).toHaveCount(0);
});

test('quitar Chat entero pregunta, y lo nombra como familia', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  await canal(page, 'Chat').click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();

  const dialogo = page.getByRole('dialog', { name: 'Vas a quitar canales' });
  await expect(dialogo).toContainText(/agentes de este grupo pierden Chat[,.]/);
  await expect(dialogo).not.toContainText('Web Chat');
  await dialogo.getByRole('button', { name: 'Sí, quitar' }).click();
  await expect(page.getByText('Grupo "Online Support" actualizado')).toBeVisible();
  const guardados = (await enlacesGuardados(page)).filter((l) => l.groupId === 11);
  expect(guardados.length).toBeGreaterThan(0);
  expect(guardados.every((l) => l.channels.length > 0 && !l.channels.includes('chat') && !l.channels.includes('whatsapp'))).toBe(true);
});

test('el resumen lleva una barra por familia, y el listado de agentes dice «Chat»', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  const barras = page.getByRole('region', { name: 'Resumen' }).locator('.resumen__channel');
  await expect(barras).toHaveCount(3);
  await expect(barras.locator('.resumen__channel-name')).toHaveText([/Teléfono\s*$/, /Chat\s*$/, /Email\s*$/]);

  await goto(page, 'admin/agentes');
  const fila = page.locator('tbody tr', { hasText: 'Denzel Washington' });
  await expect(fila.getByRole('img', { name: 'Chat', exact: true })).toHaveCount(1);
  await expect(fila.getByRole('img', { name: 'Web Chat', exact: true })).toHaveCount(0);
});


test('solo WhatsApp conserva Chat al guardar y el panel conserva su columna para explicar compatibilidad', async ({ page }) => {
  await sembrarEnlaces(page, [{ agentId: 1, groupId: 11, channels: ['whatsapp'], active: true }]);
  await goto(page, 'admin/grupos/editar/11');
  for (const nombre of ['Teléfono', 'Web Chat', 'Email']) await canal(page, nombre).click();
  await irA(page, 'Agentes');
  await expect(page.getByRole('checkbox', { name: /^Tom Hanks — Chat: único canal/ })).toBeChecked();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Grupo "Online Support" actualizado')).toBeVisible();
  expect((await enlacesGuardados(page))[0].channels).toEqual(['chat']);

  await goto(page, 'admin/grupos');
  await page.getByRole('button', { name: 'Asignar agentes de Online Support' }).click();
  const panel = page.locator('.agents-panel');
  await expect(panel.locator('tbody tr')).toHaveCount(1);
  await expect(panel.getByRole('columnheader', { name: 'Chat', exact: true })).toHaveCount(1);
  // Solo Chat: 41,875rem (DD-176, la columna de Chat mide su rótulo; con DD-156, 43).
  await expect.poll(() => page.locator('.p-drawer').evaluate((e) => e.getBoundingClientRect().width)).toBe(670);

  await goto(page, 'admin/agentes/editar/1?seccion=grupos');
  await expect(page.locator('.assign').getByRole('checkbox', { name: /Chat/ })).toBeChecked();
  await expect(page.getByRole('region', { name: 'Resumen' })).toContainText('Chat');
  await goto(page, 'admin/agentes');
  const fila = page.locator('tbody tr', { hasText: 'Tom Hanks' });
  await expect(fila.getByRole('img', { name: 'Chat', exact: true })).toHaveCount(1);
});

test('el resumen del agente solo cuenta familias ofrecidas por sus grupos, igual que el listado', async ({ page }) => {
  await sembrarEnlaces(page, [{ agentId: 1, groupId: 1, channels: ['phone', 'email'], active: true }]);
  await goto(page, 'admin/agentes/editar/1');
  const resumen = page.getByRole('region', { name: 'Resumen' });
  await expect(resumen).toContainText('Teléfono');
  await expect(resumen).not.toContainText('Email');
});

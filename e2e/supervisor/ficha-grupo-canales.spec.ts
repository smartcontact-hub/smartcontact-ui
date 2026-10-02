import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * Los cuatro canales del grupo se configuran por separado. Desde DD-147, el agente
 * atiende tres familias: Teléfono, Chat (Web Chat y WhatsApp) y Email.
 * La asignación debe persistir y conservar la protección del último canal.
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

test('los cuatro canales del grupo se asignan al agente por sus tres familias', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');

  // El grupo ofrece los cuatro.
  for (const c of ['Web Chat', 'WhatsApp', 'Email']) {
    await canal(page, c).click();
  }
  await irA(page, 'Agentes');

  await expect(page.getByRole('columnheader', { name: 'Chat', exact: true })).toHaveCount(1);
  await expect(page.getByRole('columnheader', { name: 'WhatsApp', exact: true })).toHaveCount(0);
  // Marcar la familia debe conservar la casilla, sin perderla al ordenar los canales del enlace.
  const indice = await page.evaluate(() =>
    [...document.querySelectorAll('thead th')].findIndex((t) => t.textContent?.trim() === 'Chat'),
  );
  expect(indice, 'no hay columna de Chat').toBeGreaterThan(0);

  const celda = page.locator('tbody tr').first().locator('td').nth(indice);
  const casilla = celda.locator('[role=checkbox], input[type=checkbox]').first();
  await expect(casilla).toHaveAttribute('aria-checked', 'false');

  await celda.locator('sc-checkbox').first().click();
  await expect(casilla).toHaveAttribute('aria-checked', 'true');
});

test('sin Teléfono, su bloque se va de Distribución y deja la línea que dice dónde se enciende', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');
  await irA(page, 'Distribución y colas');
  await expect(page.locator('#group-channel-phone')).toBeVisible();
  await expect(page.locator('#group-phone')).toHaveCount(1);

  // Fuera el teléfono (con Web Chat, para que el grupo siga teniendo un canal).
  await irA(page, 'General');
  await canal(page, 'Web Chat').click();
  await canal(page, 'Teléfono').click();

  /* Solo se ve lo que aplica (visión de producto de grupos, 2026-09-25): ni su bloque ni el
   * teléfono saliente. Pero no se esfuma sin rastro: una línea dice que existe y dónde se
   * enciende (la decisión del 2026-09-23 contra las secciones que desaparecen). Y el índice no
   * encoge: sigue con sus cuatro secciones. */
  await irA(page, 'Distribución y colas');
  await expect(page.locator('#group-channel-phone')).toHaveCount(0);
  await expect(page.locator('#group-phone')).toHaveCount(0);
  await expect(page.locator('#group-section-distribution')).toContainText('Teléfono no está activo · actívalo en General');
  await expect(page.locator('sc-form-section-nav .form-nav__item')).toHaveCount(4);
});

/* Habilitado pertenece al enlace, no a la presencia de la persona (DD-149). */
test('el grupo permite habilitar el enlace sin bloquear sus canales', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/12');
  await irA(page, 'Agentes');
  await expect(page.getByRole('columnheader', { name: 'Habilitado' })).toHaveCount(1);
  const disabled = page.locator('.assign tbody tr').filter({ has: page.locator('input[role="switch"]:not(:checked)') });
  await expect(disabled).toHaveCount(1);
  await expect(disabled.getByRole('checkbox', { name: / — Chat/ })).toBeEnabled();
  await page.locator('.assign tbody tr').first().locator('td').first().locator('input[type=checkbox]').first().click();
  await expect(page.locator('sc-bulk-action-bar').getByRole('button', { name: 'Quitar del grupo' })).toBeVisible();
});

test('un agente asignado tiene al menos un canal: la casilla del último está apagada y dice por qué', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');
  await canal(page, 'Web Chat').click();
  await irA(page, 'Agentes');

  const fila = page.locator('.assign tbody tr').first();
  const telefono = fila.getByRole('checkbox', { name: /Teléfono/ });
  const webChat = fila.getByRole('checkbox', { name: / — Chat/ });
  // Solo Teléfono: es su último canal, no se desmarca aquí.
  await expect(telefono).toBeDisabled();
  await expect(telefono).toHaveAccessibleName(/único canal/);

  // Con Web Chat, Teléfono se puede quitar, y entonces el último es Web Chat.
  await webChat.click();
  await expect(telefono).toBeEnabled();
  await telefono.click();
  await expect(telefono).toHaveAttribute('aria-checked', 'false');
  await expect(webChat).toBeDisabled();
});

test('quitar un canal del grupo dice cuántos lo pierden y cuántos salen, y al guardar salen', async ({ page }) => {
  // El 1 es solo de Teléfono: al cambiarlo por Web Chat, sus agentes se quedan sin ningún canal.
  await goto(page, 'admin/grupos/editar/1');
  await canal(page, 'Web Chat').click();
  await canal(page, 'Teléfono').click();
  await page.getByRole('button', { name: 'Guardar' }).click();

  const dialogo = page.getByRole('dialog', { name: 'Vas a quitar canales' });
  await expect(dialogo).toContainText(/(\d+) agentes de este grupo pierden Teléfono, y \1 se quedan sin ningún canal y salen del grupo/);
  await dialogo.getByRole('button', { name: 'Sí, quitar' }).click();
  await expect(page.getByText('Grupo "ACD Demo C2CB" actualizado')).toBeVisible();

  await page.reload();
  await irA(page, 'Agentes');
  await expect(page.getByText('Sin agentes asignados')).toBeVisible();
});

/* La lista de agentes dice por dónde atiende cada uno con la MISMA regla que la ficha del grupo: los canales de un
 * enlace, recortados a los que su grupo ofrece hoy. En el seed, el agente 18 guarda Email en «Exclusivo», que solo
 * tiene Teléfono, y en «ACD demo cuscare», que sí tiene Email, solo Teléfono: la lista le pintaba un Email que no
 * atiende en ningún grupo (medido el 2026-09-26). */
test('la lista de agentes no pinta un canal que ninguno de sus grupos ofrece', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const fila = page.locator('tbody tr', { hasText: 'Marta Recio' });
  await expect(fila.locator('.sc-channel-row__item[data-channel="phone"]')).toHaveCount(1);
  await expect(fila.locator('.sc-channel-row__item[data-channel="email"]')).toHaveCount(0);
});

/* El listado anuncia la misma familia que se edita en el panel, aunque el grupo ofrezca WhatsApp. */
test('la lista de agentes anuncia Chat al asignarlo desde el panel', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('sc-group-agent-links')) return;
    localStorage.setItem('sc-group-agent-links-v', '1');
    localStorage.setItem('sc-group-agent-links', JSON.stringify([
      { agentId: 1, groupId: 12, channels: ['phone'], active: true },
    ]));
  });
  await goto(page, 'admin/grupos');
  await page.getByRole('button', { name: 'Asignar agentes de Reclamaciones' }).click();
  const panel = page.locator('.agents-panel');
  await panel.getByRole('checkbox', { name: 'Tom Hanks — Chat', exact: true }).click();
  await panel.getByRole('button', { name: 'Guardar (1)' }).click();
  await expect(panel).toHaveCount(0);

  await goto(page, 'admin/agentes');
  const fila = page.locator('tbody tr', { hasText: 'Tom Hanks' });
  await expect(fila.getByRole('img', { name: 'Chat', exact: true })).toHaveCount(1);
  await expect(fila.getByRole('img', { name: 'WhatsApp', exact: true })).toHaveCount(0);
  await expect(fila.getByRole('img', { name: 'Teléfono', exact: true })).toHaveCount(1);
});

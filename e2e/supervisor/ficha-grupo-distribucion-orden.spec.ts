import { expect, test, type Locator } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * DISTRIBUCIÓN Y COLAS, CON SU JERARQUÍA A LA VISTA (DD-157).
 *
 * La revisión de producto del 2026-10-04 pidió tres cosas de esta sección:
 *   1. que cada canal se lea como un bloque con sus partes dentro: el rótulo «Distribución» tenía la letra de la
 *      etiqueta «Estrategia» y no parecía una parte de Teléfono;
 *   2. en Chat, el orden de Teléfono: distribución, cola y mensajes primero, y el acceso (horario, dominios,
 *      script y número) al final, en vez de partir los campos de la cola con el script en medio;
 *   3. en Teléfono, la música de espera dentro de la cola, junto al tiempo máximo, y los demás mensajes de la
 *      cola de vuelta (salieron de la vista el 2026-09-25 y siguen en el modelo), plegados y sin llamarlos
 *      «anuncios». Y el tiempo máximo de espera dice qué pasa si no hay siguiente destino.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const DISTRIBUCION = 'admin/grupos/editar/11?seccion=distribucion';

/** Los títulos de las partes de un canal, en orden. */
const partes = (canal: Locator) =>
  canal.locator('h4').evaluateAll((titulos) => titulos.map((t) => t.textContent!.replace(/\s+/g, ' ').trim()));

test('cada canal es un bloque con sus partes dentro, y cada parte pesa más que sus campos', async ({ page }) => {
  await goto(page, DISTRIBUCION);
  for (const id of ['group-channel-phone', 'group-channel-chat']) {
    const canal = page.locator(`#${id}`);
    await expect(canal).toBeVisible();
    // La caja es la subsección del DS: blanca sobre el gris de la sección, sin borde (árbol Section → Subsection → Slot).
    const [caja, debajo] = await canal.evaluate((el) => {
      const fondo = (e: Element) => getComputedStyle(e).backgroundColor;
      const transparente = (c: string) => c === 'transparent' || c === 'rgba(0, 0, 0, 0)';
      let p = el.parentElement;
      while (p && transparente(fondo(p))) p = p.parentElement;
      return [fondo(el.firstElementChild!), p ? fondo(p) : ''];
    });
    expect(caja, `${id}: el canal pinta su propio fondo`).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
    expect(caja, `${id}: el canal es una caja, de otro fondo que lo que tiene debajo`).not.toBe(debajo);
    const tamano = (l: Locator) => l.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const parte = await tamano(canal.locator('h4').first());
    const etiqueta = await tamano(canal.locator('.field__label').first());
    expect(parte, `${id}: el título de una parte, más grande que la etiqueta de un campo`).toBeGreaterThan(etiqueta);
  }
});

test('Chat sigue el orden de Teléfono: distribución, cola y mensajes, y el acceso al final', async ({ page }) => {
  await goto(page, DISTRIBUCION);
  expect(await partes(page.locator('#group-channel-chat'))).toEqual([
    'Distribución',
    'Cola',
    'Mensajes en cola',
    'Acceso Web Chat',
    'Acceso WhatsApp',
  ]);
});

test('Teléfono: la música va en la cola, y los demás mensajes, plegados y sin «anuncio»', async ({ page }) => {
  await goto(page, DISTRIBUCION);
  const tel = page.locator('#group-channel-phone');
  expect(await partes(tel)).toEqual(['Distribución', 'Cola', 'Mensajes en cola']);
  const cola = tel.locator('sc-slot').filter({ has: page.getByRole('heading', { name: 'Cola', exact: true }) });
  await expect(cola.getByText('Música de espera', { exact: true })).toBeVisible();

  const mensajes = tel.getByRole('button', { name: /Mensajes en cola/ });
  await expect(mensajes, 'nacen plegados').toHaveAttribute('aria-expanded', 'false');
  await mensajes.click();
  await expect(mensajes).toHaveAttribute('aria-expanded', 'true');
  for (const rotulo of [
    'Identificador del grupo',
    '«Eres el siguiente»',
    'Mensajes periódicos',
    'Voz de los mensajes',
    'Decir el tiempo medio de espera',
    'Decir la posición en la cola',
    'Decir al agente cuánto ha esperado el cliente',
  ]) {
    await expect(tel.getByText(rotulo, { exact: true }), rotulo).toBeVisible();
  }
  await expect(tel).not.toContainText(/anunci/i);
});

test('un mensaje de la cola se guarda con el grupo', async ({ page }) => {
  await goto(page, DISTRIBUCION);
  const tel = page.locator('#group-channel-phone');
  await tel.getByRole('button', { name: /Mensajes en cola/ }).click();
  await tel.getByRole('group', { name: '«Eres el siguiente»' }).getByText('Texto a voz', { exact: true }).click();
  await tel.getByRole('textbox', { name: '«Eres el siguiente»: Texto que lee la voz' }).fill('Le atendemos enseguida');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (JSON.parse(localStorage.getItem('sc-groups') ?? '[]') as { id: number; announcements?: { nextInLineText?: string } }[])
            .find((g) => g.id === 11)?.announcements?.nextInLineText,
      ),
    )
    .toBe('Le atendemos enseguida');
});

test('el tiempo máximo de espera dice qué pasa sin siguiente destino, en la ficha y en Contact Center', async ({ page }) => {
  await goto(page, DISTRIBUCION);
  await expect(page.locator('#group-channel-phone')).toContainText(
    'Sin atender en este tiempo, pasa al siguiente destino del Diseñador VUI; si no hay, termina.',
  );

  await goto(page, 'config/aed/grupos');
  const contactCenter = page.locator('main#main-content');
  await expect(contactCenter).toContainText(
    'Sin atender en este tiempo, pasa al siguiente destino del Diseñador VUI; si no hay, termina.',
  );
  await expect(contactCenter).toContainText('Voz de los mensajes');
  await expect(contactCenter).not.toContainText(/anunci/i);
});

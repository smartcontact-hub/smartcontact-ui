import { expect, test, type Locator, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA AYUDA DE UN CAMPO VA DEBAJO DE SU CONTROL (DD-198).
 *
 * Medido el 2026-10-11 en la ficha de grupo: en «Mensajes en cola», la ayuda de «Identificador del grupo» y de «Eres el
 * siguiente» iba entre el rótulo y el botón segmentado, y la del script de Web Chat encima de su campo; el resto de
 * campos la llevan debajo. Rótulo y control son una pieza que se lee de un vistazo, y en una rejilla de dos columnas
 * los controles quedan a la misma altura. Lo que abre la opción elegida va después de la ayuda, que no salta.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const caja = async (loc: Locator) => (await loc.boundingBox())!;

const abrirMensajesEnCola = async (page: Page) => {
  await goto(page, 'admin/grupos/editar/1?seccion=distribucion');
  const plegado = page.getByRole('button', { name: /Mensajes en cola/ });
  if ((await plegado.getAttribute('aria-expanded')) === 'false') await plegado.click();
};

test('Mensajes en cola · la ayuda va debajo del segmentado, los dos controles a la misma altura, y no salta', async ({ page }) => {
  await abrirMensajesEnCola(page);
  const campo = (nombre: string) => page.locator('.field', { has: page.getByText(nombre, { exact: true }) });
  const id = campo('Identificador del grupo');
  const siguiente = campo('«Eres el siguiente»');

  const [rotulo, opciones, ayuda] = [
    await caja(id.locator('.field__label')),
    await caja(id.locator('p-selectbutton')),
    await caja(id.locator('.sc-selectbutton__msg')),
  ];
  expect(opciones.y, 'el rótulo, encima de las opciones').toBeGreaterThan(rotulo.y);
  expect(ayuda.y, 'la ayuda, debajo de las opciones').toBeGreaterThanOrEqual(opciones.y + opciones.height);
  await expect(id.locator('p-selectbutton')).toHaveAccessibleDescription(await id.locator('.sc-selectbutton__msg').innerText());

  // En la rejilla, los dos segmentados a la misma altura aunque sus ayudas midan distinto.
  expect(Math.round((await caja(siguiente.locator('p-selectbutton'))).y)).toBe(Math.round(opciones.y));

  // Lo que abre la opción va después de la ayuda, y la ayuda no se mueve.
  await id.getByRole('button', { name: 'Sin locución' }).click();
  const quieta = (await caja(id.locator('.sc-selectbutton__msg'))).y;
  await id.getByRole('button', { name: 'Texto a voz' }).click();
  const texto = id.locator('input');
  await expect(texto).toBeVisible();
  expect((await caja(id.locator('.sc-selectbutton__msg'))).y, 'la ayuda no salta al elegir').toBe(quieta);
  expect((await caja(texto)).y, 'el texto, después de la ayuda').toBeGreaterThan(quieta);
});

test('Script de Web Chat · la ayuda debajo, y copiar dentro del campo, solo con icono', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const campo = page.locator('.field', { has: page.locator('#group-chat-script') });
  await campo.scrollIntoViewIfNeeded();
  const area = await caja(campo.locator('textarea'));
  const ayuda = await caja(campo.locator('.sc-textarea__msg'));
  expect(ayuda.y, 'la ayuda, debajo del campo').toBeGreaterThanOrEqual(area.y + area.height);
  const copiar = campo.getByRole('button', { name: 'Copiar código' });
  const boton = await caja(copiar);
  expect(boton.y, 'copiar, dentro del campo').toBeGreaterThanOrEqual(area.y);
  expect(boton.y + boton.height).toBeLessThanOrEqual(area.y + area.height);
  await expect(copiar).toHaveText(/^\s*\S*\s*$/); // solo el glifo del icono, sin «Copiar»
});

test('Ficha de agente · la ayuda del tipo de extensión, debajo del segmentado y anunciada con él', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1');
  const campo = page.locator('.field', { has: page.locator('#agent-ext-type-label') });
  const opciones = await caja(campo.locator('p-selectbutton'));
  const ayuda = campo.locator('.sc-selectbutton__msg');
  expect((await caja(ayuda)).y).toBeGreaterThanOrEqual(opciones.y + opciones.height);
  await expect(campo.locator('p-selectbutton')).toHaveAccessibleDescription(await ayuda.innerText());
});

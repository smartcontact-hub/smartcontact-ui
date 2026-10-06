import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LO QUE VERÁ EL AGENTE: EL TELÉFONO DE SC-AGENT EN LA FICHA DE UNA TIPIFICACIÓN (DD-175).
 *
 * La revisión del 2026-10-05: a la derecha de la ficha, donde las fichas llevan su resumen, la sección de Tipificación
 * del teléfono del agente, con lo que se va definiendo y para probarla. Lo que fija:
 *   1. sus piezas son las del teléfono: la franja «Tipificación», un botón-píldora por nivel (el primero encendido, los
 *      demás apagados hasta elegir el de arriba), el comentario, Guardar y la barra de cuatro pestañas; sin ajustes;
 *   2. se prueba: elegir los tres niveles enciende Guardar, y Guardar dice cómo quedaría la conversación;
 *   3. sigue a la ficha: sin comentario no hay comentario, y sin niveles ni comentario dice que no pide nada;
 *   4. la barra de pestañas va redondeada en sus cuatro esquinas, y su sombra (con spread) no la corta su columna;
 *   5. sus colores son los tokens de la ventana del agente, iguales en los dos temas.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const telefono = (page: Page) => page.locator('sc-tipificacion-vista .tel');
const pildora = (page: Page, i: number) => page.locator(`#tip-vista-${i}`);

const elegir = async (page: Page, i: number, opcion: string): Promise<void> => {
  await pildora(page, i).click();
  await page.locator('.p-popover').getByRole('option', { name: opcion, exact: true }).click();
  await expect(pildora(page, i)).toContainText(opcion);
};

test('sus piezas son las del teléfono del agente, sin ajustes', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1');
  await expect(page.locator('sc-tipificacion-vista').getByRole('heading', { level: 2 })).toHaveText('Lo que verá el agente');
  await expect(telefono(page).locator('.tel__cabeza')).toHaveText('Tipificación');
  await expect(pildora(page, 0)).toBeEnabled();
  await expect(pildora(page, 1)).toBeDisabled();
  await expect(pildora(page, 2)).toBeDisabled();
  await expect(telefono(page).getByRole('textbox', { name: 'Comentario' })).toBeVisible();
  await expect(telefono(page).getByRole('button', { name: 'Guardar' })).toBeDisabled();
  await expect(telefono(page).locator('.tel__pestanas sc-icon')).toHaveCount(4);
  await expect(telefono(page).locator('sc-icon[name="settings"]')).toHaveCount(0);
});

test('se prueba: los tres niveles encienden Guardar, y Guardar dice cómo quedaría', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1');
  await elegir(page, 0, 'Consulta');
  await expect(pildora(page, 1)).toBeEnabled();
  await elegir(page, 1, 'Facturación');
  await elegir(page, 2, 'Importe');
  const guardar = telefono(page).getByRole('button', { name: 'Guardar' });
  await expect(guardar).toBeEnabled();
  await guardar.click();
  await expect(page.locator('.vista__resultado')).toHaveText(/Quedaría como Consulta › Facturación › Importe/);
});

test('sigue a la ficha: sin comentario no hay comentario; sin niveles ni comentario, no pide nada', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/4');
  // «Encuesta de calidad» no pide comentario: un nivel y Guardar.
  await expect(telefono(page).getByRole('textbox')).toHaveCount(0);
  await expect(telefono(page).locator('.tel__nivel')).toHaveCount(1);

  await goto(page, 'admin/tipificaciones/editar/5');
  // «Cierre de chat» solo pide comentario; al quitárselo, no pide nada y el teléfono lo dice.
  await expect(telefono(page).locator('.tel__nivel')).toHaveCount(0);
  await page.locator('sc-toggleswitch').filter({ has: page.locator('[aria-label="Pedir un comentario"]') }).locator('input, [role="switch"]').first().click();
  await expect(telefono(page)).toContainText('No pide nada');
});

test('la barra de pestañas va redondeada en sus cuatro esquinas, y la sombra no se corta', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1');
  const medida = await page.evaluate(() => {
    const barra = getComputedStyle(document.querySelector('.tel__pestanas')!);
    const tel = document.querySelector('.tel')!;
    const recortes: string[] = [];
    // Lo que recorta entre el teléfono y la rejilla de la ficha: ahí dentro una columna que desplaza cortaba la sombra
    // en recto por los lados (`.ficha-summary`). Más arriba desplaza la página entera, y eso no la corta.
    for (let e = tel.parentElement; e && !e.classList.contains('page__inner'); e = e.parentElement) {
      const o = getComputedStyle(e);
      if (o.overflowX !== 'visible' || o.overflowY !== 'visible') recortes.push(e.tagName.toLowerCase() + '.' + e.className);
    }
    return {
      arriba: parseFloat(barra.borderTopLeftRadius),
      abajo: parseFloat(barra.borderBottomRightRadius),
      sombra: getComputedStyle(tel).boxShadow,
      recortes,
    };
  });
  expect(medida.arriba).toBeGreaterThan(0);
  expect(medida.abajo).toBe(medida.arriba);
  // Con spread: el cuarto valor de la primera sombra es positivo.
  expect(medida.sombra).toMatch(/\d+px \d+px \d+px [1-9]\d*px/);
  expect(medida.recortes).toEqual([]);
});

test('sus colores son los de la ventana del agente, iguales en los dos temas', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1');
  const colores = () =>
    page.evaluate(() => {
      const fondo = (s: string) => getComputedStyle(document.querySelector(s)!).backgroundColor;
      return { panel: fondo('.tel__seccion'), barra: fondo('.tel__pestanas'), comentario: fondo('.tel__comentario') };
    });
  const claro = await colores();
  expect(claro.panel).not.toBe(claro.barra);
  await page.evaluate(() => document.documentElement.classList.add('sc-dark'));
  expect(await colores()).toEqual(claro);
});

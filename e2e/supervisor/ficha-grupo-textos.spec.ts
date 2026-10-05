import { expect, test, type Locator, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

/**
 * LA FICHA DE GRUPO DICE LO QUE HACE CADA CAMPO CON LAS PALABRAS DE LA REVISIÓN DE PRODUCTO (DD-141).
 *
 * La revisión de producto del 2026-10-01 dio el flujo de grupos por bueno con ajustes de texto y de campos. Lo que fija:
 *   1. Las estrategias reparten conversaciones, no llamadas ni chats: «Menos conversaciones atendidas» en Teléfono y en
 *      «Dentro de cada nivel», y «Menos conversaciones activas» en Chat, con su ayuda.
 *   2. Un grupo o unos valores de Contact Center guardados con los nombres de antes abren con los de ahora y sin cambios
 *      pendientes: el nombre ES el valor guardado, y subir la versión del almacén borraría lo que hay.
 *   3. «Desbordar sesión» sale de la ficha y de Contact Center: lo cubre «Caducar sesión», que se llamaba «Cerrar chat
 *      por inactividad» hasta DD-142. Lo guardado no se pierde al guardar.
 *   4. «Caducar sesión» nace con 5 minutos.
 *   5. El tamaño de cola dice qué cuenta cada modo: Fija, el total; Variable, por agente conectado.
 *   6. La tipificación se elige por su categoría: el número que llevaba al lado eran sus tipificaciones, y se leía como
 *      niveles o como grupos.
 *   7. Los nombres largos caben en sus desplegables, en la ficha y en Contact Center.
 *
 * Storage limpio por test → cada almacén vuelve a su semilla.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const canal = (page: Page, nombre: string) =>
  page.locator('#group-section-general sc-checkbox').filter({ hasText: new RegExp(`^\\s*${nombre}\\s*$`) });

/** Las opciones de un desplegable, por su primera línea: una opción apagada lleva debajo su motivo. */
const opcionesDe = async (page: Page, control: Locator): Promise<string[]> => {
  await control.click();
  const opciones = page.locator('.p-select-overlay .p-select-option');
  await expect(opciones.first()).toBeVisible();
  const textos = (await opciones.allInnerTexts()).map((t) => t.split('\n')[0]!.trim());
  await page.keyboard.press('Escape');
  await expect(page.locator('.p-select-overlay')).toHaveCount(0);
  return textos;
};

/** Lo elegido no cabe en el desplegable: el texto es más ancho que su caja y se corta con «…». */
const recortado = (control: Locator) => control.evaluate((el) => el.scrollWidth > el.clientWidth + 1);

const GUARDAR = { name: 'Guardar', exact: true } as const;

test('las estrategias reparten conversaciones: Teléfono, «Dentro de cada nivel» y Chat, con su ayuda', async ({ page }) => {
  // El grupo 11 tiene Teléfono y Chat.
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const telefono = page.locator('#group-strategy');
  const chat = page.locator('#group-chat-strategy');

  const deTelefono = await opcionesDe(page, telefono);
  const deChat = await opcionesDe(page, chat);
  expect(deTelefono).toContain('Menos conversaciones atendidas');
  expect(deChat).toContain('Menos conversaciones activas');
  expect(deChat).toContain('Niveles');
  await pickSelectOption(page, chat, 'Niveles');
  const dentroDeChat = await opcionesDe(page, page.locator('#group-chat-sub-strategy'));
  expect(dentroDeChat).toEqual(deChat.filter((s) => s !== 'Niveles'));

  await pickSelectOption(page, telefono, 'Niveles');
  const dentroDelNivel = await opcionesDe(page, page.locator('#group-sub-strategy'));
  expect(dentroDelNivel).toContain('Menos conversaciones atendidas');

  for (const deAntes of ['Menos llamadas atendidas', 'Menos chats activos']) {
    expect([...deTelefono, ...deChat, ...dentroDelNivel], deAntes).not.toContain(deAntes);
  }

  await pickSelectOption(page, telefono, 'Menos conversaciones atendidas');
  await expect(telefono).toHaveAccessibleDescription('Va al agente que menos conversaciones ha atendido.');
});

/* Dos grupos y unos valores por defecto como los dejaban guardados la ficha y Contact Center hasta el 2026-10-01. */
const gruposConNombresDeAntes = [
  {
    id: 1,
    code: '20001',
    name: 'E2E Reparto por niveles',
    phone: '917945449',
    priority: 'Baja',
    channels: ['phone', 'chat'],
    strategy: 'Niveles',
    subStrategy: 'Menos llamadas atendidas',
    chatStrategy: 'Menos chats activos',
  },
  {
    id: 2,
    code: '20002',
    name: 'E2E Reparto al que menos atendió',
    phone: '917945449',
    priority: 'Baja',
    channels: ['phone'],
    strategy: 'Menos llamadas atendidas',
  },
];

test('lo guardado con los nombres de antes abre con los de ahora, sin cambios pendientes', async ({ page }) => {
  await page.addInitScript((grupos) => {
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify(grupos));
    localStorage.setItem('sc-group-defaults-v', '1');
    localStorage.setItem(
      'sc-group-defaults',
      JSON.stringify([{ strategy: 'Menos llamadas atendidas', chatStrategy: 'Menos chats activos' }]),
    );
  }, gruposConNombresDeAntes);

  await goto(page, 'admin/grupos');
  await expect(page.locator('tbody tr', { hasText: 'E2E Reparto al que menos atendió' })).toContainText(
    'Menos conversaciones atendidas',
  );
  await expect(page.locator('tbody')).not.toContainText('llamadas atendidas');

  await goto(page, 'admin/grupos/editar/1?seccion=distribucion');
  await expect(page.locator('#group-sub-strategy')).toHaveText('Menos conversaciones atendidas');
  await expect(page.locator('#group-chat-strategy')).toHaveText('Menos conversaciones activas');
  await expect(page.getByRole('button', GUARDAR)).toBeDisabled();

  await goto(page, 'admin/grupos/editar/2?seccion=distribucion');
  const estrategia = page.locator('#group-strategy');
  await expect(estrategia).toHaveText('Menos conversaciones atendidas');
  await expect(estrategia).toHaveAccessibleDescription('Va al agente que menos conversaciones ha atendido.');
  await expect(page.getByRole('button', GUARDAR)).toBeDisabled();

  await goto(page, 'config/aed/grupos');
  await expect(page.locator('#grupos-strategy')).toHaveText('Menos conversaciones atendidas');
  await expect(page.locator('#grupos-chat-strategy')).toHaveText('Menos conversaciones activas');
  await expect(page.getByRole('button', GUARDAR)).toBeDisabled();
});

test('«Desbordar sesión» sale de la ficha y de Contact Center, y lo que tenía guardado no se pierde al guardar', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-sembrado')) return;
    sessionStorage.setItem('e2e-sembrado', '1');
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem(
      'sc-groups',
      JSON.stringify([
        {
          id: 1,
          code: '20001',
          name: 'E2E Sesión desbordada',
          phone: '917945449',
          priority: 'Baja',
          channels: ['phone', 'chat'],
          strategy: 'Balanceada',
          advanced: { overflowSession: true },
        },
      ]),
    );
    localStorage.setItem('sc-group-defaults-v', '1');
    localStorage.setItem('sc-group-defaults', JSON.stringify([{ advanced: { overflowSession: true } }]));
  });

  await goto(page, 'admin/grupos/editar/1?seccion=distribucion');
  // La regla común que se queda, a la vista: así el cero de abajo no es de una sección sin pintar.
  await expect(page.getByRole('switch', { name: 'Desbordar si todos los agentes están inactivos', exact: true })).toBeVisible();
  await expect(page.getByText('Desbordar sesión', { exact: true })).toHaveCount(0);

  const espera = page.locator('#group-phone-max-wait');
  await pickSelectOption(page, espera, '30 s');
  await page.getByRole('button', GUARDAR).click();
  await expect(page.getByText('Grupo "E2E Sesión desbordada" actualizado')).toBeVisible();
  const enElGrupo = await page.evaluate(() => JSON.parse(localStorage.getItem('sc-groups') ?? '[]')[0]?.advanced?.overflowSession);
  expect(enElGrupo, 'el grupo lo conserva').toBe(true);

  await goto(page, 'config/aed/grupos');
  await expect(page.locator('#grupos-overflow')).toBeVisible();
  await expect(page.getByText('Desbordar sesión', { exact: true })).toHaveCount(0);
  await pickSelectOption(page, page.locator('#grupos-priority'), 'Media');
  await page.getByRole('button', GUARDAR).click();
  await expect(page.getByText('Parámetros de grupos guardados')).toBeVisible();
  const enContactCenter = await page.evaluate(
    () => JSON.parse(localStorage.getItem('sc-group-defaults') ?? '[]')[0]?.advanced?.overflowSession,
  );
  expect(enContactCenter, 'Contact Center lo conserva').toBe(true);
});

test('«Caducar sesión» nace con 5 minutos en Contact Center', async ({ page }) => {
  await goto(page, 'config/aed/grupos');
  await page.locator('#grupos-chat-inactivity-on').click();
  await expect(page.locator('#grupos-chat-inactivity')).toHaveText('5 min');
});

test('un grupo nuevo caduca la sesión de chat a los 5 minutos si se enciende', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  await page.locator('#group-name').fill(`E2E Inactividad ${Date.now()}`);
  await canal(page, 'Chat').click();
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await page.getByRole('switch', { name: 'Caducar sesión', exact: true }).click();
  await expect(page.locator('#group-chat-inactivity')).toHaveText('5 min');
});

test('el tamaño de cola dice qué cuenta cada modo: Fija, el total; Variable, por agente conectado', async ({
  page,
}) => {
  // El grupo 1 trae la cola fija de 50 de la semilla.
  await goto(page, 'admin/grupos/editar/1?seccion=distribucion');
  const telefono = page.locator('#group-channel-phone');
  const ayuda = telefono.locator('.field', { has: page.locator('#group-phone-queue-size') }).locator('.field__help');
  await expect(ayuda).toHaveText('Hasta 50 conversaciones en espera en total. ');

  await pickSelectOption(page, page.locator('#group-phone-queue-type'), 'Variable');
  await expect(ayuda).toHaveText('2 conversaciones en cola por agente conectado. Recomendado: 2');
});

test('la tipificación se elige por su categoría, sin la cuenta de sus tipificaciones al lado', async ({ page }) => {
  // El grupo 12 tipifica con «Consulta», que en la semilla tiene tres.
  await goto(page, 'admin/grupos/editar/12?seccion=recursos');
  const tipificacion = page.locator('#group-typification');
  await expect(tipificacion).toHaveText('Consulta');
  const opciones = await opcionesDe(page, tipificacion);
  expect(opciones).toContain('Consulta');
  expect(opciones.filter((o) => /\(\d+\)$/.test(o))).toEqual([]);
});

test('a 1366 los nombres largos caben en sus desplegables, en la ficha y en Contact Center', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await pickSelectOption(page, page.locator('#group-strategy'), 'Menos conversaciones atendidas');
  await pickSelectOption(page, page.locator('#group-chat-strategy'), 'Menos conversaciones activas');
  expect(await recortado(page.locator('#group-strategy')), 'la de Teléfono, en la ficha').toBe(false);
  expect(await recortado(page.locator('#group-chat-strategy')), 'la de Chat, en la ficha').toBe(false);

  await goto(page, 'config/aed/grupos');
  await pickSelectOption(page, page.locator('#grupos-strategy'), 'Menos conversaciones atendidas');
  await pickSelectOption(page, page.locator('#grupos-chat-strategy'), 'Menos conversaciones activas');
  expect(await recortado(page.locator('#grupos-strategy')), 'la de Teléfono, en Contact Center').toBe(false);
  expect(await recortado(page.locator('#grupos-chat-strategy')), 'la de Chat, en Contact Center').toBe(false);
});

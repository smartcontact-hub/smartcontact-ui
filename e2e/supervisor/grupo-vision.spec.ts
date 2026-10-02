import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

/**
 * LA FICHA DE GRUPO QUE PIDE LA VISIÓN DE PRODUCTO (2026-09-25, DD-121), escrita como la matriz de
 * lo que se ve según los canales del grupo.
 *
 * Se escribió ANTES que la ficha nueva y se vio en rojo contra la de pestañas: cada prueba nombra una
 * regla de la visión (índice lateral de cuatro secciones; General solo con nombre, prioridad y
 * canales; Chat madre de Web Chat y WhatsApp; distribución y cola dentro de cada canal; un único
 * desbordamiento común; en la cola de teléfono solo la música y la voz; capacidad de cola con dos
 * opciones). Si una se pone roja, la ficha ha dejado de cumplir esa regla.
 *
 * Grupos del seed: el 11 («Online Support») tiene los cuatro canales; el 1 («ACD Demo C2CB»), solo
 * Teléfono. Storage limpio por test → cada store de admin re-siembra su seed.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const indice = (page: Page) => page.locator('sc-form-section-nav');
const irA = async (page: Page, seccion: string): Promise<void> => {
  await indice(page).getByText(seccion, { exact: true }).click();
};
const canal = (page: Page, nombre: string) =>
  page.locator('#group-section-general sc-checkbox').filter({ hasText: new RegExp(`^\\s*${nombre}\\s*$`) });

test('la ficha navega por un índice lateral con las cuatro secciones de la visión', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');

  await expect(indice(page)).toBeVisible();
  await expect(indice(page).locator('.form-nav__label')).toHaveText([
    'General',
    'Distribución y colas',
    'Recursos',
    'Agentes',
  ]);
  // Ni la tira de pestañas de antes.
  await expect(page.locator('p-tabs')).toHaveCount(0);
  // Una sección a la vez: abre en General.
  await expect(page.locator('[id^="group-section-"]')).toHaveCount(1);
  await expect(page.locator('#group-section-general')).toBeVisible();
});

test('General pide nombre, prioridad y canales, y nada más', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  const general = page.locator('#group-section-general');

  await expect(general.getByLabel('Nombre')).toBeVisible();
  await expect(general.getByText('Prioridad', { exact: true })).toBeVisible();
  for (const c of ['Teléfono', 'Chat', 'Web Chat', 'WhatsApp', 'Email']) {
    await expect(canal(page, c), c).toHaveCount(1);
  }
  // Lo que la visión quitó de General.
  for (const fuera of [/descripci[oó]n/i, /c[oó]digo/i, /permisos/i, /activaci[oó]n/i, /tel[eé]fono asociado/i]) {
    await expect(general.getByText(fuera)).toHaveCount(0);
  }
});

test('Chat es la madre: apagarlo apaga Web Chat y WhatsApp, y encenderlo los enciende', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  const marcada = (nombre: string) => canal(page, nombre).locator('[role=checkbox], input[type=checkbox]').first();

  await expect(marcada('Web Chat')).toHaveAttribute('aria-checked', 'true');
  await canal(page, 'Chat').click();
  await expect(marcada('Web Chat')).toHaveAttribute('aria-checked', 'false');
  await expect(marcada('WhatsApp')).toHaveAttribute('aria-checked', 'false');

  await canal(page, 'Chat').click();
  await expect(marcada('Web Chat')).toHaveAttribute('aria-checked', 'true');
  await expect(marcada('WhatsApp')).toHaveAttribute('aria-checked', 'true');
});

test('Distribución y colas: un desbordamiento común y un bloque por canal activo', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  await irA(page, 'Distribución y colas');
  const seccion = page.locator('#group-section-distribution');

  await expect(seccion.getByText('Desbordar si todos los agentes están inactivos')).toHaveCount(1);
  for (const id of ['phone', 'chat', 'email']) {
    await expect(seccion.locator(`#group-channel-${id}`), id).toBeVisible();
  }

  // Un grupo solo de teléfono no enseña bloques de Chat ni de Email.
  await goto(page, 'admin/grupos/editar/1');
  await irA(page, 'Distribución y colas');
  await expect(page.locator('#group-channel-phone')).toBeVisible();
  await expect(page.locator('#group-channel-chat')).toHaveCount(0);
  await expect(page.locator('#group-channel-email')).toHaveCount(0);
});

test('Teléfono: saliente y voz a la vista; en la cola, solo la música', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1');
  await irA(page, 'Distribución y colas');
  const telefono = page.locator('#group-channel-phone');

  // El rótulo del teléfono saliente lleva su «*» de obligatorio desde DD-142, y el texto de un rótulo empieza por un
  // espacio que el casado por expresión regular no recorta (medido).
  for (const visible of ['Teléfono saliente', 'Voz de los anuncios', 'Música de espera']) {
    await expect(telefono.getByText(new RegExp(`^\\s*${visible}(\\s*\\*)?\\s*$`)), visible).toBeVisible();
  }
  for (const fuera of ['Identificador del grupo', 'Anuncio periódico', 'Audio saliente', '«Eres el siguiente»']) {
    await expect(page.getByText(fuera, { exact: true }), fuera).toHaveCount(0);
  }
  // Capacidad de cola: dos opciones, ni una más.
  await telefono.locator('#group-phone-queue-type').click();
  await expect(page.getByRole('option')).toHaveText(['Fija', 'Variable']);
  await page.keyboard.press('Escape');
});

test('Chat: «Caducar sesión» a la vista; Web Chat con dominios y script; WhatsApp con su número', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  await irA(page, 'Distribución y colas');
  const chat = page.locator('#group-channel-chat');

  // «Caducar sesión», como en el Contact Center validado (DD-142); antes, «Cerrar chat por inactividad».
  await expect(chat.getByText('Caducar sesión', { exact: true })).toBeVisible();
  await expect(chat.getByText('Dominios permitidos')).toBeVisible();
  await expect(chat.getByRole('button', { name: 'Copiar código' })).toBeVisible();
  await expect(chat.getByText('Número de WhatsApp')).toBeVisible();

  // Sin WhatsApp, su número y sus mensajes desaparecen; Web Chat sigue.
  await irA(page, 'General');
  await canal(page, 'WhatsApp').click();
  await irA(page, 'Distribución y colas');
  await expect(page.locator('#group-channel-chat').getByText('Número de WhatsApp')).toHaveCount(0);
  await expect(page.locator('#group-channel-chat').getByText('Dominios permitidos')).toBeVisible();
});

/* Un grupo como lo dejaba guardado la ficha hasta el 2026-09-26: UNA cola para todo el grupo, en
 * `advanced`, y ni `phoneQueue`, ni `chatQueue`, ni `chat`. Los stores del repo no migran (subir su
 * versión borra lo guardado), así que el modelo nuevo es aditivo y se lee con `resolveGroup`. */
const grupoDeAntes = {
  id: 10,
  code: '20010',
  name: 'Nodo AED 1',
  phone: '917945449',
  priority: 'Baja',
  channels: ['phone', 'chat'],
  strategy: 'Balanceada',
  chatStrategy: 'Rotativa (por turnos)',
  advanced: { queueSizeType: 'per_agent', queueSize: 7, maxQueueWaitSec: 99, serviceLevelSec: 33, transferSec: 11, wrapUpSec: 4 },
};

test('un grupo guardado con la cola única de antes abre con ella en Teléfono y en Chat, sin cambios pendientes', async ({ page }) => {
  await page.addInitScript((grupo) => {
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify([grupo]));
  }, grupoDeAntes);
  await goto(page, 'admin/grupos/editar/10');
  await irA(page, 'Distribución y colas');

  for (const canal of ['phone', 'chat']) {
    await expect(page.locator(`#group-${canal}-max-wait`), canal).toHaveText('99 s');
    await expect(page.locator(`#group-${canal}-service-level`), canal).toHaveText('33 s');
    await expect(page.locator(`#group-${canal}-transfer`), canal).toHaveText('11 s');
    await expect(page.locator(`#group-${canal}-queue-size`), canal).toHaveValue(/^7/);
  }
  // Leer y completar lo que falta no es un cambio: Guardar sigue apagado.
  await expect(page.getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

test('cada canal guarda su cola: tocar la de Chat no mueve la de Teléfono', async ({ page }) => {
  await page.addInitScript((grupo) => {
    if (sessionStorage.getItem('e2e-sembrado')) return;
    sessionStorage.setItem('e2e-sembrado', '1');
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify([grupo]));
  }, grupoDeAntes);
  await goto(page, 'admin/grupos/editar/10');
  await irA(page, 'Distribución y colas');

  const esperaChat = page.locator('#group-chat-max-wait');
  await pickSelectOption(page, esperaChat, '30 s');
  await page.getByRole('button', { name: 'Guardar' }).click();
  /* Se espera al AVISO, no al botón: `save()` escribe a los 400ms y el botón ya sale apagado mientras
   * carga, así que esperar al botón recargaba antes de guardar (me dio un rojo falso). */
  await expect(page.getByText('Grupo "Nodo AED 1" actualizado')).toBeVisible();

  await page.reload();
  await irA(page, 'Distribución y colas');
  await expect(page.locator('#group-chat-max-wait')).toHaveText('30 s');
  await expect(page.locator('#group-phone-max-wait')).toHaveText('99 s');
});

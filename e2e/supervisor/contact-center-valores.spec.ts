import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion, pickSelectOption } from './helpers';

/**
 * CONTACT CENTER ES DONDE SE FIJA CON QUÉ NACE UN GRUPO O UN AGENTE (DD-135).
 *
 * Hasta el 2026-09-29 los de grupo vivían en «Valores por defecto», un botón del listado de grupos; Contact Center ›
 * Grupos y › Agentes eran réplicas de la maqueta que no guardaban nada, y el alta de agente nacía con valores clavados
 * en el código. Ahora Contact Center habla con las palabras de cada ficha, guarda, y el alta lee lo guardado.
 *
 * Los de fábrica son los del documento de producto de usuarios y grupos («parámetros por defecto»): transferencia 10 s,
 * espera en cola 15 s, % de servicio 60 s, prioridad baja, estrategia balanceada y desbordar si todos los agentes están
 * inactivos; para agentes, llamadas y transferencias a todo menos la numeración especial, con gestión de dispositivos,
 * activación por grupo y dispositivos externos.
 *
 * Storage limpio por test → cada store vuelve a los de fábrica.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Un número de `sc-inputnumber` lleva su sufijo pegado («15s»): se casa el número entero, no un prefijo suyo. */
const numero = (n: number): RegExp => new RegExp(`^${n}(?!\\d)`);
const interruptor = (page: Page, nombre: string) => page.getByRole('switch', { name: nombre, exact: true });
const casilla = (page: Page, fila: string, columna: string) =>
  page.getByRole('checkbox', { name: `${fila} — ${columna}`, exact: true });
const canal = (page: Page, nombre: string) =>
  page.locator('#group-section-general sc-checkbox').filter({ hasText: new RegExp(`^\\s*${nombre}\\s*$`) });

const DESTINOS = ['Fijos', 'Móviles', 'Internacionales', 'Numeración especial'] as const;
const COLUMNAS = ['Llamadas', 'Transferencias'] as const;
const OVERFLOW = 'Desbordar si todos los agentes están inactivos';

/** La matriz de fábrica: todo menos la numeración especial, en las dos columnas. */
const esperaMatrizDeFabrica = async (page: Page): Promise<void> => {
  for (const fila of DESTINOS) {
    for (const columna of COLUMNAS) {
      const celda = casilla(page, fila, columna);
      if (fila === 'Numeración especial') await expect(celda, `${fila} — ${columna}`).not.toBeChecked();
      else await expect(celda, `${fila} — ${columna}`).toBeChecked();
    }
  }
};

test('Contact Center › Grupos habla como la ficha y trae los valores del documento de producto', async ({ page }) => {
  await goto(page, 'config/aed/grupos');

  await expect(page.locator('h1')).toHaveText('Grupos');
  await expect(page.locator('#grupos-priority')).toHaveText('Baja');
  await expect(page.locator('#grupos-strategy')).toHaveText('Balanceada');
  await expect(page.locator('#grupos-chat-strategy')).toHaveText('Balanceada');
  for (const c of ['phone', 'chat']) {
    await expect(page.locator(`#grupos-${c}-transfer`), c).toHaveText('10 s');
    await expect(page.locator(`#grupos-${c}-max-wait`), c).toHaveText('15 s');
    await expect(page.locator(`#grupos-${c}-service-level`), c).toHaveText('1 min');
  }
  await expect(page.locator('#grupos-overflow')).toBeChecked();
  // Las multiselecciones, el FIFO/LIFO y los códecs de la réplica no son campos de la ficha.
  await expect(page.locator('sc-multiselect')).toHaveCount(0);
});

test('lo que se guarda en Contact Center › Grupos es con lo que nace un grupo nuevo', async ({ page }) => {
  await goto(page, 'config/aed/grupos');
  await pickSelectOption(page, page.locator('#grupos-chat-strategy'), 'Menos conversaciones activas');
  const esperaChat = page.locator('#grupos-chat-max-wait');
  await pickSelectOption(page, esperaChat, '1,5 min');
  await page.locator('#grupos-chat-inactivity-on').click();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Parámetros de grupos guardados')).toBeVisible();

  await goto(page, 'admin/grupos/crear');
  await expect(page.locator('#group-priority')).toHaveText('Baja');
  await page.locator('#group-name').fill(`E2E Por defecto ${Date.now()}`);
  await canal(page, 'Chat').click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(interruptor(page, OVERFLOW)).toBeChecked();
  await expect(page.locator('#group-strategy')).toHaveText('Balanceada');
  await expect(page.locator('#group-phone-transfer')).toHaveText('10 s');
  await expect(page.locator('#group-phone-max-wait')).toHaveText('15 s');
  await expect(page.locator('#group-chat-strategy')).toHaveText('Menos conversaciones activas');
  await expect(page.locator('#group-chat-max-wait')).toHaveText('1,5 min');
  await expect(page.locator('#group-chat-inactivity')).toBeVisible();
});

test('lo guardado con la cola única de antes cae en la de Teléfono y en la de Chat', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sc-group-defaults-v', '1');
    localStorage.setItem(
      'sc-group-defaults',
      JSON.stringify([{ strategy: 'Balanceada', priority: 'Media', voice: 'Femenina · español', advanced: { maxQueueWaitSec: 99, queueSize: 7 } }]),
    );
  });
  await goto(page, 'config/aed/grupos');
  for (const c of ['phone', 'chat']) {
    await expect(page.locator(`#grupos-${c}-max-wait`), c).toHaveText('99 s');
    await expect(page.locator(`#grupos-${c}-queue-size`), c).toHaveValue(numero(7));
  }
  // Leer lo de antes con la forma nueva no es un cambio.
  await expect(page.getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

test('la dirección vieja de «Valores por defecto» lleva a Contact Center › Grupos, y el listado ya no tiene el botón', async ({ page }) => {
  await goto(page, 'admin/grupos/valores-por-defecto');
  await expect(page).toHaveURL(/\/config\/aed\/grupos$/);
  await expect(page.locator('h1')).toHaveText('Grupos');

  await goto(page, 'admin/grupos');
  // La barra ya está pintada: sin esto, contar cero botones pasaría antes de que llegue ninguno.
  await expect(page.getByRole('button', { name: 'Nuevo grupo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Valores por defecto' })).toHaveCount(0);
});

test('Contact Center › Agentes habla como la ficha de agente y trae los valores del documento de producto', async ({ page }) => {
  await goto(page, 'config/aed/agentes');

  await expect(page.locator('h1')).toHaveText('Agentes');
  await expect(page.locator('sc-permission-matrix tbody th')).toHaveText([...DESTINOS]);
  await esperaMatrizDeFabrica(page);
  for (const nombre of ['Gestión de dispositivos', 'Activación por grupo', 'Dispositivos externos']) {
    await expect(interruptor(page, nombre), nombre).toBeChecked();
  }
  await expect(page.locator('#agentes-iframe-url')).toHaveValue('');
  // «Llamadas internas» y el título de la URL eran de la maqueta: la ficha de agente no los tiene.
  await expect(page.getByText('Llamadas internas')).toHaveCount(0);
  await expect(page.getByText('Título (opcional)')).toHaveCount(0);

  // Y el alta de agente nace con lo mismo.
  await goto(page, 'admin/agentes/crear');
  await irASeccion(page, 'Permisos');
  await esperaMatrizDeFabrica(page);
  await expect(interruptor(page, 'Gestión de dispositivos')).toBeChecked();
  await expect(interruptor(page, 'Activación por grupo')).toBeChecked();
  await irASeccion(page, 'Avanzado');
  await expect(interruptor(page, 'Dispositivos externos')).toBeChecked();
});

test('lo que se guarda en Contact Center › Agentes es con lo que nace un agente nuevo', async ({ page }) => {
  await goto(page, 'config/aed/agentes');
  await casilla(page, 'Móviles', 'Llamadas').click();
  await interruptor(page, 'Dispositivos externos').click();
  await page.locator('#agentes-iframe-url').fill('https://crm.ejemplo.com/ficha');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Parámetros de agentes guardados')).toBeVisible();

  await goto(page, 'admin/agentes/crear');
  await irASeccion(page, 'Permisos');
  await expect(casilla(page, 'Móviles', 'Llamadas')).not.toBeChecked();
  await expect(casilla(page, 'Móviles', 'Transferencias')).toBeChecked();
  await irASeccion(page, 'Avanzado');
  await expect(page.locator('#agent-iframe-url')).toHaveValue('https://crm.ejemplo.com/ficha');
  await expect(interruptor(page, 'Dispositivos externos')).not.toBeChecked();
});

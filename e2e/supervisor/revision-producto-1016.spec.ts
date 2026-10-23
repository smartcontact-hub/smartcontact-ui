import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion } from './helpers';

/**
 * REVISIÓN DE PRODUCTO DEL 2026-10-16 (DD-211), menos el árbol de las agendas, que vive en `agenda-agentes.spec.ts`:
 *   1. el globo de la edición en bloque, cerrado con un clic fuera, desbloquea las casillas (§3);
 *   2. la ficha de agente: el PIN, que no sale en el alta y al editar es de solo lectura; sin Teléfono, ni «Grabar
 *      llamadas», ni la matriz de Llamadas, ni Grabación y Salientes en el resumen; Agentes y Grupos en el Destino; fuera
 *      «Automático con preview» y «Actualizar teléfono en login» (§2); un campo de solo lectura no parece editable (§10);
 *   3. la ficha de grupo: el audio saliente en «Mensajes en cola»; cada canal con su nivel al lado (§4);
 *   4. el resultado de guardar, en un toast, y nada junto a los botones de la barra (§5);
 *   5. ✓ en la sección sin obligatorios que se deja en un alta (§6);
 *   6. Contact Center con un solo Guardar: cambiar de sección no pregunta ni pierde nada (§7).
 * Cada prueba hace lo que `main` no hacía antes de DD-211, así que se pone roja si vuelve.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const fila = (page: Page, etiqueta: string) => page.locator('sc-form-section-nav .form-nav__item').filter({ hasText: etiqueta });
const toast = (page: Page) => page.locator('.p-toast-message');

test('§3 · el globo de la edición en bloque, cerrado con un clic fuera, desbloquea las casillas de las filas', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1?seccion=grupos');
  const tabla = page.locator('sc-group-assignment-table');
  const cabecera = tabla.getByRole('columnheader', { name: 'Habilitado', exact: true }).getByRole('checkbox');
  const filas = tabla.locator('tbody').getByRole('checkbox');
  await cabecera.click();
  const globo = page.getByRole('alertdialog', { name: /^¿(Des)?[Hh]abilitar al agente en \d+ grupos\?$/ });
  await expect(globo).toBeVisible();
  await expect(filas.first(), 'mientras pregunta, las filas esperan').toBeDisabled();

  await page.locator('main h1').first().click();
  await expect(globo).toBeHidden();
  await expect(filas.first(), 'cerrado sin responder, las filas vuelven').toBeEnabled();
});

test('§2 · el PIN no sale en el alta y, al editar con la extensión en el teléfono, es de solo lectura', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  await page.getByRole('button', { name: 'Teléfono', exact: true }).first().click();
  await expect(page.locator('#agent-pin')).toHaveCount(0);

  // Leonardo DiCaprio suena en su teléfono.
  await goto(page, 'admin/agentes/editar/5');
  const pin = page.locator('#agent-pin');
  await expect(pin).toBeVisible();
  await expect(pin).toHaveAttribute('readonly', /.*/);
  await expect(pin).not.toHaveValue('');

  // Y no parece editable (§10): sin borde, sobre el fondo suave, con el texto a contraste completo; el email, editable,
  // tiene su borde y su fondo de campo.
  const estilo = (id: string) =>
    page.locator(id).evaluate((el) => {
      const s = getComputedStyle(el);
      return { borde: s.borderTopColor, fondo: s.backgroundColor, texto: s.color };
    });
  const [delPin, delEmail] = [await estilo('#agent-pin'), await estilo('#agent-email')];
  expect(delPin.borde, 'el PIN, sin borde').toBe('rgba(0, 0, 0, 0)');
  expect(delEmail.borde, 'el email, con borde').not.toBe('rgba(0, 0, 0, 0)');
  expect(delPin.fondo, 'el PIN, sobre otro fondo').not.toBe(delEmail.fondo);
  expect(delPin.texto, 'el texto del PIN no se apaga').toBe(delEmail.texto);
  // Se llega con el teclado, y se ve dónde está el foco aunque no haya borde.
  await pin.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(pin).toBeFocused();
  expect(await pin.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
});

test('§2 · sin Teléfono no se ve lo de las llamadas, ni en Configuración ni en el resumen', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1');
  const resumen = page.locator('.resumen');
  await expect(resumen.getByText('Grabación', { exact: true })).toBeVisible();
  await expect(resumen.getByText('Salientes', { exact: true })).toBeVisible();

  await page.locator('.checkbox-grid').first().locator('sc-checkbox').filter({ hasText: /^\s*Teléfono\s*$/ }).getByRole('checkbox').click();
  await expect(resumen.getByText('Grabación', { exact: true })).toHaveCount(0);
  await expect(resumen.getByText('Salientes', { exact: true })).toHaveCount(0);

  await irASeccion(page, 'Configuración');
  await expect(page.getByRole('switch', { name: 'Grabar llamadas', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Llamadas', exact: true })).toHaveCount(0);
  // «Gestión de dispositivos» se queda: también sirve al chat.
  await expect(page.getByRole('switch', { name: /^Gestión de dispositivos/ })).toHaveCount(1);
});

test('§2 · Agentes y Grupos en el Destino; sin «Automático con preview» ni «Actualizar teléfono en login»', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1?seccion=configuracion');
  for (const destino of ['Agentes', 'Grupos']) {
    for (const columna of ['Llamadas', 'Transferencias']) {
      await expect(page.getByRole('checkbox', { name: `${destino} — ${columna}`, exact: true })).toBeChecked();
    }
  }
  await expect(page.getByText('Automático con preview')).toHaveCount(0);
  await expect(page.getByText('Actualizar teléfono en login')).toHaveCount(0);

  // Contact Center › Agentes, la misma matriz; y › General, sin el preview.
  await goto(page, 'config/aed/agentes');
  await expect(page.getByRole('checkbox', { name: 'Agentes — Llamadas', exact: true })).toBeVisible();
  await goto(page, 'config/aed/servicio');
  await expect(page.getByText('Tipo de descuelgue')).toBeVisible();
  await expect(page.getByText('Automático con preview')).toHaveCount(0);
});

test('§2 · un agente guardado antes de Agentes y Grupos en el Destino los tiene permitidos, como de fábrica', async ({ page }) => {
  // Lo guardado antes no traía esas cuatro claves: se guarda la lista y se le quitan, como estaría en un navegador de antes.
  await goto(page, 'admin/agentes/editar/1?seccion=configuracion');
  await page.getByRole('checkbox', { name: 'Fijos — Llamadas', exact: true }).click();
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(toast(page)).toBeVisible();
  await page.evaluate(() => {
    const agentes = JSON.parse(localStorage.getItem('sc-agents') ?? '[]') as { permissions: Record<string, boolean> }[];
    for (const a of agentes) {
      for (const k of ['callsDestAgents', 'callsDestGroups', 'transfersDestAgents', 'transfersDestGroups']) delete a.permissions[k];
    }
    localStorage.setItem('sc-agents', JSON.stringify(agentes));
  });

  await goto(page, 'admin/agentes/editar/2?seccion=configuracion');
  for (const destino of ['Agentes', 'Grupos']) {
    for (const columna of ['Llamadas', 'Transferencias']) {
      await expect(page.getByRole('checkbox', { name: `${destino} — ${columna}`, exact: true })).toBeChecked();
    }
  }
});

test('§4 · el audio saliente va con los mensajes de la cola, no con el teléfono saliente', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1?seccion=distribucion');
  const salientes = page.locator('sc-slot').filter({ has: page.getByText('Llamadas salientes', { exact: true }) });
  await expect(salientes.getByText('Audio saliente')).toHaveCount(0);
  const mensajes = page.locator('sc-slot').filter({ has: page.getByText('Mensajes en cola', { exact: true }) }).first();
  await mensajes.getByRole('button', { name: /Mensajes en cola/ }).first().click();
  await expect(mensajes.getByText('Audio saliente', { exact: true })).toBeVisible();
});

test('§4 · en la tabla de agentes del grupo, cada canal con su nivel al lado', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('sc-groups')) return;
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem('sc-groups', JSON.stringify([{ id: 11, code: '20011', name: 'Niveles juntos', phone: '917945449', priority: 'Baja', channels: ['phone', 'chat', 'email'], strategy: 'Niveles', chatStrategy: 'Niveles', chatSubStrategy: 'Menos chats activos', emailStrategy: 'Niveles' }]));
    localStorage.setItem('sc-group-agent-links-v', '1');
    localStorage.setItem('sc-group-agent-links', JSON.stringify([{ agentId: 1, groupId: 11, channels: ['phone', 'chat', 'email'], active: true, levels: { phone: 1, chat: 2, email: 3 } }]));
  });
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const cabeceras = (await page.locator('sc-agent-channel-table thead th').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  const desde = cabeceras.indexOf('Teléfono');
  expect(cabeceras.slice(desde, desde + 6)).toEqual(['Teléfono', 'Nivel Teléfono', 'Chat', 'Nivel Chat', 'Email', 'Nivel Email']);
});

test('§5 · guardar lo dice un toast, y nada junto a los botones de la barra', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1?seccion=configuracion');
  await page.getByRole('checkbox', { name: 'Fijos — Llamadas', exact: true }).click();
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(toast(page)).toContainText('Agente «Tom Hanks» actualizado');
  await expect(page.locator('.top-bar__resultado')).toHaveCount(0);
});

test('§6 · en el alta, la sección sin obligatorios que se deja lleva su marca verde: «Revisada»', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  await fila(page, 'Configuración').click();
  await fila(page, 'Recursos').click();
  // Con los marcadores del grupo desde DD-225 (DD-222): el ✓ suelto pasa a ser el marcador verde y su línea.
  await expect(fila(page, 'Configuración')).toHaveAccessibleName(/Configuración.*Revisada/);
  await expect(fila(page, 'Configuración').locator('sc-step-marker.sc-step-marker--hecha')).toBeVisible();
});

test('§7 · Contact Center: cambiar de sección no pregunta ni pierde nada, y un solo Guardar guarda las tres', async ({ page }) => {
  await goto(page, 'config/aed/agentes');
  const casilla = page.getByRole('checkbox', { name: 'Numeración especial — Llamadas', exact: true });
  await expect(casilla).not.toBeChecked();
  await casilla.click();
  await expect(fila(page, 'Agentes').locator('.form-nav__dot--changes'), 'el índice marca la sección con cambios').toHaveCount(1);

  await fila(page, 'Grupos').click();
  await expect(page.getByText('¿Descartar cambios?'), 'cambiar de sección no pregunta').toHaveCount(0);
  await expect(page.locator('h1')).toHaveText('Grupos');
  await fila(page, 'Agentes').click();
  await expect(page.getByRole('checkbox', { name: 'Numeración especial — Llamadas', exact: true }), 'lo dejado sin guardar sigue').toBeChecked();

  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(toast(page)).toContainText('Contact Center guardado');
  await expect(fila(page, 'Agentes').locator('.form-nav__dot--changes')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sc-agent-defaults') ?? '[]')[0]?.permissions?.callsDestSpecial)).toBe(true);
});

test('§7 · salir de Contact Center con cambios sin guardar sí avisa', async ({ page }) => {
  await goto(page, 'config/aed/agentes');
  await page.getByRole('checkbox', { name: 'Numeración especial — Llamadas', exact: true }).click();
  await page.locator('.top-bar__home').click();
  await expect(page.getByText('¿Descartar cambios?')).toBeVisible();
});

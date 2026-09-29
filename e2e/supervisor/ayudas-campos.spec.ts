import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

/**
 * LAS AYUDAS BAJO LOS CAMPOS (DD-133): lo que dicen sale del manual de usuario de Voice y del documento de producto de
 * usuarios y grupos, y un lector de pantalla las anuncia con su campo.
 *
 * Lo que fija:
 *   1. La estrategia de teléfono dice qué hace la elegida, y cambia con ella. Antes solo Niveles y Agente exclusivo
 *      tenían una línea, y ninguna se anunciaba.
 *   2. Prioridad se nombra por su etiqueta y dice en qué llamadas cuenta. Antes el lector leía «Baja» como nombre.
 *   3. La ayuda de un `sc-select` se anuncia con el campo: va en el elemento que recibe el foco, no en su envoltura.
 *   4. La ficha de grupo no tiene ⓘ: las cuatro pasaron a su ayuda visible o salieron porque repetían el rótulo.
 *   5. Los desplegables del DS hablan el idioma de la app: «No results», no «Sin resultados», en inglés.
 *   6. El tiempo máximo de espera en cola dice qué pasa al agotarse (DD-135): el grupo es un nodo del VUI y la salida
 *      la elige quien lo diseña. El mismo texto en Teléfono, en Chat y en Contact Center.
 *
 * Storage limpio por test → cada store de admin re-siembra su seed.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const estrategia = (page: Page) => page.getByRole('combobox', { name: 'Estrategia', exact: true });

test('la estrategia de teléfono dice qué hace la elegida, se anuncia con el campo y cambia con ella', async ({ page }) => {
  // El grupo 2 reparte por teléfono con Balanceada.
  await goto(page, 'admin/grupos/editar/2?seccion=distribucion');
  await expect(estrategia(page)).toHaveAccessibleDescription(/^Por turnos: cada llamada va al siguiente agente/);

  await pickSelectOption(page, estrategia(page), 'Más tiempo inactivo');
  await expect(estrategia(page)).toHaveAccessibleDescription('Va al agente disponible que lleva más tiempo sin actividad.');
  await pickSelectOption(page, estrategia(page), 'Niveles');
  await expect(estrategia(page)).toHaveAccessibleDescription(/^Primero, los del nivel 1 que estén disponibles y libres/);
});

test('prioridad se nombra por su etiqueta y dice en qué llamadas cuenta', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/2');
  const prioridad = page.getByRole('combobox', { name: 'Prioridad' });
  await expect(prioridad).toHaveCount(1);
  await expect(prioridad).toHaveAccessibleDescription(/Cuenta en las entrantes y en las salientes, telemarketing incluido\.$/);
});

test('la ayuda de un desplegable se anuncia con él: la extensión del agente dice qué es Tel y qué WebRTC', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1');
  const extension = page.getByRole('combobox', { name: /Extensión/ });
  await expect(extension).toHaveAccessibleDescription(/^Tel: el agente atiende las llamadas en su móvil\. WebRTC:/);
});

test('la ficha de grupo no tiene ⓘ: cada ayuda se lee sin pasar el ratón', async ({ page }) => {
  // Grupo 11: teléfono, Web Chat, WhatsApp y email, las cuatro partes que tenían ⓘ.
  for (const seccion of ['distribucion', 'recursos']) {
    await goto(page, `admin/grupos/editar/11?seccion=${seccion}`);
    // La ⓘ era un botón de solo icono: `sc-button` pinta el glifo como `span.sc-icon-font--info` dentro del `<button>`.
    await expect(page.locator('main button .sc-icon-font--info'), seccion).toHaveCount(0);
  }
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const dominio = page.getByRole('textbox', { name: 'Dominios permitidos' });
  await expect(dominio).toHaveAccessibleDescription(/^Las webs en las que se puede insertar el chat de este grupo/);
  // La ayuda va dentro del campo, así que la fila ya no centra «Añadir» contra campo + ayuda: el botón se alinea con el
  // campo (con la ayuda de dos líneas, cayó 21 px).
  const añadir = page.getByRole('button', { name: 'Añadir' });
  const [c, b] = [await dominio.boundingBox(), await añadir.boundingBox()];
  expect(Math.abs(b!.y + b!.height / 2 - (c!.y + c!.height / 2))).toBeLessThanOrEqual(1);
});

test('los desplegables del DS hablan el idioma de la app: en inglés, «No results» y «Search»', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('sc-language', 'en');
    } catch {
      /* contexto sin storage — ignorar */
    }
  });
  await goto(page, 'admin/grupos');
  await page.getByRole('button', { name: /^Assign agents (of|for|to) ACD demo cuscare/ }).click();
  await page.locator('.agents-panel sc-multiselect').click();
  const filtro = page.locator('.p-multiselect-overlay input[type=text]').first();
  await expect(filtro).toHaveAttribute('placeholder', 'Search');
  await filtro.fill('zzzz');
  await expect(page.locator('.p-multiselect-overlay .p-multiselect-empty-message')).toHaveText('No results');
});

test('el tiempo máximo de espera en cola dice qué pasa al agotarse, en los dos canales y en Contact Center', async ({ page }) => {
  const AYUDA =
    'Si nadie la atiende en este tiempo, la conversación sale del grupo y pasa al siguiente destino, que se elige en el VUI Designer.';
  // El campo se describe con su sufijo delante («s Si nadie…»): se casa el final, que es la ayuda.
  const anunciada = new RegExp(`${AYUDA.replaceAll('.', '\\.')}$`);
  // Grupo 1: solo Teléfono. Grupo 11: también Chat.
  await goto(page, 'admin/grupos/editar/1?seccion=distribucion');
  await expect(page.locator('#group-phone-max-wait')).toHaveAccessibleDescription(anunciada);
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await expect(page.locator('#group-chat-max-wait')).toHaveAccessibleDescription(anunciada);

  // En la lista de ajustes de Contact Center la ayuda va en la fila, bajo el nombre.
  await goto(page, 'config/aed/grupos');
  for (const c of ['phone', 'chat']) {
    const fila = page.locator('.setting-row').filter({ has: page.locator(`#grupos-${c}-max-wait`) });
    await expect(fila, c).toContainText(AYUDA);
  }
});

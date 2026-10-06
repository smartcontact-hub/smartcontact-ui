import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

/**
 * LAS AYUDAS BAJO LOS CAMPOS (DD-133): lo que dicen sale del manual de usuario de Voice y del documento de producto de
 * usuarios y grupos, y un lector de pantalla las anuncia con su campo.
 *
 * Lo que fija:
 *   1. La estrategia de teléfono dice qué hace la elegida, y cambia con ella. Antes solo Niveles y Agente exclusivo
 *      tenían una línea, y ninguna se anunciaba.
 *   2. Prioridad se nombra por su etiqueta y dice en qué llamadas cuenta: solo en las entrantes (DD-141). Antes el
 *      lector leía «Baja» como nombre.
 *   3. La ayuda de un `sc-select` se anuncia con el campo: va en el elemento que recibe el foco, no en su envoltura.
 *   4. La ficha de grupo no tiene ⓘ: las cuatro pasaron a su ayuda visible o salieron porque repetían el rótulo.
 *   5. Los desplegables del DS hablan el idioma de la app: «No results», no «Sin resultados», en inglés.
 *   6. El tiempo máximo de espera en cola dice qué pasa al agotarse (DD-135): el grupo es un nodo del VUI y la salida
 *      la elige quien lo diseña. El mismo texto en Teléfono, en Chat y en Contact Center.
 *   7. Cada ayuda de un campo se anuncia con él, también la que va al lado y no dentro (la fila de un interruptor, de
 *      Contact Center o de Sistema). Hasta el 2026-10-05 esas ayudas se veían y no se oían: ningún control las apuntaba.
 *
 * Storage limpio por test → cada store de admin re-siembra su seed.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const estrategia = (page: Page) => page.locator('#group-channel-phone').getByRole('combobox', { name: 'Estrategia', exact: true });

test('la estrategia de teléfono dice qué hace la elegida, se anuncia con el campo y cambia con ella', async ({ page }) => {
  // El grupo 2 reparte por teléfono con Balanceada.
  await goto(page, 'admin/grupos/editar/2?seccion=distribucion');
  // Hasta DD-142 decía «Por turnos…», que es lo que hace Rotativa: Balanceada reparte de forma equilibrada.
  await expect(estrategia(page)).toHaveAccessibleDescription('Reparte por igual entre los agentes.');

  await pickSelectOption(page, estrategia(page), 'Más tiempo inactivo');
  await expect(estrategia(page)).toHaveAccessibleDescription('Al disponible que lleva más tiempo sin actividad.');
  await pickSelectOption(page, estrategia(page), 'Niveles');
  await expect(estrategia(page)).toHaveAccessibleDescription(/^La conversación será distribuida al agente de mayor nivel/);
});

test('prioridad se nombra por su etiqueta y dice que solo cuenta en las entrantes', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/2');
  const prioridad = page.getByRole('combobox', { name: 'Prioridad' });
  await expect(prioridad).toHaveCount(1);
  // Hasta DD-141 decía, con el manual de Voice, que contaba también en las salientes: la revisión de producto lo corrige.
  await expect(prioridad).toHaveAccessibleDescription(/Solo para las llamadas entrantes\.$/);
  await expect(prioridad).not.toHaveAccessibleDescription(/salientes/);
});

test('la ayuda de un desplegable se anuncia con él: la extensión del agente dice qué es Tel y qué WebRTC', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1');
  const extension = page.getByRole('combobox', { name: /Extensión/ });
  await expect(extension).toHaveAccessibleDescription(/^Tel: en su móvil\. WebRTC:/);
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
  await expect(dominio).toHaveAccessibleDescription(/^Las webs donde se puede insertar el chat/);
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
  await goto(page, 'admin/agentes/editar/1?seccion=recursos');
  await page.locator('sc-multiselect').filter({ has: page.locator('#agent-agendas') }).click();
  const filtro = page.locator('.p-multiselect-overlay input[type=text]').first();
  await expect(filtro).toHaveAttribute('placeholder', 'Search');
  await filtro.fill('zzzz');
  await expect(page.locator('.p-multiselect-overlay .p-multiselect-empty-message')).toHaveText('No results');
});

test('el tiempo máximo de espera en cola dice qué pasa al agotarse, en los dos canales y en Contact Center', async ({ page }) => {
  // Y qué pasa sin siguiente destino (DD-157, revisión de producto del 2026-10-04).
  const AYUDA = 'Sin atender en este tiempo, pasa al siguiente destino del Diseñador VUI; si no hay, termina.';
  // El campo se describe con su sufijo delante («s Si nadie…»): se casa el final, que es la ayuda.
  const anunciada = new RegExp(`${AYUDA.replaceAll('.', '\\.')}$`);
  // Grupo 1: solo Teléfono. Grupo 11: también Chat.
  await goto(page, 'admin/grupos/editar/1?seccion=distribucion');
  await expect(page.locator('#group-phone-max-wait')).toHaveAccessibleDescription(anunciada);
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await expect(page.locator('#group-chat-max-wait')).toHaveAccessibleDescription(anunciada);

  // En la lista de ajustes de Contact Center la ayuda va en la fila, bajo el nombre, y se anuncia con su control.
  await goto(page, 'config/aed/grupos');
  for (const c of ['phone', 'chat']) {
    await expect(page.locator(`#grupos-${c}-max-wait`), c).toHaveAccessibleDescription(anunciada);
  }
});

/** La ayuda de un campo: bajo un interruptor, en una fila de ajustes o bajo un campo de la ficha. */
const AYUDA_DE_CAMPO = '.switch-field__hint, .setting-row__hint, .field__help, .policy-row__hint, .theme-row__hint, .data-row__hint';
/** Su caja: la ayuda es de un campo de ella. */
const CAJA_DEL_CAMPO = '.switch-field, .setting-row, .field, .policy-row, .theme-row, .data-row';
/** Un campo. Una fila con solo un botón no tiene (la de borrar los datos confirma con su propio texto). */
const CAMPO = 'input:not([type=hidden]):not([type=file]), textarea, [role=combobox], [role=switch], [role=group]';

const CON_AYUDAS = [
  'admin/grupos/editar/11?seccion=distribucion',
  'admin/agentes/editar/1',
  'admin/agentes/editar/1?seccion=permisos',
  'admin/agentes/editar/1?seccion=avanzado',
  'admin/usuarios/editar/1',
  'config/aed/agentes',
  'config/aed/grupos',
  'config/sistema',
];

test('cada ayuda de un campo se anuncia con él: fichas, Contact Center y Sistema', async ({ page }) => {
  for (const ruta of CON_AYUDAS) {
    await goto(page, ruta);
    // Lo plegado también cuenta: «Mensajes en cola» arranca cerrado. Un desplegable no es un `button`.
    for (const plegado of await page.locator('main button[aria-expanded="false"]:not([aria-haspopup])').all()) {
      await plegado.click();
    }
    // Cada ayuda, con los campos de su caja que la apuntan. Basta uno: el principal (el interruptor, el desplegable);
    // el texto que sale con una opción ya la ha oído en él. La aserción la hace Playwright con la descripción real.
    const ayudas = await page.evaluate(
      ({ ayuda, caja, campo }) => {
        const visible = (el: Element) => el.getBoundingClientRect().height > 0;
        let n = 0;
        return [...document.querySelectorAll(`main :is(${ayuda})`)].filter(visible).flatMap((el) => {
          const campos = [...(el.closest(caja)?.querySelectorAll(campo) ?? [])].filter(visible);
          if (!campos.length) return [];
          const texto = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
          const marcas = campos
            .filter((c) => !!el.id && (c.getAttribute('aria-describedby') ?? '').split(' ').includes(el.id))
            .map((c) => {
              c.setAttribute('data-ayuda-de', String(++n));
              return String(n);
            });
          return [{ texto, marcas }];
        });
      },
      { ayuda: AYUDA_DE_CAMPO, caja: CAJA_DEL_CAMPO, campo: CAMPO },
    );
    expect(ayudas.length, `${ruta}: sin ayudas que mirar`).toBeGreaterThan(0);
    for (const { texto, marcas } of ayudas) {
      expect.soft(marcas.length, `${ruta} · «${texto.slice(0, 50)}…»: ningún campo de su caja la anuncia`).toBeGreaterThan(0);
      const anunciada = new RegExp(texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'));
      for (const marca of marcas) {
        await expect.soft(page.locator(`[data-ayuda-de="${marca}"]`), `${ruta} · «${texto.slice(0, 40)}…»`).toHaveAccessibleDescription(anunciada);
      }
    }
  }
});

// E1b: Chat comparte el criterio de niveles y anuncia la ayuda con su propio control.
test('Niveles de Chat anuncia su ayuda y nombra Dentro de cada nivel', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  const chat = page.locator('#group-channel-chat');
  const estrategiaChat = chat.getByRole('combobox', { name: 'Estrategia', exact: true });
  await pickSelectOption(page, estrategiaChat, 'Niveles');
  await expect(estrategiaChat).toHaveAccessibleDescription(/^La conversación será distribuida al agente de mayor nivel/);
  await expect(chat.getByRole('combobox', { name: 'Dentro de cada nivel', exact: true })).toBeVisible();
});

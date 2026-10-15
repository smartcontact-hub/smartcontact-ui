import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LAS TABLAS COMUNES Y REPOSITORIOS, revisión de producto del 2026-10-15 (DD-210):
 *   · el botón de crear dice qué crea («+ Nuevo horario») y el buscador nombra la lista («Buscar usuarios…»);
 *   · la celda que cuenta grupos: ninguno es «—», uno es su nombre y, con varios, la cifra con su desplegable;
 *   · al abrir una lista por primera vez, cada columna compacta mide lo que su contenido, y «Restablecer» vuelve ahí;
 *   · Plantillas: hasta tres grupos y «+N más», y apagados los que no atienden su canal, con su porqué;
 *   · Agendas: sin la columna «Código» en sus agentes, y los contactos con su selector «Columnas», con buscador.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const barra = (page: Page) => page.locator('sc-top-bar');

test('crear dice qué crea, y el buscador nombra la lista', async ({ page }) => {
  await goto(page, 'admin/horarios');
  await expect(barra(page).getByRole('button', { name: 'Nuevo horario', exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('Buscar horarios…')).toBeVisible();
  for (const [ruta, buscador] of [
    ['admin/usuarios', 'Buscar usuarios…'],
    ['admin/grupos', 'Buscar grupos…'],
    ['admin/plantillas', 'Buscar plantillas…'],
  ] as const) {
    await goto(page, ruta);
    await expect(page.getByPlaceholder(buscador, { exact: true })).toBeVisible();
  }
});

test('la celda de grupos: ninguno es «—» y «Sin grupos» para el lector; uno, su nombre; varios, la cifra', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sc-group-agent-links-v', '1');
    localStorage.setItem(
      'sc-group-agent-links',
      JSON.stringify([
        { agentId: 1, groupId: 11, channels: ['phone'], active: true },
        { agentId: 3, groupId: 11, channels: ['phone'], active: true },
        { agentId: 3, groupId: 1, channels: ['phone'], active: true },
      ]),
    );
  });
  await goto(page, 'admin/agentes');
  const celda = (nombre: string) => page.getByRole('row', { name: new RegExp(nombre) }).locator('sc-group-popover');

  await expect(celda('Tom Hanks')).toHaveText('Online Support');
  await expect(celda('Tom Hanks').locator('button')).toHaveCount(0);

  const ninguno = celda('Meryl Streep');
  await expect(ninguno.locator('.group-popover__empty')).toHaveText('—');
  await expect(ninguno.locator('.group-popover__empty')).toHaveAttribute('aria-hidden', 'true');
  await expect(ninguno.locator('.group-popover__hidden')).toHaveText('Sin grupos');
  await expect(ninguno.locator('button')).toHaveCount(0);

  await expect(celda('Denzel Washington').getByRole('button', { name: '2 grupos' })).toHaveText('2');
});

test('al abrir, cada columna mide su contenido; lo arrastrado se recuerda y «Restablecer» vuelve a lo medido', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/agentes');
  const email = page.locator('thead th[data-field="email"]');
  await expect(page.locator('tbody tr').first()).toBeVisible();
  // Ningún email visible se corta: la columna mide el más largo de los que se ven.
  await expect
    .poll(() =>
      page.locator('tbody td').evaluateAll((tds) =>
        tds.filter((td) => /@/.test(td.textContent ?? '')).filter((td) => {
          const span = td.querySelector('span')!;
          return span.getBoundingClientRect().right > td.getBoundingClientRect().right - parseFloat(getComputedStyle(td).paddingRight) + 0.5;
        }).length,
      ),
    )
    .toBe(0);
  const medido = await email.evaluate((th) => Math.round(th.getBoundingClientRect().width));

  // Ensanchar a mano se recuerda.
  const tirador = (await email.locator('.p-datatable-column-resizer').boundingBox())!;
  await page.mouse.move(tirador.x + tirador.width / 2, tirador.y + tirador.height / 2);
  await page.mouse.down();
  await page.mouse.move(tirador.x + 40, tirador.y + tirador.height / 2, { steps: 8 });
  await page.mouse.up();
  const arrastrado = await email.evaluate((th) => Math.round(th.getBoundingClientRect().width));
  expect(arrastrado).toBeGreaterThan(medido + 30);
  await page.reload();
  await expect.poll(() => email.evaluate((th) => Math.round(th.getBoundingClientRect().width))).toBe(arrastrado);

  // «Restablecer», en el globo de columnas, lo devuelve a lo medido.
  await page.locator('.page__columns').getByRole('button').click();
  await page.getByRole('dialog', { name: 'Columnas' }).getByRole('button', { name: 'Restablecer' }).click();
  await expect.poll(() => email.evaluate((th) => Math.round(th.getBoundingClientRect().width))).toBe(medido);
});

test('plantillas: hasta tres grupos y «+N más», y los que no atienden su canal, apagados con su porqué', async ({ page }) => {
  await goto(page, 'admin/plantillas/editar/2');
  await page.locator('sc-multiselect:has(#template-groups) .p-multiselect').click();
  const opciones = page.locator('.p-multiselect-overlay .p-multiselect-option');
  // Una plantilla de chat: un grupo solo de teléfono sale apagado y dice por qué.
  const apagada = opciones.filter({ hasText: 'ACD Demo C2CB' });
  await expect(apagada).toHaveAttribute('data-p-disabled', 'true');
  await expect(apagada).toContainText('No atiende Chat');
  const activas = page.locator('.p-multiselect-overlay .p-multiselect-option:not([data-p-disabled="true"])');
  for (let i = 0; i < 4; i++) {
    const opcion = activas.nth(i);
    if ((await opcion.getAttribute('aria-selected')) !== 'true') await opcion.click();
  }
  await page.keyboard.press('Escape');
  const campo = page.locator('sc-multiselect:has(#template-groups)');
  const etiquetas = campo.locator('.p-multiselect-chip-item');
  await expect(etiquetas).toHaveCount(4);
  await expect(etiquetas.nth(3)).toHaveText(/^\+\d+ más$/);
});

test('agendas: los agentes sin «Código», y los contactos con sus columnas a elegir, con buscador', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/1');
  const agentes = page.locator('sc-agenda-agents-table');
  await expect(agentes.getByRole('columnheader')).toHaveText(['', 'Nombre', 'Email']);

  const contactos = page.locator('sc-agenda-contacts-table');
  const cabeceras = contactos.locator('thead th[data-field]');
  await expect(cabeceras).toHaveText(['Nombre', 'Apellidos', 'Empresa', 'Teléfono', 'Email trabajo', '']);

  await contactos.locator('sc-column-toggle').getByRole('button').click();
  const globo = page.getByRole('dialog', { name: 'Columnas' });
  // 34 campos: con tantos, el globo trae buscador.
  await globo.getByPlaceholder('Buscar columnas…').fill('puesto');
  await expect(globo.locator('.column-toggle__row')).toHaveCount(1);
  await globo.getByRole('checkbox', { name: 'Puesto' }).click();
  await page.keyboard.press('Escape');
  await expect(cabeceras).toHaveText(['Nombre', 'Apellidos', 'Empresa', 'Teléfono', 'Email trabajo', 'Puesto', '']);

  // Se recuerda, y «Restablecer» vuelve a las cinco.
  await page.reload();
  await expect(cabeceras).toHaveCount(7);
  await contactos.locator('sc-column-toggle').getByRole('button').click();
  await page.getByRole('dialog', { name: 'Columnas' }).getByRole('button', { name: 'Restablecer' }).click();
  await expect(cabeceras).toHaveCount(6);
});

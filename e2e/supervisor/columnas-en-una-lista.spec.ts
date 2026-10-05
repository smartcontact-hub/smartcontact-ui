import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * ELEGIR Y ORDENAR COLUMNAS EN UN SOLO CONTROL NATIVO (DD-162).
 *
 * La revisión de producto del 2026-10-04: las columnas se elegían en el selector del icono (el MultiSelect de «Column
 * Toggle») y se ordenaban arrastrando las cabeceras de la tabla (`reorderableColumns`), dos sitios para lo mismo. Se
 * pidió un solo control nativo de PrimeNG y sin arrastrar cabeceras. Es el Listbox con `checkbox` y `dragdrop`, en un
 * globo bajo el mismo icono: el patrón de Airtable y Notion (una lista con su casilla y su asa). Lo que fija, en
 * Agentes:
 *   1. el icono abre una lista con todas las columnas, en el orden de la tabla, cada una con su casilla;
 *   2. desmarcar una la oculta, y volver a marcarla la deja donde estaba;
 *   3. arrastrar una en la lista la mueve en la tabla, y sigue ahí al volver a la página;
 *   4. las cabeceras ya no se arrastran;
 *   5. Nombre sale marcada y fija;
 *   6. todo se hace con el teclado, sin arrastrar (WCAG 2.1.1 y 2.5.7): al abrir, el foco entra en la lista; las flechas
 *      eligen la columna (el teclado nativo del Listbox) y «Subir» y «Bajar» la mueven; Escape vuelve al icono. Medido el
 *      2026-10-05: el globo cuelga de `<body>` y el foco no entraba, así que con el teclado no se llegaba a la lista.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const cabeceras = (page: Page) =>
  page.locator('sc-datatable thead th').evaluateAll((ths) =>
    ths.map((th) => (th.textContent ?? '').trim()).filter((t) => t.length > 0),
  );
const boton = (page: Page) => page.locator('.page__action-bar').getByRole('button', { name: /^Columnas, \d+ de \d+$/ });
const lista = (page: Page) => page.getByRole('listbox', { name: /^Columnas/ });
const opcion = (page: Page, nombre: string) => lista(page).getByRole('option', { name: nombre, exact: true });
/** La opción enfocada del Listbox: la nativa, por `aria-activedescendant`, sin elegir nada. */
const enfocada = (page: Page) =>
  lista(page).evaluate((ul) => document.getElementById(ul.getAttribute('aria-activedescendant') ?? '')?.textContent?.trim() ?? null);

test('el botón «Columnas» dice en el foco que abre un diálogo, y si ya está abierto (DD-171)', async ({ page }) => {
  await goto(page, 'admin/agentes');
  await expect(boton(page)).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(boton(page)).toHaveAttribute('aria-expanded', 'false');
  await boton(page).click();
  await expect(lista(page)).toBeVisible();
  await expect(boton(page)).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(lista(page)).toBeHidden();
  await expect(boton(page)).toHaveAttribute('aria-expanded', 'false');
});

test('el icono abre una lista con las columnas en el orden de la tabla, cada una con su casilla', async ({ page }) => {
  await goto(page, 'admin/agentes');
  await expect(boton(page).locator('.sc-icon-font--view_column'), 'el icono de columnas').toHaveCount(1);
  await boton(page).click();
  await expect(lista(page)).toBeVisible();
  await expect(lista(page)).toHaveAttribute('aria-multiselectable', 'true');
  const enLista = await lista(page).getByRole('option').allTextContents();
  const enTabla = await cabeceras(page);
  // Las visibles, en el mismo orden en la lista que en la tabla.
  expect(enLista.map((t) => t.trim()).filter((t) => enTabla.includes(t))).toEqual(enTabla);
  await expect(lista(page).locator('.p-checkbox').first()).toBeVisible();
  await expect(opcion(page, 'Nombre')).toHaveAttribute('aria-selected', 'true');
  await expect(opcion(page, 'Nombre')).toHaveAttribute('aria-disabled', 'true');
});

test('desmarcar una columna la oculta, y volver a marcarla la deja donde estaba', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  await boton(page).click();
  await opcion(page, 'Canales').click();
  await expect.poll(() => cabeceras(page)).not.toContain('Canales');
  await expect(boton(page)).toHaveAccessibleName(new RegExp(`^Columnas, ${antes.length - 1} de `));
  await opcion(page, 'Canales').click();
  await expect.poll(() => cabeceras(page)).toEqual(antes);
});

test('arrastrar una columna en la lista la mueve en la tabla, y se queda al volver', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  const [primera, segunda] = [antes[1]!, antes[2]!];
  await boton(page).click();
  const origen = await opcion(page, segunda).boundingBox();
  const destino = await opcion(page, primera).boundingBox();
  await page.mouse.move(origen!.x + origen!.width / 2, origen!.y + origen!.height / 2);
  await page.mouse.down();
  await page.mouse.move(destino!.x + destino!.width / 2, destino!.y + 2, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => (await cabeceras(page)).slice(1, 3)).toEqual([segunda, primera]);
  await page.reload();
  await expect.poll(async () => (await cabeceras(page)).slice(1, 3)).toEqual([segunda, primera]);
});

test('las cabeceras de la tabla ya no se arrastran', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  // El mismo gesto que movía una cabecera con `reorderableColumns` (la prueba de DD-153): agarrar por el texto.
  await page
    .locator('sc-datatable thead th[data-field="channels"] .sc-datatable__header-label')
    .dragTo(page.locator('sc-datatable thead th[data-field="extension"]'));
  await page.waitForTimeout(300);
  expect(await cabeceras(page)).toEqual(antes);
});

test('todo con el teclado, sin arrastrar: el foco entra en la lista, «Subir» y «Bajar» mueven y Escape vuelve al icono', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  const i = antes.indexOf('Email');
  expect(i, 'Email se ve y tiene una movible delante').toBeGreaterThan(1);
  const anterior = antes[i - 1]!;

  await boton(page).focus();
  await page.keyboard.press('Enter');
  await expect(lista(page), 'al abrir, el foco entra en la lista').toBeFocused();
  // `enfocada()` lee `aria-activedescendant`, que un `effect()` escribe a partir del foco de PrimeNG
  // (`announceFocusedOption`, en list-page.component.ts): un efecto no asienta en el mismo tick que la
  // tecla. Leerlo justo tras cada `ArrowDown` podía dar el valor de ANTES de esa tecla y el bucle se
  // quedaba corto (medido el 2026-10-05: intermitente, solo bajo carga — en aislado no se reproduce).
  for (let n = 0; n < 12 && (await enfocada(page)) !== 'Email'; n++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
  }
  expect(await enfocada(page)).toBe('Email');
  // Las flechas solo enfocan: la columna sigue a la vista.
  await expect(opcion(page, 'Email')).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Subir Email', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await cabeceras(page)).slice(i - 1, i + 1)).toEqual(['Email', anterior]);
  await expect(page.getByRole('button', { name: 'Subir Email', exact: true }), 'el foco se queda para seguir').toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Bajar Email', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => cabeceras(page)).toEqual(antes);

  await page.keyboard.press('Escape');
  await expect(lista(page)).toBeHidden();
  await expect(boton(page), 'Escape vuelve al icono').toBeFocused();
});

test('«Subir» lleva una columna hasta debajo de la fija, no más, con el ratón y sin arrastrar, y se queda al volver', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  const ultima = antes[antes.length - 1]!;
  await boton(page).click();
  await lista(page).focus();
  for (let n = 0; n < 12 && (await enfocada(page)) !== ultima; n++) await page.keyboard.press('ArrowDown');
  // La lista tiene también las ocultas: sube por encima de ellas hasta Nombre, que es fija. Cada
  // clic puede pasarla por encima de una oculta, que no mueve ninguna cabecera visible: `cabeceras()`
  // no sirve de condición de parada, solo `isEnabled()`.
  const subir = page.getByRole('button', { name: `Subir ${ultima}`, exact: true });
  // `currentColumn` (de dónde sale `disabled`) lo pone un `effect()` que sigue el foco de la lista, y
  // un efecto no asienta en el mismo tick que el clic: leer `isEnabled()` justo después daba el estado
  // de ANTES del último clic, el bucle lo seguía viendo «enabled» y lo pulsaba una vez de más contra
  // un botón que ya iba camino de deshabilitarse — colgando 90s. El mismo margen que ya usa esta
  // suite más abajo (al arrastrar una cabecera) le da tiempo a asentar.
  for (let n = 0; n < 12 && (await subir.isEnabled()); n++) {
    await subir.click();
    await page.waitForTimeout(300);
  }
  await expect(subir, 'encima solo queda Nombre, que es fija').toBeDisabled();
  await expect.poll(async () => (await cabeceras(page)).slice(0, 2)).toEqual(['Nombre', ultima]);
  await page.reload();
  await expect.poll(async () => (await cabeceras(page)).slice(0, 2)).toEqual(['Nombre', ultima]);
});

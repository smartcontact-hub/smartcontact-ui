import { expect, test, type Page } from '@playwright/test';

import { goto } from './helpers';

/**
 * PLANTILLAS: SU EDITOR EN PÁGINA, EL CANAL DE WHATSAPP, LOS GRUPOS Y LOS DATOS. Revisión de producto:
 *   1. crear y editar una plantilla va en su propia página (en el panel de la lista, la caja del contenido era
 *      demasiado pequeña): título, canal, el editor de primeng.dev/editor y los grupos que la usan;
 *   2. hay plantillas de WhatsApp, que guardan su texto con sus marcas (`*negrita*`);
 *   3. la tabla enseña el contenido en texto plano, sin etiquetas, y los grupos con su desplegable;
 *   4. «Duplicar» y el menú «Acciones» (importar, exportar, descargar plantilla) como en el resto de listas.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const guardadas = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('sc-templates') ?? '[]') as { id: number; title: string; type: string; body: string }[]);
const guardar = (page: Page) => page.locator('sc-top-bar').getByRole('button', { name: /^(Guardar|Crear plantilla)$/ });
const editor = (page: Page) => page.locator('.ql-editor');

test('la lista: tres pestañas, contenido en texto plano, grupos con su desplegable, y la fila abre el editor', async ({ page }) => {
  await goto(page, 'admin/plantillas');
  await expect(page.getByRole('tab')).toHaveText(['Chat', 'Email', 'WhatsApp']);
  const cuerpo = page.locator('[data-testid="templates-table"] .table__body-text').first();
  await expect(cuerpo).not.toContainText('<');
  await expect(page.locator('[data-testid="templates-table"] sc-group-popover').first()).toBeVisible();

  await page.getByRole('tab', { name: 'WhatsApp' }).click();
  await expect(page.locator('[data-testid="templates-table"] .p-datatable-tbody > tr')).toHaveCount(2);
  await page.locator('[data-testid="templates-table"] .p-datatable-tbody > tr', { hasText: 'Confirmación de cita' }).locator('td').nth(1).click();
  await expect(page).toHaveURL(/\/admin\/plantillas\/editar\/13$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Confirmación de cita');
  // El contenido de WhatsApp se enseña con su formato: la marca `*…*` es negrita en el editor.
  await expect(editor(page).locator('strong')).toContainText('{fecha}');
  // Cargar el contenido no es un cambio: nada que guardar ni deshacer.
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

test('crear una de WhatsApp: la negrita se guarda con su marca, y los grupos, en el grupo', async ({ page }) => {
  await goto(page, 'admin/plantillas');
  await page.getByRole('tab', { name: 'WhatsApp' }).click();
  await page.locator('sc-top-bar').getByRole('button', { name: 'Nueva plantilla' }).click();
  await expect(page).toHaveURL(/\/admin\/plantillas\/crear\?tipo=whatsapp$/);
  await expect(page.getByRole('button', { name: 'WhatsApp', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // WhatsApp solo ofrece negrita, cursiva y tachado.
  await expect(page.locator('.ql-underline')).toHaveCount(0);
  await expect(page.locator('.ql-link')).toHaveCount(0);

  await page.getByLabel('Título').fill('Bienvenida nueva');
  await editor(page).click();
  await page.locator('.ql-bold').click();
  await page.keyboard.type('Hola');
  await page.locator('.ql-bold').click();
  await page.keyboard.type(' mundo');
  await guardar(page).click();
  await expect(page).toHaveURL(/\/admin\/plantillas\/editar\/\d+$/);
  const nueva = (await guardadas(page)).find((t) => t.title === 'Bienvenida nueva');
  expect(nueva).toMatchObject({ type: 'whatsapp', body: '*Hola* mundo' });
});

test('crear de email: HTML saneado, y no se guarda sin título ni contenido', async ({ page }) => {
  await goto(page, 'admin/plantillas/crear?tipo=email');
  await expect(guardar(page)).toBeDisabled();
  await page.getByLabel('Título').fill('Con enlace');
  await expect(guardar(page)).toBeDisabled();
  await editor(page).click();
  await page.keyboard.type('Texto <b>no es negrita</b>');
  await expect(guardar(page)).toBeEnabled();
  await guardar(page).click();
  await expect(page).toHaveURL(/\/admin\/plantillas\/editar\/\d+$/);
  const t = (await guardadas(page)).find((x) => x.title === 'Con enlace');
  // Lo escrito con símbolos es texto: se escapa, no se ejecuta.
  expect(t?.body).toBe('<p>Texto &lt;b&gt;no es negrita&lt;/b&gt;</p>');
});

test('un título repetido no se guarda', async ({ page }) => {
  await goto(page, 'admin/plantillas/crear');
  await page.getByLabel('Título').fill('saludo inicial');
  await editor(page).click();
  await page.keyboard.type('x');
  await expect(guardar(page)).toBeDisabled();
  await expect(page.getByText('Ya existe una plantilla con este título').first()).toBeVisible();
});

test('grupos: asignar uno desde la plantilla lo deja en la tabla', async ({ page }) => {
  await goto(page, 'admin/plantillas/editar/2');
  await page.locator('sc-multiselect:has(#template-groups) .p-multiselect').click();
  await page.locator('.p-multiselect-overlay .p-multiselect-option').first().click();
  await page.keyboard.press('Escape');
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' })).toBeEnabled();
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' }).click();
  await expect
    .poll(async () => page.evaluate(() => (JSON.parse(localStorage.getItem('sc-groups') ?? '[]') as { templates?: number[] }[]).filter((g) => g.templates?.includes(2)).length))
    .toBeGreaterThan(0);
});

test('duplicar crea la copia con su nombre; «Acciones» trae importar, exportar y la plantilla', async ({ page }) => {
  await goto(page, 'admin/plantillas');
  const fila = page.locator('[data-testid="templates-table"] .p-datatable-tbody > tr', { hasText: 'Saludo inicial' });
  await fila.getByLabel('Más acciones').click();
  await page.getByRole('menuitem', { name: 'Duplicar' }).click();
  await expect(page.locator('[data-testid="templates-table"] .p-datatable-tbody > tr', { hasText: 'Saludo inicial (copia)' })).toBeVisible();

  await page.getByRole('button', { name: 'Acciones', exact: true }).click();
  await expect(page.getByRole('menuitem')).toHaveText([/Importar plantillas/, /Exportar plantillas/, /Descargar plantilla CSV/]);
});

test('importar: la vista previa dice qué entra y qué no, y lo importado aparece en su pestaña', async ({ page }) => {
  await goto(page, 'admin/plantillas');
  await page.getByRole('button', { name: 'Acciones', exact: true }).click();
  await page.getByRole('menuitem', { name: /Importar plantillas/ }).click();
  const d = page.getByRole('dialog', { name: 'Importar plantillas' });
  const csv = ['Título;Canal;Contenido', 'Recordatorio;WhatsApp;Hola *{cliente}*\\nHasta pronto', ';chat;sin título', 'Saludo inicial;chat;repetida'].join('\n');
  await d.locator('input[type="file"]').setInputFiles({ name: 'plantillas.csv', mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf8') });
  await expect(d).toContainText('Se creará 1 plantilla');
  await expect(d).toContainText('Línea 3: falta el título');
  await expect(d).toContainText('1 ya existía');
  await d.getByRole('button', { name: 'Crear 1 plantilla' }).click();
  await expect(d).toBeHidden();
  await page.getByRole('tab', { name: 'WhatsApp' }).click();
  await expect(page.locator('[data-testid="templates-table"] .p-datatable-tbody > tr', { hasText: 'Recordatorio' })).toBeVisible();
});

import { expect, test, type Page } from '@playwright/test';

import { goto } from './helpers';

/**
 * PLANTILLAS: SU EDITOR EN PÁGINA, EL CANAL DE WHATSAPP, LOS AGENTES Y LOS DATOS. Revisión de producto:
 *   1. crear y editar una plantilla va en su propia página (en el panel de la lista, la caja del contenido era
 *      demasiado pequeña): nombre, canal, el editor de primeng.dev/editor y los agentes a los que se asigna (COA
 *      SISMAC-4438: solo a agentes, en una tabla con la columna «Grupos»);
 *   2. hay plantillas de WhatsApp, que guardan su texto con sus marcas (`*negrita*`);
 *   3. la lista no lleva pestañas: el canal es una columna; el contenido, en texto plano, sin etiquetas, y los agentes, su cifra;
 *   4. «Duplicar» y el menú «Acciones» (importar, exportar, descargar plantilla) como en el resto de listas.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const guardadas = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('sc-templates') ?? '[]') as { id: number; title: string; type: string; body: string }[]);
const guardar = (page: Page) => page.locator('sc-top-bar').getByRole('button', { name: /^(Guardar|Crear plantilla)$/ });
const editor = (page: Page) => page.locator('.ql-editor');

test('la lista: sin pestañas, con su columna Canal, contenido en texto plano, agentes en cifra, y la fila abre el editor', async ({ page }) => {
  await goto(page, 'admin/plantillas');
  await expect(page.getByRole('tab')).toHaveCount(0);
  const tabla = page.locator('[data-testid="templates-table"]');
  await expect(tabla.locator('thead th[data-field]')).toHaveText(['Título', 'Canal', 'Contenido', 'Agentes', 'Modificada', '']);
  const cuerpo = tabla.locator('.table__body-text').first();
  await expect(cuerpo).not.toContainText('<');
  // Chat, Email y WhatsApp, todas en la misma lista.
  const canales = await tabla.locator('tbody tr td:nth-child(3)').allTextContents();
  expect(new Set(canales.map((c) => c.trim()))).toEqual(new Set(['Chat', 'Email', 'WhatsApp']));
  // La fecha, como en Agendas: «9 oct 2026».
  await expect(tabla.locator('tbody tr').first().locator('.table__updated-text')).toHaveText(/^\d{1,2} \p{L}{3,4}\.? \d{4}$/u);

  await tabla.locator('.p-datatable-tbody > tr', { hasText: 'Confirmación de cita' }).locator('td').nth(1).click();
  await expect(page).toHaveURL(/\/admin\/plantillas\/editar\/13$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Confirmación de cita');
  // El contenido de WhatsApp se enseña con su formato: la marca `*…*` es negrita en el editor.
  await expect(editor(page).locator('strong')).toContainText('{fecha}');
  // Cargar el contenido no es un cambio: nada que guardar ni deshacer.
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

test('crear una de WhatsApp: la negrita se guarda con su marca', async ({ page }) => {
  await goto(page, 'admin/plantillas/crear?tipo=whatsapp');
  await expect(page.getByRole('button', { name: 'WhatsApp', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // WhatsApp solo ofrece negrita, cursiva y tachado.
  await expect(page.locator('.ql-underline')).toHaveCount(0);
  await expect(page.locator('.ql-link')).toHaveCount(0);

  await page.locator('#template-title').fill('Bienvenida nueva');
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

test('crear de email: HTML saneado; sin título ni contenido, lo dice cada campo al pulsar (DD-217)', async ({ page }) => {
  await goto(page, 'admin/plantillas/crear?tipo=email');
  // «Crear plantilla», siempre activo y sin «Falta: …» al lado: callado hasta que se pulsa.
  await expect(guardar(page)).toBeEnabled();
  await expect(page.locator('.form-save-reason')).toHaveCount(0);
  await expect(page.getByText('El título es obligatorio')).toHaveCount(0);
  await guardar(page).click();
  await expect(page).toHaveURL(/\/admin\/plantillas\/crear/);
  await expect(page.getByText('El título es obligatorio')).toBeVisible();
  await expect(page.getByText('El contenido es obligatorio')).toBeVisible();
  await expect(page.locator('#template-title')).toBeFocused();

  // El rojo se va en vivo al arreglarlo; el siguiente intento lleva al contenido, que es lo que queda.
  await page.locator('#template-title').fill('Con enlace');
  await expect(page.getByText('El título es obligatorio')).toHaveCount(0);
  await guardar(page).click();
  await expect(editor(page)).toBeFocused();
  await page.keyboard.type('Texto <b>no es negrita</b>');
  await expect(page.getByText('El contenido es obligatorio')).toHaveCount(0);
  await guardar(page).click();
  await expect(page).toHaveURL(/\/admin\/plantillas\/editar\/\d+$/);
  const t = (await guardadas(page)).find((x) => x.title === 'Con enlace');
  // Lo escrito con símbolos es texto: se escapa, no se ejecuta.
  expect(t?.body).toBe('<p>Texto &lt;b&gt;no es negrita&lt;/b&gt;</p>');
});

test('un título repetido se permite: no avisa y se guarda (DD-235)', async ({ page }) => {
  await goto(page, 'admin/plantillas/crear');
  await page.locator('#template-title').fill('saludo inicial');
  await editor(page).click();
  await page.keyboard.type('x');
  await expect(page.getByText('Ya existe una plantilla con este título')).toHaveCount(0);
  await guardar(page).click();
  await expect(page).toHaveURL(/\/admin\/plantillas\/editar\/\d+$/);
  expect((await guardadas(page)).some((t) => t.title === 'saludo inicial' && t.body === '<p>x</p>')).toBe(true);
});

test('agentes: asignar uno desde la plantilla lo deja en el agente, sin tocar a su grupo', async ({ page }) => {
  await goto(page, 'admin/plantillas/editar/2');
  const tabla = page.locator('sc-agent-assignment-table');
  await expect(tabla.locator('thead th[data-field]')).toHaveText(['Nombre', 'Email', 'Grupos']);
  const grupos = (await page.evaluate(() => JSON.parse(localStorage.getItem('sc-groups') ?? '[]') as { id: number; templates?: number[] }[])).map((g) => [g.id, g.templates ?? []]);
  const antes = await page.evaluate(() => (JSON.parse(localStorage.getItem('sc-agents') ?? '[]') as { templates?: number[] }[]).filter((a) => a.templates?.includes(2)).length);
  const sinMarcar = tabla.getByRole('checkbox', { name: /^Asignar la plantilla a / }).and(page.locator(':not(:checked)'));
  await sinMarcar.first().click();
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' })).toBeEnabled();
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' }).click();
  await expect
    .poll(async () => page.evaluate(() => (JSON.parse(localStorage.getItem('sc-agents') ?? '[]') as { templates?: number[] }[]).filter((a) => a.templates?.includes(2)).length))
    .toBe(antes + 1);
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem('sc-groups') ?? '[]') as { id: number; templates?: number[] }[])).map((g) => [g.id, g.templates ?? []])).toEqual(grupos);
});

test('el editor no ofrece variables: la ayuda de `{agente}`, `{cliente}`… se fue hasta que existan', async ({ page }) => {
  await goto(page, 'admin/plantillas/editar/1');
  await expect(page.getByText('Variables:')).toHaveCount(0);
});

test('duplicar abre «Nueva plantilla» con la copia («X (1)») sin crearla; «Acciones» trae importar y exportar (DD-234)', async ({ page }) => {
  await goto(page, 'admin/plantillas');
  const fila = page.locator('[data-testid="templates-table"] .p-datatable-tbody > tr', { hasText: 'Saludo inicial' });
  await fila.getByLabel('Más acciones').click();
  await page.getByRole('menuitem', { name: 'Duplicar' }).click();
  await expect(page).toHaveURL(/\/admin\/plantillas\/crear\?seedFromId=\d+$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Saludo inicial (1)');
  await expect(page.locator('#template-title')).toHaveValue('Saludo inicial (1)');
  await expect(editor(page)).toContainText('soy {agente}');
  // Todavía no existe; salir sin tocar nada no pregunta.
  expect((await guardadas(page)).map((t) => t.title)).not.toContain('Saludo inicial (1)');
  await page.getByRole('link', { name: 'Plantillas', exact: true }).first().click();
  await expect(page).toHaveURL(/\/admin\/plantillas$/);
  await expect(page.getByRole('alertdialog', { name: '¿Descartar cambios?' })).toHaveCount(0);

  // «Crear plantilla» la crea, con el mismo canal y contenido.
  await fila.getByLabel('Más acciones').click();
  await page.getByRole('menuitem', { name: 'Duplicar' }).click();
  await guardar(page).click();
  await expect(page).toHaveURL(/\/admin\/plantillas\/editar\/\d+$/);
  const copia = (await guardadas(page)).find((t) => t.title === 'Saludo inicial (1)');
  expect(copia).toMatchObject({ type: 'chat' });
  expect(copia?.body).toContain('soy {agente}');

  await goto(page, 'admin/plantillas');
  await page.getByRole('button', { name: 'Acciones', exact: true }).click();
  await expect(page.getByRole('menuitem')).toHaveText(['Importar', 'Exportar']);
});

test('importar: la vista previa dice qué entra y qué no, y lo importado aparece en la lista', async ({ page }) => {
  await goto(page, 'admin/plantillas');
  await page.getByRole('button', { name: 'Acciones', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Importar', exact: true }).click();
  const d = page.getByRole('dialog', { name: 'Importar plantillas' });
  const csv = ['Título;Canal;Contenido', 'Recordatorio;WhatsApp;Hola *{cliente}*\\nHasta pronto', ';chat;sin título', 'Saludo inicial;chat;repetida'].join('\n');
  await d.locator('input[type="file"]').setInputFiles({ name: 'plantillas.csv', mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf8') });
  await expect(d).toContainText('Se creará 1 plantilla');
  await expect(d).toContainText('Línea 3: falta el título');
  await expect(d).toContainText('1 ya existía');
  await d.getByRole('button', { name: 'Crear 1 plantilla' }).click();
  await expect(d).toBeHidden();
  await expect(page.locator('[data-testid="templates-table"] .p-datatable-tbody > tr', { hasText: 'Recordatorio' })).toBeVisible();
});

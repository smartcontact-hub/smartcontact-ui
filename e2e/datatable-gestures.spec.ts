import { expect, test } from '@playwright/test';

/**
 * GESTOS DE FILA Y COLUMNAS CONMUTABLES DE `sc-datatable` (B4).
 *
 * Por qué existe este fichero y no basta con el piloto del supervisor: de las
 * 4 capacidades que B4 añade, el piloto (`labels` y `templates`) solo ejercita
 * dos. Ninguna de esas dos tablas tiene click de fila ni selector de columnas
 * — se comprobó contando los `(click)` de sus `<tr>`, que son 0. Así que
 * `rowClick` y `visibleColumns` no tienen ningún consumidor real que los
 * pruebe, y sin esto entrarían al núcleo del DS a ciegas.
 *
 * La aserción que más pesa es la del contador: marcar la casilla NO debe
 * abrir. Es exactamente el fallo que mordió en la Ola 6 (el `stopPropagation`
 * de la casilla se comía el gesto de la fila), y ahí el bug vivía justo donde
 * todo el mundo pincha.
 */

const STORY = '[data-testid="sc-datatable-gestures"]';

test.describe('sc-datatable · gestos de fila', () => {
  test.beforeEach(async ({ page }) => {
    // Enrutado por HASH. Sin la almohadilla, el deep-link rompe las rutas de
    // los assets y la app no llega a arrancar: la página sale en blanco y los
    // tests fallan por el arnés, no por el componente.
    await page.goto('/#/components/datatable');
    // Best-effort: acotada y sin `throw`. Sin acotar tumba el build sin que
    // falle ninguna aserción (pasó en CI con el datepicker).
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
    await expect(page.locator(STORY)).toBeVisible();
  });

  test('la fila abre; la casilla selecciona y NO abre', async ({ page }) => {
    const dt = page.locator(STORY);
    const openCount = page.getByTestId('dt-open-count');
    const selected = page.getByTestId('dt-gestures-selected');

    await expect(openCount).toHaveText('0');
    await expect(selected).toHaveText('0');

    // 1. Click en el cuerpo de la fila → abre.
    await dt.locator('tbody tr').first().locator('td').nth(1).click();
    await expect(page.getByTestId('dt-last-opened')).toHaveText('Inés García');
    await expect(openCount).toHaveText('1');
    // …y NO selecciona: en `multiple` la selección es de la casilla.
    await expect(selected).toHaveText('0');

    // 2. Click en la casilla → selecciona y el contador de aperturas NO se mueve.
    await dt.locator('tbody tr').nth(1).locator('p-tablecheckbox').click();
    await expect(selected).toHaveText('1');
    await expect(openCount).toHaveText('1');

    // 3. Y una segunda casilla tampoco abre: si el gesto estuviera mal
    //    repartido, marcar 3 filas abriría 3 veces el detalle.
    await dt.locator('tbody tr').nth(2).locator('p-tablecheckbox').click();
    await expect(selected).toHaveText('2');
    await expect(openCount).toHaveText('1');
  });

  test('el click derecho emite la fila y cancela el menú nativo', async ({ page }) => {
    const dt = page.locator(STORY);

    await expect(page.getByTestId('dt-last-context')).toHaveText('—');

    await dt.locator('tbody tr').nth(1).locator('td').nth(1).click({ button: 'right' });
    await expect(page.getByTestId('dt-last-context')).toHaveText('Marc Soler');

    // El click derecho no abre: son gestos distintos con handlers distintos.
    await expect(page.getByTestId('dt-open-count')).toHaveText('0');
  });

  test('rowStyleClass pinta solo las filas que cumplen el predicado', async ({ page }) => {
    const dt = page.locator(STORY);

    // 2 de los 7 agentes están inactivos (Lucía Pérez, Sara Vidal).
    await expect(dt.locator('tbody tr')).toHaveCount(7);
    await expect(dt.locator('tbody tr.dt-row--inactive')).toHaveCount(2);

    // La clase va en la fila que toca, no en cualquiera.
    await expect(dt.locator('tbody tr').nth(2)).toHaveClass(/dt-row--inactive/);
    await expect(dt.locator('tbody tr').first()).not.toHaveClass(/dt-row--inactive/);
  });

  test('visibleColumns esconde columnas Y manda en el orden', async ({ page }) => {
    const dt = page.locator(STORY);
    const headers = dt.locator('thead th');

    // 1 casilla + 3 columnas.
    await expect(headers).toHaveCount(4);
    await expect(headers.nth(1)).toHaveText('Nombre');
    await expect(headers.nth(2)).toHaveText(/Extensión/);
    await expect(headers.nth(3)).toHaveText('Estado');

    // Esconder una columna la quita de la cabecera Y de las celdas.
    await page.getByTestId('dt-toggle-extension').click();
    await expect(headers).toHaveCount(3);
    await expect(dt.locator('tbody tr').first().locator('td')).toHaveCount(3);
    await expect(dt.locator('thead')).not.toContainText('Extensión');

    // Devolverla la recoloca AL FINAL: el orden lo manda el array de visibles,
    // no el orden en que se declararon las columnas.
    await page.getByTestId('dt-toggle-extension').click();
    await expect(headers).toHaveCount(4);
    await expect(headers.nth(3)).toHaveText(/Extensión/);

    // Y invertir el array reordena la tabla entera.
    await page.getByTestId('dt-reverse').click();
    await expect(headers.nth(1)).toHaveText(/Extensión/);
    await expect(headers.nth(3)).toHaveText('Nombre');
  });

  test('la fila vacía abarca solo las columnas visibles', async ({ page }) => {
    const dt = page.locator(STORY);

    // Con 3 columnas + casilla, el colspan de la fila vacía es 4; al esconder
    // una columna debe bajar a 3. Si `colspan` siguiera leyendo `columns()` en
    // vez de las visibles, la fila vacía desbordaría la tabla.
    await page.getByTestId('dt-toggle-extension').click();
    await expect(dt.locator('thead th')).toHaveCount(3);

    // Vaciar la tabla usa el botón de la story MVP (comparten `agents()`).
    await page.getByTestId('dt-clear').click();
    await expect(dt.locator('.dt-empty')).toBeVisible();
    await expect(dt.locator('tbody td[colspan]')).toHaveAttribute('colspan', '3');
  });
});

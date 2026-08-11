import { expect, test, type Page } from '@playwright/test';

/**
 * CusCare · navegación y gestos.
 *
 * Estos tests CONDUCEN la app (clics reales con hit-testing), no consultan el
 * DOM: comprueban que cada ruta del sidebar y del engranaje llega a su vista,
 * que el item activo se marca, y que las pestañas del detalle conmutan.
 *
 * Además fijan tres cosas MEDIDAS del sitio real que son fáciles de romper sin
 * darse cuenta al tocar CSS (alto de fila, alto de cabecera, ruta de "Groups").
 */

const HOME = '/#/private/cuscare/tickets';

/** Espera a que el shell esté pintado antes de tocar nada. */
async function goto(page: Page, hash: string) {
  await page.goto(hash);
  await expect(page.locator('.nav__item').first()).toBeVisible();
}

test.describe('sidebar', () => {
  test('los 4 items navegan a su vista', async ({ page }) => {
    await goto(page, HOME);

    const cases: { label: string; url: RegExp; marker?: string; field?: string }[] = [
      { label: 'Dashboard', url: /#\/private\/cuscare\/dashboard/, marker: 'Workload' },
      // Search ya no es una maqueta: se comprueba por su campo REAL, no por el
      // texto de un <option> (que está oculto dentro del <select>).
      { label: 'Search', url: /#\/private\/cuscare\/customer/, field: 'Término de búsqueda' },
      { label: 'Manage MO in error', url: /#\/private\/cuscare\/mo-management/, marker: 'No data to show' },
      { label: 'Tickets', url: /#\/private\/cuscare\/tickets/, marker: 'New ticket' },
    ];

    for (const c of cases) {
      await page.getByRole('link', { name: c.label, exact: true }).click();
      await expect(page).toHaveURL(c.url);
      if (c.field) {
        await expect(page.getByLabel(c.field)).toBeVisible();
      } else {
        await expect(page.getByText(c.marker!, { exact: false }).first()).toBeVisible();
      }
    }
  });

  test('el item activo se marca y los demás no', async ({ page }) => {
    await goto(page, '/#/private/cuscare/dashboard');

    const active = page.locator('.nav__item.is-active');
    await expect(active).toHaveCount(1);
    await expect(active).toContainText('Dashboard');
  });

  test('el detalle de un ticket mantiene "Tickets" marcado en el nav', async ({ page }) => {
    // Regla del shell: /tickets/ticket/:id normaliza a /tickets. Si alguien
    // toca `normalize()`, esto lo caza.
    await goto(page, '/#/private/cuscare/tickets/ticket/2050567');

    await expect(page.locator('.nav__item.is-active')).toContainText('Tickets');
  });
});

test.describe('menú del engranaje', () => {
  test('se despliega, navega y se cierra al elegir', async ({ page }) => {
    await goto(page, HOME);

    // Cerrado de inicio.
    await expect(page.locator('.settingsmenu')).toHaveCount(0);

    await page.locator('.nav__gear').click();
    await expect(page.locator('.settingsmenu')).toBeVisible();
    await expect(page.locator('.settingsmenu__item')).toHaveCount(4);

    await page.getByRole('menuitem', { name: 'Users' }).click();
    await expect(page).toHaveURL(/#\/private\/cuscare\/settings\/users/);
    // Elegir cierra el menú.
    await expect(page.locator('.settingsmenu')).toHaveCount(0);
  });

  test('"Groups" va a /settings/entities, no a /settings/groups', async ({ page }) => {
    // Comprobado en la app REAL: el rótulo y la ruta no coinciden. Este test
    // existe para que nadie lo "corrija" a groups por parecer más lógico.
    await goto(page, HOME);

    await page.locator('.nav__gear').click();
    await page.getByRole('menuitem', { name: 'Groups' }).click();

    await expect(page).toHaveURL(/#\/private\/cuscare\/settings\/entities/);
    await expect(page.getByRole('columnheader', { name: 'Group Name' })).toBeVisible();
  });

  test('las 4 vistas de ajustes cargan', async ({ page }) => {
    const cases = [
      { item: 'Users', header: 'User Name' },
      { item: 'Roles', header: 'Role Name' },
      { item: 'Groups', header: 'Group Name' },
    ];

    for (const c of cases) {
      await goto(page, HOME);
      await page.locator('.nav__gear').click();
      await page.getByRole('menuitem', { name: c.item }).click();
      await expect(page.getByRole('columnheader', { name: c.header })).toBeVisible();
    }

    // Templates no es una tabla: es una lista de carpetas.
    await goto(page, HOME);
    await page.locator('.nav__gear').click();
    await page.getByRole('menuitem', { name: 'Templates' }).click();
    await expect(page.getByRole('button', { name: /Add template/ })).toBeVisible();
    await expect(page.locator('.folder')).toHaveCount(4);
  });
});

test.describe('detalle de ticket', () => {
  test('las pestañas conmutan el contenido', async ({ page }) => {
    await goto(page, '/#/private/cuscare/tickets/ticket/2050567');

    // History es la de inicio y trae el timeline.
    await expect(page.locator('.timeline__row')).toHaveCount(5);

    await page.getByRole('tab', { name: /Notes/ }).click();
    await expect(page.locator('.timeline__row')).toHaveCount(0);
    await expect(page.getByText('Sin notas.')).toBeVisible();

    await page.getByRole('tab', { name: /Attached files/ }).click();
    await expect(page.getByText('Sin ficheros adjuntos.')).toBeVisible();

    await page.getByRole('tab', { name: /History ticket/ }).click();
    await expect(page.locator('.timeline__row')).toHaveCount(5);
  });

  test('se llega al detalle clicando el ID en la lista', async ({ page }) => {
    await goto(page, HOME);

    await page.getByRole('link', { name: '2050567' }).click();
    await expect(page).toHaveURL(/tickets\/ticket\/2050567/);
    await expect(page.getByText('#2050567').first()).toBeVisible();
  });
});

test.describe('métrica medida del sitio real', () => {
  // Estas tres cifras salen de medir el original con getComputedStyle. Van aquí
  // porque un retoque de CSS las rompe en silencio y el ojo no lo cazaría.

  test('la fila de Tickets mide 47.5px y la cabecera 41.5px', async ({ page }) => {
    await goto(page, HOME);

    const head = await page.locator('.cc-table thead tr').first().locator('th').nth(1).boundingBox();
    const row = await page.locator('.cc-table tbody tr').nth(1).boundingBox();

    expect(head?.height).toBeCloseTo(41.5, 0);
    expect(row?.height).toBeCloseTo(47.5, 0);
  });

  test('las tablas de ajustes miden 32.7px de fila (Material, no PrimeNG)', async ({ page }) => {
    await goto(page, '/#/private/cuscare/settings/users');

    const row = await page.locator('.mattable tbody tr').first().boundingBox();
    expect(row?.height).toBeCloseTo(32.7, 0);
  });

  test('el sidebar mide 90.3px y el lienzo es #f4f6fc', async ({ page }) => {
    await goto(page, HOME);

    const nav = await page.locator('.nav').boundingBox();
    expect(nav?.width).toBeCloseTo(90.3, 0);

    const canvasBg = await page
      .locator('.content-main')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(canvasBg).toBe('rgb(244, 246, 252)');
  });
});

/**
 * Modal "Ticket Status" — el que abre el pill de estado del detalle.
 *
 * Medido abriéndolo en la app real (abrir no guarda; se cerró con "Close"). Lo
 * que fija este test es lo que no se adivina desde fuera: son DIEZ naturalezas
 * de demanda en CASILLAS (varias a la vez), y sólo DOS estados en radios —
 * ninguno de los que sí salen en la columna Status de la tabla.
 */
test.describe('modal Ticket Status', () => {
  test('el pill de estado lo abre, con sus 10 naturalezas y 2 estados', async ({ page }) => {
    await page.goto('/#/private/cuscare/tickets/ticket/2050567');
    await page.locator('.statusbtn').click();

    const modal = page.getByRole('dialog', { name: 'Ticket Status' });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('checkbox')).toHaveCount(11); // 10 + "GDPR pending"
    await expect(modal.getByRole('radio')).toHaveCount(2);
    await expect(modal.getByText('Unsubscription')).toBeVisible();
    await expect(modal.getByText('Pending to define')).toBeVisible();
    await expect(modal.getByText('GDPR pending')).toBeVisible();
  });

  test('las naturalezas son múltiples y "Close" no deja rastro', async ({ page }) => {
    await page.goto('/#/private/cuscare/tickets/ticket/2050567');
    await page.locator('.statusbtn').click();

    const modal = page.getByRole('dialog', { name: 'Ticket Status' });
    await modal.getByText('Refund').click();
    await modal.getByText('Information').click();
    // Dos a la vez: si fueran radios, la segunda apagaría la primera.
    await expect(modal.locator('.tscheck input:checked')).toHaveCount(2);

    await modal.getByRole('button', { name: 'Close' }).click();
    await expect(modal).toHaveCount(0);
  });
});

/**
 * Lo que Rafa cazó de un vistazo: «nada es clicable en lo nuestro».
 *
 * En la app real la tabla Groups del dashboard ordena por sus nueve cabeceras,
 * el buscador filtra y el icono de la derecha abre un panel de columnas. Aquí
 * eran adorno: el buscador era un `<span>` con el texto pintado dentro.
 */
test.describe('dashboard · la tabla Groups hace cosas', () => {
  test('el buscador filtra de verdad', async ({ page }) => {
    await page.goto('/#/private/cuscare/dashboard');
    const filas = page.locator('.dash__groups tbody tr:not(.grid__totals)');
    await expect(filas).toHaveCount(2);

    await page.getByLabel('Search groups').fill('SK');
    await expect(filas).toHaveCount(1);
    await expect(filas.first()).toContainText('SK - Cuscare');
  });

  test('las cabeceras ordenan y ciclan asc → desc → sin orden', async ({ page }) => {
    await page.goto('/#/private/cuscare/dashboard');
    const primera = page.locator('.dash__groups tbody tr:not(.grid__totals)').first();
    await expect(primera).toContainText('ES - DOD');

    const th = page.locator('.dash__groups th.sortable', { hasText: 'Total workload' });
    await th.click(); // asc: ES-DOD (22) sigue primero
    await expect(th).toHaveAttribute('aria-sort', 'ascending');

    await th.click(); // desc: SK sube
    await expect(th).toHaveAttribute('aria-sort', 'descending');
    await expect(primera).toContainText('SK - Cuscare');

    await th.click(); // tercer clic: sin orden
    await expect(th).toHaveAttribute('aria-sort', 'none');
    await expect(primera).toContainText('ES - DOD');
  });

  test('el panel de columnas esconde una columna', async ({ page }) => {
    await page.goto('/#/private/cuscare/dashboard');
    const cabeceras = page.locator('.dash__groups thead th');
    await expect(cabeceras).toHaveCount(9);

    await page.getByRole('button', { name: 'Seleccionar columnas' }).click();
    await page.getByRole('dialog', { name: 'Columnas' }).getByLabel('SMS sent').uncheck();
    await expect(cabeceras).toHaveCount(8);
  });

  test('el pie del dashboard va en inglés, como el de Tickets', async ({ page }) => {
    await page.goto('/#/private/cuscare/dashboard');
    // Iba en castellano ("de 2 resultados", "Filas por página").
    await expect(page.locator('.groups__foot')).toContainText('of 2 results');
    await expect(page.locator('.groups__foot')).toContainText('Rows per page');
  });
});

/** El menú de "+ New" del detalle: cuatro entradas, leídas del DOM de la real. */
test('el menú "+ New" del detalle trae Email · Note · SMS · Attach file', async ({ page }) => {
  await page.goto('/#/private/cuscare/tickets/ticket/2050567');
  await page.locator('.tabs__new').click();

  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem')).toHaveText(['Email', 'Note', 'SMS', 'Attach file']);
});

/**
 * "Summary" NO era un pill decorativo: en la real abre una VISTA entera de dos
 * columnas —la superficie más densa de la app— con el servicio y su precio a la
 * izquierda y, a la derecha, los SMS enviados, los cargos y la navegación del
 * cliente. Salió de preguntarle a la app qué hacían Summary y Nav.
 */
test.describe('panel Summary de una suscripción', () => {
  test('abre la vista con sus tres bloques y las dos tarjetas de color', async ({ page }) => {
    await page.goto('/#/private/cuscare/tickets/ticket/2050567');
    await page.locator('.summarypill').first().click();

    const panel = page.locator('.sum');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.sum__price')).toHaveText('4.5 €');
    // Las dos erratas del original se replican tal cual.
    await expect(panel.getByText('RECCURING')).toBeVisible();
    await expect(panel.getByText('Unsubsribed').first()).toBeVisible();

    await expect(panel.locator('.sum__card--charges')).toContainText('Charges');
    await expect(panel.locator('.sum__card--refunded')).toContainText('Refunded');
    await expect(panel.getByRole('button', { name: /MO\/MT/ })).toBeVisible();
    await expect(panel.getByRole('button', { name: /Charges/ })).toBeVisible();
    await expect(panel.getByRole('button', { name: /Navigation/ })).toBeVisible();
  });

  test('los bloques se pliegan y el aspa cierra la vista', async ({ page }) => {
    await page.goto('/#/private/cuscare/tickets/ticket/2050567');
    await page.locator('.summarypill').first().click();

    const panel = page.locator('.sum');
    await expect(panel.locator('.sum__table').first()).toBeVisible();
    await panel.getByRole('button', { name: /MO\/MT/ }).click();
    await expect(panel.getByRole('button', { name: /MO\/MT/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    await panel.getByRole('button', { name: 'Cerrar' }).click();
    await expect(panel).toHaveCount(0);
  });
});

/**
 * Refund y Unsubscribe apuntaban a los diálogos EQUIVOCADOS.
 *
 * Los colgué de "Right to be forgotten" y del de motivo de no reembolso por una
 * suposición; el árbol de componentes de la app real tiene
 * `app-modal-confirmation-unsubscribe` y `app-new-modal-refund`, que es otra
 * cosa. Este test fija los destinos correctos para que no se vuelvan a cruzar.
 */
test.describe('destinos reales de Unsubscribe y Refund', () => {
  test('Unsubscribe abre la confirmación con sus 5 columnas', async ({ page }) => {
    await page.goto('/#/private/cuscare/tickets/ticket/2050567');
    await page.getByRole('button', { name: 'Unsubscribe', exact: true }).click();

    const modal = page.getByRole('dialog', { name: 'Unsubscribe' });
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Unsubscribe the following services')).toBeVisible();
    await expect(modal.locator('thead th')).toHaveText([
      'Product',
      'Keyword',
      'Status',
      'Price',
      'Expired',
    ]);
  });

  test('Refund abre el modal de reembolsos, con API y BNK por cargo', async ({ page }) => {
    await page.goto('/#/private/cuscare/tickets/ticket/2050567');
    await page.getByRole('button', { name: 'Refund', exact: true }).click();

    const modal = page.getByRole('dialog', { name: 'Refunds' });
    await expect(modal).toBeVisible();
    await expect(modal.locator('.rfd__amount')).toHaveText('0.00 €');
    // Dos vías de devolución por cada cargo: API y BNK.
    await expect(modal.getByRole('button', { name: 'API' })).toHaveCount(2);
    await expect(modal.getByRole('button', { name: 'BNK' })).toHaveCount(2);
  });

  test('el badge de la columna Refund también lo abre', async ({ page }) => {
    await page.goto('/#/private/cuscare/tickets/ticket/2050567');
    await page.getByRole('button', { name: /Reembolsos de/ }).click();
    await expect(page.getByRole('dialog', { name: 'Refunds' })).toBeVisible();
  });
});

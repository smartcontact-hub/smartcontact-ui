import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion, openKebabAction, pickSelectOption } from './helpers';

/**
 * REVISIÓN DE PRODUCTO DEL 2026-10-20 EN LAS FICHAS DE GRUPO Y AGENTE (DD-217): duplicar sin modal y con «(1)» (el grupo,
 * desde la misma tarde, al alta rellena, SISMAC-4056), Recursos
 * en chips sin «+» ni lápiz (a media columna, tantos como quepan; al pasar por una opción, su tooltip dice lo que
 * contiene) y la tipificación sin su descripción. Los Recursos de Repositorios del grupo salen de la ficha con DD-239
 * (Agendas y Plantillas se asignan solo a agentes): estas pruebas miran los del agente.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

// Desde el 2026-10-20 como SISMAC-4056: duplicar abre «Nuevo grupo» relleno con la copia, y el grupo existe al pulsar
// «Crear grupo» (antes, DD-217 §1, se creaba en el acto). Como duplicar agente: salir sin tocar no pregunta.
test('duplicar un grupo abre el alta rellena como «Online Support (1)», y existe al pulsar «Crear grupo»', async ({ page }) => {
  // Online Support, con un número de WhatsApp y un dominio para el script: lo que la copia no se lleva.
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#group-chat-whatsapp') }), /^\+?\d/);
  await page.locator('#group-chat-domain').fill('ejemplo.com');
  await page.keyboard.press('Enter');
  await expect(page.locator('sc-inputtags .p-chip')).toHaveCount(1);
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' }).click();
  // El toast, y no el botón apagado: se apaga también mientras guarda (400 ms), antes de escribir nada.
  await expect(page.locator('.p-toast-message').filter({ hasText: 'Grupo «Online Support» actualizado' })).toBeVisible();
  const grupos = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sc-groups')!) as { name: string }[]).map((g) => g.name));
  const antes = await grupos();

  await goto(page, 'admin/grupos');
  await openKebabAction(page, 'Online Support', 'Duplicar');

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/admin\/grupos\/crear\?seedFromId=11$/);
  await expect(page.locator('h1')).toContainText('Online Support (1)');
  await expect(page.locator('#group-name')).toHaveValue('Online Support (1)');
  expect(await grupos(), 'todavía no existe').toEqual(antes);
  // Bajo el nombre, el número con su rótulo, como «Extensión 122» en el agente.
  await expect(page.locator('.headline__meta')).toHaveText('Teléfono saliente 918371548, prioridad: máxima');

  // Lo que el funcional no copia: los dominios del script de chat y el número de WhatsApp. Lo demás, sí: el teléfono
  // saliente y los canales.
  await irASeccion(page, 'Distribución y colas');
  await expect(page.locator('sc-select:has(#group-chat-whatsapp)')).toContainText('Selecciona un número');
  await expect(page.locator('sc-inputtags .p-chip')).toHaveCount(0);
  await expect(page.locator('sc-select:has(#group-phone)')).toContainText('918371548');
  // Y su postconversación: la de los grupos de la demo vive aparte, por id, y la copia la perdía (barrido del 2026-10-20).
  await irASeccion(page, 'General');
  await expect(page.locator('sc-select:has(#group-typification)')).toContainText('Atención al cliente');

  // El número de WhatsApp es obligatorio (DD-222): sin él «Crear grupo» está apagado.
  await irASeccion(page, 'Distribución y colas');
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#group-chat-whatsapp') }), /^\+?\d/);
  await page.getByRole('button', { name: 'Crear grupo' }).click();
  await expect(page).toHaveURL(/\/admin\/grupos\/editar\/\d+(\?seccion=distribucion)?$/);
  await expect(page.locator('.p-toast-message').filter({ hasText: 'Grupo «Online Support (1)» creado' })).toBeVisible();
  // Con los agentes del original.
  const enlaces = await page.evaluate(() => {
    const links = JSON.parse(localStorage.getItem('sc-group-agent-links')!) as { groupId: number }[];
    const copia = (JSON.parse(localStorage.getItem('sc-groups')!) as { id: number; name: string }[]).find((g) => g.name === 'Online Support (1)')!;
    return { original: links.filter((l) => l.groupId === 11).length, copia: links.filter((l) => l.groupId === copia.id).length };
  });
  expect(enlaces.copia).toBe(enlaces.original);
  expect(enlaces.copia).toBeGreaterThan(0);

  // Otra vez el original: el siguiente número libre.
  await goto(page, 'admin/grupos');
  await openKebabAction(page, 'Online Support', 'Duplicar');
  await expect(page.locator('#group-name')).toHaveValue('Online Support (2)');
});

test('la copia sin tocar se deja sin preguntar, y «Deshacer» vuelve a la copia, no a un alta vacía', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await openKebabAction(page, 'Online Support', 'Duplicar');
  await expect(page.locator('#group-name')).toHaveValue('Online Support (1)');
  const deshacer = page.locator('sc-top-bar').getByRole('button', { name: 'Deshacer' });
  await expect(deshacer, 'sin cambios, no hay nada que deshacer').toHaveCount(0);

  await page.locator('#group-name').fill('Otro nombre');
  await deshacer.click();
  await expect(page.locator('#group-name')).toHaveValue('Online Support (1)');

  await page.locator('sc-top-bar').getByRole('link', { name: 'Grupos', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/grupos$/);
  await expect(page.getByText('¿Descartar cambios?')).toHaveCount(0);
  await expect(page.locator('tbody tr', { hasText: 'Online Support (1)' }), 'no se creó').toHaveCount(0);
});

/** Chips a la vista, el «+N» y cuántas hay elegidas (las marcadas en su lista), y los que la flecha corta. */
async function chipsDe(page: Page, id: string) {
  const campo = page.locator('sc-multiselect').filter({ has: page.locator(`#${id}`) });
  const medida = await campo.evaluate((el) => {
    const flecha = el.querySelector('.p-multiselect-dropdown')!.getBoundingClientRect().left;
    const chips = [...el.querySelectorAll('.p-multiselect-chip-item:not(.sc-multiselect__more-item)')];
    const mas = el.querySelector('.sc-multiselect__more')?.textContent?.match(/\d+/)?.[0];
    return {
      vistos: chips.length,
      mas: mas ? Number(mas) : 0,
      cortados: chips.filter((c) => c.getBoundingClientRect().right - flecha > 0.5).map((c) => (c.textContent ?? '').trim()),
    };
  });
  await campo.locator('.p-multiselect-dropdown').click();
  await expect(page.locator('.p-multiselect-overlay .p-multiselect-option').first()).toBeVisible();
  const elegidas = await page.locator('.p-multiselect-overlay .p-multiselect-option[aria-selected="true"]').count();
  await page.keyboard.press('Escape');
  await expect(page.locator('.p-multiselect-overlay')).toHaveCount(0);
  return { ...medida, elegidas };
}

test('Recursos: lo elegido en chips, tantos como caben, sin «+» ni lápiz; «Gestionar en Repositorios» se queda', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/3?seccion=recursos');
  const equipos = page.locator('sc-multiselect').filter({ has: page.locator('#agent-teams') });
  await expect(equipos.locator('.p-multiselect-chip')).not.toHaveCount(0);
  await expect(equipos).not.toContainText('2 equipos');
  // Caben los que da el ancho, y «+N más» cuenta el resto: ni se quedan cortos (antes, tres y «+7» con media fila
  // vacía) ni la flecha corta ninguno.
  for (const id of ['agent-teams', 'agent-agendas']) {
    const { vistos, mas, elegidas, cortados } = await chipsDe(page, id);
    expect(vistos + mas, `${id}: a la vista y en «+N» suman lo elegido`).toBe(elegidas);
    expect(cortados, `${id}: chips cortados por la flecha`).toEqual([]);
    expect(vistos, `${id}: al menos uno a la vista`).toBeGreaterThan(0);
  }
  // A media columna, Agendas junto a Equipos: el campo no crece para que quepan más chips.
  const [agendas, equiposCaja] = await Promise.all(
    ['agent-agendas', 'agent-teams'].map((id) =>
      page.locator('sc-multiselect').filter({ has: page.locator(`#${id}`) }).evaluate((el) => el.getBoundingClientRect().toJSON() as DOMRect),
    ),
  );
  expect(Math.abs(agendas.top - equiposCaja.top), 'Agendas y Equipos, en la misma fila').toBeLessThan(0.5);
  expect(Math.abs(agendas.width - equiposCaja.width), 'las dos, del mismo ancho').toBeLessThan(0.5);
  await expect(page.getByRole('button', { name: /^Nueva (agenda|plantilla)$/ })).toHaveCount(0);

  await equipos.locator('.p-multiselect-dropdown').click();
  await expect(page.locator('.p-multiselect-overlay')).toBeVisible();
  await expect(page.locator('.p-multiselect-overlay sc-resource-option button')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('link', { name: 'Gestionar en Repositorios' })).toBeVisible();
});

test('Recursos: pasar por una opción hace lo mismo en las listas del agente; su tooltip, junto a ella, dice lo que contiene', async ({ page }) => {
  for (const [ruta, id, contiene] of [
    ['admin/agentes/editar/1?seccion=recursos', 'agent-agendas', /^(\d+ contactos?|Sin contactos)$/],
    ['admin/agentes/editar/1?seccion=recursos', 'agent-teams', /\w{3,}/],
  ] as const) {
    await goto(page, ruta);
    const campo = page.locator('sc-multiselect').filter({ has: page.locator(`#${id}`) });
    await campo.locator('.p-multiselect-dropdown').click();
    const opcion = page.locator('.p-multiselect-overlay sc-resource-option').first();
    await expect(opcion).toBeVisible();
    // Nada a la vista más que el nombre: ni la cifra ni el texto alargan la fila.
    await expect(opcion.locator(':scope > :not(.resource-option__name)')).toHaveCount(0);
    const nombre = (await opcion.textContent())?.trim();
    await opcion.locator('.resource-option__name').hover();
    const tooltip = page.locator('.p-tooltip');
    await expect(tooltip, `${id}: su tooltip`).toBeVisible();
    await expect(tooltip).toHaveText(contiene);
    expect((await tooltip.textContent())?.trim(), `${id}: lo que contiene, no su nombre`).not.toBe(nombre);
    const [fila, globo, panel, ancho] = await Promise.all([
      opcion.evaluate((el) => el.getBoundingClientRect().toJSON() as DOMRect),
      tooltip.evaluate((el) => el.getBoundingClientRect().toJSON() as DOMRect),
      page.locator('.p-multiselect-overlay').evaluate((el) => el.getBoundingClientRect().width),
      campo.locator('.p-multiselect').evaluate((el) => el.getBoundingClientRect().width),
    ]);
    expect(globo.left, `${id}: el tooltip, pegado a la opción`).toBeGreaterThanOrEqual(fila.right - 0.5);
    expect(globo.top, `${id}: a la altura de la opción`).toBeLessThan(fila.bottom);
    expect(panel, `${id}: el desplegable, del ancho del campo`).toBeLessThanOrEqual(ancho + 0.5);
    await page.keyboard.press('Escape');
  }
});

test('Recursos: un nombre más largo que el campo, en su chip se acorta con «…» y se lee al pasar; en la lista, entero', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('sc-agendas-repo')) return;
    localStorage.setItem('sc-agendas-repo-v', '2');
    const agenda = (id: number, name: string) => ({ id, name, contacts: [], description: '', updatedAt: '2026-10-20' });
    localStorage.setItem(
      'sc-agendas-repo',
      JSON.stringify([
        agenda(1, 'Clientes preferentes de la campaña de renovación de seguros del hogar, Comunidad de Madrid, otoño 2026'),
        agenda(2, 'Soporte Premium'),
        agenda(3, 'Cobros'),
      ]),
    );
  });
  await goto(page, 'admin/agentes/editar/3?seccion=recursos');
  const campo = page.locator('sc-multiselect').filter({ has: page.locator('#agent-agendas') });
  const largo = campo.locator('.sc-multiselect__chip-label').first();
  await expect(largo).toContainText('Clientes preferentes');
  const medida = await campo.evaluate((el) => {
    const tope = el.querySelector('.p-multiselect-label-container')!.getBoundingClientRect().right;
    const etiqueta = el.querySelector<HTMLElement>('.sc-multiselect__chip-label')!;
    const mas = el.querySelector('.sc-multiselect__more-item:not(.sc-multiselect__more-item--midiendo)');
    return {
      acortado: etiqueta.scrollWidth > etiqueta.clientWidth,
      aspa: el.querySelector('.sc-multiselect__chip-item .p-chip-remove-icon')!.getBoundingClientRect().width,
      masDentro: !!mas && mas.getBoundingClientRect().right <= tope + 0.5,
    };
  });
  expect(medida.acortado, 'el nombre, acortado').toBe(true);
  expect(medida.aspa, 'la «×», entera').toBeGreaterThan(10);
  expect(medida.masDentro, '«+N más», dentro del campo').toBe(true);
  await largo.hover();
  await expect(page.locator('.p-tooltip')).toContainText('Comunidad de Madrid, otoño 2026');
  await page.mouse.move(0, 0);

  // En la lista, entero: baja de línea en vez de cortarse, y el desplegable no crece.
  await campo.locator('.p-multiselect-dropdown').click();
  const enLista = page.locator('.p-multiselect-overlay .resource-option__name', { hasText: 'Clientes preferentes' });
  await expect(enLista).toBeVisible();
  const lista = await enLista.evaluate((el) => ({ cortado: el.scrollWidth > el.clientWidth, alto: el.getBoundingClientRect().height, linea: parseFloat(getComputedStyle(el).lineHeight) }));
  expect(lista.cortado, 'el nombre, sin cortar').toBe(false);
  expect(lista.alto, 'en más de una línea').toBeGreaterThan(lista.linea * 1.5);
});

test('Recursos del agente: chips sin «+» ni lápiz', async ({ page }) => {
  await goto(page, 'admin/agentes/editar/1?seccion=recursos');
  await expect(page.locator('#agent-section-resources .p-multiselect-chip').first()).toBeVisible();
  await expect(page.locator('#agent-section-resources').getByRole('button', { name: /^Nuev[oa] / })).toHaveCount(0);
  await expect(page.locator('app-recurso-dialog')).toHaveCount(0);
});

test('la tipificación elegida, sin su descripción: se queda «Ver detalle»', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11');
  await expect(page.locator('.wrapup__description')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Ver detalle de/ })).toBeVisible();
});

test('duplicar un agente: «Tom Hanks (1)», como un grupo; la copia es el punto de partida y salir no pregunta', async ({ page }) => {
  await goto(page, 'admin/agentes/crear?seedFromId=1');
  const barra = page.locator('sc-top-bar');
  // El nombre de la copia dice de quién es, como al duplicar un grupo.
  await expect(page.locator('h1')).toContainText('Tom Hanks (1)');
  // El email y la extensión no se copian (son únicos): «Crear agente» apagado, y el índice dice qué falta (DD-219; desde
  // DD-225 en la línea de General, no sobre el resumen).
  await expect(barra.getByRole('button', { name: 'Crear agente' })).toBeDisabled();
  await expect(page.locator('sc-form-section-nav .form-nav__item').filter({ hasText: 'General' })).toContainText('Email, extensión');
  await expect(barra.getByRole('button', { name: 'Deshacer' })).toHaveCount(0);
  // Con un cambio, «Deshacer» vuelve a la copia, no al formulario vacío: los grupos siguen.
  const grupos = await page.locator('.ficha-summary').textContent();
  await page.locator('#agent-name').fill('Copia');
  await barra.getByRole('button', { name: 'Deshacer' }).click();
  await expect(page.locator('#agent-name')).toHaveValue('Tom Hanks (1)');
  await expect(page.locator('.ficha-summary')).toHaveText(grupos ?? '');
  // Salir sin tocar nada no pregunta.
  await page.getByRole('link', { name: 'Agentes' }).first().click();
  await expect(page).toHaveURL(/\/admin\/agentes$/);
});

test('listado de agentes: Grabación con el «—» de las celdas vacías donde no graba, y el REC donde sí', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const tabla = page.locator('sc-datatable, [data-testid="agents-table"]').first();
  await expect(tabla.locator('.recording').first()).toBeVisible();
  // El que no graba: el guion a la vista y, para el lector, «Sin grabación» (en blanco parecía que no había cargado).
  const sinGrabar = tabla.locator('sc-celda-vacia', { hasText: 'Sin grabación' });
  await expect(sinGrabar.first()).toBeAttached();
  await expect(sinGrabar.first().locator('.celda-vacia')).toHaveText('—');
  const filas = await tabla.locator('.p-datatable-tbody > tr').count();
  const conRec = await tabla.locator('.p-datatable-tbody .recording').count();
  expect(conRec + (await sinGrabar.count()), 'cada fila dice sí o no').toBe(filas);
});

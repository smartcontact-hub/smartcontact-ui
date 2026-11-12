import { expect, test, type Locator, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, openKebabAction } from './helpers';

/**
 * HORARIOS, ESTRESADOS POR LA PANTALLA (DD-251, DD-252).
 *
 * El modelo tiene su prueba pura (`scripts/__tests__/horarios.test.mjs`, la hoja de postventa de 2025 día a día). Esta
 * es la otra mitad: que lo que el usuario hace en la pantalla llega al modelo y vuelve al calendario. Cada prueba
 * cambia una regla y lee el resultado en el año o en el detalle de un día, no en el almacén.
 *
 * Las fechas salen del año en curso, para que no caduquen: el calendario abre en el año de hoy y ofrece el pasado y
 * los dos siguientes.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const ANIO = new Date().getFullYear();
const dos = (n: number): string => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number): string => `${y}-${dos(m)}-${dos(d)}`;
/** El primer martes de marzo del año: un laborable cualquiera, fuera de verano y de festivos. */
const primerMartesDeMarzo = (y: number): string => {
  const d = new Date(Date.UTC(y, 2, 1));
  while (d.getUTCDay() !== 2) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
const bisiesto = (y: number): boolean => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const POSTVENTA = 'admin/horarios/editar/9';
const TURNO_NOCHE = 'admin/horarios/editar/4';
const SIEMPRE = 'admin/horarios/editar/7';

const dia = (page: Page, fecha: string): Locator => page.locator(`[data-fecha="${fecha}"]`);
const detalle = (page: Page): Locator => page.locator('.cal__detalle');
const semana = (page: Page): Locator => page.locator('.horario__reglas sc-horario-semana').first();
const diaDeLaSemana = (page: Page, n: number): Locator => semana(page).locator('.semana__dia').nth(n);
/** El diálogo del editor (un `sc-custom-modal`); con un calendario abierto, su panel también es un `role="dialog"`. */
const dialogo = (page: Page): Locator => page.locator('[role="dialog"][aria-labelledby^="sc-custom-modal"]');
const guardar = (page: Page): Locator => page.locator('sc-top-bar').getByRole('button', { name: /^(Guardar|Crear horario)$/ });
const tabla = (page: Page, n: number): Locator => page.locator('sc-horario-filas-table').nth(n);

async function elegirDia(page: Page, fecha: string): Promise<void> {
  const anio = Number(fecha.slice(0, 4));
  const selector = page.locator('.cal__barra sc-selectbutton');
  if ((await selector.locator('[aria-pressed="true"], .p-togglebutton-checked').innerText()).trim() !== String(anio)) {
    await selector.getByText(String(anio), { exact: true }).click();
  }
  await dia(page, fecha).click();
}

/** Escribe una hora en un campo `timeOnly` y sale de él, como quien teclea. */
async function ponerHora(campo: Locator, hora: string): Promise<void> {
  // Tecla a tecla: `fill` no pasa por el análisis de la hora de PrimeNG, que escucha las pulsaciones.
  await campo.click();
  await campo.press('Control+a');
  await campo.pressSequentially(hora);
  await campo.press('Tab');
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** En el panel abierto de un `p-datepicker`, va al mes de la fecha y pulsa su día. */
async function pulsarEnPanel(page: Page, fecha: string): Promise<void> {
  const [y, m, d] = fecha.split('-').map(Number);
  const panel = page.locator('.p-datepicker-panel:visible, .p-datepicker:visible .p-datepicker-calendar-container').first();
  for (let i = 0; i < 40; i++) {
    const mes = MESES.indexOf((await panel.locator('.p-datepicker-select-month').first().innerText()).trim().toLowerCase());
    const anio = Number((await panel.locator('.p-datepicker-select-year').first().innerText()).trim());
    const delta = (y! - anio) * 12 + (m! - 1 - mes);
    if (delta === 0) break;
    // La cabecera se repinta un instante después del clic: se espera a que cambie antes de volver a leerla.
    const antes = `${mes}-${anio}`;
    await panel.locator(delta > 0 ? '.p-datepicker-next-button' : '.p-datepicker-prev-button').first().click();
    await expect
      .poll(async () => `${MESES.indexOf((await panel.locator('.p-datepicker-select-month').first().innerText()).trim().toLowerCase())}-${(await panel.locator('.p-datepicker-select-year').first().innerText()).trim()}`)
      .not.toBe(antes);
  }
  await panel
    .locator('td:not(.p-datepicker-other-month) .p-datepicker-day')
    .filter({ hasText: new RegExp(`^\\s*${d}\\s*$`) })
    .first()
    .click();
}

async function nuevoPeriodo(page: Page, nombre: string, desde: string, hasta: string, cadaAnio = true): Promise<Locator> {
  await page.getByRole('button', { name: 'Nuevo periodo', exact: true }).first().click();
  const modal = dialogo(page);
  await modal.locator('#periodo-nombre').fill(nombre);
  await modal.locator('#periodo-fechas').click();
  await pulsarEnPanel(page, desde);
  await pulsarEnPanel(page, hasta);
  await page.keyboard.press('Escape');
  if (!cadaAnio) await modal.locator('#periodo-anual').click();
  return modal;
}

/* ── La semana ───────────────────────────────────────────────────────────────────────────────────────────────── */

test('semana: una franja vacía o dos que se pisan se dicen bajo su día y no dejan guardar', async ({ page }) => {
  await goto(page, POSTVENTA);
  const lunes = diaDeLaSemana(page, 0);
  await ponerHora(lunes.locator('sc-datepicker input').nth(1), '09:00');
  await expect(lunes.locator('.semana__error')).toHaveText('Una franja empieza y acaba a la misma hora');
  await expect(guardar(page)).toBeDisabled();

  await ponerHora(lunes.locator('sc-datepicker input').nth(1), '18:00');
  await lunes.getByRole('button', { name: 'Añadir franja' }).click();
  await ponerHora(lunes.locator('sc-datepicker input').nth(2), '17:00');
  await expect(lunes.locator('.semana__error')).toHaveText('Dos franjas del mismo día se pisan');
  await expect(guardar(page)).toBeDisabled();

  // Quitada la que pisaba, el lunes vuelve a ser el guardado: sin error y sin cambios que guardar ni deshacer.
  await lunes.getByRole('button', { name: /Quitar franja/ }).nth(1).click();
  await expect(lunes.locator('.semana__error')).toHaveCount(0);
  await expect(guardar(page)).toBeDisabled();
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Deshacer', exact: true })).toHaveCount(0);
});

test('semana: una franja de 23:00 a 07:00 acaba al día siguiente, y el día siguiente abre a las 00:00', async ({ page }) => {
  await goto(page, TURNO_NOCHE);
  await expect(diaDeLaSemana(page, 0).getByText('Día siguiente')).toBeVisible();
  await elegirDia(page, primerMartesDeMarzo(ANIO));
  await expect(detalle(page)).toContainText('00:00–07:00, 23:00–24:00');
});

test('semana: de 00:00 a 00:00 es todo el día', async ({ page }) => {
  await goto(page, SIEMPRE);
  await elegirDia(page, primerMartesDeMarzo(ANIO));
  await expect(detalle(page)).toContainText('Todo el día');
});

test('semana: «Copiar» lleva las franjas de un día a otros, y el año lo refleja', async ({ page }) => {
  await goto(page, POSTVENTA);
  await semana(page).locator('.semana__copiar sc-multiselect').click();
  await page.getByRole('option', { name: 'Sábado' }).click();
  await page.keyboard.press('Escape');
  await semana(page).getByRole('button', { name: 'Copiar', exact: true }).click();
  const sabado = diaDeLaSemana(page, 5);
  await expect(sabado.getByRole('switch')).toBeChecked();
  await expect(sabado.locator('sc-datepicker input').nth(1)).toHaveValue('18:00');
  const primerSabado = (() => {
    const d = new Date(Date.UTC(ANIO, 2, 1));
    while (d.getUTCDay() !== 6) d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  await elegirDia(page, primerSabado);
  await expect(detalle(page)).toContainText('09:00–18:00');
});

/* ── Periodos ────────────────────────────────────────────────────────────────────────────────────────────────── */

test('periodos: dos que comparten fechas no se guardan, y el error nombra al otro', async ({ page }) => {
  await goto(page, POSTVENTA);
  const modal = await nuevoPeriodo(page, 'Julio', iso(ANIO, 7, 1), iso(ANIO, 7, 31));
  await expect(modal).toContainText('Comparte fechas con el periodo «Verano»');
  await expect(modal.getByRole('button', { name: 'Crear', exact: true })).toBeDisabled();
});

test('periodos: uno anual de octubre a mayo cruza el año y cubre el 29 de febrero; de un solo año, no se puede', async ({ page }) => {
  await goto(page, POSTVENTA);
  const modal = await nuevoPeriodo(page, 'Invierno', iso(ANIO, 10, 1), iso(ANIO + 1, 5, 31), false);
  await expect(modal).toContainText('Un periodo de un solo año no puede acabar en el siguiente');
  await modal.locator('#periodo-anual').click();
  await modal.getByRole('button', { name: 'Crear', exact: true }).click();
  await expect(tabla(page, 0).locator('tbody tr')).toHaveCount(2);

  const anioBisiesto = [ANIO - 1, ANIO, ANIO + 1, ANIO + 2].find(bisiesto)!;
  await elegirDia(page, iso(anioBisiesto, 2, 29));
  await expect(detalle(page)).toContainText('Periodo «Invierno»');
});

test('periodos: la fila abre su diálogo (clic e Intro) y eliminarlo devuelve sus días a la semana', async ({ page }) => {
  await goto(page, POSTVENTA);
  const fila = tabla(page, 0).locator('tbody tr').first();
  await fila.click();
  await expect(dialogo(page)).toContainText('Editar periodo');
  await page.keyboard.press('Escape');
  await fila.focus();
  await page.keyboard.press('Enter');
  await expect(dialogo(page)).toContainText('Editar periodo');
  await page.keyboard.press('Escape');

  await openKebabAction(page, 'Verano', 'Eliminar');
  await page.getByRole('button', { name: 'Eliminar', exact: true }).last().click();
  await expect(tabla(page, 0).locator('tbody tr')).toHaveCount(1);
  await expect(tabla(page, 0)).toContainText('Sin periodos');
  await elegirDia(page, iso(ANIO, 7, 1));
  await expect(detalle(page)).not.toContainText('Periodo «Verano»');
});

test('periodos: el clic derecho da el mismo menú que el «⋮»', async ({ page }) => {
  await goto(page, POSTVENTA);
  await tabla(page, 0).locator('tbody tr').first().click({ button: 'right' });
  await expect(page.locator('.p-menu-overlay .p-menu-item-label')).toHaveText(['Editar', 'Eliminar']);
});

/* ── Fechas especiales ───────────────────────────────────────────────────────────────────────────────────────── */

test('fechas especiales: tres días de una vez, cerrados; una ya puesta se dice con su nombre', async ({ page }) => {
  await goto(page, POSTVENTA);
  const antes = await tabla(page, 1).locator('tbody tr').count();
  await page.getByRole('button', { name: 'Nueva fecha especial', exact: true }).first().click();
  const modal = dialogo(page);
  await modal.locator('#especial-nombre').fill('Puente');
  for (const d of [iso(ANIO + 1, 3, 9), iso(ANIO + 1, 3, 10), iso(ANIO + 1, 3, 11)]) await pulsarEnPanel(page, d);
  await expect(modal).toContainText('3 días marcados');
  await modal.getByRole('button', { name: 'Crear', exact: true }).click();
  await expect(tabla(page, 1).locator('tbody tr')).toHaveCount(antes + 3);
  await elegirDia(page, iso(ANIO + 1, 3, 10));
  await expect(detalle(page)).toContainText('Fecha especial «Puente»');
  await expect(detalle(page)).toContainText('Cerrado');

  await page.getByRole('button', { name: 'Nueva fecha especial', exact: true }).first().click();
  await dialogo(page).locator('#especial-nombre').fill('Otra');
  await pulsarEnPanel(page, iso(ANIO + 1, 3, 10));
  await expect(dialogo(page)).toContainText('ya es «Puente»');
  await expect(dialogo(page).getByRole('button', { name: 'Crear', exact: true })).toBeDisabled();
});

test('fechas especiales: «Editar este día» abre un festivo con horas propias; sobre una especial, la edita', async ({ page }) => {
  await goto(page, POSTVENTA);
  await elegirDia(page, iso(ANIO, 12, 25));
  await expect(detalle(page)).toContainText('Festivo «Navidad» (Festivos Barcelona)');
  await page.getByRole('button', { name: 'Editar este día', exact: true }).click();
  const modal = dialogo(page);
  await expect(modal).toContainText('Nueva fecha especial');
  await modal.locator('#especial-nombre').fill('Campaña');
  await modal.getByText('Con horario', { exact: true }).click();
  await modal.getByRole('button', { name: 'Crear', exact: true }).click();
  await expect(detalle(page)).toContainText('Fecha especial «Campaña»');
  await expect(detalle(page)).toContainText('Abierto');

  await elegirDia(page, iso(ANIO, 12, 24));
  await page.getByRole('button', { name: 'Editar fecha especial', exact: true }).click();
  await expect(dialogo(page)).toContainText('Editar fecha especial');
  await expect(dialogo(page).locator('#especial-nombre')).toHaveValue('Nochebuena');
});

test('fechas especiales: «Próximas» y «Pasadas» reparten todas, sin perder ninguna', async ({ page }) => {
  await goto(page, POSTVENTA);
  const filtro = tabla(page, 1).locator('sc-selectbutton');
  const proximas = await tabla(page, 1).locator('tbody tr:not(.p-datatable-empty-message)').count();
  if (await filtro.count()) {
    await filtro.getByText('Pasadas', { exact: true }).click();
    // La tabla se repinta un instante después del clic: se espera a que cuadre, y si se pierde una no cuadra nunca.
    await expect.poll(async () => proximas + (await tabla(page, 1).locator('tbody tr:not(.p-datatable-empty-message)').count())).toBe(5);
  } else {
    expect(proximas).toBe(5);
  }
});

/* ── Festivos ────────────────────────────────────────────────────────────────────────────────────────────────── */

test('festivos: un calendario inactivo no cierra nada, y quitarlo del horario reabre sus días', async ({ page }) => {
  await goto(page, 'admin/festivos/editar/1');
  await page.locator('#festivos-activo').click();
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar', exact: true }).click();
  await goto(page, POSTVENTA);
  await elegirDia(page, iso(ANIO, 5, 1));
  await expect(detalle(page)).not.toContainText('Festivo');
});

test('festivos: borrar un calendario aplicado lo dice y lo quita de sus horarios', async ({ page }) => {
  await goto(page, 'admin/festivos');
  await page.getByRole('row').filter({ hasText: 'Festivos Barcelona' }).click({ button: 'right' });
  await page.getByRole('menuitem', { name: /Eliminar/ }).click();
  await expect(page.getByText(/Lo aplican? \d+ horarios?: deja(rá|rán) de cerrar estos días\./)).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).last().click();
  await goto(page, POSTVENTA);
  await expect(page.locator('#horario-festivos')).not.toContainText('Festivos Barcelona');
  await elegirDia(page, iso(ANIO, 12, 25));
  await expect(detalle(page)).not.toContainText('Festivo');
});

/* ── En uso ──────────────────────────────────────────────────────────────────────────────────────────────────── */

test('en uso: borrar un horario que usa un grupo lo dice, lo suelta, y el siguiente horario no hereda su sitio', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/12?seccion=distribucion');
  await expect(page.locator('#group-chat-schedule')).toHaveText('Postventa');
  await expect(page.getByText('L–J 09:00–18:00; V 09:00–15:00').first()).toBeVisible();

  await goto(page, 'admin/horarios');
  await page.getByRole('row').filter({ hasText: 'Postventa' }).click({ button: 'right' });
  await page.getByRole('menuitem', { name: /Eliminar/ }).click();
  await expect(page.getByText('Lo usa 1 grupo: pasará a atender siempre.')).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).last().click();

  // Un horario nuevo: con el id del borrado libre, es el que lo heredaría.
  await page.locator('sc-top-bar').getByRole('button', { name: /^Nuevo horario/ }).click();
  await page.locator('#horario-name').fill('Recién creado');
  await page.locator('sc-top-bar').getByRole('button', { name: 'Crear horario', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/horarios\/editar\/\d+$/);

  await goto(page, 'admin/grupos/editar/12?seccion=distribucion');
  await expect(page.locator('#group-chat-schedule')).toHaveText('Siempre');
});

test('en uso: apagar un horario que usan grupos dice qué les pasa', async ({ page }) => {
  await goto(page, POSTVENTA);
  await expect(page.locator('#horario-activo-ayuda')).toHaveText(/Lo usa 1 grupo: apagado, lo conserva/);
});

test('en uso: la ayuda de «Activo» de un calendario dice qué horarios lo aplican; las listas, en masculino', async ({ page }) => {
  await goto(page, 'admin/festivos/editar/1');
  await expect(page.locator('#festivos-activo-ayuda')).toHaveText(/^Lo aplican 2 horarios: apagado, dejarán de cerrar estos días\.$/);
  await goto(page, 'admin/festivos');
  await expect(page.getByRole('row').filter({ hasText: 'Festivos Barcelona' })).toContainText('Activo');
  await goto(page, 'admin/horarios');
  await expect(page.getByRole('row').filter({ hasText: 'Postventa' })).toContainText('Activo');
  await expect(page.getByRole('row').filter({ hasText: 'Postventa' })).not.toContainText('Activa');
});

/* ── El año ──────────────────────────────────────────────────────────────────────────────────────────────────── */

test('año: las flechas cruzan mes y año, un 29 de febrero pasa al 28 y «Hoy» vuelve', async ({ page }) => {
  await goto(page, POSTVENTA);
  await elegirDia(page, iso(ANIO, 12, 31));
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.cal__dia--elegido')).toHaveAttribute('data-fecha', iso(ANIO + 1, 1, 1));
  await expect(page.locator(`[data-fecha="${iso(ANIO + 1, 1, 1)}"]`)).toBeFocused();

  const anioBisiesto = [ANIO - 1, ANIO, ANIO + 1, ANIO + 2].find(bisiesto)!;
  await elegirDia(page, iso(anioBisiesto, 2, 29));
  const otro = [ANIO - 1, ANIO, ANIO + 1, ANIO + 2].find((y) => !bisiesto(y))!;
  await page.locator('.cal__barra sc-selectbutton').getByText(String(otro), { exact: true }).click();
  await expect(page.locator('.cal__dia--elegido')).toHaveAttribute('data-fecha', iso(otro, 2, 28));

  await page.getByRole('button', { name: 'Hoy', exact: true }).click();
  await expect(page.locator('.cal__dia--hoy')).toHaveClass(/cal__dia--elegido/);
});

/* ── Guardar ─────────────────────────────────────────────────────────────────────────────────────────────────── */

test('guardar: Deshacer vuelve atrás, Ctrl+S guarda, y duplicar copia todas las reglas', async ({ page }) => {
  await goto(page, POSTVENTA);
  await page.locator('#horario-name').fill('Postventa 2');
  await page.locator('sc-top-bar').getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(page.locator('#horario-name')).toHaveValue('Postventa');

  await page.locator('#horario-name').fill('Postventa nueva');
  await page.keyboard.press('Control+s');
  await expect(page.getByText('Horario «Postventa nueva» actualizado')).toBeVisible();

  await goto(page, 'admin/horarios');
  await openKebabAction(page, 'Postventa nueva', 'Duplicar');
  await expect(page.locator('#horario-name')).toHaveValue(/Postventa nueva \(1\)/);
  await expect(tabla(page, 0).locator('tbody tr')).toHaveCount(1);
  await expect(tabla(page, 0)).toContainText('Verano');
});

test('guardado con la forma de antes («L-V 09:00–18:00»): abre con esa semana', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('sembrado')) return;
    sessionStorage.setItem('sembrado', '1');
    localStorage.setItem(
      'sc-horarios-repo',
      JSON.stringify([{ id: 1, name: 'De antes', schedule: 'L-V 09:00–18:00', timezone: 'Europe/Madrid', description: '', status: 'active' }]),
    );
    localStorage.setItem('sc-horarios-repo-v', '1');
  });
  await goto(page, 'admin/horarios/editar/1');
  await expect(page.locator('#horario-name')).toHaveValue('De antes');
  await expect(diaDeLaSemana(page, 0).locator('sc-datepicker input').nth(0)).toHaveValue('09:00');
  await expect(diaDeLaSemana(page, 4).locator('sc-datepicker input').nth(1)).toHaveValue('18:00');
  await expect(diaDeLaSemana(page, 5)).toContainText('Cerrado');
});

/* ── Límites ─────────────────────────────────────────────────────────────────────────────────────────────────── */

test('límites: nombres de 120 caracteres no desbordan la pantalla ni las tablas', async ({ page }) => {
  const largo = 'Atención extraordinaria del servicio de postventa por campaña de invierno con jornada reducida y guardias '.padEnd(120, 'x');
  await goto(page, POSTVENTA);
  await page.locator('#horario-name').fill(largo);
  await tabla(page, 0).locator('tbody tr').first().click();
  await dialogo(page).locator('#periodo-nombre').fill(largo);
  await dialogo(page).getByRole('button', { name: 'Guardar', exact: true }).click();
  const desborda = await page.evaluate(() => {
    const main = document.querySelector('main#main-content') as HTMLElement;
    return main.scrollWidth - main.clientWidth;
  });
  expect(desborda).toBeLessThanOrEqual(0);
  const fila = tabla(page, 0).locator('tbody tr').first();
  expect((await fila.boundingBox())!.height).toBeLessThanOrEqual(50);
});

// El corte es el de las fichas con resumen al lado (`.ficha-summary`, 1340).
for (const ancho of [1024, 1339, 1340, 1920]) {
  test(`anchos: a ${ancho} no desborda, y por debajo de 1340 el año va debajo de las reglas`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: 900 });
    await goto(page, POSTVENTA);
    const desborda = await page.evaluate(() => {
      const main = document.querySelector('main#main-content') as HTMLElement;
      return main.scrollWidth - main.clientWidth;
    });
    expect(desborda).toBeLessThanOrEqual(0);
    const reglas = (await page.locator('.horario__reglas').boundingBox())!;
    const ano = (await page.locator('.horario__resultado').boundingBox())!;
    if (ancho < 1340) expect(ano.y).toBeGreaterThan(reglas.y + reglas.height - 1);
    else expect(Math.abs(ano.y - reglas.y)).toBeLessThan(2);
  });
}

for (const [idioma, texto] of [['en', 'Regular week'], ['fr', 'Semaine habituelle'], ['pt', 'Semana habitual']] as const) {
  test(`idiomas: en ${idioma}, sin claves sin traducir`, async ({ page }) => {
    await page.addInitScript((l) => localStorage.setItem('sc-language', l), idioma);
    await goto(page, POSTVENTA);
    await expect(page.getByText(texto).first()).toBeVisible();
    const crudas = await page.locator('main').evaluate((m) => (m.textContent ?? '').match(/repositories\.[a-z_.]+/g) ?? []);
    expect(crudas).toEqual([]);
  });
}

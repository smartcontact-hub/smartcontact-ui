import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

/**
 * Un agente enseña el mismo estado en el Dashboard y en Administración › Agentes (DD-139).
 *
 * Medido el 2026-10-01, antes del arreglo: de los 10 agentes de la demo del Dashboard, 6 (los ids 5 a 10) tenían un
 * estado en el Dashboard y otro en el listado. Eran dos listas escritas a mano, `DEMO_AGENT_PRESENCE` en el Dashboard
 * (DD-127) y `presenceStatus` en las semillas de Administración. Ahora el estado vive solo en Administración y el
 * Dashboard lo lee de allí con una correspondencia fija. Cada prueba cubre una manera de volver a tener dos verdades:
 * los datos de fábrica, lo que el navegador guardó del Dashboard antes, y un cambio hecho en la ficha del agente.
 *
 * Se mide sobre lo PINTADO en las dos pantallas: la prueba no sabe dónde vive cada estado.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/**
 * Lo que dice el Dashboard de cada estado del listado (DD-139). El listado distingue por qué un agente no recibe
 * conversaciones; el Dashboard solo si está disponible, conectado sin recibirlas («En pausa») o fuera del puesto.
 */
const EN_EL_DASHBOARD: Readonly<Record<string, string>> = {
  Disponible: 'Disponible',
  'No disponible': 'En pausa',
  Baño: 'En pausa',
  Comida: 'En pausa',
  Formación: 'En pausa',
  Administrativo: 'En pausa',
  'Post-conversando': 'En pausa',
  Desconectado: 'Desconectado',
};

interface Fila {
  readonly nombre: string;
  readonly estado: string;
}

/** Las filas de la primera tabla de agentes del monitor abierto: nombre y estado (el `aria-label` de su punto). */
const filasDelDashboard = async (page: Page): Promise<Fila[]> => {
  const tabla = page.locator('sc-dashboard-widget-card').filter({ has: page.locator('sc-dashboard-agents-table') }).first();
  await expect(tabla.locator('tbody tr').first()).toBeVisible();
  return tabla.locator('tbody tr').evaluateAll((trs) =>
    trs.map((tr) => ({
      nombre: tr.querySelector('.agents-table__agent')?.textContent?.trim() ?? '',
      estado: tr.querySelector('sc-badge')?.getAttribute('aria-label') ?? '',
    })),
  );
};

/** El estado de un agente en Administración › Agentes: lo busca por su nombre y lee su burbuja (la columna «Estado» queda escondida de inicio, DD-185). */
const estadoEnElListado = async (page: Page, nombre: string): Promise<string> => {
  const tabla = page.getByTestId('agents-table');
  await page.locator('sc-search input').fill(nombre);
  // Hasta que la tabla enseña SOLO a ese agente: la búsqueda anterior sigue pintada mientras la nueva no llega.
  await expect(async () => {
    const nombres = await tabla.locator('tbody tr .cell-name__text').allTextContents();
    expect(nombres.map((n) => n.trim())).toEqual([nombre]);
  }).toPass();
  return ((await tabla.locator('tbody tr sc-presence-avatar .visually-hidden').first().textContent()) ?? '').trim();
};

/** Los agentes cuyo estado en el Dashboard no es el que les toca por el listado, dichos para leerlos en el fallo. */
const distintosDelListado = async (page: Page, filas: readonly Fila[]): Promise<string[]> => {
  await goto(page, 'admin/agentes');
  const distintos: string[] = [];
  for (const { nombre, estado } of filas) {
    const enElListado = await estadoEnElListado(page, nombre);
    if (EN_EL_DASHBOARD[enElListado] !== estado) {
      distintos.push(`${nombre}: «${estado}» en el Dashboard y «${enElListado}» en el listado`);
    }
  }
  return distintos;
};

test('cada agente del Dashboard enseña el estado que tiene en Administración › Agentes', async ({ page }) => {
  await goto(page, 'dashboard');
  const filas = await filasDelDashboard(page);
  expect(filas.length, 'la tabla de «Monitor x» enseña agentes').toBeGreaterThan(0);
  expect(new Set(filas.map((f) => f.nombre)).size, 'cada nombre una vez: el listado se busca por nombre').toBe(filas.length);
  expect(await distintosDelListado(page, filas)).toEqual([]);
});

test('lo que el navegador guardó del Dashboard no manda: el estado se vuelve a leer de Administración', async ({ page }) => {
  /* Un navegador que ya abrió el Dashboard tiene sus monitores guardados (`sc-dashboard-monitors`, versión 2), con el
   * estado que tenía cada fila entonces: el latido de 8 s los escribe. Subir esa versión borraría los monitores de cada
   * usuario, así que lo guardado se lee de forma aditiva: se queda todo menos el estado, que llega de Administración.
   * Aquí se guarda un monitor con todos sus agentes desconectados y el anillo a 0. */
  await goto(page, 'dashboard');
  const nombres = (await filasDelDashboard(page)).map((f) => f.nombre);
  await page.addInitScript((agentes: readonly string[]) => {
    const fila = (name: string) => ({ name, presence: 'offline', conversations: 1, attended: 1, rejected: 0, transferred: 0, avgSeconds: 60 });
    const vacio = (id: string) => ({ id, layout: 'single', slots: [null] });
    const monitor = {
      id: 'guardado-antes',
      name: 'Guardado antes',
      boxes: [
        {
          id: 'caja-tabla',
          layout: 'single',
          slots: [{ id: 'w-tabla', kind: 'agents-table', type: 'agents-table', title: null, entities: agentes, filter: { channel: 'all', direction: 'all' }, rows: agentes.map(fila) }],
        },
        {
          id: 'caja-anillo',
          layout: 'split',
          slots: [{ id: 'w-anillo', kind: 'agents-state', type: 'agents-available', title: null, entities: agentes, filter: null, presence: 'available', value: 0, total: 0 }, null, null, null],
        },
        vacio('caja-3'),
        vacio('caja-4'),
      ],
    };
    localStorage.setItem('sc-dashboard-monitors', JSON.stringify([monitor]));
    localStorage.setItem('sc-dashboard-monitors-version', '2');
  }, nombres);

  await goto(page, 'dashboard');
  const filas = await filasDelDashboard(page);
  expect(filas.map((f) => f.nombre), 'pinta el monitor guardado').toEqual(nombres);
  const anillo = page.locator('.kpi--ring').first();
  await expect(anillo.locator('.sc-gauge__value'), 'el anillo guardado a 0 cuenta los disponibles de la tabla').toHaveText(
    String(filas.filter((f) => f.estado === 'Disponible').length),
  );
  await expect(anillo.locator('.kpi__caption')).toHaveText(`de ${filas.filter((f) => f.estado !== 'Desconectado').length} conectados`);
  expect(await distintosDelListado(page, filas)).toEqual([]);
});

test('cambiar el estado en la ficha de un agente lo cambia en el Dashboard', async ({ page }) => {
  await goto(page, 'dashboard');
  const antes = await filasDelDashboard(page);
  const objetivo = antes.find((f) => f.estado === 'En pausa');
  if (!objetivo) throw new Error('la demo no tiene ningún agente en pausa: la prueba no prueba nada');
  const anillo = page.locator('.kpi--ring').first();
  const disponibles = antes.filter((f) => f.estado === 'Disponible').length;
  await expect(anillo.locator('.sc-gauge__value')).toHaveText(String(disponibles));

  // Su ficha, desde el listado: la fila abre la ficha con el id del agente en la dirección.
  await goto(page, 'admin/agentes');
  await estadoEnElListado(page, objetivo.nombre);
  await page.getByTestId('agents-table').locator('tbody tr .cell-name__text').click();
  await expect(page).toHaveURL(/\/admin\/agentes\/editar\/\d+/);
  const id = /editar\/(\d+)/.exec(page.url())?.[1];
  await goto(page, `admin/agentes/editar/${id}?seccion=identidad`);
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#agent-presence') }), /^\s*Disponible\s*$/);
  await page.getByRole('button', { name: 'Guardar' }).click();
  /* Se espera al aviso, no al botón: mientras guarda, el botón ya está apagado (cargando) y el guardado llega 400 ms
   * después. Medido el 2026-10-01: navegar en ese hueco perdía el cambio, y el listado seguía en «Comida». */
  await expect(page.getByText(`Agente "${objetivo.nombre}" actualizado`), 'guardado').toBeVisible();
  // El cambio llegó a Administración: si no, que el Dashboard no lo enseñe no probaría nada.
  await goto(page, 'admin/agentes');
  expect(await estadoEnElListado(page, objetivo.nombre), 'el listado ya lo enseña disponible').toBe('Disponible');

  await goto(page, 'dashboard');
  const despues = await filasDelDashboard(page);
  expect(despues.find((f) => f.nombre === objetivo.nombre)?.estado, 'su fila sigue a su ficha').toBe('Disponible');
  await expect(anillo.locator('.sc-gauge__value'), 'y el anillo lo cuenta').toHaveText(String(disponibles + 1));
});

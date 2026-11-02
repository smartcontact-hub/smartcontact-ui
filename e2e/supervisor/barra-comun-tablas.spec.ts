import { expect, test, type Locator, type Page } from '@playwright/test';

import { goto } from './helpers';

/**
 * LA BARRA COMÚN DE LAS TABLAS DE ASIGNAR (DD-243): en todas, el filtro del conjunto primero («Todos / Asignados / Sin
 * asignar»), el buscador después llenando lo que queda, y la cifra de asignados al final, a la derecha. Al editar abre en
 * «Asignados»; en el alta, en «Todos» (DD-151). La cifra sigue a cada casilla. Y el hub de Repositorios, que filtra por
 * categoría, también pone el filtro delante del buscador.
 */
test.use({ storageState: { cookies: [], origins: [] } });

interface Caso {
  readonly ruta: string;
  readonly abre: 'Todos' | 'Asignados';
}

const CASOS: readonly Caso[] = [
  { ruta: 'admin/grupos/editar/1?seccion=agentes', abre: 'Asignados' },
  { ruta: 'admin/agentes/editar/1?seccion=grupos', abre: 'Asignados' },
  { ruta: 'admin/equipos/crear', abre: 'Todos' },
  { ruta: 'admin/equipos/editar/1', abre: 'Asignados' },
  { ruta: 'admin/agendas/crear', abre: 'Todos' },
  { ruta: 'admin/agendas/editar/1', abre: 'Asignados' },
  { ruta: 'admin/plantillas/crear', abre: 'Todos' },
  { ruta: 'admin/plantillas/editar/1', abre: 'Asignados' },
];

const izquierda = async (l: Locator) => (await l.boundingBox())!.x;

async function medirBarra(page: Page): Promise<Locator> {
  const barra = page.locator('sc-assign-bar');
  await expect(barra).toHaveCount(1);
  const filtro = barra.locator('sc-selectbutton');
  const buscador = barra.locator('sc-search');
  const cifra = barra.locator('.assign-bar__count');
  await expect(filtro.getByRole('button')).toHaveText(['Todos', 'Asignados', 'Sin asignar']);
  expect(await izquierda(filtro)).toBeLessThan(await izquierda(buscador));
  expect(await izquierda(buscador)).toBeLessThan(await izquierda(cifra));
  // La cifra va al final de la fila: entre ella y el borde derecho de la barra no queda nada.
  const [b, c, s] = [(await barra.boundingBox())!, (await cifra.boundingBox())!, (await buscador.boundingBox())!];
  expect(Math.round(b.x + b.width - (c.x + c.width))).toBeLessThanOrEqual(1);
  // El buscador llena lo que queda: de él a la cifra, 7, como entre el filtro y él (DD-192).
  expect(Math.round(c.x - (s.x + s.width))).toBe(7);
  expect(Math.round(s.x - (await filtro.boundingBox())!.x - (await filtro.boundingBox())!.width)).toBe(7);
  return barra;
}

for (const { ruta, abre } of CASOS) {
  test(`${ruta}: filtro, buscador y cifra, y abre en «${abre}»`, async ({ page }) => {
    await goto(page, ruta);
    const barra = await medirBarra(page);
    await expect(barra.getByRole('button', { name: abre, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(barra.locator('.assign-bar__count')).toHaveText(/^\d+ asignados?$/);
  });
}

test('Equipos: marcar en «Sin asignar» sube la cifra y la fila se queda hasta cambiar de filtro', async ({ page }) => {
  await goto(page, 'admin/equipos/crear');
  const barra = await medirBarra(page);
  await expect(barra.locator('.assign-bar__count')).toHaveText('0 asignados');
  await barra.getByRole('button', { name: 'Sin asignar', exact: true }).click();
  const filas = page.locator('sc-datatable tbody tr');
  const antes = await filas.count();
  await filas.first().getByRole('checkbox').click();
  await expect(barra.locator('.assign-bar__count')).toHaveText('1 asignado');
  await expect(filas).toHaveCount(antes);
});

test('Equipos: «Agente» se ordena por nombre, A→Z y Z→A', async ({ page }) => {
  await goto(page, 'admin/equipos/crear');
  const cabecera = page.locator('sc-datatable thead th', { hasText: 'Agente' });
  const primero = () => page.locator('sc-datatable tbody tr').first().locator('.assign__name-label').innerText();
  const inicial = await primero();
  // Cada clic reordena: se espera a que cambie la primera fila antes de leerla.
  await cabecera.click();
  await expect.poll(primero).not.toBe(inicial);
  const az = await primero();
  await cabecera.click();
  await expect.poll(primero).not.toBe(az);
  const za = await primero();
  expect(az.localeCompare(za, 'es')).toBeLessThan(0);
  await expect(cabecera).toHaveAttribute('aria-sort', 'descending');
});

test('Agendas: «Nombre» se ordena, y el listado de Equipos ordena por sus tres columnas', async ({ page }) => {
  await goto(page, 'admin/agendas/crear');
  await expect(page.locator('sc-agent-assignment-table thead th', { hasText: 'Nombre' })).toHaveClass(/p-datatable-sortable-column/);
  await goto(page, 'admin/equipos');
  const ordenables = page.getByTestId('repo-table').locator('thead th.p-datatable-sortable-column');
  await expect(ordenables).toHaveText(['Nombre', 'Descripción', 'Agentes']);
});

test('Repositorios: el filtro por categoría va delante del buscador, a 7', async ({ page }) => {
  await goto(page, 'admin/repositorios');
  const filtro = page.locator('.hub__toolbar sc-selectbutton');
  const buscador = page.locator('.hub__toolbar sc-search');
  const [f, b] = [(await filtro.boundingBox())!, (await buscador.boundingBox())!];
  expect(f.x).toBeLessThan(b.x);
  expect(Math.round(b.x - (f.x + f.width))).toBe(7);
});

test('el panel rápido del Monitor: la misma barra, con su cifra; el pie solo dice lo que falta guardar', async ({ page }) => {
  await goto(page, 'dashboard');
  await page.getByRole('tab').nth(1).click();
  const tarjeta = page.locator('sc-dashboard-widget-card').filter({ has: page.locator('sc-dashboard-group-panel') });
  await tarjeta.getByRole('button', { name: 'Asignar agentes', exact: true }).click();
  await page.getByRole('menu').getByRole('menuitem', { name: 'Exclusivo' }).click();
  const panel = page.locator('.agents-panel');
  const barra = panel.locator('sc-assign-bar');
  await expect(barra.locator('.assign-bar__count')).toHaveText(/^\d+ asignados?$/);
  const [f, s, c] = await Promise.all(['sc-selectbutton', 'sc-search', '.assign-bar__count'].map(async (sel) => (await barra.locator(sel).boundingBox())!));
  expect(Math.abs(f.y + f.height / 2 - (s.y + s.height / 2)), 'en una fila').toBeLessThanOrEqual(1);
  expect(Math.abs(s.y + s.height / 2 - (c.y + c.height / 2)), 'en una fila').toBeLessThanOrEqual(1);
  await expect(panel.locator('.agents-panel__footer')).not.toContainText('Asignados');
});

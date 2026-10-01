import { join } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { goto } from './helpers';

/**
 * AGRUPACIÓN POR ESPACIO — LO QUE VA JUNTO SE SEPARA MENOS QUE LO QUE NO (DD-123).
 *
 * La escalera 7 · 14 · 28 (AGENTS §«UX de pantalla» 9) vivía en un comentario de la hoja de Config
 * AED y no la medía nada; lo único que se medía iba en contra (un test fijaba la fila de `.grid` en
 * los 12,25 de la maqueta). Medido en el build el 2026-09-27, antes del arreglo: 10 vistas en 5
 * pantallas y 4 diálogos por debajo del doble.
 *
 * QUÉ MIDE, sobre las cajas renderizadas (`agrupacion-medida.js`):
 *   R1 · un campo está al menos al doble de su vecino de encima que de su etiqueta a su control;
 *   R2 · dos opciones en fila, al menos al doble entre ellas que de cada control a su texto;
 *   R3 · el botón que envía, al menos al doble del último campo que los campos entre sí;
 *   R4 · una caja (`sc-section-card`, `sc-panel`) no suma aire al suyo: lo que apilan los envoltorios de dentro,
 *        de su borde a lo primero y lo último que tiene, no llega a 7 (DD-125).
 *
 * DÓNDE: cada ruta del Supervisor con cada pestaña, sección de su índice o paso de su alta, el acceso, los diálogos
 * de alta que abre la acción «Nuevo…/Crear/Añadir» de cada lista, y «Duplicar» de un grupo. Una
 * pantalla o un diálogo nuevos entran solos si cuelgan de esas rutas o de esa acción.
 *
 * QUÉ NO VE: la agrupación de lo que no es un campo, una opción o un botón (tarjetas, títulos con su
 * texto, celdas de tabla). Esos huecos siguen siendo juicio: la revisión previa a enseñar una
 * pantalla (`npm run revision`) los captura para mirarlos.
 *
 * CONOCIDOS: lo que está rojo a sabiendas, con su medida y su porqué. Cualquier OTRO rojo rompe la
 * prueba, y un conocido que se pone verde también, para que se borre su línea el día que se arregle.
 */

const MEDIDA = join(process.cwd(), 'e2e', 'supervisor', 'agrupacion-medida.js');

interface Par {
  readonly regla: 'R1' | 'R2' | 'R3' | 'R4';
  readonly ok: boolean;
  readonly etiqueta: string;
  readonly vecino: string;
  readonly dentro: number;
  readonly entre: number;
}

const RUTAS = [
  'dashboard',
  'conversaciones',
  'conversaciones/reglas',
  'conversaciones/reglas/nueva',
  'conversaciones/entidades',
  'conversaciones/categorias',
  'admin/usuarios',
  'admin/usuarios/crear',
  'admin/usuarios/editar/1',
  'admin/grupos',
  'admin/grupos/crear',
  'admin/grupos/editar/11',
  'admin/agentes',
  'admin/agentes/crear',
  'admin/agentes/editar/1',
  'admin/labels',
  'admin/plantillas',
  'admin/repositorios',
  'admin/agendas',
  'admin/horarios',
  'admin/tipificaciones',
  'admin/variables',
  'admin/entidades',
  'admin/intenciones',
  'admin/reglas-ia',
  'admin/entidades-ia',
  'admin/clasificacion-ia',
  'config/aed/servicio',
  'config/aed/agentes',
  'config/aed/grupos',
  'config/seguridad',
  'config/sistema',
] as const;

/** Listas cuya acción de alta abre un diálogo o un panel (las demás navegan a su ficha). */
const ALTAS = [
  'conversaciones/entidades',
  'conversaciones/categorias',
  'admin/labels',
  'admin/plantillas',
  'admin/agendas',
  'admin/horarios',
  'admin/tipificaciones',
  'admin/variables',
  'admin/entidades',
  'admin/intenciones',
  'admin/reglas-ia',
  'admin/entidades-ia',
  'admin/clasificacion-ia',
] as const;

/**
 * Clave `vista · regla · etiqueta → vecino`, y su porqué. Vacío: los tres que hubo (el pie de
 * `sc-dialog` a 18 del último campo, contra 14 y 15,75 entre campos) se arreglaron llevando la
 * botonera a 28 en el propio componente (DD-123). Una entrada nueva necesita su medida y su DD.
 */
const CONOCIDOS: Record<string, string> = {};

const clave = (vista: string, p: Par): string => `${vista} · ${p.regla} · ${p.etiqueta} → ${p.vecino}`;

/**
 * Mide la vista que hay en pantalla. Un rojo tiene que AGUANTAR: se repite la medida hasta tres
 * veces, porque una animación de entrada (el diálogo, un fundido de navegación) da cajas a medio
 * camino que no son la pantalla.
 */
const medir = async (page: Page, vista: string): Promise<string[]> => {
  await page.evaluate(() => document.fonts.ready);
  let rojos: string[] = [];
  for (let intento = 0; intento < 3; intento++) {
    await page.waitForTimeout(intento === 0 ? 350 : 600);
    const pares = await page.evaluate(
      () => (window as unknown as { __medirAgrupacion: () => Par[] }).__medirAgrupacion(),
    );
    rojos = pares.filter((p) => !p.ok).map((p) => `${clave(vista, p)} (dentro ${p.dentro}, entre ${p.entre})`);
    if (!rojos.length) break;
  }
  return rojos;
};

/** Quita lo que va delante del texto de una pestaña o sección: la ligadura de su icono de Material, o el número de
 *  un paso del alta (DD-137). La misma que `nombreDe` de `scripts/revision-pantalla.mjs`, que tiene su prueba. */
const nombreDe = (txt: string): string => txt.replace(/^\s*(?:[a-z_]+|\d+)\s*\n/, '').replace(/\s+/g, ' ').trim();

/**
 * Lo mínimo que abre los pasos apagados de un alta (DD-137): la de grupo no deja pasar de General sin nombre
 * (DD-121). Se rellena al llegar al primer paso apagado, así que General se mide como la ve quien llega. Un alta
 * nueva con puerta entra aquí: si un paso sigue apagado, la prueba lo dice en vez de dejarlo sin medir.
 */
const PREPARAR: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'admin/grupos/crear': { '#group-name': 'Agrupación' },
};

/** Lo medido en un test: los rojos y las vistas que recorrió (para saber qué conocidos le tocan). */
interface Medido {
  readonly rojos: string[];
  readonly vistas: string[];
}

const medirVista = async (page: Page, vista: string): Promise<Medido> => ({ rojos: await medir(page, vista), vistas: [vista] });

/** Recorre la ruta y, si tiene pestañas, índice de secciones o pasos de alta, cada una. */
const medirRuta = async (page: Page, ruta: string): Promise<Medido> => {
  const pestanas = page.locator('main [role="tab"]');
  const secciones = page.locator('sc-form-section-nav .form-nav__item');
  const nP = await pestanas.count();
  const nS = await secciones.count();
  const tira = nP > 1 ? pestanas : nS > 1 ? secciones : null;
  if (!tira) return medirVista(page, ruta);
  const rojos: string[] = [];
  const vistas: string[] = [];
  for (let i = 0; i < (nP > 1 ? nP : nS); i++) {
    const item = tira.nth(i);
    if (!(await item.isEnabled())) {
      for (const [campo, valor] of Object.entries(PREPARAR[ruta] ?? {})) await page.locator(campo).fill(valor);
      await expect(item, `${ruta}: un paso apagado se quedaría sin medir; lo que lo abre va en PREPARAR`).toBeEnabled();
    }
    await item.click();
    const vista = `${ruta} · ${nombreDe(await item.innerText())}`;
    vistas.push(vista);
    rojos.push(...(await medir(page, vista)));
  }
  return { rojos, vistas };
};

/** Compara lo medido con los conocidos de ESAS vistas: ni un rojo nuevo, ni un conocido ya verde. */
const cuadrar = ({ rojos, vistas }: Medido): void => {
  const sinMedida = rojos.map((r) => r.replace(/ \(dentro .*\)$/, ''));
  const esperados = Object.keys(CONOCIDOS).filter((k) => vistas.some((v) => k.startsWith(`${v} · R`)));
  const nuevos = rojos.filter((_, i) => !esperados.includes(sinMedida[i]!));
  const curados = esperados.filter((k) => !sinMedida.includes(k));
  expect(
    nuevos,
    'En rojo. Por debajo del doble (DD-123): sube el hueco ENTRE al peldaño siguiente de 7 · 14 · 28, o baja el de DENTRO. ' +
      'Aire que se suma (R4, DD-125): quita el margen o el relleno de la cadena que se nombra.',
  ).toEqual([]);
  expect(curados, 'Ya están en verde: borra su línea de CONOCIDOS.').toEqual([]);
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: MEDIDA });
});

test('agrupación · acceso', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  cuadrar(await medirVista(page, 'login'));
});

for (const ruta of RUTAS) {
  test(`agrupación · ${ruta}`, async ({ page }) => {
    await goto(page, ruta);
    await page.waitForLoadState('networkidle');
    cuadrar(await medirRuta(page, ruta));
  });
}

for (const ruta of ALTAS) {
  test(`agrupación · alta de ${ruta}`, async ({ page }) => {
    await goto(page, ruta);
    await page.waitForLoadState('networkidle');
    const alta = page
      .locator('header button, main button')
      .filter({ hasText: /(nuev[oa]|añadir|crear)\b/i })
      .first();
    await alta.click();
    await expect(page.locator('[role="dialog"]:visible, .p-dialog:visible').first()).toBeVisible();
    cuadrar(await medirVista(page, `${ruta} · alta`));
  });
}

test('agrupación · duplicar un grupo', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await page.waitForLoadState('networkidle');
  await page.locator('tbody tr').first().locator('button').last().click();
  const duplicar = page.locator('.p-menu-item, [role="menuitem"]').filter({ hasText: /duplicar/i }).first();
  await expect(duplicar).toBeVisible();
  await duplicar.click();
  await expect(page.locator('[role="dialog"]:visible, .p-dialog:visible').first()).toBeVisible();
  cuadrar(await medirVista(page, 'admin/grupos · duplicar'));
});

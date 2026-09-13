import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

import { goto } from './helpers';

/**
 * PIEZAS HECHAS A MANO EN PANTALLAS — EL INVENTARIO SOLO PUEDE BAJAR.
 *
 * Por qué existe (2026-09-13, Rafa): «si lo que estamos montando es un sistema de diseño
 * automatizable, agéntico, lo suyo es no ir a mano a menos que sea tremendamente necesario».
 * DD-76 pasó las pastillas de categoría a `sc-tag`, pero una sonda encontró otras ocho familias de
 * etiquetas, estados y contadores que cada pantalla se dibuja con su propio SCSS. Una revisión a ojo
 * no las ve volver; este test sí.
 *
 * QUÉ CUENTA. Un elemento con forma de pastilla (alto 12-32, ancho ≤260, fondo o borde, radio ≥2,
 * con texto, sin controles dentro) que pinta una PANTALLA y no un componente del DS.
 *
 * CÓMO SABE QUIÉN LO PINTA. No por la clase ni por estar dentro de un `<sc-*>`: las celdas de una
 * tabla viven DENTRO de `sc-datatable` y las pinta la página. Cada elemento lleva el
 * `_ngcontent-X` de la plantilla que lo creó, y el host de esa plantilla lleva `_nghost-X`; si el
 * host es un selector del DS, es del DS. Los selectores se leen del código fuente del DS, no de una
 * lista escrita aquí. Así se midió el inventario de abajo, con control: detecta `sc-label` (radio 2,
 * que un primer filtro de radio ≥3 perdía) y no cuenta ninguno de los 104 `sc-tag` del Supervisor.
 *
 * QUÉ NO VE. Solo busca pastillas. Otras piezas a mano (cajas, filas, iconos sueltos) no entran.
 *
 * CÓMO SE USA. Si migras una pieza al DS, su número baja y el test se pone rojo pidiendo que bajes
 * el inventario: bájalo en el mismo commit. Si aparece una clase nueva, no la añadas aquí sin más:
 * usa el componente del DS, o escribe al lado por qué es «tremendamente necesario».
 */

const DS_LIB = join(process.cwd(), 'projects', 'ui-smartcontact', 'src', 'lib');

const selectoresDelDS = (): string[] => {
  const out = new Set<string>();
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const ruta = join(dir, name);
      if (statSync(ruta).isDirectory()) walk(ruta);
      else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) {
        for (const m of readFileSync(ruta, 'utf8').matchAll(/selector:\s*['"]([^'"]+)['"]/g)) {
          for (const s of m[1].split(',')) if (s.trim().startsWith('sc-')) out.add(s.trim());
        }
      }
    }
  };
  walk(DS_LIB);
  return [...out];
};

const RUTAS = [
  'conversaciones',
  'conversaciones/entidades',
  'conversaciones/reglas',
  'conversaciones/categorias',
  'admin/usuarios',
  'admin/grupos',
  'admin/agentes',
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
] as const;

/**
 * Clave: `clase (componente que la pinta)`. Valor: cuántas hay sumando las RUTAS, tema claro.
 *
 * Al nacer (2026-09-13) eran 14 familias y 140 piezas: estados (`sc-label`, `status-pill`,
 * `rules-status`), tipo de extensión y de entidad, chips de acción de regla y dos contadores. Esas
 * pasaron a `sc-tag` / `sc-badge` en el mismo cambio. Queda UNA, y no por olvido:
 */
const INVENTARIO: Record<string, number> = {
  /* El icono de cada tarjeta del hub de Repositorios. No es una etiqueta: su fondo y su borde
   * cambian con el hover y el deshabilitado DE LA TARJETA. Llevarlo a `sc-avatar` obligaría a
   * pisar sus clases internas desde la pantalla, que es otra forma de ir a mano. Se decide con
   * la tarjeta del hub, no sola. */
  'hub-item__icon (sc-repositorios-hub-page)': 11,
};

test('las pantallas no dibujan pastillas a mano fuera del inventario', async ({ page }) => {
  test.setTimeout(180_000);
  const DS = selectoresDelDS();
  expect(DS.length, 'la lectura de selectores del DS no encontró nada').toBeGreaterThan(40);

  const medido: Record<string, number> = {};
  for (const ruta of RUTAS) {
    await goto(page, ruta);
    await page.waitForTimeout(1200);
    const piezas = await page.evaluate((ds: string[]) => {
      const out: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('main *')) {
        const r = el.getBoundingClientRect();
        if (!r.width || r.height < 12 || r.height > 32 || r.width > 260) continue;
        const cs = getComputedStyle(el);
        const fondo = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
        if (!(fondo || parseFloat(cs.borderTopWidth) > 0)) continue;
        if (parseFloat(cs.borderTopLeftRadius) < 2) continue;
        if (!el.textContent?.trim() || el.querySelector('input, button, select')) continue;
        if (el.matches('button, a, input, [role=button], [role=option], [role=tab]')) continue;
        const attr = [...el.attributes].find((a) => a.name.startsWith('_ngcontent-'));
        if (!attr) continue;
        const host = document.querySelector(`[_nghost-${attr.name.slice('_ngcontent-'.length)}]`);
        const dueno = host ? host.tagName.toLowerCase() : '?';
        if (ds.includes(dueno)) continue;
        const clase = [...el.classList].filter((c) => !c.startsWith('ng-')).slice(0, 2).join('.');
        out.push(`${clase || el.tagName.toLowerCase()} (${dueno})`);
      }
      return out;
    }, DS);
    for (const p of piezas) medido[p] = (medido[p] ?? 0) + 1;
  }

  expect(
    medido,
    'Si una cifra BAJA, bájala aquí (migraste una pieza al DS). Si SUBE o aparece una clase, usa el ' +
      'componente del DS en vez de dibujarla a mano.',
  ).toEqual(INVENTARIO);
});

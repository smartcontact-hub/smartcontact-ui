import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ScDatatableComponent } from './sc-datatable.component';
import type { ScColumnDef } from '../../core/types/datatable.types';

/**
 * PRIMER TEST UNITARIO DEL REPO.
 *
 * Hasta ahora había CERO `TestBed`, y no por decisión: los targets `test` de
 * `angular.json` apuntaban al builder de karma, pero karma y jasmine nunca se
 * instalaron — `ng test` ni arrancaba. Era un arnés a medio montar, y por eso
 * toda la lógica se verificaba por e2e: en navegador, en segundos, y solo por
 * sus efectos visibles.
 *
 * Qué se gana aquí que la e2e no da: los CASOS LÍMITE. `[visibleColumns]` con
 * un `field` que no existe, con el array vacío, con duplicados — cosas que
 * ningún recorrido de usuario produce pero que un consumidor sí puede pasar, y
 * que en la e2e habría que montar una página entera para provocar.
 *
 * Se empieza por `sc-datatable` porque su lógica nueva (B4) es la que más
 * consumidores tiene: seis tablas del supervisor dependen de que no falle.
 */

interface Fila {
  id: number;
  nombre: string;
}

const COLS: readonly ScColumnDef<Fila>[] = [
  { field: 'id', header: 'ID' },
  { field: 'nombre', header: 'Nombre' },
  { field: 'acciones', header: '' },
];

/** Los computeds bajo prueba son `protected`: API interna, pero es justo la
 *  lógica que interesa fijar sin pasar por el DOM. */
type Interno = {
  visibleCols: () => readonly ScColumnDef<Fila>[];
  colspan: () => number;
  rowSelectDisabled: () => boolean;
};

function montar(inputs: Record<string, unknown> = {}) {
  TestBed.configureTestingModule({ imports: [ScDatatableComponent] });
  const fixture: ComponentFixture<ScDatatableComponent<Fila>> =
    TestBed.createComponent<ScDatatableComponent<Fila>>(ScDatatableComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture.componentInstance as unknown as Interno;
}

describe('sc-datatable · visibleCols', () => {
  it('sin [visibleColumns] pinta todas, en el orden declarado', () => {
    const c = montar({ columns: COLS });
    expect(c.visibleCols().map((x) => x.field)).toEqual(['id', 'nombre', 'acciones']);
  });

  it('filtra por field', () => {
    const c = montar({ columns: COLS, visibleColumns: ['nombre', 'acciones'] });
    expect(c.visibleCols().map((x) => x.field)).toEqual(['nombre', 'acciones']);
  });

  it('el ORDEN lo manda el array de visibles, no el declarado', () => {
    // Es lo que permite que el arrastre de `sc-column-selector` mueva columnas.
    const c = montar({ columns: COLS, visibleColumns: ['acciones', 'id', 'nombre'] });
    expect(c.visibleCols().map((x) => x.field)).toEqual(['acciones', 'id', 'nombre']);
  });

  it('ignora un field que no existe en columns, sin romper', () => {
    /* Caso límite REAL: `sc-column-selector` persiste sus claves en
     * localStorage. Si una columna se renombra en el código, la clave vieja
     * sigue guardada en el navegador del usuario. Si esto explotara o dejara un
     * hueco, la tabla se rompería SOLO para quien ya la había usado — el peor
     * tipo de fallo, invisible en local y en CI. */
    const c = montar({ columns: COLS, visibleColumns: ['nombre', 'fantasma', 'id'] });
    expect(c.visibleCols().map((x) => x.field)).toEqual(['nombre', 'id']);
  });

  it('con el array vacío no pinta ninguna columna', () => {
    // Distinto de `undefined`, que significa "todas". Vacío significa vacío.
    const c = montar({ columns: COLS, visibleColumns: [] });
    expect(c.visibleCols()).toHaveLength(0);
  });
});

describe('sc-datatable · colspan de la fila vacía', () => {
  it('cuenta las columnas VISIBLES, no las declaradas', () => {
    /* Si contara las declaradas, esconder una columna dejaría la fila de
     * "sin resultados" desbordando la tabla. */
    const c = montar({ columns: COLS, visibleColumns: ['id'], selectionMode: null });
    expect(c.colspan()).toBe(1);
  });

  it('suma uno por la columna de la casilla en modo multiple', () => {
    const c = montar({ columns: COLS, selectionMode: 'multiple' });
    expect(c.colspan()).toBe(4);
  });
});

describe('sc-datatable · quién selecciona al clicar la fila', () => {
  it('en multiple, la fila NO selecciona — eso es de la casilla', () => {
    /* El modelo canónico de la Ola 6: la fila abre, la casilla selecciona. Con
     * `pSelectableRow` activo, PrimeNG hacía las dos cosas con un solo click. */
    const c = montar({ selectionMode: 'multiple' });
    expect(c.rowSelectDisabled()).toBe(true);
  });

  it('en single SÍ selecciona: ahí seleccionar ES clicar la fila', () => {
    const c = montar({ selectionMode: 'single' });
    expect(c.rowSelectDisabled()).toBe(false);
  });

  it('sin selección, la fila no selecciona nada', () => {
    const c = montar({ selectionMode: null });
    expect(c.rowSelectDisabled()).toBe(true);
  });
});

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
  onCheckMousedown: (event: MouseEvent, index: number) => void;
  onSelectionChange: (nueva: Fila | readonly Fila[] | null) => void;
  selection: { (): unknown; set: (v: unknown) => void };
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


describe('sc-datatable · selección de rango con ancla', () => {
  const FILAS: Fila[] = [
    { id: 1, nombre: 'uno' },
    { id: 2, nombre: 'dos' },
    { id: 3, nombre: 'tres' },
    { id: 4, nombre: 'cuatro' },
    { id: 5, nombre: 'cinco' },
  ];

  /** Monta en el modo donde el rango tiene sentido, con `dataKey` puesto. */
  function tabla(inputs: Record<string, unknown> = {}) {
    return montar({ columns: COLS, value: FILAS, dataKey: 'id', selectionMode: 'multiple', ...inputs });
  }

  /* El flujo REAL, que es lo que estos tests reproducen ahora (la versión
   * anterior llamaba a un handler de click que en navegador ni se disparaba —
   * lo destapó Playwright): (1) `mousedown` sobre la casilla captura el
   * `shiftKey`; (2) p-table togglea la fila y emite la selección nueva por
   * `onSelectionChange`, que es donde se aplica el rango. El `target` con
   * `closest` finge que el gesto empezó sobre la casilla (el guard lo exige). */
  const md = (c: Interno, shift: boolean, index: number) =>
    c.onCheckMousedown({ shiftKey: shift, target: { closest: () => ({}) } } as unknown as MouseEvent, index);
  const ids = (c: Interno) => {
    const s = c.selection();
    const arr = Array.isArray(s) ? (s as Fila[]) : s ? [s as Fila] : [];
    return arr.map((f) => f.id).sort((a, b) => a - b);
  };

  it('un click normal (sin shift) pasa la selección tal cual y fija el ancla', () => {
    const c = tabla();
    md(c, false, 1);
    c.onSelectionChange([FILAS[1]!]); // lo que emite p-table tras togglear
    expect(ids(c)).toEqual([2]);
  });

  it('shift+click extiende desde el ancla hasta la fila clicada', () => {
    const c = tabla();
    md(c, false, 1);
    c.onSelectionChange([FILAS[1]!]); // ancla en idx1
    md(c, true, 4);
    c.onSelectionChange([FILAS[1]!, FILAS[4]!]); // p-table ya togló idx4
    expect(ids(c)).toEqual([2, 3, 4, 5]);
  });

  it('el rango funciona HACIA ATRÁS', () => {
    /* Seleccionar de abajo a arriba es la mitad de los usos reales y es donde
     * un `slice(ancla, index)` ingenuo devuelve vacío. */
    const c = tabla();
    md(c, false, 4);
    c.onSelectionChange([FILAS[4]!]);
    md(c, true, 1);
    c.onSelectionChange([FILAS[4]!, FILAS[1]!]);
    expect(ids(c)).toEqual([2, 3, 4, 5]);
  });

  it('el rango SUMA: no desmarca lo que ya había fuera de él', () => {
    const c = tabla();
    md(c, false, 0);
    c.onSelectionChange([FILAS[0]!]); // idx0 suelta
    md(c, false, 2);
    c.onSelectionChange([FILAS[0]!, FILAS[2]!]); // ancla=2
    md(c, true, 4);
    c.onSelectionChange([FILAS[0]!, FILAS[2]!, FILAS[4]!]); // rango 2..4
    expect(ids(c)).toEqual([1, 3, 4, 5]);
  });

  it('no duplica una fila que el rango vuelve a tocar', () => {
    /* La casilla ya marcó la fila clicada antes de que se aplique el rango:
     * sin deduplicar, esa fila entraría dos veces y el contador de la barra
     * masiva mentiría. */
    const c = tabla();
    md(c, false, 0);
    c.onSelectionChange([FILAS[0]!]);
    md(c, true, 2);
    c.onSelectionChange([FILAS[0]!, FILAS[2]!]); // rango 0..2 sobre [1,3]
    expect(ids(c)).toEqual([1, 2, 3]);
    expect(c.selection() as Fila[]).toHaveLength(3);
  });

  it('sin ancla previa, shift+click solo selecciona esa fila', () => {
    const c = tabla();
    md(c, true, 3);
    c.onSelectionChange([FILAS[3]!]);
    expect(ids(c)).toEqual([4]);
  });

  it('fuera de `multiple` no hay rango', () => {
    const c = tabla({ selectionMode: 'single' });
    md(c, false, 0);
    c.onSelectionChange(FILAS[0]!);
    md(c, true, 3);
    c.onSelectionChange(FILAS[3]!);
    expect(ids(c)).toEqual([4]);
  });

  it('un mousedown en el HUECO de la celda no deja un shift pendiente', () => {
    /* El guard `closest('p-tablecheckbox')` evita que un shift sobre el padding
     * contamine el siguiente cambio (p. ej. el de la casilla de cabecera). */
    const c = tabla();
    md(c, false, 1);
    c.onSelectionChange([FILAS[1]!]); // ancla=1
    c.onCheckMousedown(
      { shiftKey: true, target: { closest: () => null } } as unknown as MouseEvent,
      4,
    );
    c.onSelectionChange([FILAS[1]!, FILAS[4]!]); // cambio ajeno, sin rango
    expect(ids(c)).toEqual([2, 5]);
  });
});

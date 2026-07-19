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
  onCheckCellClick: (event: MouseEvent, index: number) => void;
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

  const click = (shift = false) => new MouseEvent('click', { shiftKey: shift });
  const ids = (c: Interno) => (c.selection() as Fila[]).map((f) => f.id);

  /* Este handler corre DESPUÉS de que `p-tableCheckbox` haya marcado su fila
   * (burbujea, llega el segundo). En estos tests no hay checkbox real, así que
   * se simula ese paso previo poniendo la selección a mano antes del shift. */

  it('sin shift solo fija el ancla: no toca la selección', () => {
    const c = tabla();
    c.onCheckCellClick(click(), 1);
    expect(c.selection()).toBeNull();
  });

  it('shift+click extiende desde el ancla hasta la fila clicada', () => {
    const c = tabla();
    c.onCheckCellClick(click(), 1); // ancla en la 2ª fila
    c.selection.set([FILAS[1]]); // lo que habría hecho la casilla
    c.onCheckCellClick(click(true), 4);
    expect(ids(c)).toEqual([2, 3, 4, 5]);
  });

  it('el rango funciona HACIA ATRÁS', () => {
    /* Seleccionar de abajo a arriba es la mitad de los usos reales y es donde
     * un `slice(ancla, index)` ingenuo devuelve vacío. */
    const c = tabla();
    c.onCheckCellClick(click(), 4);
    c.selection.set([FILAS[4]]);
    c.onCheckCellClick(click(true), 1);
    expect(ids(c)).toEqual([5, 2, 3, 4]);
  });

  /* AQUÍ FALTA UN TEST, y es más honesto decirlo que fingirlo.
   *
   * Escribí uno que afirmaba «el ancla no se mueve con shift, así que se puede
   * reencuadrar desde el mismo origen». Pasaba. Una prueba de mutación —hacer
   * que el ancla SÍ se moviera— lo dejó igual de verde: era vacuo.
   *
   * La razón no es el test, es la semántica: el rango se UNE a lo seleccionado
   * y la fila del ancla siempre está dentro, así que mover el ancla no cambia
   * el conjunto resultante. La propiedad no es observable HOY.
   *
   * Se vuelve observable el día que shift+click REEMPLACE el rango en vez de
   * sumarlo (que es lo que hacen Finder y Gmail). Esa es una decisión de
   * producto pendiente; cuando se tome, este test se escribe de verdad.
   */

  it('sin ancla previa, shift+click no inventa un rango', () => {
    const c = tabla();
    c.onCheckCellClick(click(true), 3);
    expect(c.selection()).toBeNull();
  });

  it('no duplica lo ya seleccionado', () => {
    /* La casilla ya marcó la fila clicada antes de que llegue este handler:
     * sin deduplicar, esa fila entraría dos veces y el contador de la barra
     * masiva mentiría. */
    const c = tabla();
    c.onCheckCellClick(click(), 0);
    c.selection.set([FILAS[0], FILAS[2]]);
    c.onCheckCellClick(click(true), 2);
    expect(ids(c)).toEqual([1, 3, 2]);
  });

  it('fuera de `multiple` no hay rango', () => {
    const c = tabla({ selectionMode: 'single' });
    c.onCheckCellClick(click(), 0);
    c.selection.set([FILAS[0]]);
    c.onCheckCellClick(click(true), 3);
    expect(ids(c)).toEqual([1]);
  });
});

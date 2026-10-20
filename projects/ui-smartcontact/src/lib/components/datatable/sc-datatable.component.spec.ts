import { Component, computed, signal, viewChild, type TemplateRef } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { ScDatatableComponent } from './sc-datatable.component';
import type { ScColumnDef } from '../../core/types/datatable.types';

// jsdom no tiene geometría ni ResizeObserver; el scroll y el ancho reales se prueban en e2e.
beforeEach(() => vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }));
afterEach(() => vi.unstubAllGlobals());

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
  selectionControl: () => 'checkbox' | 'radio' | null;
  onCheckMousedown: (event: MouseEvent, index: number) => void;
  onSelectionChange: (nueva: Fila | readonly Fila[] | null) => void;
  selection: { (): unknown; set: (v: unknown) => void };
  rowClass: (row: Fila, index: number) => string | undefined;
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

  it('en multiple sin columna (`none`) selecciona la fila, como el ejemplo «Multiple» de primeng.dev', () => {
    const c = montar({ selectionMode: 'multiple', selectionColumn: 'none' });
    expect(c.rowSelectDisabled()).toBe(false);
    expect(c.selectionControl()).toBeNull();
  });

  it('en single con radio la fila NO selecciona: eso es del radio', () => {
    const c = montar({ selectionMode: 'single', selectionColumn: 'radio' });
    expect(c.rowSelectDisabled()).toBe(true);
    expect(c.selectionControl()).toBe('radio');
  });

  it('una columna que no casa con el modo se queda en la de siempre de ese modo', () => {
    expect(montar({ selectionMode: 'single', selectionColumn: 'checkbox' }).selectionControl()).toBeNull();
    TestBed.resetTestingModule();
    expect(montar({ selectionMode: 'multiple', selectionColumn: 'radio' }).selectionControl()).toBe('checkbox');
  });
});

describe('sc-datatable · la columna de selección en el DOM', () => {
  it('con radio pinta un `p-table-radio-button` por fila y suma su columna al colspan', async () => {
    TestBed.configureTestingModule({ imports: [ScDatatableComponent] });
    const fixture = TestBed.createComponent<ScDatatableComponent<Fila>>(ScDatatableComponent);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('value', [{ id: 1, nombre: 'A' }, { id: 2, nombre: 'B' }]);
    fixture.componentRef.setInput('selectionMode', 'single');
    fixture.componentRef.setInput('selectionColumn', 'radio');
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('tbody p-table-radio-button')).toHaveLength(2);
    expect(host.querySelectorAll('tbody p-table-checkbox')).toHaveLength(0);
    expect((fixture.componentInstance as unknown as Interno).colspan()).toBe(4);
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
   * `onSelectionChange`, que es donde se aplica el rango.
   *
   * ⚠️ El `target` es un elemento de VERDAD, con la misma clase que pone la
   * plantilla. Antes era `{ closest: () => ({}) }` —un doble que decía «sí» a
   * cualquier selector—, y eso dejaba los 8 tests ciegos justo a lo único que
   * el guard comprueba: que el selector case con el DOM. PrimeNG 22 renombró
   * `p-tablecheckbox` a `p-table-checkbox`, el guard empezó a cortar siempre y
   * estos tests siguieron verdes con la selección por rango muerta.
   *
   * Regla que deja: un doble no debe responder que sí a la pregunta que el
   * código está haciendo. Si lo hace, el test mide su propio stub. */
  const casilla = () => {
    const td = document.createElement('td');
    const box = document.createElement('p-table-checkbox');
    box.className = 'sc-datatable__check-box';
    td.appendChild(box);
    return box;
  };
  const md = (c: Interno, shift: boolean, index: number) =>
    c.onCheckMousedown({ shiftKey: shift, target: casilla() } as unknown as MouseEvent, index);
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
    /* El guard `closest('.sc-datatable__check-box')` evita que un shift sobre el
     * padding contamine el siguiente cambio (p. ej. el de la casilla de
     * cabecera). El `target` es el `td` PELADO: mismo DOM, pero el gesto no
     * empezó sobre la casilla. */
    const c = tabla();
    md(c, false, 1);
    c.onSelectionChange([FILAS[1]!]); // ancla=1
    c.onCheckMousedown(
      { shiftKey: true, target: document.createElement('td') } as unknown as MouseEvent,
      4,
    );
    c.onSelectionChange([FILAS[1]!, FILAS[4]!]); // cambio ajeno, sin rango
    expect(ids(c)).toEqual([2, 5]);
  });
});


/**
 * La fila seleccionada lleva `sc-row--selected`, que sale de la SELECCIÓN y no de p-table.
 *
 * p-table pone `.p-datatable-row-selected` solo en las filas que marca él: las que añade un tramo con Mayúsculas llegan
 * por el input y se quedaban sin pintar (medido el 2026-10-05 en Usuarios y Agentes: la barra decía 4 seleccionadas y
 * se veían 2). Hasta hoy lo resolvía cada pantalla desde `[rowStyleClass]`, y solo lo hacía Conversaciones.
 */
describe('sc-datatable · la fila seleccionada lleva su clase, también la que añade un tramo', () => {
  const FILAS: Fila[] = [
    { id: 1, nombre: 'uno' },
    { id: 2, nombre: 'dos' },
    { id: 3, nombre: 'tres' },
  ];
  const tabla = (inputs: Record<string, unknown>) =>
    montar({ columns: COLS, value: FILAS, dataKey: 'id', selectionMode: 'multiple', ...inputs });

  it('marca las filas de la selección y ninguna más', () => {
    const c = tabla({ selection: [FILAS[1]!, FILAS[2]!] });
    expect(c.rowClass(FILAS[1]!, 1)).toBe('sc-row--selected');
    expect(c.rowClass(FILAS[2]!, 2)).toBe('sc-row--selected');
    expect(c.rowClass(FILAS[0]!, 0)).toBeUndefined();
  });

  it('las del tramo también: lo que emite la tabla tras un Mayús+clic', () => {
    const c = tabla({});
    const box = document.createElement('p-table-checkbox');
    box.className = 'sc-datatable__check-box';
    c.onCheckMousedown({ shiftKey: false, target: box } as unknown as MouseEvent, 0);
    c.onSelectionChange([FILAS[0]!]);
    c.onCheckMousedown({ shiftKey: true, target: box } as unknown as MouseEvent, 2);
    c.onSelectionChange([FILAS[0]!, FILAS[2]!]);
    // La del medio no la marcó p-table: la añadió el tramo.
    expect(c.rowClass(FILAS[1]!, 1)).toBe('sc-row--selected');
  });

  it('se suma a las clases de la pantalla', () => {
    const c = tabla({ selection: [FILAS[1]!], rowStyleClass: () => 'propia' });
    expect(c.rowClass(FILAS[1]!, 1)).toBe('propia sc-row--selected');
    expect(c.rowClass(FILAS[0]!, 0)).toBe('propia');
  });

  it('cuenta por `dataKey`: una copia con el mismo id está seleccionada', () => {
    const c = tabla({ selection: [{ ...FILAS[1]! }] });
    expect(c.rowClass(FILAS[1]!, 1)).toBe('sc-row--selected');
  });
});

describe('sc-datatable · columnas fijas nativas', () => {
  it('conecta cabeceras ordenables, simples y celdas; las demás siguen libres', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    try {
      TestBed.configureTestingModule({ imports: [ScDatatableComponent] });
      const fixture = TestBed.createComponent(ScDatatableComponent);
      const columns = [
        { field: 'id', header: 'ID', sortable: true, frozen: true, alignFrozen: 'left' },
        { field: 'nombre', header: 'Nombre' },
        { field: 'acciones', header: '', frozen: true, alignFrozen: 'right' },
      ];
      fixture.componentRef.setInput('columns', columns);
      fixture.componentRef.setInput('value', [{ id: 1, nombre: 'Agente' }]);
      fixture.detectChanges();
      await fixture.whenStable();
      const root: HTMLElement = fixture.nativeElement;
      expect(root.querySelectorAll('th.p-datatable-frozen-column')).toHaveLength(2);
      expect(root.querySelectorAll('td.p-datatable-frozen-column')).toHaveLength(2);
      expect(root.querySelector('th[data-field="nombre"]')?.classList.contains('p-datatable-frozen-column')).toBe(false);
      fixture.componentRef.setInput('columns', columns.map(c => ({ ...c, frozen: false })));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(root.querySelectorAll('.p-datatable-frozen-column')).toHaveLength(0);
      fixture.destroy();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('sc-datatable · la columna que nombra la fila es su cabecera (DD-194)', () => {
  it('pinta `th scope="row"` solo en la columna `rowHeader`, con su valor y fija si lo pide', async () => {
    TestBed.configureTestingModule({ imports: [ScDatatableComponent] });
    const fixture = TestBed.createComponent(ScDatatableComponent);
    fixture.componentRef.setInput('columns', [
      { field: 'id', header: 'ID' },
      { field: 'nombre', header: 'Nombre', rowHeader: true, frozen: true },
    ]);
    fixture.componentRef.setInput('value', [{ id: 1, nombre: 'Agente' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    const fila = (fixture.nativeElement as HTMLElement).querySelector('tbody tr')!;
    expect([...fila.children].map((c) => `${c.tagName}${c.getAttribute('scope') ? `[${c.getAttribute('scope')}]` : ''}`)).toEqual([
      'TD',
      'TH[row]',
    ]);
    const cabecera = fila.querySelector('th')!;
    expect(cabecera.textContent?.trim()).toBe('Agente');
    expect(cabecera.classList.contains('p-datatable-frozen-column')).toBe(true);
    fixture.destroy();
  });
});

describe('sc-datatable · esqueleto de carga', () => {
  function montarConDatos(skeleton: boolean) {
    TestBed.configureTestingModule({ imports: [ScDatatableComponent] });
    const fixture = TestBed.createComponent(ScDatatableComponent);
    fixture.componentRef.setInput('columns', COLS);
    fixture.componentRef.setInput('value', [
      { id: 1, nombre: 'Ana' },
      { id: 2, nombre: 'Luis' },
    ]);
    fixture.componentRef.setInput('selectionMode', 'multiple');
    fixture.componentRef.setInput('skeletonRows', 4);
    fixture.componentRef.setInput('skeleton', skeleton);
    fixture.detectChanges();
    return fixture;
  }

  it('pinta sus filas, un esqueleto por celda y ningún dato', async () => {
    const fixture = montarConDatos(true);
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    const filas = root.querySelectorAll('tbody tr');
    expect(filas.length).toBe(4);
    // 3 columnas + la casilla
    expect(filas[0].querySelectorAll('p-skeleton').length).toBe(4);
    expect(root.textContent).not.toContain('Ana');
    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelector('.sc-datatable__check-all input')?.hasAttribute('disabled')).toBe(true);
    fixture.destroy();
  });

  it('cada columna pinta su forma: avatar, etiqueta, botón o nada', async () => {
    TestBed.configureTestingModule({ imports: [ScDatatableComponent] });
    const fixture = TestBed.createComponent(ScDatatableComponent);
    fixture.componentRef.setInput('columns', [
      { field: 'nombre', header: 'Nombre', skeleton: 'avatar' },
      { field: 'grupo', header: 'Grupo' },
      { field: 'estado', header: 'Estado', skeleton: 'tag' },
      { field: 'acciones', header: '', skeleton: 'action' },
      { field: 'vacia', header: '', skeleton: 'none' },
    ]);
    fixture.componentRef.setInput('skeletonRows', 2);
    fixture.componentRef.setInput('skeleton', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const celdas = [...(fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr')[0].children];
    const formas = celdas.map((td) =>
      [...td.querySelectorAll('sc-skeleton')].map((sk) => (sk.querySelector('.p-skeleton-circle') ? 'circle' : 'rectangle')),
    );
    expect(formas).toEqual([['circle', 'rectangle'], ['rectangle'], ['rectangle'], ['rectangle'], []]);
    fixture.destroy();
  });

  it('al quitarlo, vuelven los datos y deja de estar ocupada', async () => {
    const fixture = montarConDatos(true);
    fixture.componentRef.setInput('skeleton', false);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('tbody tr').length).toBe(2);
    expect(root.querySelector('p-skeleton')).toBeNull();
    expect(root.textContent).toContain('Ana');
    expect(root.hasAttribute('aria-busy')).toBe(false);
    fixture.destroy();
  });
});

describe('sc-datatable · orden', () => {
  const COLS_ORDEN: readonly ScColumnDef<Fila>[] = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'nombre', header: 'Nombre', sortable: true },
  ];

  async function montarOrdenable(filas: Fila[], inputs: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ imports: [ScDatatableComponent] });
    const fixture = TestBed.createComponent<ScDatatableComponent<Fila>>(ScDatatableComponent);
    fixture.componentRef.setInput('columns', COLS_ORDEN);
    fixture.componentRef.setInput('value', filas);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const nombresPintados = (root: HTMLElement) =>
    [...root.querySelectorAll('tbody tr')].map((tr) => tr.children[1]?.textContent?.trim());

  it('ordena lo que pinta sin reordenar el array de quien usa la tabla', async () => {
    /* p-table ordena en sitio el array que recibe: sin la copia, la pantalla veía su propio array reordenado y el
     * orden de partida se perdía. */
    const filas: Fila[] = [{ id: 2, nombre: 'B' }, { id: 1, nombre: 'A' }, { id: 3, nombre: 'C' }];
    const fixture = await montarOrdenable(filas, { sortField: 'nombre' });
    expect(nombresPintados(fixture.nativeElement)).toEqual(['A', 'B', 'C']);
    expect(filas.map((f) => f.nombre)).toEqual(['B', 'A', 'C']);
    fixture.destroy();
  });

  it('con removableSort, el tercer clic en la cabecera quita el orden y vuelve el de partida', async () => {
    const filas: Fila[] = [{ id: 2, nombre: 'B' }, { id: 1, nombre: 'A' }, { id: 3, nombre: 'C' }];
    const fixture = await montarOrdenable(filas, { removableSort: true });
    const emitidos: unknown[] = [];
    fixture.componentInstance.sortChange.subscribe((e) => emitidos.push(e));
    const cabecera = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('thead th[data-field="nombre"]')!;
    for (let i = 0; i < 3; i++) {
      cabecera.click();
      fixture.detectChanges();
      await fixture.whenStable();
    }
    expect(emitidos).toEqual([
      { field: 'nombre', order: 1 },
      { field: 'nombre', order: -1 },
      { field: undefined, order: 0 },
    ]);
    expect(nombresPintados(fixture.nativeElement)).toEqual(['B', 'A', 'C']);
    expect(cabecera.getAttribute('aria-sort')).toBe('none');
    fixture.destroy();
  });

  it('una columna con defaultSortOrder -1 ordena de mayor a menor al primer clic, también viniendo de otra en descendente', async () => {
    /* «Servicios» y «Agentes» de Grupos (SISMAC-4056): se busca el que más tiene. p-table calcula el sentido con el
     * `defaultSortOrder` de TODA la tabla antes de avisar, así que darle la vuelta fuera dejaba la flecha mintiendo. */
    const cols: readonly ScColumnDef<Fila>[] = [
      { field: 'id', header: 'ID', sortable: true },
      { field: 'nombre', header: 'Nombre', sortable: true, defaultSortOrder: -1 },
    ];
    const fixture = await montarOrdenable([{ id: 2, nombre: 'B' }, { id: 1, nombre: 'A' }, { id: 3, nombre: 'C' }], { columns: cols });
    const emitidos: unknown[] = [];
    fixture.componentInstance.sortChange.subscribe((e) => emitidos.push(e));
    const root = fixture.nativeElement as HTMLElement;
    const pulsar = async (campo: string) => {
      root.querySelector<HTMLElement>(`thead th[data-field="${campo}"]`)!.click();
      fixture.detectChanges();
      await fixture.whenStable();
    };
    const nombre = root.querySelector<HTMLElement>('thead th[data-field="nombre"]')!;

    await pulsar('nombre');
    expect(nombresPintados(root)).toEqual(['C', 'B', 'A']);
    expect(nombre.getAttribute('aria-sort')).toBe('descending');
    await pulsar('nombre');
    expect(nombresPintados(root)).toEqual(['A', 'B', 'C']);
    expect(nombre.getAttribute('aria-sort')).toBe('ascending');

    // ID, a descendente con dos clics; y Nombre, otra vez su primer clic: de mayor a menor.
    await pulsar('id');
    await pulsar('id');
    await pulsar('nombre');
    expect(nombresPintados(root)).toEqual(['C', 'B', 'A']);
    expect(nombre.getAttribute('aria-sort')).toBe('descending');
    expect(emitidos.at(-1)).toEqual({ field: 'nombre', order: -1 });
    expect(emitidos.filter((e) => (e as { field?: string }).field === 'nombre').map((e) => (e as { order: number }).order)).toEqual([-1, 1, -1]);
    fixture.destroy();
  });

  it('sin removableSort, el tercer clic vuelve a ascendente, como p-table', async () => {
    const fixture = await montarOrdenable([{ id: 2, nombre: 'B' }, { id: 1, nombre: 'A' }]);
    const cabecera = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('thead th[data-field="nombre"]')!;
    for (let i = 0; i < 3; i++) {
      cabecera.click();
      fixture.detectChanges();
      await fixture.whenStable();
    }
    expect(nombresPintados(fixture.nativeElement)).toEqual(['A', 'B']);
    expect(cabecera.getAttribute('aria-sort')).toBe('ascending');
    fixture.destroy();
  });
});

/** Una cabecera con algo más que su texto: la casilla de «todos» de una tabla de asignación (SISMAC-4058). */
@Component({
  standalone: true,
  imports: [ScDatatableComponent],
  template: `
    <ng-template #cabecera let-col>
      <span class="propia">PROPIA:{{ col.header }}</span>
    </ng-template>
    <sc-datatable [value]="filas" [columns]="columnas()" dataKey="id" />
  `,
})
class ConCabeceraPropia {
  readonly filas: readonly Fila[] = [{ id: 1, nombre: 'Inés' }];
  private readonly cabecera = viewChild.required<TemplateRef<unknown>>('cabecera');
  readonly columnas = computed<readonly ScColumnDef<Fila>[]>(() => [
    { field: 'id', header: 'ID', headerTemplate: this.cabecera() as never, headerAriaLabel: 'Identificador' },
    { field: 'nombre', header: 'Nombre', sortable: true, headerTemplate: this.cabecera() as never },
  ]);
}

describe('sc-datatable · headerTemplate', () => {
  beforeEach(() => vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }));
  afterEach(() => vi.unstubAllGlobals());

  it('pinta la plantilla de la columna en su celda de cabecera, con la columna de contexto, y conserva la flecha de ordenar', async () => {
    TestBed.configureTestingModule({ imports: [ConCabeceraPropia] });
    const fixture = TestBed.createComponent(ConCabeceraPropia);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const id = root.querySelector<HTMLElement>('thead th[data-field="id"]')!;
    const nombre = root.querySelector<HTMLElement>('thead th[data-field="nombre"]')!;
    expect(id.querySelector('.propia')?.textContent).toBe('PROPIA:ID');
    expect(id.querySelector('.sc-datatable__header-label'), 'en lugar del texto, no además').toBeNull();
    expect(id.getAttribute('aria-label')).toBe('Identificador');
    expect(nombre.querySelector('.propia')?.textContent).toBe('PROPIA:Nombre');
    expect(nombre.querySelector('p-sort-icon, p-sorticon, [data-pc-name="sorticon"]'), 'la flecha de ordenar sigue').not.toBeNull();
    fixture.destroy();
  });
});

describe('sc-datatable · filtros y cabecera agrupada', () => {
  const FILAS: Fila[] = [{ id: 2, nombre: 'Berta' }, { id: 1, nombre: 'Anna' }, { id: 3, nombre: 'Carla' }];
  const COLS_FILTRO: readonly ScColumnDef<Fila>[] = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'nombre', header: 'Nombre', filter: { filterOn: 'input' } },
  ];

  async function montarFiltrable(inputs: Record<string, unknown> = {}, cols: readonly ScColumnDef<Fila>[] = COLS_FILTRO) {
    TestBed.configureTestingModule({ imports: [ScDatatableComponent] });
    const fixture = TestBed.createComponent<ScDatatableComponent<Fila>>(ScDatatableComponent);
    fixture.componentRef.setInput('columns', cols);
    fixture.componentRef.setInput('value', FILAS);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  async function escribirFiltro(fixture: ComponentFixture<ScDatatableComponent<Fila>>, texto: string) {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('.sc-datatable__filter-row input')!;
    input.value = texto;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const nombresPintados = (root: HTMLElement) =>
    [...root.querySelectorAll('tbody tr')].map((tr) => tr.children[1]?.textContent?.trim());

  it('al borrar el último filtro, el paginador vuelve a contar todas las filas', async () => {
    /* p-table solo recalcula la cuenta si queda algún filtro: borrar «Marta» dejaba 1 página para 150 filas. */
    const fixture = await montarFiltrable({ paginator: true, rows: 1 });
    const paginas = () => (fixture.nativeElement as HTMLElement).querySelectorAll('.p-paginator-page').length;
    expect(paginas()).toBe(3);
    await escribirFiltro(fixture, 'An');
    expect(paginas()).toBe(1);
    await escribirFiltro(fixture, '');
    expect(paginas()).toBe(3);
    fixture.destroy();
  });

  it('las columnas seguidas con el mismo group comparten una celda encima; las demás ocupan las dos filas', async () => {
    const fixture = await montarFiltrable({}, [
      { field: 'id', header: 'ID', group: 'Agente' },
      { field: 'nombre', header: 'Nombre', group: 'Agente' },
      { field: 'extra', header: 'Extra' },
    ]);
    const filasCabecera = (fixture.nativeElement as HTMLElement).querySelectorAll('thead tr');
    expect(filasCabecera.length).toBe(2);
    const grupo = filasCabecera[0].querySelector('th.sc-datatable__group')!;
    expect(grupo.textContent?.trim()).toBe('Agente');
    expect(grupo.getAttribute('colspan')).toBe('2');
    expect(filasCabecera[0].querySelector('th[data-field="extra"]')!.getAttribute('rowspan')).toBe('2');
    expect([...filasCabecera[1].querySelectorAll('th')].map((th) => th.textContent?.trim())).toEqual(['ID', 'Nombre']);
    fixture.destroy();
  });

  it('al pasar de fila a menú con un filtro puesto, el filtro se vacía y el menú nace con su lista de reglas', async () => {
    /* En fila, p-table guarda un valor suelto; en menú, una lista. El menú heredaba el valor y no se abría. */
    const fixture = await montarFiltrable();
    await escribirFiltro(fixture, 'An');
    expect(nombresPintados(fixture.nativeElement)).toEqual(['Anna']);
    fixture.componentRef.setInput('filterDisplay', 'menu');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(nombresPintados(fixture.nativeElement)).toEqual(['Berta', 'Anna', 'Carla']);
    const filtros = (fixture.componentInstance as unknown as { table: () => { filters: Record<string, unknown> } }).table().filters;
    expect(Array.isArray(filtros['nombre'])).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('.sc-datatable__filter-row')).toBeNull();
    fixture.destroy();
  });

  it('clear() quita filtro y orden, y las filas vuelven al orden de value', async () => {
    const fixture = await montarFiltrable({ sortField: 'id' });
    await escribirFiltro(fixture, 'a');
    expect(nombresPintados(fixture.nativeElement)).toEqual(['Anna']);
    fixture.componentInstance.clear();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(nombresPintados(fixture.nativeElement)).toEqual(['Berta', 'Anna', 'Carla']);
    fixture.destroy();
  });
});

describe('sc-datatable · edición', () => {
  /* El editor lo pone quien usa la tabla, en su plantilla: hace falta un anfitrión que lo declare. */
  @Component({
    imports: [ScDatatableComponent],
    template: `
      <ng-template #editor let-fila><input class="editor" [value]="fila.nombre" (input)="fila.nombre = $any($event.target).value" /></ng-template>
      <sc-datatable
        [value]="filas"
        [columns]="cols()"
        [editMode]="modo()"
        selectionMode="multiple"
        dataKey="id"
        (rowClick)="eventos.push('rowClick')"
        (rowKeydown)="eventos.push('rowKeydown')"
        (rowEditInit)="eventos.push('rowEditInit:' + $event.row.nombre)"
        (rowEditCancel)="eventos.push('rowEditCancel:' + $event.row.nombre)"
        (editComplete)="eventos.push('editComplete:' + $event.field)"
      />
    `,
  })
  class Anfitrion {
    readonly filas: Fila[] = [{ id: 1, nombre: 'Anna' }, { id: 2, nombre: 'Berta' }];
    readonly modo = signal<'cell' | 'row'>('cell');
    readonly eventos: string[] = [];
    private readonly editor = viewChild<TemplateRef<unknown>>('editor');
    readonly cols = computed<ScColumnDef<Fila>[]>(() => [
      { field: 'id', header: 'ID' },
      { field: 'nombre', header: 'Nombre', editTemplate: this.editor() as never },
    ]);
  }

  async function montarEditable(modo: 'cell' | 'row') {
    TestBed.configureTestingModule({ imports: [Anfitrion] });
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.componentInstance.modo.set(modo);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const celdaNombre = (root: HTMLElement) => root.querySelectorAll<HTMLElement>('tbody tr')[0].querySelectorAll('td')[2];

  it('por celda: pulsar la celda la abre sin disparar rowClick, y las teclas del editor no llegan a la fila', async () => {
    const fixture = await montarEditable('cell');
    const root = fixture.nativeElement as HTMLElement;
    celdaNombre(root).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const editor = celdaNombre(root).querySelector<HTMLInputElement>('input.editor');
    expect(editor).not.toBeNull();
    expect(fixture.componentInstance.eventos).not.toContain('rowClick');
    /* Cmd+A en el campo marcaba todas las filas; Fin se llevaba el foco a la fila. */
    editor!.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', metaKey: true, bubbles: true }));
    editor!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', code: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.eventos).not.toContain('rowKeydown');
    expect(root.querySelectorAll('tbody tr.p-datatable-row-selected').length).toBe(0);
    fixture.destroy();
  });

  it('por fila: el lápiz abre los editores de la fila y cancelar avisa para reponer', async () => {
    const fixture = await montarEditable('row');
    const root = fixture.nativeElement as HTMLElement;
    const primera = () => root.querySelectorAll<HTMLElement>('tbody tr')[0];
    expect(root.querySelectorAll('thead th.sc-datatable__row-editor').length).toBe(1);
    primera().querySelector<HTMLButtonElement>('.sc-datatable__row-editor button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(primera().querySelector('input.editor')).not.toBeNull();
    expect(root.querySelectorAll('tbody tr')[1].querySelector('input.editor')).toBeNull();
    const botones = [...primera().querySelectorAll<HTMLButtonElement>('.sc-datatable__row-editor button')];
    expect(botones.map((b) => b.getAttribute('aria-label'))).toEqual(['Guardar', 'Cancelar']);
    botones[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(primera().querySelector('input.editor')).toBeNull();
    expect(fixture.componentInstance.eventos).toEqual(['rowEditInit:Anna', 'rowEditCancel:Anna']);
    fixture.destroy();
  });
});

describe('sc-datatable · filas: detalle, grupos y fijas', () => {
  interface Agente {
    readonly id: number;
    readonly nombre: string;
    readonly equipo: string;
  }

  @Component({
    imports: [ScDatatableComponent],
    template: `
      <ng-template #detalle let-a><span class="detalle">Detalle de {{ a.nombre }}</span></ng-template>
      <sc-datatable
        [value]="filas"
        [columns]="cols"
        dataKey="id"
        [expansionTemplate]="conDetalle() ? detalle : undefined"
        [rowGroupMode]="modo()"
        [groupRowsBy]="'equipo'"
        [expandableRowGroups]="plegables()"
        [frozenValue]="fijas()"
      />
    `,
  })
  class Anfitrion {
    readonly filas: Agente[] = [
      { id: 1, nombre: 'Anna', equipo: 'A' },
      { id: 2, nombre: 'Berta', equipo: 'A' },
      { id: 3, nombre: 'Carla', equipo: 'B' },
    ];
    readonly cols: ScColumnDef<Agente>[] = [
      { field: 'equipo', header: 'Equipo' },
      { field: 'nombre', header: 'Nombre' },
    ];
    readonly conDetalle = signal(false);
    readonly modo = signal<'subheader' | 'rowspan' | undefined>(undefined);
    readonly plegables = signal(false);
    readonly fijas = signal<Agente[] | undefined>(undefined);
  }

  async function montarFilas(ajustes: (a: Anfitrion) => void) {
    TestBed.configureTestingModule({ imports: [Anfitrion] });
    const fixture = TestBed.createComponent(Anfitrion);
    ajustes(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('el detalle despliega solo su fila, aunque llegue groupRowsBy sin agrupar', async () => {
    /* Con groupRowsBy puesto, PrimeNG guarda lo desplegado por ese campo: desplegaba a la vez las dos del equipo A. */
    const fixture = await montarFilas((a) => a.conDetalle.set(true));
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('tbody tr td.sc-datatable__expander button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const detalles = [...root.querySelectorAll('tbody tr.sc-datatable__expansion')];
    expect(detalles.map((tr) => tr.textContent?.trim())).toEqual(['Detalle de Anna']);
    expect(detalles[0].querySelector('td')!.getAttribute('colspan')).toBe('3');
    fixture.destroy();
  });

  it('grupos plegables: salen plegados y la flecha del título despliega solo su grupo', async () => {
    const fixture = await montarFilas((a) => {
      a.modo.set('subheader');
      a.plegables.set(true);
    });
    const root = fixture.nativeElement as HTMLElement;
    const titulos = () => [...root.querySelectorAll('tbody tr.sc-datatable__group-row')].map((tr) => tr.textContent?.trim());
    const datos = () => root.querySelectorAll('tbody tr:not(.sc-datatable__group-row)').length;
    expect(titulos()).toEqual(['A', 'B']);
    expect(datos()).toBe(0);
    root.querySelector<HTMLButtonElement>('tbody tr.sc-datatable__group-row button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(datos()).toBe(2);
    fixture.destroy();
  });

  it('rowspan: la celda del grupo solo está en su primera fila y ocupa el grupo', async () => {
    const fixture = await montarFilas((a) => a.modo.set('rowspan'));
    const celdas = [...(fixture.nativeElement as HTMLElement).querySelectorAll('tbody td.sc-datatable__rowspan')];
    // Un grupo de una fila no lleva `rowspan`: PrimeNG da nulo, que en HTML vale 1.
    expect(celdas.map((td) => `${td.textContent?.trim()}:${td.getAttribute('rowspan')}`)).toEqual(['A:2', 'B:null']);
    fixture.destroy();
  });

  it('frozenValue: las fijas van en su propio cuerpo, pintadas como las demás', async () => {
    const fixture = await montarFilas((a) => a.fijas.set([{ id: 9, nombre: 'Fija', equipo: 'Z' }]));
    const fijas = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody.p-datatable-frozen-tbody:first-of-type tr');
    expect([...fijas].map((tr) => tr.textContent?.replace(/\s+/g, ' ').trim())).toEqual(['Z Fija']);
    fixture.destroy();
  });
});

describe('sc-datatable · datos: exportar, recordar y paginador', () => {
  const FILAS: Fila[] = [{ id: 2, nombre: 'Berta' }, { id: 1, nombre: 'Anna' }, { id: 3, nombre: 'Carla' }];
  const COLS_DATOS: readonly ScColumnDef<Fila>[] = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'nombre', header: 'Nombre', sortable: true, filter: { filterOn: 'input' } },
    { field: 'acciones', header: '', headerAriaLabel: 'Acciones', exportable: false },
  ];

  async function montarDatos(inputs: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ imports: [ScDatatableComponent] });
    const fixture = TestBed.createComponent<ScDatatableComponent<Fila>>(ScDatatableComponent);
    fixture.componentRef.setInput('columns', COLS_DATOS);
    fixture.componentRef.setInput('value', FILAS);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  /** jsdom no descarga: se queda con el texto del Blob y con el nombre del enlace. */
  function capturarDescarga() {
    const descarga = { csv: '', fichero: '' };
    vi.stubGlobal(
      'Blob',
      class {
        constructor(partes: unknown[]) {
          descarga.csv = String(partes[1]);
        }
      },
    );
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:prueba' });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      descarga.fichero = this.getAttribute('download') ?? '';
    });
    return descarga;
  }

  const nombresPintados = (root: HTMLElement) =>
    [...root.querySelectorAll('tbody tr')].map((tr) => tr.children[1]?.textContent?.trim());

  async function clic(fixture: ComponentFixture<ScDatatableComponent<Fila>>, el: HTMLElement) {
    el.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('exportCSV: las columnas visibles con su título, sin las no exportables, y las filas filtradas en su orden', async () => {
    const descarga = capturarDescarga();
    const fixture = await montarDatos({ sortField: 'nombre', sortOrder: -1, exportFilename: 'agentes' });
    fixture.componentInstance.exportCSV();
    expect(descarga.fichero).toBe('agentes.csv');
    expect(descarga.csv).toBe('"ID","Nombre"\n"3","Carla"\n"2","Berta"\n"1","Anna"');
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('.sc-datatable__filter-row input')!;
    input.value = 'B';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.exportCSV();
    expect(descarga.csv).toBe('"ID","Nombre"\n"2","Berta"');
    // Las columnas se prestan solo durante la llamada: p-table vuelve a no tener ninguna.
    expect((fixture.componentInstance as unknown as { table: () => { columns: unknown } }).table().columns).toBeUndefined();
    fixture.destroy();
  });

  it('exportCSV: solo las ocultas fuera, con separador y exportFunction de quien usa la tabla', async () => {
    const descarga = capturarDescarga();
    const fixture = await montarDatos({
      visibleColumns: ['nombre', 'acciones'],
      csvSeparator: ';',
      exportFunction: ({ data }: { data: unknown }) => (data === 'Anna' ? 'Anna "la jefa"' : String(data).toUpperCase()),
    });
    fixture.componentInstance.exportCSV();
    // La comilla de lo que devuelve exportFunction va doblada, como la del dato crudo: sin eso, la fila salía rota.
    expect(descarga.csv).toBe('"Nombre"\n"BERTA"\n"Anna ""la jefa"""\n"CARLA"');
    fixture.destroy();
  });

  async function volverConEstado(inputs: Record<string, unknown>) {
    TestBed.resetTestingModule();
    const restaurados: unknown[] = [];
    TestBed.configureTestingModule({ imports: [ScDatatableComponent] });
    const fixture = TestBed.createComponent<ScDatatableComponent<Fila>>(ScDatatableComponent);
    fixture.componentInstance.stateRestore.subscribe((s) => restaurados.push(s));
    fixture.componentRef.setInput('columns', COLS_DATOS);
    fixture.componentRef.setInput('value', FILAS);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, restaurados };
  }

  it('stateKey: al volver, repone la página y el orden descendente que tenía', async () => {
    /* p-table repone y, en el mismo arranque, sus entradas lo pisan: volvía en la primera página y en ascendente. Y el
     * filtro en fila sin escribir de «Nombre» se guardaba de forma que, al reponerlo, p-table buscaba su `[0]` y se rompía. */
    sessionStorage.clear();
    const inputs = { paginator: true, rows: 1, stateKey: 'sc-prueba' };
    const primera = await montarDatos(inputs);
    const cabecera = () => (primera.nativeElement as HTMLElement).querySelector<HTMLElement>('thead th[data-field="nombre"]')!;
    await clic(primera, cabecera());
    await clic(primera, cabecera());
    await clic(primera, (primera.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.p-paginator-page')[2]);
    expect(nombresPintados(primera.nativeElement)).toEqual(['Anna']);
    primera.destroy();

    const { fixture, restaurados } = await volverConEstado(inputs);
    const root = fixture.nativeElement as HTMLElement;
    expect(restaurados.length).toBe(1);
    expect(nombresPintados(root)).toEqual(['Anna']);
    expect(root.querySelector('thead th[data-field="nombre"]')!.getAttribute('aria-sort')).toBe('descending');
    expect(fixture.componentInstance.first()).toBe(2);
    fixture.destroy();
    sessionStorage.clear();
  });

  it('stateKey: repone lo marcado y avisa por selectionChange', async () => {
    sessionStorage.clear();
    const inputs = { stateKey: 'sc-prueba', dataKey: 'id', selectionMode: 'multiple' };
    const primera = await montarDatos(inputs);
    await clic(primera, (primera.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('tbody tr p-table-checkbox input')[1]);
    expect((primera.componentInstance.selection() as Fila[]).map((f) => f.nombre)).toEqual(['Anna']);
    primera.destroy();

    const { fixture } = await volverConEstado(inputs);
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.componentInstance.selection() as Fila[]).map((f) => f.nombre)).toEqual(['Anna']);
    expect(fixture.nativeElement.querySelectorAll('tbody tr.p-datatable-row-selected, tbody tr[aria-selected="true"]').length).toBe(1);
    fixture.destroy();
    sessionStorage.clear();
  });

  it('stateKey: repone el filtro escrito en la fila de filtros', async () => {
    sessionStorage.clear();
    const inputs = { stateKey: 'sc-prueba', stateStorage: 'session' };
    const primera = await montarDatos(inputs);
    const input = (primera.nativeElement as HTMLElement).querySelector<HTMLInputElement>('.sc-datatable__filter-row input')!;
    input.value = 'C';
    input.dispatchEvent(new Event('input'));
    primera.detectChanges();
    await primera.whenStable();
    expect(nombresPintados(primera.nativeElement)).toEqual(['Carla']);
    primera.destroy();

    const { fixture } = await volverConEstado(inputs);
    const root = fixture.nativeElement as HTMLElement;
    expect(nombresPintados(root)).toEqual(['Carla']);
    expect(root.querySelector<HTMLInputElement>('.sc-datatable__filter-row input')!.value).toBe('C');
    fixture.destroy();
    sessionStorage.clear();
  });

  it('paginador: el texto de la página con su plantilla, y arriba y abajo con paginatorPosition both', async () => {
    const fixture = await montarDatos({
      paginator: true,
      rows: 1,
      showCurrentPageReport: true,
      currentPageReportTemplate: '{first} a {last} de {totalRecords}',
      paginatorPosition: 'both',
    });
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('p-paginator').length).toBe(2);
    expect(root.querySelector('.p-paginator-current')!.textContent?.trim()).toBe('1 a 1 de 3');
    fixture.destroy();
  });
});

/**
 * Las 55 filas del Excel de BI (`PrimeNG_Table_vs_TreeTable_funcionalidades.xlsx`), cruzadas con lo que
 * mide hoy `sc-datatable`. Fuente de la clasificación: `~/Documents/Claude/2026-10 Tablas BI/
 * 01-matriz-funcionalidades.md` (medido sobre el código del componente, no sobre la doc de PrimeNG).
 *
 * `liveArg`: cuando la fila tiene un control en vivo en esta pantalla (el mismo `liveArgs` que alimenta
 * la vista previa fija), el nombre coincide con el input real de `sc-datatable`. Varias filas pueden
 * compartir un control (Selección · Single/Multiple son los dos valores del mismo `selectionMode`).
 */

export type BiPrioridad = 'si' | 'tal-vez' | 'no' | 'si-pero';
export type DsEstado = 'ya' | 'sin-back' | 'pide-back';

export interface LiveControl {
  readonly kind: 'boolean' | 'select';
  readonly argName: string;
  readonly options?: readonly { readonly label: string; readonly value: unknown }[];
}

export interface TablaFila {
  readonly id: number;
  readonly grupo: string;
  readonly nombre: string;
  readonly bi: BiPrioridad;
  readonly estado: DsEstado;
  readonly estimate?: string;
  readonly nota: string;
  readonly live?: LiveControl;
  /** Ruta de una demo YA construida en sc-docs que enseña esto de verdad (frozen, lazy, gestos…). */
  readonly demoRuta?: string;
}

const SELECTION_CONTROL: LiveControl = {
  kind: 'select',
  argName: 'selectionMode',
  options: [
    { label: 'Ninguna', value: null },
    { label: 'Una fila', value: 'single' },
    { label: 'Varias filas', value: 'multiple' },
  ],
};

const SORT_CONTROL: LiveControl = {
  kind: 'select',
  argName: 'sortField',
  options: [
    { label: 'Sin ordenar', value: '' },
    { label: 'Por nombre', value: 'name' },
  ],
};

export const TABLAS_BI: readonly TablaFila[] = [
  { id: 1, grupo: 'General', nombre: 'Basic', bi: 'si', estado: 'ya', nota: 'Componente base; 10 tablas migradas lo usan.' },
  { id: 2, grupo: 'General', nombre: 'Size', bi: 'si', estado: 'ya', nota: 'Input `size`.', live: { kind: 'select', argName: 'size', options: [{ label: 'Pequeño', value: 'sm' }, { label: 'Normal', value: 'md' }, { label: 'Grande', value: 'lg' }] } },
  { id: 3, grupo: 'General', nombre: 'Grid Lines', bi: 'si', estado: 'ya', nota: 'Input `showGridlines`.', live: { kind: 'boolean', argName: 'showGridlines' } },
  { id: 4, grupo: 'General', nombre: 'Striped Rows', bi: 'si', estado: 'ya', nota: 'Input `stripedRows`.', live: { kind: 'boolean', argName: 'stripedRows' } },
  { id: 5, grupo: 'Selección', nombre: 'Single', bi: 'si', estado: 'ya', nota: '`selectionMode=\'single\'`.', live: SELECTION_CONTROL },
  { id: 6, grupo: 'Selección', nombre: 'Multiple', bi: 'si', estado: 'ya', nota: '`selectionMode=\'multiple\'`: con casilla, o marcando la fila con `selectionColumn: \'none\'` y `metaKeySelection`; con barra masiva en producción.', live: SELECTION_CONTROL },
  { id: 7, grupo: 'Selección', nombre: 'Checkbox', bi: 'si', estado: 'ya', nota: 'Nativo de la selección múltiple.' },
  { id: 8, grupo: 'Selección', nombre: 'Radio Button', bi: 'si', estado: 'ya', nota: '`selectionColumn: \'radio\'` con `selectionMode=\'single\'`: la fila no marca, el radio sí.' },
  { id: 9, grupo: 'Selección', nombre: 'Keyboard', bi: 'no', estado: 'ya', nota: 'Marcando la fila (`selectionColumn: \'none\'`), el de PrimeNG: ↑ ↓ Inicio Fin Espacio Intro, Mayús para un tramo. Para lo demás, `rowsFocusable` y `rowKeydown` (DD-162).' },
  { id: 10, grupo: 'Selección', nombre: 'Column (acción en columna)', bi: 'si', estado: 'ya', nota: 'En producción: la cifra de agentes abre un panel desde su celda.' },
  { id: 11, grupo: 'Selección', nombre: 'Events (Toast)', bi: 'si', estado: 'ya', nota: 'Outputs `rowSelect` y `rowUnselect`. Dónde se cuenta lo pone la pantalla: junto a la tabla, no en un toast (DD-191).' },
  { id: 12, grupo: 'Ordenación', nombre: 'Single', bi: 'si', estado: 'ya', nota: 'Inputs `sortField`/`sortOrder`.', live: SORT_CONTROL },
  { id: 13, grupo: 'Ordenación', nombre: 'Multiple', bi: 'si', estado: 'ya', nota: '`sortMode=\'multiple\'`: Cmd/Ctrl+clic añade columna; `sortChange` trae `multiSortMeta`.' },
  { id: 14, grupo: 'Ordenación', nombre: 'Presort', bi: 'si', estado: 'ya', nota: 'Mismos inputs, con valor inicial.' },
  { id: 15, grupo: 'Ordenación', nombre: 'Multiple Presort', bi: 'si', estado: 'ya', nota: 'Input `multiSortMeta`, con `sortMode=\'multiple\'`.' },
  { id: 16, grupo: 'Ordenación', nombre: 'Removable Sort', bi: 'si', estado: 'ya', nota: 'Input `removableSort`: el tercer clic quita el orden y las filas vuelven al de partida.' },
  { id: 17, grupo: 'Paginación', nombre: 'Basic', bi: 'si', estado: 'ya', nota: 'Inputs `paginator`, `rows`, `rowsPerPageOptions`.', live: { kind: 'boolean', argName: 'paginator' } },
  { id: 18, grupo: 'Paginación', nombre: 'Programmatic', bi: 'si', estado: 'ya', nota: '`first` es de dos vías: se fija la página desde fuera.' },
  { id: 19, grupo: 'Paginación', nombre: 'Template', bi: 'no', estado: 'sin-back', estimate: 'medio día', nota: 'No hay slot para un paginador a medida.' },
  { id: 20, grupo: 'Scroll', nombre: 'Vertical', bi: 'si', estado: 'ya', nota: 'Inputs `scrollable`, `scrollHeight`.', live: { kind: 'boolean', argName: 'scrollable' } },
  { id: 21, grupo: 'Scroll', nombre: 'Horizontal', bi: 'si', estado: 'ya', nota: 'Mismo mecanismo.' },
  { id: 22, grupo: 'Scroll', nombre: 'Flexible', bi: 'si', estado: 'ya', nota: '`scrollHeight="flex"`.' },
  { id: 23, grupo: 'Frozen', nombre: 'Columnas', bi: 'si', estado: 'ya', nota: '`col.frozen`, `col.alignFrozen`.', demoRuta: 'components/datatable' },
  { id: 24, grupo: 'Frozen', nombre: 'Columnas múltiples', bi: 'si', estado: 'ya', nota: 'Varias columnas con `frozen: true`.', demoRuta: 'components/datatable' },
  { id: 25, grupo: 'Frozen', nombre: 'Filas', bi: 'si', estado: 'ya', nota: 'Slots `frozenbody`/`frozenexpandedrow` ya presentes.' },
  { id: 26, grupo: 'Expansión', nombre: 'Row Expansion', bi: 'si', estado: 'sin-back', estimate: '1-2 días', nota: 'No hay fila expandible: desarrollo nuevo, nunca pedido hasta hoy.' },
  { id: 27, grupo: 'Expansión', nombre: 'Controlled', bi: 'no', estado: 'sin-back', nota: 'Depende de Expansión · Row Expansion.' },
  { id: 28, grupo: 'Edición', nombre: 'Cell', bi: 'si', estado: 'sin-back', estimate: '2-3 días', nota: 'PrimeNG lo da nativo; el wrapper no lo expone todavía.' },
  { id: 29, grupo: 'Edición', nombre: 'Cell & Selection', bi: 'si', estado: 'sin-back', estimate: '2-3 días', nota: 'Depende de Edición · Cell.' },
  { id: 30, grupo: 'Edición', nombre: 'Row', bi: 'si', estado: 'sin-back', estimate: '2-3 días', nota: 'Depende de Edición · Cell.' },
  { id: 31, grupo: 'Row Group', nombre: 'Subheader', bi: 'tal-vez', estado: 'sin-back', estimate: '2-3 días', nota: 'No existe agrupación de filas; solo si BI la confirma en la reunión.' },
  { id: 32, grupo: 'Row Group', nombre: 'RowSpan', bi: 'tal-vez', estado: 'sin-back', nota: 'Depende de Row Group · Subheader.' },
  { id: 33, grupo: 'Row Group', nombre: 'Expandable', bi: 'tal-vez', estado: 'sin-back', nota: 'Depende de Row Group · Subheader.' },
  { id: 34, grupo: 'Column Resize', nombre: 'Fit', bi: 'si', estado: 'ya', nota: 'Inputs `resizableColumns`, `columnResizeMode=\'fit\'`.', live: { kind: 'boolean', argName: 'resizableColumns' } },
  { id: 35, grupo: 'Column Resize', nombre: 'Expand', bi: 'si', estado: 'ya', nota: '`columnResizeMode=\'expand\'`.' },
  { id: 36, grupo: 'Column Resize', nombre: 'Scrollable', bi: 'si', estado: 'ya', nota: 'Combinado con `scrollable`.' },
  { id: 37, grupo: 'Reorder', nombre: 'Column', bi: 'si', estado: 'ya', nota: 'Input `reorderableColumns`: se arrastra la cabecera y `columnOrderChange` da el orden nuevo, que la pantalla aplica con `visibleColumns`. También desde el globo «Columnas» (DD-162/176).', live: { kind: 'boolean', argName: 'reorderableColumns' } },
  { id: 38, grupo: 'Reorder', nombre: 'Row', bi: 'no', estado: 'sin-back', estimate: '1-2 días', nota: 'No existe arrastrar filas; nunca pedido en ninguna pantalla.' },
  { id: 39, grupo: 'Columnas', nombre: 'Column Toggle', bi: 'si', estado: 'ya', nota: 'Input `visibleColumns`, persistido en localStorage (DD-153/162/176).', demoRuta: 'components/datatable' },
  { id: 40, grupo: 'Columnas', nombre: 'Column Group – Basic', bi: 'tal-vez', estado: 'ya', nota: '`ScColumnDef.group`: las columnas seguidas con el mismo grupo comparten una celda encima. El grupo del pie no está.', demoRuta: 'components/datatable' },
  { id: 41, grupo: 'Columnas', nombre: 'Column Group – Filter & Sort', bi: 'tal-vez', estado: 'ya', nota: '`group` con `sortable` y `filter`: cada columna ordena y filtra bajo su grupo. Con cabecera agrupada no se reordenan columnas.' },
  { id: 42, grupo: 'Columnas', nombre: 'Dynamic Columns', bi: 'si', estado: 'ya', nota: 'Es el núcleo del componente.' },
  { id: 43, grupo: 'Filtro', nombre: 'Basic', bi: 'si', estado: 'ya', nota: '`ScColumnDef.filter` con `filterDisplay=\'row\'`: un control por columna bajo la cabecera, propio si hace falta (`filter.template`). Buscador con `filterGlobal()`; `clear()` lo quita todo.', demoRuta: 'components/datatable' },
  { id: 44, grupo: 'Filtro', nombre: 'Advanced', bi: 'tal-vez', estado: 'ya', nota: '`filterDisplay=\'menu\'`: un botón junto al título abre las reglas de la columna, con Y/O y «Añadir regla».' },
  { id: 45, grupo: 'Datos', nombre: 'Export', bi: 'si', estado: 'sin-back', estimate: 'medio día', nota: 'El evento ya se emite (`exportRequest`); nadie lo escucha todavía.' },
  { id: 46, grupo: 'Datos', nombre: 'Lazy Load', bi: 'si-pero', estado: 'pide-back', nota: 'El mecanismo existe, demostrado con datos simulados; sin un endpoint no hay nada que pedir.', demoRuta: 'components/datatable' },
  { id: 47, grupo: 'Datos', nombre: 'Virtual Scroll – Preload', bi: 'si-pero', estado: 'ya', nota: 'Input `virtualScroll`: virtualiza el RENDER, no es carga progresiva.' },
  { id: 48, grupo: 'Datos', nombre: 'Virtual Scroll – Lazy', bi: 'si', estado: 'pide-back', nota: 'Combina Preload + Lazy Load: mismo contrato de servidor.', demoRuta: 'components/datatable' },
  { id: 49, grupo: 'Datos', nombre: 'Stateful', bi: 'si', estado: 'sin-back', estimate: 'horas', nota: 'El patrón ya existe (columnas en localStorage); falta extenderlo a orden/página/filtro.' },
  { id: 50, grupo: 'Estados', nombre: 'Loading – Overlay', bi: 'si', estado: 'ya', nota: 'Input `loading`.', live: { kind: 'boolean', argName: 'loading' } },
  { id: 51, grupo: 'Estados', nombre: 'Loading – Skeleton', bi: 'si', estado: 'ya', nota: 'Inputs `skeleton` y `skeletonRows`, con la forma de cada columna (`ScColumnDef.skeleton`, DD-201).' },
  { id: 52, grupo: 'Estados', nombre: 'Empty State', bi: 'tal-vez', estado: 'ya', nota: 'Slot `scTableEmpty`.' },
  { id: 53, grupo: 'Aspecto', nombre: 'Template', bi: 'si', estado: 'ya', nota: '`cellTemplate` por columna: el núcleo del wrapper.' },
  { id: 54, grupo: 'Aspecto', nombre: 'Conditional Style', bi: 'si', estado: 'ya', nota: 'Input `rowStyleClass`, en producción en conversation-table.' },
  { id: 55, grupo: 'Interacción', nombre: 'Context Menu', bi: 'si', estado: 'ya', nota: 'Output `rowContextMenu`.', demoRuta: 'components/datatable' },
];

/** Orden de grupos: el del propio Excel, para que hable el mismo idioma que la reunión. */
export const GRUPOS_BI: readonly string[] = [
  'General', 'Selección', 'Ordenación', 'Paginación', 'Scroll', 'Frozen', 'Expansión', 'Edición',
  'Row Group', 'Column Resize', 'Reorder', 'Columnas', 'Filtro', 'Datos', 'Estados', 'Aspecto', 'Interacción',
];

export const BI_LABEL: Record<BiPrioridad, string> = {
  si: 'BI: sí',
  'tal-vez': 'BI: tal vez',
  no: 'BI: no',
  'si-pero': 'BI: sí, con matiz',
};

export const ESTADO_LABEL: Record<DsEstado, string> = {
  ya: 'Ya lo da',
  'sin-back': 'Falta front',
  'pide-back': 'Pide back',
};

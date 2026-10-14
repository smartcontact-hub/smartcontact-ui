import type { TemplateRef } from '@angular/core';

/** Contexto de la plantilla de celda custom de una columna. */
export interface ScColumnCellContext<T = unknown> {
  /** La fila de datos. */
  readonly $implicit: T;
  /** Índice de la fila en el render actual. */
  readonly rowIndex: number;
  /**
   * La columna que se está pintando (`let-col="col"`).
   *
   * Imprescindible para las tablas con columnas CONFIGURABLES, que no pueden
   * declarar un `<ng-template>` por columna porque no saben cuáles habrá: con
   * una sola plantilla genérica, sin esto no hay forma de saber qué campo leer
   * ni cómo pintarlo. Las tablas de columnas fijas pueden ignorarlo.
   */
  readonly col: ScColumnDef<T>;
}

/**
 * Definición de columna del `sc-datatable`. Modelo data-driven (column-def +
 * template), 1:1 con el preset PrimeNG ya tokenizado.
 *
 * `header` va **ya traducido por el consumidor** (el DS no traduce contenido —
 * misma decisión que la paleta de comandos). `cellTemplate` deja al consumidor
 * componer cualquier celda (avatar+nombre, `sc-inline-rename-cell`, badges…) sin
 * que el DS conozca tipos de celda.
 */
export interface ScColumnDef<T = unknown> {
  /**
   * Propiedad de la fila que se lee y por la que se ordena. Es también la
   * identidad de la columna: `[visibleColumns]` casa por este valor, así que
   * una columna sin datos (acciones, kebab) necesita igualmente un `field`
   * único aunque no exista en la fila.
   */
  readonly field: string;
  /** Cabecera ya traducida por el consumidor. */
  readonly header: string;
  /** Nombre accesible de la cabecera cuando `header` va vacío.
   *
   * Las columnas de acciones (kebab, menú) se pintan con `header: ''` a
   * propósito: visualmente no deben decir nada. Pero un `<th>` vacío es una
   * cabecera de columna ANÓNIMA para un lector de pantalla, y las tablas a
   * mano que se migraron sí llevaban su `aria-label="Acciones"` — o sea que
   * la migración lo perdía en silencio. Lo destaparon tres revisiones
   * independientes el 2026-07-19, cada una en su tabla. */
  readonly headerAriaLabel?: string;
  /** Activa la UI de orden por esta columna (orden client-side de p-table). */
  readonly sortable?: boolean;
  /** Ancho CSS de la columna (p.ej. `'12rem'`, `'20%'`). */
  readonly width?: string;
  /** Alineación del texto de la celda y la cabecera. */
  readonly align?: 'left' | 'right' | 'center';
  /** Fija la columna con pFrozenColumn; sin pedirlo, sigue desplazándose. */
  readonly frozen?: boolean;
  /** Borde físico donde la fija PrimeNG. Por defecto, el izquierdo. */
  readonly alignFrozen?: 'left' | 'right';
  /**
   * La columna nombra la fila: su celda es `<th scope="row">` y no `<td>`, y un lector de pantalla
   * la anuncia al recorrer el resto de la fila (DD-194). Una por tabla, la que se queda fija en estrecho.
   */
  readonly rowHeader?: boolean;
  /**
   * Plantilla de celda custom; contexto `{ $implicit: row, rowIndex }`. Si se
   * omite, la celda pinta `row[field]`.
   */
  readonly cellTemplate?: TemplateRef<ScColumnCellContext<T>>;
  /**
   * La celda de esta columna NO dispara `(rowClick)`.
   *
   * Para columnas de acciones: el kebab ya para la propagación por su cuenta,
   * pero el HUECO alrededor —el padding de la celda— no, así que fallar el
   * botón por unos píxeles abría la ficha. Antes de migrar lo tragaba el `<td>`
   * de la página; ahora el `<td>` lo pinta el DS, y por eso se declara aquí.
   */
  readonly stopRowClick?: boolean;
  /**
   * Con `reorderableColumns` en la tabla, si esta columna se puede arrastrar a otro sitio. Por
   * defecto sí; `false` la deja fija (p. ej. la que da nombre a la fila).
   */
  readonly reorderable?: boolean;
  /**
   * Forma de la celda mientras la tabla pinta su esqueleto (`[skeleton]`), para que al llegar los datos no cambie nada:
   * `text`, una barra de ancho variado (la receta de carga perezosa de primeng.dev/table); `avatar`, el círculo del avatar
   * y una barra; `tag`, la píldora de una etiqueta; `action`, el cuadrado de un botón de solo icono pequeño; `none`, nada.
   * Por defecto, `text`.
   */
  readonly skeleton?: ScColumnSkeleton;
  /**
   * Filtro de la columna: el `p-columnFilter` de primeng.dev/table «Filter» tal cual, en una fila bajo la cabecera o
   * en un menú junto al título según `filterDisplay` de la tabla. Filtra por `field`.
   */
  readonly filter?: ScColumnFilter;
  /**
   * Cabecera de grupo (primeng.dev/table «Column Group»): las columnas SEGUIDAS con el mismo `group` comparten una
   * celda encima de sus títulos. Las que no lo llevan ocupan las dos filas de la cabecera.
   */
  readonly group?: string;
  /**
   * El control con el que se edita la celda (primeng.dev/table «Cell Edit» y «Row Edit»): el `#input` de su
   * `p-cellEditor`; el `#output` es la celda de siempre. Con `editMode` `cell` se abre al pulsar la celda; con `row`, con
   * el lápiz de la fila. El control escribe en la fila (`row[field]`); deshacer lo cambiado es de quien usa la tabla.
   */
  readonly editTemplate?: TemplateRef<ScColumnCellContext<T>>;
  /** Si la columna sale en `exportCSV()`. Por defecto, sí; `false` para las que no son datos (avatar, botones). */
  readonly exportable?: boolean;
}

/** Los nombres de los tres botones de editar una fila (`editMode: 'row'`), ya traducidos por quien usa la tabla. */
export interface ScRowEditLabels {
  readonly edit: string;
  readonly save: string;
  readonly cancel: string;
}

/** Contexto de `expansionTemplate`, `groupHeaderTemplate` y `groupFooterTemplate` de `sc-datatable`. */
export interface ScRowTemplateContext<T = unknown> {
  /** La fila: la desplegada, o la primera de su grupo. */
  readonly $implicit: T;
  readonly rowIndex: number;
  /** Si la fila o el grupo están desplegados. */
  readonly expanded?: boolean;
}

/** Los nombres del botón que despliega una fila o un grupo, ya traducidos por quien usa la tabla. */
export interface ScRowExpandLabels {
  readonly expand: string;
  readonly collapse: string;
}

/** Payload de `rowReorder`: de dónde a dónde se arrastró la fila y las filas en su orden nuevo. */
export interface ScDatatableRowReorderEvent<T = unknown> {
  readonly dragIndex: number;
  readonly dropIndex: number;
  readonly rows: readonly T[];
}

/** Payload de `rowEditInit`, `rowEditSave` y `rowEditCancel`: la fila y su índice en el render actual. */
export interface ScDatatableRowEditEvent<T = unknown> {
  readonly row: T;
  readonly index: number;
}

/** Contexto de la plantilla propia de un filtro (`ScColumnFilter.template`): el `#filter` de `p-columnFilter`. */
export interface ScColumnFilterContext {
  /** El valor que tiene el filtro ahora. */
  readonly $implicit: unknown;
  /** Se llama con el valor nuevo para filtrar. */
  readonly filterCallback: (value: unknown) => void;
}

/** El filtro de una columna (`ScColumnDef.filter`): los inputs de `p-columnFilter`, con sus mismos valores por defecto. */
export interface ScColumnFilter {
  /** El control que pinta PrimeNG: `text` (por defecto), `numeric`, `date` o `boolean`. */
  readonly type?: 'text' | 'numeric' | 'date' | 'boolean';
  /** Cómo compara (`contains`, `equals`, `in`, `gte`…). Sin él, el de PrimeNG para su `type`. */
  readonly matchMode?: string;
  readonly placeholder?: string;
  /** Nombre accesible del control. Sin él, el título de la columna. */
  readonly ariaLabel?: string;
  /** Cuándo filtra el texto y el número: al pulsar Intro (por defecto) o al escribir. */
  readonly filterOn?: 'enter' | 'input';
  /**
   * En fila: el botón que abre las opciones de comparación. Por defecto, sí. En `menu` no cuenta: ahí el menú ES el
   * filtro, y en `p-column-filter` apagarlo lo quitaba entero.
   */
  readonly showMenu?: boolean;
  /**
   * El `numeric`: las flechas de subir y bajar. Por defecto, sí. En fila, con el botón de comparar al lado, no caben en
   * una columna estrecha y se pisan (medido en 10rem): ahí, o el uno o las otras.
   */
  readonly showButtons?: boolean;
  /** En menú: elegir cómo compara, Y/O entre reglas y añadir otra regla. Por defecto, sí los tres. */
  readonly showMatchModes?: boolean;
  readonly showOperator?: boolean;
  readonly showAddButton?: boolean;
  /**
   * Un control propio en lugar del de PrimeNG (un `sc-select`, un `sc-multiselect`), como el «Agent» y el «Status»
   * del ejemplo: recibe el valor y `filterCallback`.
   */
  readonly template?: TemplateRef<ScColumnFilterContext>;
}

/** Forma de una celda en el esqueleto de carga de `sc-datatable` (ver `ScColumnDef.skeleton`). */
export type ScColumnSkeleton = 'text' | 'avatar' | 'tag' | 'action' | 'none';

/**
 * Payload de los gestos de fila (`rowClick`, `rowContextMenu`).
 *
 * Lleva el evento original **sin consumir**: el DS solo hace el
 * `preventDefault()` del menú contextual (evitar el menú nativo del navegador
 * es la única lectura posible de ese gesto). Todo lo demás —parar la
 * propagación, leer `shiftKey`— es del consumidor, que es quien sabe qué
 * significa un click en su tabla.
 */
export interface ScDatatableRowEvent<T = unknown> {
  /** La fila sobre la que se hizo el gesto. */
  readonly row: T;
  /** Índice de la fila en el render actual (ojo: cambia al ordenar/paginar). */
  readonly index: number;
  /** El evento del DOM, por si el consumidor necesita `shiftKey` o coordenadas. */
  readonly originalEvent: MouseEvent;
}

/**
 * Payload de `rowKeydown`. Igual que `ScDatatableRowEvent` pero con el evento
 * de teclado, para que el consumidor lea `key` sin castear.
 */
export interface ScDatatableRowKeyEvent<T = unknown> {
  readonly row: T;
  readonly index: number;
  readonly originalEvent: KeyboardEvent;
}

/**
 * Clases extra por fila. Se resuelve en cada render, así que debe ser barata y
 * pura: nada de leer señales que no dependan de la propia fila.
 */
export type ScRowStyleClassFn<T = unknown> = (row: T, index: number) => string | undefined;

/**
 * Nombre accesible de la casilla de una fila.
 *
 * Existe porque sin él PrimeNG cae a sus literales por defecto —`'Row Selected'`,
 * `'All items selected'`— que son **inglés fijo**: no pasan por i18n y no dicen
 * QUÉ fila es. En una app de cuatro idiomas eso convierte una tabla
 * seleccionable en una lista de casillas anónimas para un lector de pantalla.
 * Las tablas escritas a mano sí las nombraban (`[attr.aria-label]="user.name"`),
 * así que cada migración lo perdía en silencio.
 */
export type ScRowAriaLabelFn<T = unknown> = (row: T, index: number) => string;

import { Signal } from '@angular/core';
import type { GroupRef } from '@smartcontact-hub/components';

/** Material Symbols glyph name (e.g. `'call'`, `'inventory_2'`). */
export type LucideIconData = string;

export interface RepoEntity {
  readonly id: number;
  readonly name: string;
}

/** Visual presentation for a column. `count` es una cifra: la lista la escribe con el separador de miles del idioma. */
export type RepoColumnKind = 'text' | 'truncate' | 'status' | 'count' | 'date' | 'groups';

export interface RepoColumnDef<T extends RepoEntity> {
  readonly key: string;
  readonly labelKey: string;
  readonly kind: RepoColumnKind;
  readonly accessor: (item: T) => string;
  /** CSS width applied to the cell (e.g. `'192px'`, `'25%'`). Defaults to `auto`. */
  readonly width?: string;
  /** Mark the primary "name" column so it renders bolder. */
  readonly emphasis?: boolean;
  /** For `kind === 'status'`: maps the raw value to a translated label + tone. */
  readonly statusMap?: Readonly<Record<string, RepoStatusEntry>>;
  /** Para `kind === 'groups'`: los grupos que usan la fila, para el desplegable de «Grupos» de siempre. */
  readonly groups?: (item: T) => readonly GroupRef[];
  /** Para `kind === 'groups'`: lo que oye el lector en la cifra, si no son solo grupos («N grupos y agentes»). Lleva
   *  `{{count}}` y su forma para uno en `<clave>_one`. */
  readonly groupsAriaKey?: string;
}

export interface RepoStatusEntry {
  readonly labelKey: string;
  readonly tone: 'success' | 'secondary' | 'warning' | 'danger' | 'info';
}

/** `switch`: un interruptor de dos estados (Activa o Inactiva); con dos opciones, un desplegable pedía dos clics. */
export type RepoFieldType = 'text' | 'textarea' | 'select' | 'switch';

export interface RepoFieldDef {
  readonly key: string;
  readonly labelKey: string;
  /** Una etiqueta ya escrita (no una clave): la de un campo que el usuario nombra, como «Personalizado 1». Gana a `labelKey`. */
  readonly label?: string;
  /** Un título de sección encima de este campo, si abre una: el formulario los agrupa. */
  readonly sectionKey?: string;
  /** Ocupa el ancho entero cuando el formulario va en dos columnas (una dirección, las notas). */
  readonly wide?: boolean;
  readonly type: RepoFieldType;
  readonly required?: boolean;
  readonly placeholderKey?: string;
  /** Required for `type === 'select'` and `'switch'`. First option is the default; in a switch, it is «on». */
  readonly options?: readonly { readonly value: string; readonly labelKey: string }[];
  /** `tel` para un teléfono: el teclado del móvil y el autocompletado lo reconocen. Por defecto, `text`. */
  readonly inputType?: 'text' | 'tel';
}

/**
 * Per-instance configuration consumed by `<sc-repo-list-page>`. Each of the
 * 9 repository pages (Agendas, Horarios, …) contributes one of these.
 */
export interface RepoPageConfig<T extends RepoEntity> {
  readonly titleKey: string;
  readonly entitySingularKey: string;
  /** El título del alta, con su género («Nueva tipificación»). Sin él, el genérico «Nuevo/a {{entity}}». */
  readonly createTitleKey?: string;
  readonly entityPluralKey: string;
  readonly icon: LucideIconData;
  readonly breadcrumbExtraKey: string;
  readonly columns: readonly RepoColumnDef<T>[];
  readonly fields: readonly RepoFieldDef[];
  readonly searchKeys: readonly (keyof T & string)[];
  readonly filePrefix: string;
  readonly sheetNameKey: string;
  /**
   * Con editor propio (DD-163): la base de sus rutas (`/admin/agendas`), de la que salen `crear` y `editar/:id`. Con
   * ella la fila abre el editor y «Crear» y «Editar» navegan; sin ella, el alta y la edición van en el panel sobre la
   * lista.
   */
  readonly editRoute?: string;
  /** Suma «Duplicar» al menú de la fila: la copia nace con un nombre que no se repite. */
  readonly duplicable?: boolean;
  /** Suma el botón «Columnas» (elegir y ordenar): la primera columna va fija. Se guarda por `filePrefix`. */
  readonly columnChoices?: boolean;
  /** El campo (AAAA-MM-DD) que se pone a hoy al duplicar o guardar desde el panel de la lista. */
  readonly modifiedField?: string;
}

/** Minimal store contract every repo instance must satisfy. */
export interface RepoStore<T extends RepoEntity> {
  readonly items: Signal<readonly T[]>;
  addItem(data: Omit<T, 'id'>): T;
  updateItem(id: number, updates: Partial<T>): void;
  deleteItem(id: number): void;
  deleteItems(ids: readonly number[]): void;
}

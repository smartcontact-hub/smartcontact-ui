import type { TemplateRef } from '@angular/core';

/**
 * Los cuatro tipos de filtro de columna del diseño (Figma «V2 – Tabla tickets + filtros»), más uno a medida:
 *   · `text`        → texto libre, filtra en vivo;
 *   · `select`      → una sola opción, se cierra al elegir; con buscador si `search`;
 *   · `multiselect` → varias, se queda abierto hasta clicar fuera; sin botón de aplicar;
 *   · `date`        → rango de fechas (Creado y Actualizado);

 *   · `optionsText` → una opción de una lista corta Y un texto libre, a la vez (ID y Productos en producción);
 *   · `custom`      → un componente propio (el de «Request type»), con su `predicate` e `isActive`.
 */
export type FilterKind = 'text' | 'select' | 'multiselect' | 'date' | 'optionsText' | 'custom';

export interface FilterOption {
  readonly label: string;
  readonly value: string;
}

export interface FilterDef<T> {
  readonly kind: FilterKind;
  readonly options?: readonly FilterOption[];
  /** Select y multiselect: lleva buscador. */
  readonly search?: boolean;
  readonly placeholder?: string;
  /** Solo `optionsText`: el placeholder del campo de texto del panel. */
  readonly textPlaceholder?: string;
  /** Lo que la fila aporta al filtro. Por defecto, `row[field]`. En `date` tiene que devolver una `Date`. */
  readonly read?: (row: T) => unknown;
  /** Regla a medida (select con opciones especiales, y `custom`). Sin ella, el valor tiene que coincidir. */
  readonly predicate?: (row: T, value: unknown) => boolean;
  /** Solo `custom`: ¿este valor filtra algo? */
  readonly isActive?: (value: unknown) => boolean;
}

/** El valor de un filtro `optionsText`: la opción elegida (la primera = sin filtro) y lo escrito. */
export interface OptionsTextValue {
  readonly mode: string;
  readonly text: string;
}

/** Lo que recibe la plantilla de un filtro `custom`. */
export interface FilterContext {
  readonly field: string;
  readonly value: unknown;
  readonly set: (value: unknown) => void;
}

export type FilterTemplates = Readonly<Record<string, TemplateRef<FilterContext>>>;

/** Sin tildes y en minúsculas: «informacion» encuentra «Información». */
export const plain = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function filterIsActive<T>(def: FilterDef<T>, value: unknown): boolean {
  switch (def.kind) {
    case 'text':
      return typeof value === 'string' && value.trim() !== '';
    case 'select':
      return value !== null && value !== undefined && value !== '';
    case 'multiselect':
      return Array.isArray(value) && value.length > 0;
    case 'date':
      return Array.isArray(value) && value[0] instanceof Date;
    case 'optionsText': {
      const v = value as OptionsTextValue | undefined;
      return !!v && (v.mode !== def.options?.[0]?.value || v.text.trim() !== '');
    }
    case 'custom':
      return def.isActive?.(value) ?? false;
  }
}

const startOfDay = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function filterMatches<T>(def: FilterDef<T>, field: string, row: T, value: unknown): boolean {
  if (def.predicate) return def.predicate(row, value);
  const own = def.read ? def.read(row) : (row as Record<string, unknown>)[field];
  switch (def.kind) {
    case 'text':
      return plain(String(own ?? '')).includes(plain(String(value)));
    case 'select':
      return Array.isArray(own) ? own.includes(value) : String(own ?? '') === value;
    case 'multiselect':
      return Array.isArray(own)
        ? own.some((o) => (value as string[]).includes(String(o)))
        : (value as string[]).includes(String(own ?? ''));
    case 'date': {
      if (!(own instanceof Date)) return false;
      const [from, to] = value as readonly (Date | null)[];
      const day = startOfDay(own);
      return day >= startOfDay(from as Date) && day <= startOfDay((to ?? from) as Date);
    }
    case 'optionsText':
    case 'custom':
      return true;
  }
}

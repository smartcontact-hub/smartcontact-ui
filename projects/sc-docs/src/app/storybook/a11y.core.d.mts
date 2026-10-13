/** Tipos de la revisión de accesibilidad de una story (la lógica vive en `a11y.core.mjs`). */

export type ImpactoA11y = 'critical' | 'serious' | 'moderate' | 'minor';

export interface NodoA11y {
  readonly selector: string;
  /** Cómo se lee en la ficha (`button.p-button`); lo pone el servicio del navegador, no la parte pura. */
  readonly elemento?: string;
  readonly html: string;
  readonly resumen: string;
}

export interface ViolacionA11y {
  readonly regla: string;
  readonly impacto: ImpactoA11y;
  readonly ayuda: string;
  readonly url: string;
  readonly nodos: readonly NodoA11y[];
}

export const OPCIONES_AXE: {
  readonly runOnly: { readonly type: 'tag'; readonly values: readonly string[] };
  readonly resultTypes: readonly string[];
};
export const IMPACTOS: readonly ImpactoA11y[];
export const IMPACTO_ES: Readonly<Record<ImpactoA11y, string>>;
export function resumirViolaciones(violations: readonly unknown[] | null | undefined): ViolacionA11y[];
export function contarFallos(resumen: readonly ViolacionA11y[]): number;

export interface GrupoNodosA11y {
  readonly resumen: string;
  readonly nodos: readonly NodoA11y[];
  /** `button.p-button ×9, span`: los elementos del grupo, contados. */
  readonly elementos: string;
}
export function agruparNodos(nodos: readonly NodoA11y[] | null | undefined): GrupoNodosA11y[];
export const AXE_ES_EXTRA: { readonly rules: Record<string, unknown>; readonly checks: Record<string, unknown> };
export function localeEs<T>(es: T): T;

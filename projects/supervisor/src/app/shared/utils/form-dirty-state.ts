/**
 * Dirty-state de formularios por comparación de SNAPSHOT (no un flag de un solo
 * sentido). La serialización estable vive en `form-dirty-state.core.mjs` (pura,
 * cubierta por `test:unit`); aquí se envuelve con signals de Angular.
 *
 * Patrón único plataforma-wide (admin agentes/grupos/usuarios, AED, builder de
 * reglas): pásale una función que devuelva el estado editable (el signal del
 * form). `dirty` es un `computed` que se recalcula solo y VUELVE a false si
 * deshaces el cambio — el botón Guardar refleja "hay cambio neto", no "tocaste".
 *
 *   readonly #dirty = createFormDirtyState(() => this.form());
 *   protected readonly canSave = computed(
 *     () => this.valid() && (this.isNew() || this.#dirty.dirty()),
 *   );
 *   // al cargar la entidad y tras guardar:  this.#dirty.markPristine();
 */
import { computed, signal, type Signal } from '@angular/core';

import { stableStringify } from './form-dirty-state.core.mjs';

export interface FormDirtyState {
  /** True cuando el estado actual difiere del pristine (CAMBIO NETO; deshacer → false). */
  readonly dirty: Signal<boolean>;
  /** Fija el estado actual como "limpio" de referencia (al cargar la entidad / tras guardar). */
  markPristine(): void;
}

/**
 * @param snapshot Función que devuelve el estado editable a vigilar (un signal
 *   del form). Se serializa de forma estable, así que Sets y orden de claves no
 *   producen falsos "sucio".
 */
/**
 * Se re-exporta a propósito (2026-08-13). `createFormDirtyState` guarda el pristine
 * **serializado**, así que sirve donde el pristine solo se usa para COMPARAR. Pero varias páginas
 * lo usan además para **restaurar** el formulario al descartar cambios
 * (`form.set(structuredClone(pristine()))`), y para eso necesitan el objeto, no su string: ahí no
 * se puede migrar entero sin romper "descartar cambios".
 *
 * Esas páginas se quedan con su `signal<FormState>` y consumen ESTA función para comparar — que
 * es donde estaba el defecto de verdad: con `JSON.stringify` crudo, `{x:1,y:2}` y `{y:2,x:1}`
 * salen distintos (falso SUCIO: el botón Guardar se activa sin que hayas tocado nada) y dos `Set`
 * distintos salen iguales (falso LIMPIO: un cambio real se pierde). Una sola implementación de
 * comparación para todo el repo, con o sin `createFormDirtyState`.
 */
export { stableStringify } from './form-dirty-state.core.mjs';

export function createFormDirtyState(snapshot: () => unknown): FormDirtyState {
  const pristine = signal(stableStringify(snapshot()));
  return {
    dirty: computed(() => stableStringify(snapshot()) !== pristine()),
    markPristine: () => pristine.set(stableStringify(snapshot())),
  };
}

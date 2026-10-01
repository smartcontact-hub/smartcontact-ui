/**
 * LOS PASOS DE UN ALTA (DD-137): las secciones del índice de la ficha, en su orden, como pasos del Stepper vertical
 * nativo de PrimeNG. Una sola fuente: los pasos salen de `navSections`, así que pasos e índice no pueden discrepar.
 *
 * El paso abierto vive aquí y no en la dirección: cambiar de paso no toca la URL ni el historial, y Atrás del
 * navegador sale del alta (DD-122). Al crear, la ficha abre su edición en la sección del paso abierto.
 *
 * Un paso lleva ✓ cuando se abrió, se dejó y está completo: el que está abierto no, aunque esté bien, porque aún se
 * está rellenando. Lo que puede cerrar un paso (la puerta de General en el grupo, DD-121) lo decide cada ficha con
 * `bloqueado`; el nativo lo pinta apagado.
 *
 *   protected readonly alta = pasosDeAlta({
 *     secciones: this.navSections,
 *     bloqueado: (id) => id !== GENERAL && !this.generalValid(),
 *     completo: (id) => id !== GENERAL || this.generalValid(),
 *   });
 */
import { computed, signal, type Signal } from '@angular/core';
import type { FormNavSection } from '@smartcontact-hub/components';

export interface PasoAlta {
  readonly id: string;
  readonly labelKey: string;
  /** El número del paso: el nativo lo pinta en su círculo, y con él se abre. Empieza en 1. */
  readonly value: number;
  readonly disabled: boolean;
  /** Se dejó completo: lleva ✓ y su pestaña lo dice. */
  readonly hecho: boolean;
}

export interface PasosAlta {
  readonly pasos: Signal<readonly PasoAlta[]>;
  /** La sección del paso abierto. */
  readonly abierta: Signal<string>;
  /** El número del paso abierto, para el `value` del `p-stepper`. */
  readonly actual: Signal<number>;
  /** Abre la sección `id` y da por dejada la que estaba abierta. La puerta la aplica la ficha antes. */
  abrir(id: string): void;
  /** La sección del paso con ese número, o `null`. */
  seccionDe(value: number | undefined): string | null;
  /** La sección anterior y la siguiente a la abierta, para «Atrás» y «Siguiente»; `null` en los extremos. */
  anterior(): string | null;
  siguiente(): string | null;
}

export function pasosDeAlta(opts: {
  readonly secciones: Signal<readonly FormNavSection[]>;
  /** El paso no se puede abrir todavía: el nativo lo pinta apagado. */
  readonly bloqueado: (id: string) => boolean;
  /** Lo del paso está completo. */
  readonly completo: (id: string) => boolean;
}): PasosAlta {
  const primera = (): string => opts.secciones()[0]?.id ?? '';
  const abiertaManual = signal<string | null>(null);
  const dejadas = signal<ReadonlySet<string>>(new Set());

  const abierta = computed(() => abiertaManual() ?? primera());
  const ids = computed(() => opts.secciones().map((s) => s.id));

  const pasos = computed<readonly PasoAlta[]>(() =>
    opts.secciones().map((s, i) => ({
      id: s.id,
      labelKey: s.labelKey,
      value: i + 1,
      disabled: opts.bloqueado(s.id),
      hecho: s.id !== abierta() && dejadas().has(s.id) && opts.completo(s.id),
    })),
  );

  const vecina = (salto: number): string | null => {
    const lista = ids();
    const i = lista.indexOf(abierta());
    return i >= 0 ? (lista[i + salto] ?? null) : null;
  };

  return {
    pasos,
    abierta,
    actual: computed(() => ids().indexOf(abierta()) + 1),
    abrir(id: string): void {
      const antes = abierta();
      if (id === antes) return;
      dejadas.update((d) => new Set(d).add(antes));
      abiertaManual.set(id);
    },
    seccionDe: (value) => (value ? (ids()[value - 1] ?? null) : null),
    anterior: () => vecina(-1),
    siguiente: () => vecina(1),
  };
}

/**
 * LAS SECCIONES DE UN ALTA (DD-143): el alta tiene el índice de la edición (DD-122), y aquí vive lo que el alta le
 * añade: qué sección está abierta, cuáles se dejaron completas (su ✓ en el índice) y cuáles van antes y después, para
 * «Atrás» y «Siguiente». Las secciones son las del índice (`navSections`), así que no pueden discrepar.
 *
 * La sección abierta vive aquí y no en la dirección: cambiar de sección en el alta no toca la URL ni el historial, y
 * Atrás del navegador sale del alta (DD-122 §4). Al crear, la ficha abre su edición en la sección abierta.
 *
 * Una sección lleva ✓ cuando se abrió, se dejó y está completa: la abierta no, aunque esté bien, porque aún se está
 * rellenando. Si se dejó sin lo obligatorio, la ficha la marca con el punto rojo (`dejadas`), como Distribución y
 * colas sin teléfono saliente (DD-142); antes de abrirla, ninguna marca. Lo que no deja salir de una sección (la
 * puerta de General en el grupo, DD-121) lo aplica cada ficha antes de `abrir`.
 *
 *   protected readonly alta = seccionesDeAlta({
 *     secciones: this.navSections,
 *     completa: (id) => id !== GENERAL || this.generalValid(),
 *   });
 */
import { afterNextRender, computed, signal, type Injector, type Signal } from '@angular/core';
import type { FormNavSection } from '@smartcontact-hub/components';

export interface SeccionesAlta {
  /** La sección abierta. */
  readonly abierta: Signal<string>;
  /** Las que se dejaron completas: el ✓ del índice (`sectionsDone`). */
  readonly hechas: Signal<ReadonlySet<string>>;
  /** Las que se abrieron y se dejaron, completas o no: desde ahí, lo que les falte se dice en el índice. */
  readonly dejadas: Signal<ReadonlySet<string>>;
  /** Abre la sección `id` y da por dejada la que estaba abierta. La puerta la aplica la ficha antes. */
  abrir(id: string): void;
  /** La sección anterior y la siguiente a la abierta, para «Atrás» y «Siguiente»; `null` en los extremos. */
  anterior(): string | null;
  siguiente(): string | null;
}

export function seccionesDeAlta(opts: {
  readonly secciones: Signal<readonly FormNavSection[]>;
  /** Lo de la sección está completo. */
  readonly completa: (id: string) => boolean;
}): SeccionesAlta {
  const primera = (): string => opts.secciones()[0]?.id ?? '';
  const abiertaManual = signal<string | null>(null);
  const dejadas = signal<ReadonlySet<string>>(new Set());

  const abierta = computed(() => abiertaManual() ?? primera());
  const ids = computed(() => opts.secciones().map((s) => s.id));

  const vecina = (salto: number): string | null => {
    const lista = ids();
    const i = lista.indexOf(abierta());
    return i >= 0 ? (lista[i + salto] ?? null) : null;
  };

  return {
    abierta,
    hechas: computed(() => new Set(ids().filter((id) => id !== abierta() && dejadas().has(id) && opts.completa(id)))),
    dejadas: dejadas.asReadonly(),
    abrir(id: string): void {
      const antes = abierta();
      if (id === antes) return;
      dejadas.update((d) => new Set(d).add(antes));
      abiertaManual.set(id);
    },
    anterior: () => vecina(-1),
    siguiente: () => vecina(1),
  };
}

/**
 * Tras «Siguiente» o «Atrás», la llegada a la sección `id`: la zona de contenido vuelve arriba, como al llegar a una
 * página, y el foco va al título de la sección, que es lo que el lector anuncia. Sin eso, desde el pie de una sección
 * larga se llegaba a media altura de la siguiente, y el foco se quedaba en un botón que a veces ya no está (la última
 * sección no lleva «Siguiente»).
 *
 * El título es el `h2` de la tarjeta de la sección (`sc-section-card` con `anchorId` = id): se hace enfocable sin
 * entrar en el orden del tabulador (`tabindex="-1"`).
 */
export function llegarASeccion(id: string, injector: Injector): void {
  afterNextRender(
    () => {
      const titulo = document.getElementById(id)?.querySelector<HTMLElement>('h2');
      if (!titulo) return;
      document.getElementById('main-content')?.scrollTo({ top: 0 });
      titulo.tabIndex = -1;
      titulo.focus({ preventScroll: true });
    },
    { injector },
  );
}

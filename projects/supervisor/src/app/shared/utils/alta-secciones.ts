/**
 * LAS SECCIONES DE UN ALTA (DD-143): el alta tiene el índice de la edición (DD-122), y aquí vive lo que el alta le
 * añade: qué sección está abierta, cuáles se dejaron completas (su ✓ en el índice) y cuáles van antes y después, para
 * «Atrás» y «Siguiente». Las secciones son las del índice (`navSections`), así que no pueden discrepar.
 *
 * La sección abierta vive aquí y no en la dirección: cambiar de sección en el alta no toca la URL ni el historial, y
 * Atrás del navegador sale del alta (DD-122 §4). Al crear, la ficha abre su edición en la sección abierta.
 *
 * Una sección lleva ✓ cuando tiene algo obligatorio, se abrió, se dejó y está completa: la abierta no, aunque esté bien,
 * porque aún se está rellenando. La que no tiene nada obligatorio no lo lleva nunca (DD-158): un ✓ por solo pasar no
 * comprueba nada, y enseña a no fiarse de los que sí. Si se dejó sin lo obligatorio, la ficha la marca con el punto rojo (`dejadas`), como Distribución y
 * colas sin teléfono saliente (DD-142); antes de abrirla, ninguna marca. Lo que no deja salir de una sección (la
 * puerta de General en el grupo, DD-121) lo aplica cada ficha antes de `abrir`.
 *
 *   protected readonly alta = seccionesDeAlta({
 *     secciones: this.navSections,
 *     obligatoria: (id) => id === GENERAL,
 *     completa: (id) => id !== GENERAL || this.generalValid(),
 *   });
 */
import { afterNextRender, computed, effect, signal, type Injector, type Signal } from '@angular/core';
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
  /** La sección tiene algo obligatorio: solo entonces puede llevar ✓. */
  readonly obligatoria: (id: string) => boolean;
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
    hechas: computed(
      () => new Set(ids().filter((id) => id !== abierta() && dejadas().has(id) && opts.obligatoria(id) && opts.completa(id))),
    ),
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

export interface OcasionDeAvisar {
  /** ¿Se puede decir ya, bajo su campo y con el punto del índice, que falta `falta`, de la sección `seccion`? */
  acusa(seccion: string, falta: string): boolean;
}

/**
 * CUÁNDO SE DICE QUE FALTA ALGO (DD-199): cuando la persona ya tuvo ocasión de rellenarlo. Un obligatorio vacío no es
 * un error, es algo por rellenar, y pintarlo en rojo antes de tiempo culpa a quien aún no ha podido hacer nada: el
 * desplegable que aparece al encender «Tipificar llamadas» nacía en rojo, con su aviso y el punto en el índice.
 *
 * Hay ocasión cuando se deja la sección sin ello (con «Siguiente», el índice o el resumen), en el alta y al editar, o
 * cuando lo guardado ya venía sin ello: entonces falta de verdad y se dice al abrir (DD-142). Duplicar es un alta: lo
 * que se vacía a propósito (el nombre, la extensión) tampoco acusa. Mientras tanto lo dicen el resumen («Falta: …») y
 * el motivo junto al botón, sin rojo. Un error de CONTENIDO (repetido, mal escrito) no espera ocasión: va en vivo.
 *
 * `faltas` son las claves de lo que falta AHORA. Lo guardado es lo que había la última vez que la ficha no tenía cambios
 * (al abrirla, al guardar o al deshacer), así que no hace falta copiarlo en cada sitio que la marca como guardada.
 */
export function ocasionDeAvisar(opts: {
  readonly alta: SeccionesAlta;
  /** Se edita algo guardado: ni un alta ni un duplicado. */
  readonly editando: () => boolean;
  /** La sección a la vista. */
  readonly abierta: () => string;
  /** La ficha tiene cambios sin guardar. */
  readonly cambios: () => boolean;
  readonly faltas: () => Iterable<string>;
}): OcasionDeAvisar {
  // Se apuntan en el acto, con `effect`, y no al leerse: entre dos lecturas se puede pasar por varias secciones.
  const faltabaGuardado = signal<ReadonlySet<string>>(new Set());
  effect(() => {
    if (!opts.cambios()) faltabaGuardado.set(new Set(opts.faltas()));
  });
  // Al editar, la sección vive en la dirección: la que deja de estar a la vista se ha dejado.
  const dejadasAlEditar = signal<ReadonlySet<string>>(new Set());
  let antes: string | null = null;
  effect(() => {
    const ahora = opts.abierta();
    const dejada = antes;
    if (dejada !== null && dejada !== ahora) dejadasAlEditar.update((d) => new Set(d).add(dejada));
    antes = ahora;
  });
  return {
    acusa(seccion: string, falta: string): boolean {
      if (!opts.editando()) return opts.alta.dejadas().has(seccion);
      return dejadasAlEditar().has(seccion) || faltabaGuardado().has(falta);
    },
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

/**
 * La llegada a un sitio DENTRO de una sección (DD-146): el bloque de un canal o un campo, desde el resumen. Ya pintada
 * la sección, lo trae arriba y le da el foco. El nombre fijo no lo tapa: la zona que se desplaza aparta sus anclas
 * (DD-145). Un campo llega con su rótulo, así que se trae su `.field` y se enfoca el control.
 */
export function llegarAAncla(id: string, injector: Injector): void {
  afterNextRender(
    () => {
      const sitio = document.getElementById(id);
      if (!sitio) return;
      (sitio.closest('.field') ?? sitio).scrollIntoView({ block: 'start' });
      sitio.focus({ preventScroll: true });
    },
    { injector },
  );
}

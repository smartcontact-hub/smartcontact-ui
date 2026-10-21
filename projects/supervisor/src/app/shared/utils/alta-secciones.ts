/**
 * LAS SECCIONES DE UNA FICHA Y SU ÍNDICE (DD-143, DD-217): el alta tiene el índice de la edición (DD-122), y aquí vive
 * lo que el alta le añade: qué sección está abierta, cuáles llevan ✓ y cuáles van antes y después, para «Atrás» y
 * «Siguiente». Las secciones son las del índice (`navSections`), así que no pueden discrepar. Se navega libre: ninguna
 * sección retiene a nadie (DD-217 retira las puertas de DD-121 y DD-158).
 *
 * La sección abierta vive aquí y no en la dirección: cambiar de sección en el alta no toca la URL ni el historial, y
 * Atrás del navegador sale del alta (DD-122 §4). Al crear, la ficha abre su edición en la sección abierta.
 *
 * Una sección lleva ✓ cuando se dejó tal como está ahora y está completa (DD-217): la abierta no, aunque esté bien,
 * porque aún se está rellenando. También la que no tiene nada obligatorio, completa con solo pasar por ella (DD-211
 * §6). «Tal como está» es su FIRMA: lo que otra sección decide de ella (en el grupo, los canales de General); si
 * cambia desde que se dejó, el ✓ se va sin ponerse en rojo. Las reglas, puras, en `alta-secciones.core.mjs`.
 *
 *   protected readonly alta = seccionesDeAlta({
 *     secciones: this.navSections,
 *     completa: (id) => id !== GENERAL || this.generalValid(),
 *     firma: (id) => (id === GENERAL ? '' : firmaDe(this.form().channels)),
 *   });
 */
import { afterNextRender, computed, effect, signal, type Injector, type Signal } from '@angular/core';
import type { FormNavSection } from '@smartcontact-hub/components';

import { dejarSeccion, estadosDeSecciones, seccionesHechas, seDice } from './alta-secciones.core.mjs';

export { firmaDe } from './alta-secciones.core.mjs';

export interface SeccionesAlta {
  /** La sección abierta. */
  readonly abierta: Signal<string>;
  /** Las que se dejaron tal como están y completas: el ✓ del índice (`sectionsDone`). */
  readonly hechas: Signal<ReadonlySet<string>>;
  /** El estado de cada sección para el marcador de paso del índice (`sectionStates`): pendiente, actual, hecha o error. */
  readonly estados: Signal<ReadonlyMap<string, 'pendiente' | 'actual' | 'hecha' | 'error'>>;
  /** Abre la sección `id` y da por dejada la que estaba abierta, con su firma de ese momento. */
  abrir(id: string): void;
  /** La sección anterior y la siguiente a la abierta, para «Atrás» y «Siguiente»; `null` en los extremos. */
  /** Vuelta al formulario vacío («Deshacer» en un alta): lo dejado deja de contar, y la sección abierta se queda abierta. */
  reiniciar(): void;
  anterior(): string | null;
  siguiente(): string | null;
}

export function seccionesDeAlta(opts: {
  readonly secciones: Signal<readonly FormNavSection[]>;
  /** Lo de la sección está completo; una sección sin nada obligatorio lo está siempre. */
  readonly completa: (id: string) => boolean;
  /** Lo que otras secciones deciden de esta. Sin ella, ninguna depende de otra. */
  readonly firma?: (id: string) => string;
}): SeccionesAlta {
  const primera = (): string => opts.secciones()[0]?.id ?? '';
  const firma = opts.firma ?? (() => '');
  const abiertaManual = signal<string | null>(null);
  const dejadas = signal<ReadonlyMap<string, string>>(new Map());
  /** Si la sección estaba completa al dejarla: la roja sigue roja al abrirla de nuevo, y la verde sigue verde. */
  const resultados = signal<ReadonlyMap<string, boolean>>(new Map());

  const abierta = computed(() => abiertaManual() ?? primera());
  const ids = computed(() => opts.secciones().map((s) => s.id));

  const vecina = (salto: number): string | null => {
    const lista = ids();
    const i = lista.indexOf(abierta());
    return i >= 0 ? (lista[i + salto] ?? null) : null;
  };

  return {
    abierta,
    hechas: computed(() =>
      seccionesHechas({ ids: ids(), abierta: abierta(), dejadas: dejadas(), firma, completa: opts.completa }),
    ),
    estados: computed(() =>
      estadosDeSecciones({ ids: ids(), abierta: abierta(), dejadas: dejadas(), resultados: resultados(), firma, completa: opts.completa }),
    ),
    abrir(id: string): void {
      const antes = abierta();
      if (id === antes) return;
      dejadas.update((d) => dejarSeccion(d, antes, firma(antes)));
      resultados.update((r) => new Map(r).set(antes, opts.completa(antes)));
      abiertaManual.set(id);
    },
    reiniciar(): void {
      dejadas.set(new Map());
      resultados.set(new Map());
    },
    anterior: () => vecina(-1),
    siguiente: () => vecina(1),
  };
}

export interface OcasionDeAvisar {
  /** ¿Se dice ya en rojo, bajo su campo, que falta `falta`? Si no, y falta, su aviso va en gris (`ayudaDeObligatorio`). */
  acusa(falta: string): boolean;
  /** ¿Lo dice ya el índice? Como `acusa`, sin lo tocado: eso se dice bajo el campo, donde se está mirando. */
  acusaEnIndice(falta: string): boolean;
  /** Se dejó el campo de `falta`: si sigue vacío, desde ahora se dice en rojo, también si se vacía otra vez. */
  tocar(falta: string): void;
  /** Se pulsó Crear o Guardar con algo pendiente: desde ahora se dice lo que falta en este momento, hasta que se arregle. */
  intentar(): void;
  /** Vuelta a lo guardado (Deshacer) o guardado: lo pendiente vuelve a callar en gris. */
  olvidar(): void;
}

/**
 * CUÁNDO SE DICE EN ROJO QUE FALTA ALGO (DD-219, que enmienda DD-217 §1). «Crear» y «Guardar» se apagan mientras falte
 * algo y el resumen dice qué («Falta: nombre, teléfono saliente»), como la especificación de COA. Bajo cada campo
 * obligatorio vacío, su aviso sale desde el principio, pero en gris: es algo por rellenar, no un error de quien acaba
 * de abrir la ficha. Pasa a rojo al dejar el campo vacío (`tocar`), y entonces se queda en vivo hasta que se rellena.
 *
 * El índice no se pone en rojo por lo tocado: el 2026-10-20 un punto rojo en Distribución y colas salía al volver a
 * General, y al borrar el nombre parecía causado por él (DD-217). Lo guardado que ya venía sin algo se dice desde que
 * se abre (DD-142): falta de verdad, y no lo ha causado quien la abre. Pulsar con algo pendiente (Intro en un campo)
 * apunta lo que faltaba, como antes. Duplicar un agente es un alta. Un error de CONTENIDO (repetido, mal escrito) no
 * espera: va en vivo, y no pasa por aquí.
 *
 * `faltas` son las claves de lo que falta AHORA. Lo guardado es lo que había la última vez que la ficha no tenía cambios
 * (al abrirla, al guardar o al deshacer), así que no hace falta copiarlo en cada sitio que la marca como guardada.
 */
export function ocasionDeAvisar(opts: {
  /** Se edita algo guardado: ni un alta ni un duplicado. */
  readonly editando: () => boolean;
  /** La ficha tiene cambios sin guardar. */
  readonly cambios: () => boolean;
  readonly faltas: () => Iterable<string>;
}): OcasionDeAvisar {
  // Se apunta en el acto, con `effect`, y no al leerse: entre dos lecturas la ficha puede haber cambiado.
  const faltabaGuardado = signal<ReadonlySet<string>>(new Set());
  effect(() => {
    if (!opts.cambios()) faltabaGuardado.set(new Set(opts.faltas()));
  });
  const intento = signal<ReadonlySet<string> | null>(null);
  const tocados = signal<ReadonlySet<string>>(new Set());
  const ninguna: ReadonlySet<string> = new Set();
  const guardado = () => (opts.editando() ? faltabaGuardado() : ninguna);
  return {
    acusa: (falta: string) => seDice(falta, intento(), guardado(), tocados()),
    acusaEnIndice: (falta: string) => seDice(falta, intento(), guardado()),
    tocar: (falta: string) => {
      if (!tocados().has(falta)) tocados.update((t) => new Set(t).add(falta));
    },
    intentar: () => intento.set(new Set(opts.faltas())),
    olvidar: () => {
      intento.set(null);
      tocados.set(new Set());
    },
  };
}

/**
 * La ayuda gris de un obligatorio que aún no se dice en rojo (DD-219): su aviso («El nombre es obligatorio») y, detrás,
 * la ayuda propia del campo, si la tiene. Sin aviso, la ayuda sola. El aviso se escribe sin punto, porque en rojo es un
 * error; en gris es una ayuda, y acaba en punto como las demás (DD-217).
 */
export function ayudaDeObligatorio(aviso: string | null | undefined, ayuda?: string): string | undefined {
  if (!aviso) return ayuda || undefined;
  const frase = /[.!?…:]$/.test(aviso.trim()) ? aviso : `${aviso}.`;
  return ayuda ? `${frase} ${ayuda}` : frase;
}

/**
 * ¿Se dejó de verdad el campo? Un desplegable de PrimeNG pinta su lista en otro sitio del documento (`appendTo`), y
 * abrirla para elegir mueve el foco ahí: eso no es dejar el campo vacío, es estar eligiendo (DD-219). Pulsar su flecha
 * con el campo ya enfocado manda el foco un instante a `main` y la lista lo devuelve; mientras, el campo está `:active`.
 */
export function dejoElCampo(event: FocusEvent): boolean {
  const campo = event.currentTarget;
  if (campo instanceof Element && campo.matches(':active')) return false;
  const destino = event.relatedTarget;
  if (!(destino instanceof Element)) return true;
  if (campo instanceof Element && campo.contains(destino)) return false;
  return !destino.closest('.p-overlay, .p-select-overlay, .p-multiselect-overlay, [role="listbox"]');
}

/** Un aviso a la vista: de qué sección es, lo que dice (ya traducido) y el campo al que se llega (`null`: al título de
 *  la sección, cuando lo que falta no es un campo, como asignar un grupo). */
export interface AvisoDeFicha {
  readonly seccion: string;
  readonly texto: string;
  readonly ancla: string | null;
}

/** Lo que dice el índice de cada sección con avisos: el primero, en el orden de la ficha (DD-217). */
export function avisosDelIndice(avisos: readonly AvisoDeFicha[]): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const a of avisos) out[a.seccion] ??= a.texto;
  return out;
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

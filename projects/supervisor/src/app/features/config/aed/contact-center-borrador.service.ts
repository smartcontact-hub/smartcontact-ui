import { computed, Injectable, signal, type WritableSignal } from '@angular/core';

import { stableStringify } from '@shared/utils/form-dirty-state';

/** Las secciones de Contact Center que guardan algo. */
export type SeccionContactCenter = 'servicio' | 'agentes' | 'grupos';

interface Parte<T> {
  /** Lo que se está editando: el formulario de la sección. */
  readonly form: WritableSignal<T>;
  /** Lo último guardado: con él se sabe si hay cambios y a qué vuelve «Deshacer». */
  readonly guardado: WritableSignal<T>;
  readonly valido: (valor: T) => boolean;
  readonly persistir: (valor: T) => void;
}

/**
 * EL BORRADOR DE CONTACT CENTER (DD-211 §7): Servicio, Agentes y Grupos se editan como una sola ficha, con un solo
 * «Guardar» y un solo «Deshacer» en la barra, como las fichas de agente y de grupo (DD-122). Cambiar de sección no
 * pregunta ni pierde nada; el aviso de cambios sin guardar solo salta al salir de Contact Center.
 *
 * Cada sección es una ruta hija que se destruye al cambiar de sección, así que su formulario no puede vivir en ella:
 * vive aquí, y la página lo pide con `parte()` al nacer (la misma señal al volver). Este servicio lo da el armazón
 * (`providers` de `SettingsShellComponent`): nace al entrar en Contact Center y muere al salir.
 */
@Injectable()
export class ContactCenterBorradorService {
  private readonly partes = signal<Partial<Record<SeccionContactCenter, Parte<unknown>>>>({});

  readonly saving = signal(false);

  /**
   * El formulario de una sección. La primera vez nace de lo guardado (`inicial`); al volver a la sección, es el mismo,
   * con lo que se dejó sin guardar. `persistir` es como lo guarda su store; `valido`, si se puede guardar tal cual.
   */
  parte<T>(
    seccion: SeccionContactCenter,
    opts: { readonly inicial: () => T; readonly persistir: (valor: T) => void; readonly valido?: (valor: T) => boolean },
  ): WritableSignal<T> {
    const ya = this.partes()[seccion] as Parte<T> | undefined;
    if (ya) return ya.form;
    const inicial = opts.inicial();
    const parte: Parte<T> = {
      form: signal(structuredClone(inicial)),
      guardado: signal(structuredClone(inicial)),
      valido: opts.valido ?? (() => true),
      persistir: opts.persistir,
    };
    this.partes.update((p) => ({ ...p, [seccion]: parte }));
    return parte.form;
  }

  /** Las secciones con cambios sin guardar: el punto del índice (DD-122). */
  readonly conCambios = computed<ReadonlySet<SeccionContactCenter>>(() => {
    const out = new Set<SeccionContactCenter>();
    for (const [seccion, parte] of this.entradas()) {
      if (stableStringify(parte.form()) !== stableStringify(parte.guardado())) out.add(seccion);
    }
    return out;
  });

  readonly dirty = computed(() => this.conCambios().size > 0);
  private readonly valido = computed(() => this.entradas().every(([, parte]) => parte.valido(parte.form())));
  readonly canSave = computed(() => this.dirty() && this.valido() && !this.saving());

  /** Guarda las secciones con cambios, cada una en su store. Devuelve si había algo que guardar. No mira `saving`:
   *  quien guarda lo enciende antes, para el botón. */
  guardar(): boolean {
    if (!this.dirty() || !this.valido()) return false;
    const cambiadas = this.conCambios();
    for (const [seccion, parte] of this.entradas()) {
      if (!cambiadas.has(seccion)) continue;
      const valor = structuredClone(parte.form());
      parte.persistir(valor);
      parte.guardado.set(structuredClone(valor));
    }
    return true;
  }

  /** «Deshacer»: todas las secciones vuelven a lo guardado. */
  deshacer(): void {
    for (const [, parte] of this.entradas()) parte.form.set(structuredClone(parte.guardado()));
  }

  private entradas(): [SeccionContactCenter, Parte<unknown>][] {
    return Object.entries(this.partes()).filter((e): e is [SeccionContactCenter, Parte<unknown>] => !!e[1]);
  }
}

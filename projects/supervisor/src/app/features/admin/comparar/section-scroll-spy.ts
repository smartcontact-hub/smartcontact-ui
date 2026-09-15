import { afterNextRender, DestroyRef, effect, inject, untracked, type WritableSignal } from '@angular/core';

/**
 * RAMA DE COMPARACIÓN (`comparar/fichas`). El índice de la variante `b`: todas las secciones
 * están en la página, pulsar una te lleva hasta ella con scroll y, al hacer scroll a mano, el
 * índice marca la sección que tienes delante.
 *
 * El scroll no es de la ventana sino de `main#main-content` (el shell), así que se escucha ahí.
 *
 * Tras un salto el índice se queda en la sección pulsada hasta que la persona vuelve a mover la
 * rueda, el dedo o el teclado. Sin eso, al pulsar una de las últimas (que no pueden subir hasta
 * arriba porque la página se acaba) el cálculo marcaría la de más abajo y parecería que el
 * clic no ha ido a donde decía.
 *
 * Llamar en el constructor (contexto de inyección).
 */
export interface SectionScrollSpy {
  /** Lleva la página hasta la sección y la marca en el índice. */
  jump(id: string): void;
}

export function createSectionScrollSpy(opts: {
  enabled: () => boolean;
  ids: () => readonly string[];
  active: WritableSignal<string>;
}): SectionScrollSpy {
  const destroyRef = inject(DestroyRef);
  let lockedToJump = false;

  const container = (): HTMLElement | null => document.getElementById('main-content');

  /** Lo que el índice deja libre arriba al pegarse: la tarjeta aterriza a su altura. */
  const topOffset = (): number => {
    const rail = document.querySelector<HTMLElement>('.page__rail');
    const top = rail ? parseFloat(getComputedStyle(rail).top) : 0;
    return Number.isFinite(top) ? top : 0;
  };

  const sync = (): void => {
    if (!opts.enabled() || lockedToJump) return;
    const box = container();
    const ids = opts.ids();
    if (!box || ids.length === 0) return;

    const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 4;
    if (atBottom) {
      opts.active.set(ids[ids.length - 1]!);
      return;
    }
    // La sección «delante» es la última cuya cabecera ya ha pasado el primer tercio de la vista.
    const line = box.getBoundingClientRect().top + box.clientHeight / 3;
    let current = ids[0]!;
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= line) current = id;
    }
    opts.active.set(current);
  };

  const unlock = (): void => {
    lockedToJump = false;
  };

  const scrollTo = (id: string, behavior: ScrollBehavior): void => {
    const box = container();
    const el = document.getElementById(id);
    if (!box || !el) return;
    const top = box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - topOffset();
    box.scrollTo({ top: Math.max(0, top), behavior });
  };

  afterNextRender(() => {
    const box = container();
    if (!box) return;
    const userEvents = ['wheel', 'touchstart', 'keydown'] as const;
    box.addEventListener('scroll', sync, { passive: true });
    for (const type of userEvents) box.addEventListener(type, unlock, { passive: true });
    destroyRef.onDestroy(() => {
      box.removeEventListener('scroll', sync);
      for (const type of userEvents) box.removeEventListener(type, unlock);
    });
  });

  // Al pasar a una sola página, la vista se queda en la sección que estabas mirando.
  effect(() => {
    if (!opts.enabled()) return;
    const id = untracked(opts.active);
    requestAnimationFrame(() => {
      lockedToJump = true;
      scrollTo(id, 'auto');
    });
  });

  return {
    jump(id: string): void {
      opts.active.set(id);
      if (!opts.enabled()) return;
      lockedToJump = true;
      scrollTo(id, 'smooth');
    },
  };
}

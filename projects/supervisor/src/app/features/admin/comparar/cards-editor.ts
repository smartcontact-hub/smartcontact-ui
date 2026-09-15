import { DestroyRef, DOCUMENT, inject, type WritableSignal } from '@angular/core';

import { FichaVariantService } from './ficha-variant.service';

/**
 * RAMA DE COMPARACIÓN (`comparar/fichas`), variante `e` («Resumen + panel lateral»).
 *
 * Todo lo que hace el panel lateral de ajustes, en un solo sitio para las tres fichas:
 *
 *   · Pulsar una tarjeta abre su sección. Con el panel ya abierto, cambia de sección sin cerrarlo
 *     y vuelve el panel arriba, para no aterrizar a media altura de la sección anterior.
 *   · Pulsar FUERA lo cierra (Rafa, 2026-09-15), pero solo dentro de la ficha: la barra de arriba
 *     (Guardar) y los desplegables, que PrimeNG pinta fuera de la página, no lo cierran. Pulsar
 *     otra tarjeta tampoco: cambia de sección.
 *   · El foco entra en el panel al abrirlo y, si se cierra con la X o con Esc, vuelve a la
 *     tarjeta que lo abrió. Si se cierra pulsando fuera, el foco se queda donde se ha pulsado.
 *
 * Llamar en contexto de inyección (un campo de la ficha).
 */
export interface CardsEditor {
  pick(sectionId: string): void;
  isPicked(sectionId: string): boolean;
  /** El `(visibleChange)` del `sc-drawer`: solo lo emite al cerrar con la X o con Esc. */
  onVisibleChange(open: boolean): void;
}

const BODY_SELECTOR = '.compare-drawer-body';

export function createCardsEditor(opts: {
  enabled: () => boolean;
  active: WritableSignal<string>;
}): CardsEditor {
  const variants = inject(FichaVariantService);
  const document = inject(DOCUMENT);
  let opener: HTMLElement | null = null;

  const body = (): HTMLElement | null => document.querySelector<HTMLElement>(BODY_SELECTOR);
  /** Tras pintar: el contenido del panel no existe hasta que Angular lo monta. */
  const afterPaint = (fn: () => void): void => {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (!opts.enabled() || !variants.editorOpen()) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    // Dentro del panel (PrimeNG le pone role="complementary"), o en otra tarjeta: no se cierra.
    if (target.closest('[role="complementary"]') || target.closest('sc-board-card')) return;
    // Fuera de la ficha (barra de arriba, menú, desplegables pintados en <body>): tampoco.
    if (!target.closest('.page')) return;
    variants.editorOpen.set(false);
  };

  document.addEventListener('pointerdown', onPointerDown, true);
  inject(DestroyRef).onDestroy(() => document.removeEventListener('pointerdown', onPointerDown, true));

  return {
    pick(sectionId: string): void {
      const wasOpen = variants.editorOpen();
      opts.active.set(sectionId);
      if (!opts.enabled()) return;
      opener = document.querySelector<HTMLElement>(`.board-card__head[aria-controls="${sectionId}"]`);
      variants.guideOpen.set(false);
      variants.editorOpen.set(true);
      afterPaint(() => {
        const el = body();
        if (!el) return;
        if (wasOpen) el.scrollIntoView({ block: 'start' });
        el.focus({ preventScroll: true });
      });
    },

    isPicked(sectionId: string): boolean {
      return opts.enabled() && variants.editorOpen() && opts.active() === sectionId;
    },

    onVisibleChange(open: boolean): void {
      variants.editorOpen.set(open);
      if (!open) opener?.focus({ preventScroll: true });
    },
  };
}

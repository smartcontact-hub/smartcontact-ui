import { DestroyRef, ElementRef, inject } from '@angular/core';

/**
 * EL FOCO VUELVE A QUIEN ABRIÓ EL PANEL.
 *
 * Los paneles de alta en línea (Etiquetas, Repositorios, Plantillas) son diálogos no modales: meten el foco en su
 * primer campo y se cierran con Escape o «Cancelar». Medido el 2026-10-15 (candidato 29 del barrido de PrimeNG): al
 * cerrarse, el foco se iba al `body` y quien usa el teclado tenía que volver a recorrer la página desde arriba. WAI-ARIA
 * APG, «Dialog Pattern»: al cerrar, el foco vuelve al control que lo abrió.
 *
 * Se llama en el constructor del panel, cuando el foco aún está en lo que lo abrió. Al destruirse, si el foco estaba
 * dentro del panel (o ya se había perdido), vuelve allí; si el usuario se fue a otra parte, no se le mueve.
 */
export function focoDeVueltaAlCerrar(): void {
  if (typeof document === 'undefined') return;
  const host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  const abridor = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  inject(DestroyRef).onDestroy(() => {
    const ahora = document.activeElement;
    const perdido = !ahora || ahora === document.body || host.contains(ahora);
    if (perdido && abridor?.isConnected) abridor.focus();
  });
}

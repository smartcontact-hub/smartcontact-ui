import { afterNextRender, DestroyRef, inject, type Signal, type TemplateRef } from '@angular/core';

import { TopBarSlotService } from './top-bar-slot.service';

/**
 * Proyecta las acciones de una página en la TopBar, y las retira al salir.
 *
 * **Por qué existe.** Este wiring era el patrón más repetido del repo: 17
 * páginas con el MISMO bloque de registro, copiado byte a byte. Y la limpieza
 * salía en dos idiomas, sin criterio escrito en ninguna parte:
 *
 *   · las 10 páginas de LISTA cerraban con `destroyRef.onDestroy(...)`, justo
 *     debajo del registro;
 *   · las 7 de ALTA/EDICIÓN metían `clearActions()` dentro del `ngOnDestroy`
 *     que ya tenían para el cerrojo cross-tab — a más de 200 líneas de su
 *     registro.
 *
 * Ese segundo idioma no era una elección de diseño: era dónde había hueco. Y es
 * el modo de fallo clásico de esta clase de wiring — quien refactorice ese
 * `ngOnDestroy` puede llevarse la limpieza sin notarlo, y el síntoma (acciones
 * de la página anterior colgando en la barra) aparece en OTRA pantalla.
 *
 * Aquí registro y limpieza son la misma llamada, así que no se pueden separar.
 *
 * Se llama desde el `constructor` (o desde un inicializador de campo): necesita
 * contexto de inyección, como `afterNextRender` y `inject`.
 *
 * ```ts
 * private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');
 *
 * constructor() {
 *   useTopbarActions(this.topbarActions);
 * }
 * ```
 */
export function useTopbarActions(tplRef: Signal<TemplateRef<unknown> | undefined>): void {
  const topBarSlot = inject(TopBarSlotService);
  const destroyRef = inject(DestroyRef);

  afterNextRender(() => {
    const tpl = tplRef();

    if (tpl) {
      topBarSlot.setActions(tpl);
    }
  });

  destroyRef.onDestroy(() => topBarSlot.clearActions());
}

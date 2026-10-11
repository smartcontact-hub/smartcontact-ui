import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Injectable, inject } from '@angular/core';

import { TopBarSlotService } from '../layout/top-bar/top-bar-slot.service';

/**
 * Dónde se cuenta el resultado de una acción del usuario (DD-191). El toast queda para lo que manda
 * el SISTEMA (una tarea en segundo plano que acaba, una conexión que cae); lo que acaba de hacer el
 * usuario se cuenta junto a su contexto, como Primer:
 *
 * - `visto`: el resultado YA se ve (la fila nueva en la lista, la que desaparece, la ficha a la que
 *   se llega, la descarga del navegador). No se pinta nada más; solo se anuncia al lector de
 *   pantalla, que no ve el cambio.
 * - `enLaBarra`: guardar sin salir de la ficha. Junto a los botones de la barra, hasta la siguiente
 *   acción: la página llama a `limpiar` en cuanto vuelve a haber cambios sin guardar.
 */
@Injectable({ providedIn: 'root' })
export class ResultadoAccionService {
  private readonly lector = inject(LiveAnnouncer);
  private readonly barra = inject(TopBarSlotService);

  /** El resultado ya está a la vista: solo para el lector de pantalla. */
  visto(texto: string): void {
    void this.lector.announce(texto, 'polite');
  }

  /** Guardar y quedarse: el resultado junto a los botones de la barra. */
  enLaBarra(texto: string): void {
    this.barra.resultado.set(texto);
  }

  /** Vuelve a haber cambios (o empieza otra acción): el resultado anterior ya no vale. */
  limpiar(): void {
    this.barra.resultado.set(null);
  }
}

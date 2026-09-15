import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * RAMA DE COMPARACIÓN (`comparar/fichas`), variante `d`. Una fila del resumen: rótulo a la
 * izquierda y valor a la derecha. El rótulo llega ya traducido; el valor, proyectado.
 *
 * `stacked` pone el rótulo encima y el valor a todo el ancho: para las filas que son LISTAS
 * (secciones, permisos), que en media columna se convertían en una torre de texto. En una tarjeta
 * estrecha pasa lo mismo sin pedirlo (consulta de contenedor).
 */
@Component({
  selector: 'sc-board-row',
  host: { '[class.board-row--stacked]': 'stacked()' },
  template: `
    <span class="board-row__label sc-text-caption-regular">{{ label() }}</span>
    <span class="board-row__value sc-text-body-regular"><ng-content /></span>
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: baseline;
      gap: var(--sc-spacing-0-625);
    }
    :host(.board-row--stacked) {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--sc-spacing-0-125);
    }
    /* En una tarjeta estrecha (la franja de cinco del agente) el rótulo va encima: lado a lado, los
     * dos se partían en tres líneas. */
    @container (max-width: 20rem) {
      :host {
        grid-template-columns: minmax(0, 1fr);
        gap: 0;
      }
    }
    .board-row__label {
      color: var(--sc-text-secondary);
    }
    .board-row__value {
      color: var(--sc-text-primary);
      overflow-wrap: anywhere;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardRowComponent {
  readonly label = input.required<string>();
  readonly stacked = input(false, { transform: booleanAttribute });
}

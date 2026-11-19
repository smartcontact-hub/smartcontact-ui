import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { MINUTOS_DEL_DIA, resolverDia, type Semana, sumarDias } from '../../state/horarios.core.mjs';

/** Un lunes cualquiera: la semana es la misma todas las semanas, solo hace falta para resolver los tramos que cruzan la medianoche. */
const LUNES = '2024-01-01';

/**
 * La semana en pequeño, para una celda de tabla: siete rayas finas (de lunes a domingo) sobre la línea de las 24 horas, con los
 * tramos en que se atiende en el azul de acción. Es lo mismo que la vista «Semana» del editor, sin ejes, letras ni números.
 * Decorativa: el texto accesible lo trae quien la pone (`etiqueta`).
 */
@Component({
  selector: 'sc-horario-semana-mini',
  template: `
    <span class="mini" role="img" [attr.aria-label]="etiqueta()" [attr.title]="etiqueta() || null">
      @for (d of dias(); track $index) {
        <span class="mini__dia">
          @for (b of d; track $index) {
            <span class="mini__barra" [style.left.%]="b.izq" [style.width.%]="b.ancho"></span>
          }
        </span>
      }
    </span>
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
      max-inline-size: 7.5rem;
    }

    .mini {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-125);
    }

    /* La raya de cada día: fondo gris del DS y, encima, los tramos. 3 px de alto; radios concéntricos con la pista. */
    .mini__dia {
      position: relative;
      block-size: 3px;
      border-radius: var(--sc-radius-sm);
      background: var(--sc-bg-hover);
      overflow: hidden;
    }

    .mini__barra {
      position: absolute;
      inset-block: 0;
      border-radius: var(--sc-radius-sm);
      background: var(--sc-bg-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioSemanaMiniComponent {
  readonly semana = input.required<Semana>();
  /** El texto que lee quien no ve la figura (la semana en una línea). */
  readonly etiqueta = input('');

  protected readonly dias = computed(() =>
    Array.from({ length: 7 }, (_, i) =>
      resolverDia({ week: this.semana(), periods: [], specials: [], holidayCalendarIds: [] }, sumarDias(LUNES, i), []).tramos.map(([a, b]) => ({
        izq: (a / MINUTOS_DEL_DIA) * 100,
        ancho: ((b - a) / MINUTOS_DEL_DIA) * 100,
      })),
    ),
  );
}

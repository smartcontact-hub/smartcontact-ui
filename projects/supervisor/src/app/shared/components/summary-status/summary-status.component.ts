import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScIconComponent } from '@smartcontact-hub/icons';

/** Una cosa que falta, para la línea del resumen: lo que se lee («nombre», ya traducido) y adónde lleva. */
export interface FaltaDelResumen {
  readonly etiqueta: string;
  readonly seccion: string;
  /** El campo al que se llega; `null`, al título de la sección (lo que falta no es un campo, como asignar un grupo). */
  readonly ancla: string | null;
}

/**
 * LO QUE LE FALTA A UNA FICHA, ARRIBA DE SU RESUMEN (DD-136, que vuelve con DD-219): «Falta: nombre, teléfono
 * saliente» mientras falte algo, y «Listo para crear» en cuanto «Crear …» se enciende. Es lo que explica por qué el
 * botón está apagado: sin esta línea, un botón gris obliga a buscar por las secciones qué lo bloquea.
 *
 * Cada cosa que falta lleva a su campo (`ir`), como cada fila del resumen (DD-146), y la ficha resuelve el clic.
 *
 * UN solo `role="status"`, que existe desde que se abre la ficha y cambia en su sitio: el lector anuncia cada cambio, y
 * la línea no aparece ni desaparece (reserva su alto aunque esté vacía). Vacía cuando no hay nada que decir: un error de
 * formato (un email mal escrito, un nombre repetido) se dice en su campo, y al editar nunca dice «Listo». En gris, no en
 * ámbar: algo por rellenar no es un aviso (DD-219). Los estilos, en `styles/_resumen.scss`.
 */
@Component({
  selector: 'sc-summary-status',
  imports: [TranslateModule, ScIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="resumen__status sc-text-caption-semibold" role="status" [class.resumen__status--ready]="showReady()">
      @if (missing().length > 0) {
        <sc-icon name="info" size="inherit" [weight]="600" aria-hidden="true" />
        <span>
          {{ 'common.summary_missing_label' | translate }}
          @for (item of missing(); track item.etiqueta; let last = $last) {
            <button type="button" class="resumen__enlace resumen__status-item" (click)="ir.emit(item)">{{ item.etiqueta }}</button>@if (!last) {<span>, </span>}
          }
        </span>
      } @else if (showReady()) {
        <sc-icon name="check_circle" size="inherit" [weight]="600" aria-hidden="true" />
        {{ 'common.summary_ready' | translate }}
      }
    </p>
  `,
})
export class SummaryStatusComponent {
  /** Lo que falta para poder crear o guardar, en el orden de la ficha. Vacío = nada. */
  readonly missing = input<readonly FaltaDelResumen[]>([]);
  /** El botón «Crear …» está encendido. Solo en un alta: al editar, siempre `false`. */
  readonly ready = input(false);
  /** Se pulsó una cosa que falta: la ficha lleva a su campo. */
  readonly ir = output<FaltaDelResumen>();

  protected readonly showReady = computed(() => this.missing().length === 0 && this.ready());
}

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { injectLangChange } from '@core/utils/lang-change';

/**
 * LO QUE LE FALTA A UN ALTA, ARRIBA DE SU RESUMEN (DD-136): «Falta: nombre · extensión» mientras falte algo, y «Listo
 * para crear» en cuanto el botón «Crear …» se enciende.
 *
 * Es el efecto de gradiente de meta: cuanto menos le falta a un formulario, antes se termina. Las altas nacen con los
 * valores de Contact Center (DD-135), así que lo que queda suele ser poco, y decirlo en palabras lo acerca. Sin
 * porcentaje ni barra (DD-121, DD-126): un número de avance mide campos, y lo que importa es lo poco que falta.
 *
 * UN solo `role="status"`, que existe desde que se abre el alta y cambia en su sitio: el lector anuncia cada cambio,
 * y la línea no aparece ni desaparece (reserva su alto aunque esté vacía). Vacía cuando no hay nada que decir: un
 * error de formato (un email mal escrito, un nombre repetido) se dice en su campo, y al editar nunca dice «Listo».
 *
 * Los iconos, con el peso de su texto semibold (600, DD-130). Los estilos, en `styles/_resumen.scss`.
 */
@Component({
  selector: 'sc-summary-status',
  imports: [TranslateModule, ScIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="resumen__status sc-text-caption-semibold" role="status" [class.resumen__status--ready]="showReady()">
      @if (missingText(); as text) {
        <sc-icon name="error" size="inherit" [weight]="600" aria-hidden="true" />
        {{ text }}
      } @else if (showReady()) {
        <sc-icon name="check_circle" size="inherit" [weight]="600" aria-hidden="true" />
        {{ 'common.summary_ready' | translate }}
      }
    </p>
  `,
})
export class SummaryStatusComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  /** Claves de lo que falta para poder crear, en el orden de la ficha. Vacío = nada. */
  readonly missing = input<readonly string[]>([]);
  /** El botón «Crear …» está encendido. Solo en un alta: al editar, siempre `false`. */
  readonly ready = input(false);

  protected readonly missingText = computed(() => {
    this.lang();
    const items = this.missing().map((key) => this.translate.instant(key));
    return items.length > 0 ? this.translate.instant('common.summary_missing', { items: items.join(', ') }) : '';
  });

  protected readonly showReady = computed(() => !this.missingText() && this.ready());
}

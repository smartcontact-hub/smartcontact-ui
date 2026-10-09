import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScIconComponent } from '@smartcontact-hub/icons';

/**
 * UNA NOTA DE DECISIÓN, para la revisión del prototipo (revisión de agentes y tipificaciones del 2026-10-09): un punto
 * que el equipo o producto tiene que decidir, dicho junto a lo que afecta. No es una ayuda del producto: por eso no se
 * parece a un tooltip normal (oscuro y pequeño), sino a una tarjeta morada, con su título «Nota para el equipo» y la
 * pregunta y la propuesta debajo. Se abre al pasar el ratón o al enfocar, y se queda mientras el puntero esté encima,
 * para poder leerla entera.
 *
 *   <sc-nota-decision claveTitulo="notas.pin.titulo" claveTexto="notas.pin.texto" />
 *
 * Cuando el equipo decida, la nota se borra: lo decidido va a su DD.
 */
@Component({
  selector: 'sc-nota-decision',
  imports: [ScIconComponent, TooltipModule, TranslateModule],
  template: `
    <button
      type="button"
      class="nota"
      [pTooltip]="globo"
      tooltipStyleClass="nota-decision__globo"
      [pTooltipPT]="piezas"
      tooltipPosition="top"
      tooltipEvent="both"
      [autoHide]="false"
      [attr.aria-label]="('decision_notes.label' | translate) + ': ' + (claveTitulo() | translate)"
    >
      <sc-icon name="info" size="sm" [filled]="true" aria-hidden="true" />
    </button>
    <ng-template #globo>
      <span class="nota-decision__eyebrow sc-text-caption-semibold">{{ 'decision_notes.label' | translate }}</span>
      <strong class="nota-decision__titulo sc-text-body-semibold">{{ claveTitulo() | translate }}</strong>
      <span class="nota-decision__texto sc-text-body-regular">{{ claveTexto() | translate }}</span>
    </ng-template>
  `,
  styles: `
    :host {
      display: inline-flex;
      vertical-align: middle;
    }
    /* El signo de la nota: el morado de las etiquetas del DS, para no confundirse con una ayuda del producto. */
    .nota {
      display: inline-flex;
      padding: 0;
      border: 0;
      border-radius: var(--sc-radius-full);
      background: none;
      color: var(--sc-label-purple-dot);
      cursor: help;
    }
    .nota:focus-visible {
      outline: var(--sc-focus-ring-width) solid var(--sc-border-focus);
      outline-offset: var(--sc-focus-ring-offset);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotaDecisionComponent {
  readonly claveTitulo = input.required<string>();
  readonly claveTexto = input.required<string>();

  /** Clases propias en la caja y la flecha del tooltip, por su passthrough: el globo se pinta sin tocar `.p-tooltip-*`. */
  protected readonly piezas = { text: { class: 'nota-decision__tarjeta' }, arrow: { class: 'nota-decision__flecha' } };
}

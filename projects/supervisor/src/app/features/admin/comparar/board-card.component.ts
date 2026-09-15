import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScIconComponent } from '@smartcontact-hub/icons';

/**
 * RAMA DE COMPARACIÓN (`comparar/fichas`), variante `d` («Resumen + editor»).
 *
 * Una sección de la ficha en RESUMEN: lo que vale ahora, de un vistazo y sin controles. Toda la
 * ficha cabe en una pantalla como un mosaico de estas tarjetas; pulsar una la abre en el editor
 * de la derecha, y la tarjeta se queda marcada y se sigue actualizando mientras editas. Así se
 * cambia una sección sin perder de vista las demás (el patrón lista + detalle de Meridian).
 *
 * El resumen lo escribe cada ficha dentro (`sc-board-row`): solo LEE el estado actual, sin
 * comparar con lo guardado ni contar cambios.
 */
@Component({
  selector: 'sc-board-card',
  imports: [ScIconComponent, TranslateModule],
  template: `
    <article class="board-card" [class.board-card--selected]="selected()" (click)="pick.emit()">
      <button
        type="button"
        class="board-card__head"
        [attr.aria-pressed]="selected()"
        [attr.aria-controls]="sectionId()"
        (click)="$event.stopPropagation(); pick.emit()"
      >
        <span class="board-card__icon" aria-hidden="true"><sc-icon [name]="icon()" size="sm" /></span>
        <span class="board-card__title sc-text-body-semibold">{{ titleKey() | translate }}</span>
        <span class="board-card__action sc-text-caption-regular">
          {{ (selected() ? 'compare.board.editing' : 'common.edit') | translate }}
        </span>
      </button>
      <div class="board-card__body">
        <ng-content />
      </div>
    </article>
  `,
  styleUrl: './board-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardCardComponent {
  readonly sectionId = input.required<string>();
  readonly icon = input.required<string>();
  readonly titleKey = input.required<string>();
  readonly selected = input(false, { transform: booleanAttribute });
  readonly pick = output<void>();
}

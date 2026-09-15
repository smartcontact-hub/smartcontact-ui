import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { stableStringify } from '@shared/utils/form-dirty-state';

/**
 * RAMA DE COMPARACIÓN (`comparar/fichas`). El panel de la variante `c`: debajo del índice, lo
 * que has cambiado sin guardar, agrupado por sección, y lo que ese cambio mueve FUERA de la
 * sección o de la ficha (un grupo que gana un agente, agentes que pierden un canal). Es la
 * respuesta a «cuando toco algo afecta a otras cosas» sin tener que ver todo a la vez.
 */
export interface PendingSection {
  readonly sectionId: string;
  readonly icon: string;
  readonly labelKey: string;
  /** Campos cambiados, ya traducidos. */
  readonly fields: readonly string[];
  /** Consecuencias fuera de la sección, ya traducidas. */
  readonly effects: readonly string[];
}

/** ¿Cambió este valor? Con la misma comparación que decide si Guardar se enciende. */
export function changed(before: unknown, after: unknown): boolean {
  return stableStringify(before) !== stableStringify(after);
}

@Component({
  selector: 'sc-pending-changes-panel',
  imports: [ScIconComponent, TranslateModule],
  template: `
    <section class="pending" aria-labelledby="pending-changes-title" aria-live="polite">
      <p id="pending-changes-title" class="pending__title sc-text-caption-semibold">
        {{ 'compare.pending.title' | translate }}
      </p>
      @if (sections().length === 0) {
        <p class="pending__empty sc-text-caption-regular">{{ 'compare.pending.empty' | translate }}</p>
      } @else {
        <ul class="pending__list">
          @for (s of sections(); track s.sectionId) {
            <li class="pending__item">
              <a class="pending__section sc-text-body-semibold" [href]="'#' + s.sectionId" (click)="onGo($event, s.sectionId)">
                <span class="pending__icon" aria-hidden="true"><sc-icon [name]="s.icon" size="sm" /></span>
                {{ s.labelKey | translate }}
              </a>
              @if (s.fields.length > 0) {
                <p class="pending__fields sc-text-caption-regular">{{ s.fields.join(' · ') }}</p>
              }
              @for (e of s.effects; track e) {
                <p class="pending__effect sc-text-caption-regular">
                  <span class="pending__effect-icon" aria-hidden="true"><sc-icon name="subdirectory_arrow_right" size="sm" /></span>
                  <span>{{ e }}</span>
                </p>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
  styleUrl: './pending-changes-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingChangesPanelComponent {
  readonly sections = input.required<readonly PendingSection[]>();
  readonly go = output<string>();

  protected onGo(event: MouseEvent, id: string): void {
    event.preventDefault();
    this.go.emit(id);
  }
}

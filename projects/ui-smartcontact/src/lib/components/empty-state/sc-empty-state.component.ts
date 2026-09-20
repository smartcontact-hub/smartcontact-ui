import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { SC_ICON_SIZE_DISPLAY_SM, ScIconComponent } from '@smartcontact-hub/icons';

import { ScButtonComponent } from '../button/sc-button.component';

/**
 * Centered empty-state card shown by list pages when there are zero rows
 * (initial seed empty, or filter wiped everything). Big circular icon,
 * title, descriptive body, optional primary CTA.
 *
 * Reserves a tall `min-height` so the page header doesn't shift when the
 * list flips between empty and populated.
 *
 * i18n: `titleKey`/`bodyKey`/`ctaKey` son claves que resuelve el consumidor
 * (componente i18n-driven), no copy propio — por eso NO registra diccionario
 * colocado (a diferencia de los custom con texto fijo). Iconos vía
 * `@smartcontact-hub/icons` (§4.6).
 */
@Component({
  selector: 'sc-empty-state',
  standalone: true,
  imports: [ScButtonComponent, ScIconComponent, TranslateModule],
  templateUrl: './sc-empty-state.component.html',
  styleUrl: './sc-empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScEmptyStateComponent {
  /** Icono del estado vacío. Decorativo: lo que explica qué pasa es el texto. */
  readonly icon = input.required<string>();
  /** Clave de traducción del título. */
  readonly titleKey = input.required<string>();
  /** Opcional: un vacío que se explica con el título no necesita una segunda frase. */
  readonly bodyKey = input<string>('');
  /**
   * Parámetros de interpolación para título y cuerpo (`{{query}}`, `{{entity}}`). Nace con el vacío
   * de búsqueda sin resultados, que tiene que decir QUÉ se buscó (2026-09-14).
   */
  readonly params = input<Record<string, unknown> | undefined>(undefined);
  /** When set, renders a primary action button labeled with this i18n key. */
  readonly ctaKey = input<string | null>(null);

  /**
   * Icono del CTA. Por defecto `add`, que es el caso mayoritario ("Nuevo X").
   * Existe porque NO todo CTA de un vacío crea algo: en transcripciones el
   * vacío ofrece "limpiar filtros" —no se crean conversaciones, entran solas—
   * y un "+" ahí decía justo lo contrario de lo que hace el botón.
   */
  readonly ctaIcon = input<string>('add');

  /** Emite el MouseEvent del click — permite anclar menús popup al botón
   *  (`menu.toggle($event)`). Los listeners sin parámetro siguen valiendo. */
  readonly cta = output<MouseEvent>();
  protected readonly iconSizeDisplay = SC_ICON_SIZE_DISPLAY_SM;

  protected onCtaClick(ev: MouseEvent): void {
    this.cta.emit(ev);
  }
}

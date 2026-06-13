import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { SC_ICON_SIZE_2XL, ScIconComponent } from '@smartcontact-hub/icons';

/**
 * Static page header used by non-entity routes (`/config/*` and list
 * pages). Visually mirrors `sc-sticky-form-header` — same leading icon
 * chip (36×36, compact S59), uppercase entity eyebrow, large title, subtle
 * subtitle — so the rest of the app reads as part of the same family.
 *
 * Unlike `sticky-form-header`, this header has no actions baked in: the page
 * projects its own primary action into `[page-header-actions]`, and accepts a
 * Material Symbols icon name instead of a projected photo/avatar component.
 *
 * i18n: `entityKey`/`titleKey`/`subtitleKey` son claves que resuelve el
 * consumidor (componente i18n-driven) → sin diccionario colocado. Iconos vía
 * `@smartcontact-hub/icons` (§4.6).
 */
@Component({
  selector: 'sc-page-header',
  standalone: true,
  imports: [ScIconComponent, TranslateModule],
  templateUrl: './sc-page-header.component.html',
  styleUrl: './sc-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScPageHeaderComponent {
  /** i18n key for the small uppercase eyebrow above the title. Optional. */
  readonly entityKey = input<string | null>(null);
  /** i18n key for the main title. */
  readonly titleKey = input.required<string>();
  /** i18n key for the subtle subtitle line below the title. Optional. */
  readonly subtitleKey = input<string | null>(null);
  /** Leading Material Symbols icon name (rendered in a 36×36 chip). Optional. */
  readonly icon = input<string | null>(null);

  protected readonly iconSize2xl = SC_ICON_SIZE_2XL;
}

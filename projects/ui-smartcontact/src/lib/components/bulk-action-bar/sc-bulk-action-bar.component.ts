import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SC_ICON_SIZE_DEFAULT, ScIconComponent } from '@smartcontact/icons';

import { registerScBulkActionBarTranslations } from './i18n/sc-bulk-action-bar.translations';

export interface BulkActionEntityLabels {
  readonly singular: string;
  readonly plural: string;
  /** Gender/lang suffix; defaults to the colocated `sc.bulkActionBar.selectedOne`. */
  readonly suffixSingular?: string;
  readonly suffixPlural?: string;
}

/**
 * Fixed-bottom action bar that surfaces when items are selected in list pages
 * (DD#298). Shows a "{n} {entity} {selected}" summary plus a clear button on
 * the left, and arbitrary projected actions on the right.
 *
 * Sits flush with the sidebar via `--sc-sidebar-width`.
 *
 * i18n: las etiquetas de entidad las suministra el consumidor (típicamente vía
 * `useBulkEntityI18n`); los rótulos accesibles y los sufijos por defecto del
 * resumen viven en el diccionario colocado `sc.bulkActionBar.*` (sin claves
 * `common.*`). Iconos vía `@smartcontact/icons` (§4.6).
 */
@Component({
  selector: 'sc-bulk-action-bar',
  standalone: true,
  imports: [ScIconComponent, TranslateModule],
  templateUrl: './sc-bulk-action-bar.component.html',
  styleUrl: './sc-bulk-action-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScBulkActionBarComponent {
  readonly count = input.required<number>();
  readonly entity = input.required<BulkActionEntityLabels>();

  readonly clear = output<void>();

  private readonly translate = inject(TranslateService);
  protected readonly closeIcon = 'close';
  protected readonly iconSizeDefault = SC_ICON_SIZE_DEFAULT;

  protected readonly visible = computed(() => this.count() > 0);

  protected readonly summary = computed(() => {
    const c = this.count();
    const e = this.entity();
    const label = c === 1 ? e.singular : e.plural;
    /* Sufijo: si el consumidor no lo pasa (uso directo sin `useBulkEntityI18n`),
     * cae al colocado `sc.bulkActionBar.selectedOne/Other` — sin español
     * hardcodeado en el paquete. */
    const suffix =
      c === 1
        ? (e.suffixSingular ?? this.translate.instant('sc.bulkActionBar.selectedOne'))
        : (e.suffixPlural ?? this.translate.instant('sc.bulkActionBar.selectedOther'));
    return `${c} ${label} ${suffix}`;
  });

  constructor() {
    registerScBulkActionBarTranslations(this.translate);
  }
}

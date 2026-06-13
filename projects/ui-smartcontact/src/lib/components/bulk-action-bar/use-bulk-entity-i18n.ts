import { type Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';

import { type BulkActionEntityLabels } from './sc-bulk-action-bar.component';
import { registerScBulkActionBarTranslations } from './i18n/sc-bulk-action-bar.translations';

export interface BulkEntityI18nKeys {
  /** i18n key con el singular ("agente", "agent", "conversación"…). */
  readonly singular: string;
  /** i18n key con el plural ("agentes", "agents", "conversaciones"…). */
  readonly plural: string;
  /** Suffix singular ("seleccionado", "selected", …). Default colocado
   *  `sc.bulkActionBar.selectedOne`. */
  readonly selectedOne?: string;
  /** Suffix plural ("seleccionados", "selected", …). Default colocado
   *  `sc.bulkActionBar.selectedOther`. */
  readonly selectedOther?: string;
}

/**
 * Construye un `Signal<BulkActionEntityLabels>` reactivo al cambio de idioma.
 *
 * Origen S49: `bulkEntity` hardcoded ES no se traducía en EN/FR/PT (bug 2a).
 * Patrón establecido en `conversations-page.component.ts` y promovido a
 * helper en S50 cuando 7 consumers necesitaron el mismo cableado.
 *
 * Uso típico (Angular standalone component):
 *
 * ```ts
 * protected readonly bulkEntity = useBulkEntityI18n({
 *   singular: 'admin.agents.bulk.entity.singular',
 *   plural: 'admin.agents.bulk.entity.plural',
 *   selectedOne: 'admin.agents.bulk.entity.selected_one',
 *   selectedOther: 'admin.agents.bulk.entity.selected_other',
 * });
 * ```
 *
 * En el template:
 * ```html
 * <sc-bulk-action-bar [entity]="bulkEntity()" ... />
 * ```
 *
 * El computed escucha `TranslateService.onLangChange` via `toSignal` y se
 * re-evalúa al cambio de idioma — sin esta dependency, `translate.instant`
 * en un computed solo dispara una vez (no reactivo a lang switch).
 *
 * Debe llamarse en un injection context (field initializer / constructor del
 * componente consumidor).
 */
export function useBulkEntityI18n(keys: BulkEntityI18nKeys): Signal<BulkActionEntityLabels> {
  const translate = inject(TranslateService);
  // Garantiza que los sufijos por defecto resuelven aunque el consumidor use el
  // helper sin montar el `<sc-bulk-action-bar>` todavía.
  registerScBulkActionBarTranslations(translate);
  const lang = toSignal(
    translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(translate.currentLang),
    ),
    { initialValue: translate.currentLang },
  );
  return computed(() => {
    lang(); // dependency for re-runs on lang change
    return {
      singular: translate.instant(keys.singular),
      plural: translate.instant(keys.plural),
      suffixSingular: translate.instant(keys.selectedOne ?? 'sc.bulkActionBar.selectedOne'),
      suffixPlural: translate.instant(keys.selectedOther ?? 'sc.bulkActionBar.selectedOther'),
    };
  });
}

/**
 * Copy fijo del componente, colocado (convención del DS). Aquí viven el rótulo
 * accesible de la región, el del botón de limpiar y los SUFIJOS por defecto
 * («seleccionado/s») del resumen — desacoplados de las claves `common.bulk.*`
 * de la app de origen. Las etiquetas de la entidad (singular/plural) las
 * suministra el consumidor (normalmente vía `useBulkEntityI18n`).
 */
import type { TranslateService, TranslationObject } from '@ngx-translate/core';

export const SC_BULK_ACTION_BAR_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      bulkActionBar: {
        region: 'Bulk actions',
        clearSelection: 'Clear selection',
        selectedOne: 'selected',
        selectedOther: 'selected',
      },
    },
  },
  es: {
    sc: {
      bulkActionBar: {
        region: 'Acciones en bloque',
        clearSelection: 'Limpiar selección',
        selectedOne: 'seleccionado',
        selectedOther: 'seleccionados',
      },
    },
  },
};

/**
 * Registra el diccionario del componente (idempotente — `setTranslation` con
 * merge). Lo llaman tanto el componente como `useBulkEntityI18n`, de modo que
 * los sufijos por defecto resuelven aunque el helper se use sin el componente.
 */
export function registerScBulkActionBarTranslations(translate: TranslateService): void {
  for (const [language, dict] of Object.entries(SC_BULK_ACTION_BAR_TRANSLATIONS)) {
    translate.setTranslation(language, dict, true);
  }
}

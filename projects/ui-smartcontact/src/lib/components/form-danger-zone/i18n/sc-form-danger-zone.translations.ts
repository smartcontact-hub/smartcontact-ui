/**
 * Copy fijo del componente, colocado (convención del DS): los textos por
 * defecto del título y del botón — desacoplados de las claves `common.*` de la
 * app de origen. La descripción (`descriptionKey`) la suministra siempre el
 * consumidor (input required).
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_FORM_DANGER_ZONE_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      formDangerZone: {
        title: 'Danger zone',
        action: 'Delete',
      },
    },
  },
  es: {
    sc: {
      formDangerZone: {
        title: 'Zona de peligro',
        action: 'Eliminar',
      },
    },
  },
};

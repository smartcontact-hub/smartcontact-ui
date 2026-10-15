/**
 * Copy fijo del componente, colocado (convención del DS: los componentes con texto propio registran SOLO su
 * diccionario). Aquí vive el rótulo del botón que vacía la fecha en el pie con atajos: sin un defecto en el idioma de la app, un lector de pantalla
 * anuncia el texto en otro idioma cuando el consumidor no pasa el suyo.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_DATEPICKER_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      datepicker: {
        clear: 'Clear',
      },
    },
  },
  es: {
    sc: {
      datepicker: {
        clear: 'Limpiar',
      },
    },
  },
  fr: {
    sc: {
      datepicker: {
        clear: 'Effacer',
      },
    },
  },
  pt: {
    sc: {
      datepicker: {
        clear: 'Limpar',
      },
    },
  },
};

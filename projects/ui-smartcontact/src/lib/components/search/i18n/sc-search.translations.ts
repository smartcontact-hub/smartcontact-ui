/**
 * Copy fijo del componente, colocado (convención del DS: los componentes con texto propio registran SOLO su
 * diccionario). Aquí vive el nombre accesible del botón que vacía la búsqueda: sin un defecto en el idioma de la app, un lector de pantalla
 * anuncia el texto en otro idioma cuando el consumidor no pasa el suyo.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_SEARCH_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      search: {
        clear: 'Clear search',
      },
    },
  },
  es: {
    sc: {
      search: {
        clear: 'Limpiar búsqueda',
      },
    },
  },
  fr: {
    sc: {
      search: {
        clear: 'Effacer la recherche',
      },
    },
  },
  pt: {
    sc: {
      search: {
        clear: 'Limpar busca',
      },
    },
  },
};

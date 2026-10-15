/**
 * Copy fijo del componente, colocado (convención del DS: los componentes con texto propio registran SOLO su
 * diccionario). Aquí vive el nombre accesible del botón de cerrar del diálogo: sin un defecto en el idioma de la app, un lector de pantalla
 * anuncia el texto en otro idioma cuando el consumidor no pasa el suyo.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_DIALOG_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      dialog: {
        close: 'Close',
      },
    },
  },
  es: {
    sc: {
      dialog: {
        close: 'Cerrar',
      },
    },
  },
  fr: {
    sc: {
      dialog: {
        close: 'Fermer',
      },
    },
  },
  pt: {
    sc: {
      dialog: {
        close: 'Fechar',
      },
    },
  },
};

/**
 * Copy fijo del componente, colocado (convención del DS: los componentes con texto propio registran SOLO su
 * diccionario). Aquí vive los nombres accesibles del botón de mostrar y ocultar la contraseña: sin un defecto en el idioma de la app, un lector de pantalla
 * anuncia el texto en otro idioma cuando el consumidor no pasa el suyo.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_PASSWORD_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      password: {
        show: 'Show password',
        hide: 'Hide password',
      },
    },
  },
  es: {
    sc: {
      password: {
        show: 'Mostrar contraseña',
        hide: 'Ocultar contraseña',
      },
    },
  },
  fr: {
    sc: {
      password: {
        show: 'Afficher le mot de passe',
        hide: 'Masquer le mot de passe',
      },
    },
  },
  pt: {
    sc: {
      password: {
        show: 'Mostrar senha',
        hide: 'Ocultar senha',
      },
    },
  },
};

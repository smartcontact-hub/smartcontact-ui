/**
 * Copy fijo del componente, colocado (convención del DS: los componentes con texto propio registran SOLO su
 * diccionario). El nombre accesible del botón de cerrar: sin un defecto en el idioma de la app, un lector de
 * pantalla lo anuncia en otro idioma cuando el consumidor no pasa el suyo.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_CUSTOM_MODAL_TRANSLATIONS: Record<string, TranslationObject> = {
  es: { sc: { customModal: { close: 'Cerrar' } } },
  en: { sc: { customModal: { close: 'Close' } } },
  fr: { sc: { customModal: { close: 'Fermer' } } },
  pt: { sc: { customModal: { close: 'Fechar' } } },
};

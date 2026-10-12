/**
 * Copy fijo de `sc-textarea`, colocado (convención del DS): el botón de copiar de un campo `copyable` (DD-198). Quien
 * pase sus propios textos por entrada, manda.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_TEXTAREA_TRANSLATIONS: Record<string, TranslationObject> = {
  es: { sc: { textarea: { copy: 'Copiar', copied: 'Copiado' } } },
  en: { sc: { textarea: { copy: 'Copy', copied: 'Copied' } } },
  fr: { sc: { textarea: { copy: 'Copier', copied: 'Copié' } } },
  pt: { sc: { textarea: { copy: 'Copiar', copied: 'Copiado' } } },
};

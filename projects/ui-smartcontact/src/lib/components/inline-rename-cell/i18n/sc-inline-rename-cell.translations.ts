/**
 * Copy fijo del componente, colocado (convención del DS: los custom con texto
 * propio registran SOLO su diccionario). Cubre los aria-label de los botones y el
 * fallback del aria-label del input cuando el consumidor no pasa uno propio.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_INLINE_RENAME_CELL_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      inlineRenameCell: {
        confirm: 'Confirm',
        cancel: 'Cancel',
        defaultAriaLabel: 'Rename',
      },
    },
  },
  es: {
    sc: {
      inlineRenameCell: {
        confirm: 'Confirmar',
        cancel: 'Cancelar',
        defaultAriaLabel: 'Renombrar',
      },
    },
  },
};

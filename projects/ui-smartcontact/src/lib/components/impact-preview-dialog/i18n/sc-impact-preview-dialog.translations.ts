/**
 * Copy fijo del componente, colocado (convención del DS): etiquetas por defecto
 * de los botones, aria del botón quitar y el mensaje de lista vacía —
 * desacoplados del español hardcodeado del origen. El `title`, los nombres de
 * items y las etiquetas del badge los suministra el consumidor.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_IMPACT_PREVIEW_DIALOG_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      impactPreviewDialog: {
        confirm: 'Apply',
        cancel: 'Cancel',
        remove: 'Remove {{name}}',
        empty: 'No items left.',
      },
    },
  },
  es: {
    sc: {
      impactPreviewDialog: {
        confirm: 'Aplicar',
        cancel: 'Cancelar',
        remove: 'Quitar {{name}}',
        empty: 'No queda ningún elemento.',
      },
    },
  },
};

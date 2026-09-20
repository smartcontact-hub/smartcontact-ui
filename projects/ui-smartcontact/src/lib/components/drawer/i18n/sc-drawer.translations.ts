/**
 * Copy fijo del componente, colocado (convención del DS: los custom con texto propio registran
 * SOLO su diccionario). Aquí vive el nombre accesible del botón de cerrar: sin él, PrimeNG pinta
 * una X sin `aria-label` y un lector de pantalla la anuncia como «botón», sin decir qué hace
 * (medido el 2026-09-15 en los tres `sc-drawer` del Supervisor).
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_DRAWER_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      drawer: {
        close: 'Close panel',
      },
    },
  },
  es: {
    sc: {
      drawer: {
        close: 'Cerrar panel',
      },
    },
  },
};

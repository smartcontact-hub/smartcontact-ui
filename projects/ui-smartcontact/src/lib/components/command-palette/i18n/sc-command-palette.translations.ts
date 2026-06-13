/**
 * Copy fijo del componente, colocado (convención del DS: los custom con texto
 * propio registran SOLO su diccionario, sin tirar de claves de la app). Cubre
 * únicamente el chrome de la paleta — el `label`/`category` de cada comando los
 * provee ya traducidos el consumidor.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_COMMAND_PALETTE_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      commandPalette: {
        dialogAriaLabel: 'Search and run commands',
        searchPlaceholder: 'Search pages, actions…',
        searchAriaLabel: 'Search pages and actions',
        empty: 'No results',
        hintNavigate: 'navigate',
        hintSelect: 'select',
        hintClose: 'close',
      },
    },
  },
  es: {
    sc: {
      commandPalette: {
        dialogAriaLabel: 'Buscar y ejecutar comandos',
        searchPlaceholder: 'Buscar páginas, acciones…',
        searchAriaLabel: 'Buscar páginas y acciones',
        empty: 'Sin resultados',
        hintNavigate: 'navegar',
        hintSelect: 'seleccionar',
        hintClose: 'cerrar',
      },
    },
  },
};

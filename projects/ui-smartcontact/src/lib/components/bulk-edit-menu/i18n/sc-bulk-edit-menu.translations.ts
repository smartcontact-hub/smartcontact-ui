/**
 * Copy fijo del componente, colocado (convención del DS). Aquí solo viven las
 * palabras de conexión de la frase «Cambiar [campo] a [valor] [Aplicar]» y el
 * rótulo accesible del grupo — desacoplado de la app de origen. Las etiquetas
 * de campos y valores (`BulkEditFieldOption.label` / `BulkEditValueOption.label`)
 * las sigue suministrando el consumidor ya traducidas.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_BULK_EDIT_MENU_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      bulkEditMenu: {
        groupLabel: 'Bulk edit',
        change: 'Change',
        to: 'to',
        apply: 'Apply',
      },
    },
  },
  es: {
    sc: {
      bulkEditMenu: {
        groupLabel: 'Editar en bloque',
        change: 'Cambiar',
        to: 'a',
        apply: 'Aplicar',
      },
    },
  },
};

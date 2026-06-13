/**
 * Copy fijo del componente, colocado (convención del DS): todo el chrome del
 * diálogo de borrado (títulos/cuerpos por modo, etiquetas de la confirmación
 * por tipeo, chips, botonera y toasts de copiado) — desacoplado de las claves
 * `common.*` de la app de origen. Los nombres de entidad (`entitySingular` /
 * `entityPlural`) y de items los suministra el consumidor, interpolados como
 * parámetros.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_DELETE_ENTITY_DIALOG_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      deleteEntityDialog: {
        titleSingle: 'Delete {{entity}}?',
        titleBulk: 'Delete {{count}} {{entity}}?',
        bodySingle: "You're about to permanently delete «{{name}}». This can't be undone.",
        bodyBulk: 'This permanently deletes the selected {{entity}}. This can\'t be undone.',
        typeToConfirm: 'Type the name to confirm:',
        clickToCopy: 'Click to copy',
        emptyPruned: 'You removed every item from the list.',
        reset: 'Restore list',
        removeFromList: 'Remove {{name}} from the list',
        cancel: 'Cancel',
        delete: 'Delete',
        copied: 'Copied to clipboard',
        copyFailed: "Couldn't copy",
      },
    },
  },
  es: {
    sc: {
      deleteEntityDialog: {
        titleSingle: '¿Eliminar {{entity}}?',
        titleBulk: '¿Eliminar {{count}} {{entity}}?',
        bodySingle: 'Vas a eliminar permanentemente «{{name}}». Esta acción no se puede deshacer.',
        bodyBulk:
          'Se eliminarán permanentemente los {{entity}} seleccionados. Esta acción no se puede deshacer.',
        typeToConfirm: 'Escribe el nombre para confirmar:',
        clickToCopy: 'Clic para copiar',
        emptyPruned: 'Quitaste todos los elementos de la lista.',
        reset: 'Restaurar lista',
        removeFromList: 'Quitar {{name}} de la lista',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        copied: 'Copiado al portapapeles',
        copyFailed: 'No se pudo copiar',
      },
    },
  },
};

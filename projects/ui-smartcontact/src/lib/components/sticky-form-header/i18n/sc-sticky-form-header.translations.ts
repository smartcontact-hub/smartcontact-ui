/**
 * Copy fijo del componente, colocado (convención del DS): las palabras de
 * acción del header (editar/guardar/cancelar/atrás/cargando) y el placeholder
 * de nombre por defecto — desacoplados de las claves `common.*` de la app de
 * origen. La etiqueta de entidad (`entityKey`) la suministra el consumidor.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_STICKY_FORM_HEADER_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      stickyFormHeader: {
        edit: 'Edit',
        save: 'Save',
        cancel: 'Cancel',
        back: 'Back',
        loading: 'Loading…',
        namePlaceholder: 'Name',
      },
    },
  },
  es: {
    sc: {
      stickyFormHeader: {
        edit: 'Editar',
        save: 'Guardar',
        cancel: 'Cancelar',
        back: 'Atrás',
        loading: 'Cargando…',
        namePlaceholder: 'Nombre',
      },
    },
  },
};

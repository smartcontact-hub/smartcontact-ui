/**
 * Copy fijo del componente, colocado (convención del DS): rótulos del botón,
 * hint de formato/tamaño, enlace de quitar y los toasts de validación —
 * desacoplado de las claves `common.photo.*` de la app de origen.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_PHOTO_UPLOAD_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      photoUpload: {
        changePhoto: 'Change photo',
        select: 'Select photo',
        hint: 'JPG, PNG or GIF · max 800 KB',
        remove: 'Remove photo',
        invalidType: 'Invalid file type. Use JPG, PNG or GIF.',
        tooLarge: 'Image too large (max 800 KB).',
      },
    },
  },
  es: {
    sc: {
      photoUpload: {
        changePhoto: 'Cambiar foto',
        select: 'Seleccionar foto',
        hint: 'JPG, PNG o GIF · máx 800 KB',
        remove: 'Quitar foto',
        invalidType: 'Tipo de archivo no válido. Usa JPG, PNG o GIF.',
        tooLarge: 'Imagen demasiado grande (máx 800 KB).',
      },
    },
  },
};

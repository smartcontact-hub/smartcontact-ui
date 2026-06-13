/**
 * Copy fijo del componente, colocado (convención del DS: los custom con texto
 * propio registran SOLO su diccionario, sin tirar de claves `common.*` de la
 * app de origen). Las etiquetas de cada sección (`FormNavSection.labelKey`) las
 * sigue resolviendo el consumidor — aquí solo viven los aria-label propios del
 * nav (el rótulo accesible del `<nav>` y el del punto de error).
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_FORM_SECTION_NAV_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      formSectionNav: {
        label: 'Form sections',
        sectionHasErrors: 'This section has missing required fields',
      },
    },
  },
  es: {
    sc: {
      formSectionNav: {
        label: 'Secciones del formulario',
        sectionHasErrors: 'Esta sección tiene campos obligatorios sin rellenar',
      },
    },
  },
};

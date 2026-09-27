/**
 * Copy fijo del componente, colocado (convención del DS: los custom con texto
 * propio registran SOLO su diccionario, sin tirar de claves `common.*` de la
 * app de origen). Las etiquetas de cada sección (`FormNavSection.labelKey`) y el
 * rótulo visible (`titleKey`) los sigue resolviendo el consumidor — aquí solo vive
 * el copy propio del nav: su nombre accesible y lo que se oye con cada marca (lo
 * que falta y los cambios sin guardar).
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_FORM_SECTION_NAV_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      formSectionNav: {
        label: 'Form sections',
        sectionHasErrors: 'This section has missing required fields',
        sectionHasChanges: 'This section has unsaved changes',
      },
    },
  },
  es: {
    sc: {
      formSectionNav: {
        label: 'Secciones del formulario',
        sectionHasErrors: 'Esta sección tiene campos obligatorios sin rellenar',
        sectionHasChanges: 'Esta sección tiene cambios sin guardar',
      },
    },
  },
};

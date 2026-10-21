/**
 * Copy fijo del componente, colocado (convención del DS: los custom con texto
 * propio registran SOLO su diccionario, sin tirar de claves `common.*` de la
 * app de origen). Las etiquetas de cada sección (`FormNavSection.labelKey`) y el
 * rótulo visible (`titleKey`) los sigue resolviendo el consumidor — aquí solo vive
 * el copy propio del nav: su nombre accesible y lo que se oye con cada marca (lo
 * que falta, los cambios sin guardar y la sección hecha). En los cuatro idiomas
 * de las apps desde DD-143: hasta entonces, en francés y en portugués el
 * Supervisor los decía en español, su idioma de reserva.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_FORM_SECTION_NAV_TRANSLATIONS: Record<string, TranslationObject> = {
  en: {
    sc: {
      formSectionNav: {
        label: 'Form sections',
        sectionHasErrors: 'This section has missing required fields',
        sectionHasChanges: 'This section has unsaved changes',
        sectionDone: 'This section is complete',
        missingPrefix: 'Missing:',
        status: { pendiente: 'Not reviewed', actual: 'In progress', hecha: 'Done', error: 'Missing data', nuevo: 'Something new', revisada: 'Reviewed', cambios: 'Unsaved' },
      },
    },
  },
  es: {
    sc: {
      formSectionNav: {
        label: 'Secciones del formulario',
        sectionHasErrors: 'Esta sección tiene campos obligatorios sin rellenar',
        sectionHasChanges: 'Esta sección tiene cambios sin guardar',
        sectionDone: 'Esta sección está completa',
        missingPrefix: 'Falta:',
        status: { pendiente: 'Sin revisar', actual: 'En curso', hecha: 'Listo', error: 'Faltan datos', nuevo: 'Hay algo nuevo', revisada: 'Revisada', cambios: 'Sin guardar' },
      },
    },
  },
  fr: {
    sc: {
      formSectionNav: {
        label: 'Sections du formulaire',
        sectionHasErrors: 'Cette section contient des champs obligatoires non remplis',
        sectionHasChanges: 'Cette section contient des modifications non enregistrées',
        sectionDone: 'Cette section est complète',
        missingPrefix: 'Manque :',
        status: { pendiente: 'Non revue', actual: 'En cours', hecha: 'Terminée', error: 'Données manquantes', nuevo: 'Du nouveau', revisada: 'Revue', cambios: 'Non enregistrée' },
      },
    },
  },
  pt: {
    sc: {
      formSectionNav: {
        label: 'Seções do formulário',
        sectionHasErrors: 'Esta seção tem campos obrigatórios não preenchidos',
        sectionHasChanges: 'Esta seção tem alterações não salvas',
        sectionDone: 'Esta seção está completa',
        missingPrefix: 'Falta:',
        status: { pendiente: 'Sem revisar', actual: 'Em curso', hecha: 'Concluída', error: 'Faltam dados', nuevo: 'Há novidades', revisada: 'Revista', cambios: 'Por guardar' },
      },
    },
  },
};

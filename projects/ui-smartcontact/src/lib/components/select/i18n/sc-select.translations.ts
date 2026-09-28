/**
 * Copy fijo de los desplegables del DS (`sc-select` y `sc-multiselect`), colocado: cada componente con texto
 * propio registra solo su diccionario (convención del DS; así lo hace `sc-drawer`).
 *
 * Hasta el 2026-09-28 eran literales en español en los `input()` («Sin opciones», «Sin resultados», «Buscar» y, en el
 * múltiple, «{0} seleccionados»): un desplegable en inglés, francés o portugués seguía diciéndolos en español. Quien
 * los pase por entrada, manda.
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_SELECT_TRANSLATIONS: Record<string, TranslationObject> = {
  es: { sc: { select: { empty: 'Sin opciones', empty_filter: 'Sin resultados', search: 'Buscar', selected: '{0} seleccionados' } } },
  en: { sc: { select: { empty: 'No options', empty_filter: 'No results', search: 'Search', selected: '{0} selected' } } },
  fr: { sc: { select: { empty: 'Aucune option', empty_filter: 'Aucun résultat', search: 'Rechercher', selected: '{0} sélectionnés' } } },
  pt: { sc: { select: { empty: 'Sem opções', empty_filter: 'Sem resultados', search: 'Pesquisar', selected: '{0} selecionados' } } },
};

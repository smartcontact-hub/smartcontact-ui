/**
 * Copy fijo del componente, colocado (convención del DS: los custom con texto
 * propio registran SOLO su diccionario, sin tirar de claves de la app).
 */
import type { TranslationObject } from '@ngx-translate/core';

export const SC_GROUP_POPOVER_TRANSLATIONS: Record<string, TranslationObject> = {
    en: {
        sc: {
            groupPopover: {
                count: '{{count}} groups',
                countShort: '{{count}}',
                more: '+{{count}} more'
            }
        }
    },
    es: {
        sc: {
            groupPopover: {
                count: '{{count}} grupos',
                countShort: '{{count}}',
                more: '+{{count}} más'
            }
        }
    }
};

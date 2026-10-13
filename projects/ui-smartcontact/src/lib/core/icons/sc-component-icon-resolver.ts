import { resolveScIconName } from '@smartcontact-hub/icons';

import type { ScButtonIconSize } from '../types/button.types';

// Los alias del DS (`trash` → `delete`) y los nombres heredados de PrimeIcons (`pi pi-trash`) viven en UN sitio: el
// paquete de iconos (DD-200). Aquí había una copia de los dos mapas, idéntica el día que se quitó y sin nada que la
// atara a la otra.

type ScComponentIconOptions = {
    filled?: boolean;
    size?: ScButtonIconSize | null;
};

function resolveScComponentIconName(icon: string): string {
    return resolveScIconName(icon) ?? icon;
}

function supportsScIconFontOptions(iconClass: string): boolean {
    return iconClass.split(/\s+/).includes('sc-icon-font');
}

function appendScComponentIconOptions(iconClass: string, options: ScComponentIconOptions): string {
    if (!supportsScIconFontOptions(iconClass)) {
        return iconClass;
    }

    const iconClasses = [iconClass];

    if (options.size) {
        iconClasses.push(`sc-icon-font--${options.size}`);
    }

    if (options.filled) {
        iconClasses.push('sc-icon-font--filled');
    }

    return iconClasses.join(' ');
}

export function resolveScComponentIconClass(
    icon: string | null | undefined,
    options: ScComponentIconOptions = {}
): string | undefined {
    const normalizedIcon = icon?.trim();

    if (!normalizedIcon) {
        return undefined;
    }

    // Una clase ya armada (`sc-icon-font sc-icon-font--x`, `pi pi-x` sin traducción) pasa tal cual.
    if (normalizedIcon.includes(' ') && !resolveScIconName(normalizedIcon)) {
        return appendScComponentIconOptions(normalizedIcon, options);
    }

    const iconName = resolveScComponentIconName(normalizedIcon);

    return appendScComponentIconOptions(`sc-icon-font sc-icon-font--${iconName}`, options);
}

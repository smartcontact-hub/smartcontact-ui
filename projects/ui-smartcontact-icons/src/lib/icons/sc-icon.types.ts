import {
    SC_MATERIAL_SYMBOL_GLYPHS,
    ScMaterialSymbolName
} from './sc-material-symbols.generated';

const SC_ICON_ALIAS_MAP = {
    'arrow-right': 'arrow_forward',
    bars: 'menu',
    bell: 'notifications',
    'check-circle': 'check_circle',
    copy: 'content_copy',
    'exclamation-triangle': 'warning',
    'external-link': 'open_in_new',
    moon: 'dark_mode',
    sparkles: 'auto_awesome',
    'times-circle': 'error',
    trash: 'delete',
    user: 'person',
    'window-maximize': 'open_in_full'
} as const satisfies Record<string, ScMaterialSymbolName>;

export type ScIconAliasName = keyof typeof SC_ICON_ALIAS_MAP;
export type ScIconName = ScMaterialSymbolName | ScIconAliasName;

export type ScIconSize = 'sm' | 'md' | 'lg';

export type ScIconWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700;

export type ScIconGrade = -25 | 0 | 200;

export type ScIconOpticalSize = 20 | 24 | 40 | 48;

export const SC_ICON_GLYPHS = SC_MATERIAL_SYMBOL_GLYPHS;

const SC_LEGACY_PRIME_ICON_MAP = {
    'pi pi-align-left': 'menu',
    'pi pi-arrow-right': 'arrow-right',
    'pi pi-bars': 'bars',
    'pi pi-bell': 'bell',
    'pi pi-bolt': 'bolt',
    'pi pi-check': 'check',
    'pi pi-check-circle': 'check-circle',
    'pi pi-copy': 'copy',
    'pi pi-exclamation-triangle': 'exclamation-triangle',
    'pi pi-external-link': 'external-link',
    'pi pi-info-circle': 'info',
    'pi pi-moon': 'moon',
    'pi pi-refresh': 'refresh',
    'pi pi-sparkles': 'sparkles',
    'pi pi-times': 'close',
    'pi pi-times-circle': 'times-circle',
    'pi pi-trash': 'trash',
    'pi pi-undo': 'undo',
    'pi pi-upload': 'upload',
    'pi pi-user': 'user',
    'pi pi-window-maximize': 'window-maximize'
} as const satisfies Record<string, ScIconName>;

export function isScMaterialSymbolName(icon: string): icon is ScMaterialSymbolName {
    return Object.prototype.hasOwnProperty.call(SC_ICON_GLYPHS, icon);
}

export function resolveScIconName(icon: string | null | undefined): ScMaterialSymbolName | null {
    const normalizedIcon = icon?.trim();

    if (!normalizedIcon) {
        return null;
    }

    if (isScMaterialSymbolName(normalizedIcon)) {
        return normalizedIcon;
    }

    const aliasName = SC_ICON_ALIAS_MAP[normalizedIcon as ScIconAliasName];

    if (aliasName) {
        return aliasName;
    }

    const legacyIconName = SC_LEGACY_PRIME_ICON_MAP[normalizedIcon as keyof typeof SC_LEGACY_PRIME_ICON_MAP];

    if (!legacyIconName) {
        return null;
    }

    return resolveScIconName(legacyIconName);
}

export function resolveScIconGlyph(icon: string | null | undefined): string {
    const normalizedIcon = icon?.trim();

    if (!normalizedIcon) {
        return '';
    }

    const iconName = resolveScIconName(normalizedIcon);

    if (iconName) {
        return SC_ICON_GLYPHS[iconName];
    }

    return normalizedIcon;
}

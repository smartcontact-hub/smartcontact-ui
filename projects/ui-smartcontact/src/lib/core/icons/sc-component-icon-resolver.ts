import type { ScButtonIconSize } from '../types/button.types';

const SC_COMPONENT_ICON_ALIAS_MAP = {
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
} as const;

const SC_COMPONENT_LEGACY_PRIME_ICON_MAP = {
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
} as const;

type ScComponentIconOptions = {
    filled?: boolean;
    size?: ScButtonIconSize | null;
};

function resolveScComponentIconName(icon: string): string {
    const aliasName = SC_COMPONENT_ICON_ALIAS_MAP[icon as keyof typeof SC_COMPONENT_ICON_ALIAS_MAP];

    if (aliasName) {
        return aliasName;
    }

    const legacyIconName = SC_COMPONENT_LEGACY_PRIME_ICON_MAP[
        icon as keyof typeof SC_COMPONENT_LEGACY_PRIME_ICON_MAP
    ];

    if (legacyIconName) {
        return resolveScComponentIconName(legacyIconName);
    }

    return icon;
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

    const legacyIconName = SC_COMPONENT_LEGACY_PRIME_ICON_MAP[
        normalizedIcon as keyof typeof SC_COMPONENT_LEGACY_PRIME_ICON_MAP
    ];

    if (normalizedIcon.includes(' ') && !legacyIconName) {
        return appendScComponentIconOptions(normalizedIcon, options);
    }

    const iconName = resolveScComponentIconName(normalizedIcon);

    return appendScComponentIconOptions(`sc-icon-font sc-icon-font--${iconName}`, options);
}

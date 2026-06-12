import { EnvironmentProviders } from '@angular/core';
import { providePrimeNG } from 'primeng/config';

import scPreset from '../theme/sc-preset';

export type ScSmartContactThemeOptions = {
    darkModeSelector?: string | false;
    cssLayer?: boolean | {
        name?: string;
        order?: string;
    };
    prefix?: string;
};

export type ScSmartContactUiConfig = {
    ripple?: boolean;
    theme?: ScSmartContactThemeOptions;
};

export function provideSmartContactUi(config: ScSmartContactUiConfig = {}): EnvironmentProviders {
    const themeOptions: ScSmartContactThemeOptions = {
        darkModeSelector: config.theme?.darkModeSelector ?? 'none',
        prefix: config.theme?.prefix ?? 'p'
    };

    if (config.theme?.cssLayer !== undefined) {
        themeOptions.cssLayer = config.theme.cssLayer;
    }

    return providePrimeNG({
        ripple: config.ripple,
        theme: {
            preset: scPreset,
            options: themeOptions
        }
    });
}

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
        // `.sc-dark` es la clase de modo oscuro del DS (capa 7 de tokens):
        // PrimeNG emite su scheme dark bajo el mismo selector que flipa los
        // `--sc-*`. Un solo interruptor para tokens y preset.
        darkModeSelector: config.theme?.darkModeSelector ?? '.sc-dark',
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

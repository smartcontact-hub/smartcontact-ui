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

    /**
     * Clave de licencia de PrimeUI.
     *
     * Desde PrimeNG 22 la licencia se comprueba en el cliente al arrancar. Sin clave,
     * `verifyLicense` devuelve `missing` y PrimeNG inyecta un aviso rojo fijo
     * («Invalid PrimeUI License») en la esquina de CUALQUIER app que use este provider.
     * No hay tier gratuito sin clave: el tier `community` también va firmado.
     *
     * La clave viaja en el bundle por diseño —se verifica en el navegador—, así que no
     * es un secreto: puede vivir en el repo de la app.
     *
     * **Cada app pone la suya.** El Design System no trae una por defecto a propósito:
     * embarcar aquí la clave de Smart Contact se la colaría a cualquier consumidor
     * externo del DS, que es justo lo que la licencia no permite.
     */
    license?: string;
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
        license: config.license,
        theme: {
            preset: scPreset,
            options: themeOptions
        }
    });
}

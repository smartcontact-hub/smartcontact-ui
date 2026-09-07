import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withHashLocation, withNavigationErrorHandler } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { provideSmartContactUi } from '@smartcontact-hub/components';
import { routes } from './app.routes';
import { reloadOnChunkLoadError } from './shared/chunk-reload-handler';

/**
 * Clave de licencia de PrimeUI (tier community, caduca 2027-08-05).
 *
 * Sin ella PrimeNG 22 pinta un aviso rojo fijo en la esquina de la app. **Está repetida
 * en las CUATRO apps a propósito**: el `rootDir` de cada tsconfig impide importar un
 * fichero compartido de fuera del proyecto, y meterla en el Design System se la colaría
 * a cualquier consumidor externo. Al renovarla hay que tocar las cuatro.
 * Las otras tres copias: projects/{agent,cuscare,sc-docs,supervisor}/src/app/app.config.ts
 */
const PRIMEUI_LICENSE =
  'eyJpZCI6IjNkNzQ1MzkxLTNjNTAtNDg3Zi04YmRhLWJiMWIyZDAxYjUzYyIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODU5MjYxNDAsImV4cCI6MTgxNzQ2MjE0MH0.y5SIXd8TH-YF8MUtO4RESlItDQeYFkxqW1-O9f1cJJzRSJGBbewZA8-35_BpvbcYBKg_awNfwVhywDF5C0PLAA';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // El handler de error de navegación recupera el fallo de carga de un chunk diferido tras
    // un deploy con la pestaña abierta (recarga una vez en el destino). Ver chunk-reload-handler.ts.
    provideRouter(routes, withHashLocation(), withNavigationErrorHandler(reloadOnChunkLoadError)),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    // i18n (mismo patrón que el Supervisor): ngx-translate v17 con loader HTTP que trae
    // `/assets/i18n/<lang>.json`. Español es la referencia; inglés cubre el chrome y las
    // páginas clave (el resto sigue en español, sin clave, tal cual en la plantilla).
    // `LanguageService` aplica el idioma persistido al arrancar; `extend: true` fusiona el
    // dict que auto-registran los componentes SCDS del shell (⌘K) antes de que cargue el loader.
    provideTranslateService({
      fallbackLang: 'es',
      lang: 'es',
      extend: true,
      loader: provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
    }),
    provideSmartContactUi({ license: PRIMEUI_LICENSE }),
  ],
};

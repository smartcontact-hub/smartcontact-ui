import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideSmartContactUi } from '@smartcontact-hub/components';
import { provideTranslateService } from '@ngx-translate/core';

import { appRoutes } from './app.routes';

/**
 * Clave de licencia de PrimeUI (tier community). Misma que las otras apps: el `rootDir` de cada
 * tsconfig impide importarla de un fichero compartido, así que va repetida. Al renovarla hay que
 * tocar todas las copias (projects/{agent,cuscare,cuscare-ds,sc-docs,supervisor}/src/app/app.config.ts).
 */
const PRIMEUI_LICENSE =
  'eyJpZCI6IjNkNzQ1MzkxLTNjNTAtNDg3Zi04YmRhLWJiMWIyZDAxYjUzYyIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODU5MjYxNDAsImV4cCI6MTgxNzQ2MjE0MH0.y5SIXd8TH-YF8MUtO4RESlItDQeYFkxqW1-O9f1cJJzRSJGBbewZA8-35_BpvbcYBKg_awNfwVhywDF5C0PLAA';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideAnimationsAsync(),
    // Frontera del tema del DS: PrimeNG + el preset publicado (--sc-*). El orden de capas
    // (`reset, primeng`) es load-bearing: ver styles/_layers.scss.
    provideSmartContactUi({
      license: PRIMEUI_LICENSE,
      theme: {
        prefix: 'p',
        darkModeSelector: '.sc-dark',
        cssLayer: { name: 'primeng', order: 'reset, primeng' },
      },
    }),
    // Algunos componentes del DS resuelven su copy con ngx-translate; esta app va en inglés.
    provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
  ],
};

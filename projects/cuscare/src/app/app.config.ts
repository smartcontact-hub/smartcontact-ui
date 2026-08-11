import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideSmartContactUi } from '@smartcontact-hub/components';

import { appRoutes } from './app.routes';

/**
 * Config de CusCare. A diferencia del Agent (una sola pantalla) esto es multi-ruta,
 * así que lleva router — con `withHashLocation()` por dos razones que coinciden:
 *  1. la app real enruta por hash (`/aed/#/private/cuscare/tickets`), y
 *  2. en Cloudflare Pages un deep-link con hash no necesita fallback del servidor.
 *
 * PrimeNG entra por `provideSmartContactUi` porque la tabla real ES un `p-table`
 * (clases `p-datatable-*` medidas en el sitio) — replicarla con PrimeNG da el mismo
 * DOM. El LOOK, en cambio, va en CSS plano con los valores extraídos (ver DD-35).
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withHashLocation()),
    provideAnimationsAsync(),
    provideSmartContactUi({
      ripple: true,
      theme: {
        prefix: 'p',
        darkModeSelector: '.sc-dark',
        cssLayer: { name: 'primeng', order: 'reset, primeng' },
      },
    }),
  ],
};

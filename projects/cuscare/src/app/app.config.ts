import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideSmartContactUi } from '@smartcontact-hub/components';

import { appRoutes } from './app.routes';

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
      license: PRIMEUI_LICENSE,
      ripple: true,
      theme: {
        prefix: 'p',
        darkModeSelector: '.sc-dark',
        cssLayer: { name: 'primeng', order: 'reset, primeng' },
      },
    }),
  ],
};

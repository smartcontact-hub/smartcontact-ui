import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideSmartContactUi } from '@smartcontact-hub/components';

/**
 * Config mínima del Agent: es una sola pantalla con datos seed. NO necesita
 * router / http / i18n / migración (a diferencia de supervisor). Solo el tema SCDS
 * (con `darkModeSelector: '.sc-dark'`, que el ThemeService alterna) + animaciones.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
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

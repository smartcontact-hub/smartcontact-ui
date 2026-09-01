import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

/**
 * Config mínima del Agent Mini: una sola pantalla (el dialpad del Comunicador),
 * estado propio en signals ('MiniStateService'), SIN DS/PrimeNG (el Comunicador no
 * usa componentes del DS), sin router/http/i18n. Solo detección de cambios por zona.
 *
 * NO importa 'provideSmartContactUi' a propósito: mantiene el mini desacoplado del DS
 * y su build no necesita compilar el Design System.
 */
export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true })],
};

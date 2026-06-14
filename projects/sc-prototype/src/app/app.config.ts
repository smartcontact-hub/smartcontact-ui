import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

// Consumido POR NOMBRE — frontera pública real del paquete (no ruta relativa al source).
import { provideSmartContactUi } from '@smartcontact-hub/components';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideAnimationsAsync(),
    provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
    provideSmartContactUi(),
  ],
};

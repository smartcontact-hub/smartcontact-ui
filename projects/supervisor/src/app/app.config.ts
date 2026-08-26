import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  withViewTransitions,
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import {
  provideScConfirm,
  provideSmartContactUi,
} from '@smartcontact-hub/components';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

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

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withViewTransitions(),
      // Preload every lazy-loaded chunk in the background once the app
      // shell is interactive. Initial paint stays fast (only the shell
      // is on the critical path), but every subsequent navigation is
      // instant — no per-route fetch + parse delay on click.
      withPreloading(PreloadAllModules)
    ),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    // SCDS theme frontier — `provideSmartContactUi` envuelve `providePrimeNG`
    // + el preset publicado (--sc-*) de `@smartcontact-hub/components`.
    // Las opciones se pasan VERBATIM respecto al `providePrimeNG` local previo
    // (preset ScPreset): `prefix: 'p'`, `darkModeSelector: '.sc-dark'`, y el
    // orden de capas `reset, primeng` — load-bearing: el `reset` layer vive en
    // styles/_reset.scss; `primeng` va después para que `.p-button` etc. ganen
    // a `button { background: none }`. El CSS de componentes AED queda UNLAYERED
    // → sigue ganando a ambos.
    provideSmartContactUi({
      license: PRIMEUI_LICENSE,
      ripple: true,
      theme: {
        prefix: 'p',
        darkModeSelector: '.sc-dark',
        cssLayer: {
          name: 'primeng',
          order: 'reset, primeng',
        },
      },
    }),
    MessageService,
    ...provideScConfirm(),
    // ngx-translate v17: `provideTranslateService` + `provideTranslateHttpLoader`
    // (el constructor de TranslateHttpLoader ya no toma args; la config va por
    // el provider funcional). Carga `/assets/i18n/<lang>.json`, idioma `es`.
    provideTranslateService({
      fallbackLang: 'es',
      lang: 'es',
      // `extend: true` → la carga del loader (es.json) FUSIONA sobre lo ya
      // registrado en vez de reemplazar. Los componentes SCDS del shell
      // (command-palette, keyboard-shortcuts) auto-registran su dict en el
      // constructor ANTES de que el loader resuelva; sin extend, la carga los
      // borraría y sus textos saldrían como claves crudas (`sc.x.y`). Los
      // componentes en páginas lazy se montan tras la carga, así que no
      // dependían de esto — pero extend lo hace robusto para todos.
      extend: true,
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json',
      }),
    }),
  ],
};

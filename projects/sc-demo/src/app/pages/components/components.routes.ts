import { Routes } from '@angular/router';

import { SC_DEMO_COMPONENT_PAGES } from './component-pages';

/**
 * Rutas del showcase de componentes, cargadas de forma diferida (loadChildren
 * desde app.routes). Así el shell + el registro de ~60 páginas y su glue de
 * `import()` dinámico NO entran en el bundle eager (main.js): solo se pagan al
 * entrar en `/components`. Quien abre por la ruta por defecto no los descarga.
 */
export const COMPONENT_ROUTES: Routes = [
  {
    // Shell del showcase: sidebar (categorías + búsqueda) + outlet. Las páginas de
    // componentes son children → se renderizan DENTRO del shell.
    path: '',
    loadComponent: () =>
      import('./storybook-shell.component').then((m) => m.StorybookShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components-index.component').then((m) => m.ComponentsIndexComponent),
      },
      ...SC_DEMO_COMPONENT_PAGES.map((page) => ({
        path: page.path,
        loadComponent: page.load as never,
      })),
    ],
  },
];

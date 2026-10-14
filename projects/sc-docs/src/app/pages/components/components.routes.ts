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
      {
        // Todo PrimeNG por familias: para qué sirve cada componente, cuándo elegirlo frente a su vecino y si lo
        // usamos. Vive bajo Componentes a propósito (la barra se queda en cinco secciones, `smoke.spec.ts`): es el
        // cajón de lo que el DS no envuelve. Pinta un artefacto que escribe `audit:primeng-catalog`.
        path: 'primeng',
        loadComponent: () =>
          import('../primeng/catalogo-primeng.component').then((m) => m.CatalogoPrimengComponent),
      },
      ...SC_DEMO_COMPONENT_PAGES.map((page) => ({
        path: page.path,
        loadComponent: page.load as never,
      })),
    ],
  },
];

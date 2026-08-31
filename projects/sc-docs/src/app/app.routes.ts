import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    // Sección «Fundamentos»: shell con pestañas + las tres páginas de materia prima.
    // Agrupadas a propósito — antes eran tres destinos planos de un top-nav de siete.
    path: 'fundamentos',
    loadComponent: () =>
      import('./pages/fundamentos/fundamentos-shell.component').then(
        (m) => m.FundamentosShellComponent,
      ),
    children: [
      {
        path: 'escala-color',
        loadComponent: () =>
          import('./pages/foundations/foundations.component').then((m) => m.FoundationsComponent),
      },
      {
        path: 'tipografia',
        loadComponent: () =>
          import('./pages/foundations-type/foundations-type.component').then(
            (m) => m.FoundationsTypeComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'escala-color' },
    ],
  },
  {
    // Showcase de componentes: shell (sidebar + outlet) + ~60 páginas, TODO lazy
    // vía loadChildren, así el registro y su glue de import() no entran en main.js.
    path: 'components',
    loadChildren: () =>
      import('./pages/components/components.routes').then((m) => m.COMPONENT_ROUTES),
  },
  {
    path: 'uso',
    loadComponent: () =>
      import('./pages/uso/usage-gallery.component').then((m) => m.UsageGalleryComponent),
  },
  {
    path: 'reglas',
    loadComponent: () =>
      import('./pages/reglas/rules-walkthrough.component').then(
        (m) => m.RulesWalkthroughComponent,
      ),
  },
  {
    path: 'lab',
    loadComponent: () => import('./pages/lab/lab.component').then((m) => m.LabComponent),
  },

  {
    // Smoke test del preset (primitivos PrimeNG estilados solo por tokens). Fue pestaña de
    // Fundamentos; ahora es verificación, enlazada desde Lab. Sigue accesible por URL.
    path: 'tema',
    loadComponent: () => import('./pages/theme/theme.component').then((m) => m.ThemeComponent),
  },

  // Compatibilidad: las rutas planas de antes de agrupar Fundamentos. Se quedan para que
  // no muera ningún enlace ya repartido (docs, marcadores, previews por rama).
  { path: 'foundations', pathMatch: 'full', redirectTo: 'fundamentos/escala-color' },
  { path: 'foundations-type', pathMatch: 'full', redirectTo: 'fundamentos/tipografia' },
  { path: 'theme', pathMatch: 'full', redirectTo: 'tema' },
  { path: 'fundamentos/tema', pathMatch: 'full', redirectTo: 'tema' },

  // Componentes es el protagonista de la doc: es la portada.
  { path: '', pathMatch: 'full', redirectTo: 'components' },
];

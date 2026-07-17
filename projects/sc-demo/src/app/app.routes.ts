import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'foundations',
    loadComponent: () =>
      import('./pages/foundations/foundations.component').then((m) => m.FoundationsComponent),
  },
  {
    path: 'foundations-type',
    loadComponent: () =>
      import('./pages/foundations-type/foundations-type.component').then(
        (m) => m.FoundationsTypeComponent,
      ),
  },
  {
    path: 'theme',
    loadComponent: () => import('./pages/theme/theme.component').then((m) => m.ThemeComponent),
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
  { path: '', pathMatch: 'full', redirectTo: 'foundations' },
];

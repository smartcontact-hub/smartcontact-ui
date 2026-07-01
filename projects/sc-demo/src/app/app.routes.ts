import { Routes } from '@angular/router';

import { SC_DEMO_COMPONENT_PAGES } from './pages/components/component-pages';

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
    // Shell del showcase: sidebar (categorías + búsqueda) + outlet. Las páginas de
    // componentes (migradas o no) son children → se renderizan DENTRO del shell.
    path: 'components',
    loadComponent: () =>
      import('./pages/components/storybook-shell.component').then(
        (m) => m.StorybookShellComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/components/components-index.component').then(
            (m) => m.ComponentsIndexComponent,
          ),
      },
      ...SC_DEMO_COMPONENT_PAGES.map((page) => ({
        path: page.path,
        loadComponent: page.load as never,
      })),
    ],
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
  { path: '', pathMatch: 'full', redirectTo: 'foundations' },
];

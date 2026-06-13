import { Routes } from '@angular/router';

import { SC_DEMO_COMPONENT_PAGES } from './pages/components/component-pages';

export const routes: Routes = [
  {
    path: 'foundations',
    loadComponent: () =>
      import('./pages/foundations/foundations.component').then((m) => m.FoundationsComponent),
  },
  {
    path: 'theme',
    loadComponent: () => import('./pages/theme/theme.component').then((m) => m.ThemeComponent),
  },
  {
    path: 'components',
    loadComponent: () =>
      import('./pages/components/components-index.component').then(
        (m) => m.ComponentsIndexComponent,
      ),
  },
  ...SC_DEMO_COMPONENT_PAGES.map((page) => ({
    path: `components/${page.path}`,
    loadComponent: page.load as never,
  })),
  { path: '', pathMatch: 'full', redirectTo: 'foundations' },
];

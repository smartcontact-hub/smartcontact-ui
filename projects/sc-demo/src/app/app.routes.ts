import { Routes } from '@angular/router';

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
  { path: '', pathMatch: 'full', redirectTo: 'foundations' },
];

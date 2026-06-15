import { Routes } from '@angular/router';

export const TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/templates-page.component').then((m) => m.TemplatesPageComponent),
  },
];

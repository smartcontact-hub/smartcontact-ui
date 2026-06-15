import { Routes } from '@angular/router';

export const LABELS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/labels-page.component').then((m) => m.LabelsPageComponent),
  },
];

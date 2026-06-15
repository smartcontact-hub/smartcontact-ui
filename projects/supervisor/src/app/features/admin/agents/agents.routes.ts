import { Routes } from '@angular/router';

import { formDirtyGuard } from '@core/guards';

/** Agents feature routes — list + create + edit. */
export const AGENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/agents-list-page.component').then((m) => m.AgentsListPageComponent),
  },
  {
    path: 'crear',
    data: { breadcrumb: { labelKey: 'agents.form.create_breadcrumb' } },
    loadComponent: () =>
      import('./pages/agent-form-page.component').then((m) => m.AgentFormPageComponent),
    canDeactivate: [formDirtyGuard],
  },
  {
    path: 'editar/:id',
    data: { breadcrumb: { labelKey: 'agents.form.edit_breadcrumb' } },
    loadComponent: () =>
      import('./pages/agent-form-page.component').then((m) => m.AgentFormPageComponent),
    canDeactivate: [formDirtyGuard],
  },
];

import { Routes } from '@angular/router';

// Pantallas reales del prototipo (dogfood). Cada una construida solo con sc-* +
// tokens, consumiendo @smartcontact-hub/* por nombre.
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./agents/agent-list.component').then((m) => m.AgentListComponent),
  },
];

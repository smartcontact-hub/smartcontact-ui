import { Routes } from '@angular/router';

import { formDirtyGuard } from '@core/guards';

/**
 * Memory feature routes — montadas bajo `/conversaciones` desde
 * supervision.routes.ts. Migración progresiva desde el prototipo React
 * `arebury/Memory/legacy-react/`. Ver `docs/memory-migration-inventory.md`.
 *
 * Decisión S38 (fusión hubs): NO existe pantalla landing `/repositorio`
 * separada de Memory — las cards IA Memory (Reglas / Categorías /
 * Entidades) viven en el HUB AED Repositorios global. Aquí Memory expone
 * sus vistas hijas accesibles vía las cards del HUB AED.
 *
 * Mapeo actual:
 *   ''           → ConversationsPage (vista principal)
 *   'reglas'     → RulesPage (iter 9a — listado; 9b/c/d siguientes)
 *   'entidades'  → EntitiesPage (iter 10)
 *   'categorias' → CategoriesPage (iter 11)
 */
export const memoryRoutes: Routes = [
  {
    path: '',
    // Breadcrumb (experiment S59 "todo arriba"): al quitar la banda de
    // page-header, la identidad de cada vista Memory la lleva el TopBar.
    // Crumb único por página, como las listas AED ("Usuarios", "Grupos"…).
    data: { breadcrumb: { labelKey: 'memory.conversations.page_title' } },
    loadComponent: () =>
      import('./pages/conversations/conversations-page.component').then(
        (m) => m.ConversationsPageComponent,
      ),
  },
  {
    path: 'reglas',
    data: { breadcrumb: { labelKey: 'memory.rules.page_title' } },
    loadComponent: () =>
      import('./pages/rules/rules-page.component').then((m) => m.RulesPageComponent),
  },
  {
    path: 'reglas/nueva',
    canDeactivate: [formDirtyGuard],
    loadComponent: () =>
      import('./pages/rule-builder/rule-builder-page.component').then(
        (m) => m.RuleBuilderPageComponent,
      ),
  },
  {
    path: 'reglas/:id',
    canDeactivate: [formDirtyGuard],
    loadComponent: () =>
      import('./pages/rule-builder/rule-builder-page.component').then(
        (m) => m.RuleBuilderPageComponent,
      ),
  },
  {
    path: 'entidades',
    data: { breadcrumb: { labelKey: 'memory.entities.page_title' } },
    loadComponent: () =>
      import('./pages/entities/entities-page.component').then((m) => m.EntitiesPageComponent),
  },
  {
    path: 'categorias',
    data: { breadcrumb: { labelKey: 'memory.categories.page_title' } },
    loadComponent: () =>
      import('./pages/categories/categories-page.component').then((m) => m.CategoriesPageComponent),
  },
];

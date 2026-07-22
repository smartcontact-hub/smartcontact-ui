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
/*
 * El trail tiene SIEMPRE al menos un padre desde que el título de página
 * volvió al cuerpo (`.page__heading`). Con un solo tramo la barra y el título
 * decían la misma palabra a 95px de distancia —"Reglas" encima de "Reglas"—,
 * que es exactamente el tartamudeo que S59 quiso quitar. Con el padre delante,
 * cada uno hace su trabajo: la barra dice DÓNDE estás, el título QUÉ miras.
 * Es lo que hace la referencia (Snow UI: "Dashboards / Order List" arriba,
 * "Order List" en el cuerpo).
 */
export const memoryRoutes: Routes = [
  {
    path: '',
    data: {
      breadcrumb: [
        // "Supervisión" es una SECCIÓN del menú, no una ruta: sin `link`.
        { labelKey: 'sidebar.supervision', link: false },
        { labelKey: 'memory.conversations.page_title' },
      ],
    },
    loadComponent: () =>
      import('./pages/conversations/conversations-page.component').then(
        (m) => m.ConversationsPageComponent,
      ),
  },
  {
    path: 'reglas',
    data: {
      breadcrumb: [
        { labelKey: 'memory.conversations.page_title', link: '/conversaciones' },
        { labelKey: 'memory.rules.page_title' },
      ],
    },
    loadComponent: () =>
      import('./pages/rules/rules-page.component').then((m) => m.RulesPageComponent),
  },
  /*
   * El constructor cuelga de `reglas` conceptualmente, pero es su HERMANO en
   * el árbol de rutas (`reglas/nueva`, no `reglas/:id` bajo `reglas`). Por eso
   * declara el trail completo en forma de array con `link` explícito al padre:
   * la URL acumulada aquí es la del propio constructor, no la del listado.
   * Mismo patrón que `labels`/`plantillas` en `admin.routes.ts`.
   *
   * El label de la hoja es estático por ruta —crear y editar son rutas
   * distintas—, así que no hace falta `BreadcrumbService.set()`: se reusan las
   * claves que ya tenía el título (traducidas en los 4 locales), igual que
   * hacen los tres formularios hermanos de admin.
   */
  {
    path: 'reglas/nueva',
    data: {
      breadcrumb: [
        { labelKey: 'memory.rules.page_title', link: '/conversaciones/reglas' },
        { labelKey: 'memory.rules.builder.title_new' },
      ],
    },
    canDeactivate: [formDirtyGuard],
    loadComponent: () =>
      import('./pages/rule-builder/rule-builder-page.component').then(
        (m) => m.RuleBuilderPageComponent,
      ),
  },
  {
    path: 'reglas/:id',
    data: {
      breadcrumb: [
        { labelKey: 'memory.rules.page_title', link: '/conversaciones/reglas' },
        { labelKey: 'memory.rules.builder.title_edit' },
      ],
    },
    canDeactivate: [formDirtyGuard],
    loadComponent: () =>
      import('./pages/rule-builder/rule-builder-page.component').then(
        (m) => m.RuleBuilderPageComponent,
      ),
  },
  {
    path: 'entidades',
    data: {
      breadcrumb: [
        { labelKey: 'memory.conversations.page_title', link: '/conversaciones' },
        { labelKey: 'memory.entities.page_title' },
      ],
    },
    loadComponent: () =>
      import('./pages/entities/entities-page.component').then((m) => m.EntitiesPageComponent),
  },
  {
    path: 'categorias',
    data: {
      breadcrumb: [
        { labelKey: 'memory.conversations.page_title', link: '/conversaciones' },
        { labelKey: 'memory.categories.page_title' },
      ],
    },
    loadComponent: () =>
      import('./pages/categories/categories-page.component').then((m) => m.CategoriesPageComponent),
  },
];

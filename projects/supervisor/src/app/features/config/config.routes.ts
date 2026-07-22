import { Routes } from '@angular/router';

import { formDirtyGuard } from '@core/guards';

const placeholder = () =>
  import('@core/layout/placeholder-page/placeholder-page.component').then(
    (m) => m.PlaceholderPageComponent,
  );

/**
 * Config feature routes.
 *
 * `/config/aed/*` lives inside SettingsShell — three placeholder
 * sub-pages today (Servicio / Agentes / Grupos) backed by the Figma
 * 224:9167 family. The hub redirects to `/aed/servicio` so the rail
 * always has a selected item on first visit.
 *
 * Other config children render as plain pages (no inner shell, like
 * before): Seguridad (placeholder), Personalización / Integraciones
 * (still unbuilt), and Sistema (now also home to "Numeración
 * especial" — see DD#45).
 */
export const configRoutes: Routes = [
  {
    path: 'aed',
    // El hub aporta el crumb raíz "Contact Center" (Figma 1:12270); cada hoja
    // añade su sección → "Contact Center › General". Antes el medio era la propia
    // sección (enlazaba a sí misma = circular). `link: false`: /config/aed solo
    // redirige a servicio (la navegación entre secciones la da el rail).
    data: { breadcrumb: { labelKey: 'config.aed.title', link: false } },
    loadComponent: () =>
      import('./layout/settings-shell.component').then((m) => m.SettingsShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'servicio' },
      {
        path: 'servicio',
        data: {
          breadcrumb: [{ labelKey: 'config.aed.subpages.servicio.heading' }],
        },
        loadComponent: () =>
          import('./aed/aed-servicio-page.component').then((m) => m.AedServicioPageComponent),
        canDeactivate: [formDirtyGuard],
      },
      {
        path: 'agentes',
        data: {
          breadcrumb: [{ labelKey: 'config.aed.subpages.agentes.heading' }],
        },
        loadComponent: () =>
          import('./aed/aed-agentes-page.component').then((m) => m.AedAgentesPageComponent),
        canDeactivate: [formDirtyGuard],
      },
      {
        path: 'grupos',
        data: {
          breadcrumb: [{ labelKey: 'config.aed.subpages.grupos.heading' }],
        },
        loadComponent: () =>
          import('./aed/aed-grupos-page.component').then((m) => m.AedGruposPageComponent),
        canDeactivate: [formDirtyGuard],
      },
    ],
  },
  /*
   * "Configuración" abre el trail igual que "AED" abre el de sus tres
   * subpáginas: sin él, la barra repetía la palabra que el título del cuerpo
   * (`.page__heading`) ya dice. No es una ruta navegable → `link: false`.
   */
  {
    path: 'seguridad',
    data: {
      breadcrumb: [
        { labelKey: 'sidebar.configuration', link: false },
        { labelKey: 'config.seguridad.title' },
      ],
    },
    loadComponent: () =>
      import('./pages/seguridad-page.component').then((m) => m.SeguridadPageComponent),
  },
  { path: 'personalizacion', loadComponent: placeholder },
  { path: 'integraciones', loadComponent: placeholder },
  {
    path: 'sistema',
    data: {
      breadcrumb: [
        { labelKey: 'sidebar.configuration', link: false },
        { labelKey: 'config.sistema.title' },
      ],
    },
    loadComponent: () =>
      import('./pages/sistema-page.component').then((m) => m.SistemaPageComponent),
  },
];

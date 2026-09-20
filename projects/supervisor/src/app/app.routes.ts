import { Routes } from '@angular/router';

/** Marca del navegador: con ella la app se enmarca en el laboratorio del Sidebar en vez del shell. */
export const LAB_SIDEBAR_KEY = 'sc-lab-sidebar';
/** Página en la que se dejó el laboratorio: al volver a entrar se abre ahí. */
export const LAB_SIDEBAR_RETURN_KEY = 'sc-lab-sidebar-return';
/** Dominio del preview por rama de este experimento (`docs/colaboracion.md`): quien entra por
 * aquí ya está pidiendo el laboratorio, así que no hace falta pasar antes por `/lab/sidebar` ni
 * recordar un enlace especial para compartirlo. */
const LAB_SIDEBAR_PREVIEW_HOST = 'lab-sidebar.sc-supervisor.pages.dev';

function isLabSidebarEnabled(): boolean {
  const explicit = localStorage.getItem(LAB_SIDEBAR_KEY);
  /* '0' es un apagado a propósito (Salir del laboratorio): gana al dominio, si no nadie podría
   * salir del laboratorio estando en su propio preview. */
  if (explicit === '0') return false;
  return explicit === '1' || location.hostname === LAB_SIDEBAR_PREVIEW_HOST;
}

/**
 * Top-level route table.
 *
 * Layout shell (sidebar + topbar + outlet) lives at `''` and wraps every
 * feature route. Feature route tables are lazy-loaded.
 */
export const appRoutes: Routes = [
  /* Fuera del shell: el acceso no lleva sidebar ni barra. Sin guardia, a propósito
   * (ver `AuthService`): la app sigue abriéndose sin entrar. */
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page.component').then((m) => m.LoginPageComponent),
  },
  /* Laboratorio local: entrar aquí cambia el MARCO de la app al Sidebar de primeng.dev (se guarda en
   * el navegador) y abre la página en la que se salió de él (`?to=/ruta` elige otra; la primera vez,
   * Contact Center). Las pantallas siguen en sus rutas de siempre, así que sus enlaces y su «activo»
   * funcionan igual que en el shell. Se sale desde las opciones del laboratorio. */
  {
    path: 'lab/sidebar',
    canActivate: [
      () => {
        localStorage.setItem(LAB_SIDEBAR_KEY, '1');
        const to = new URLSearchParams(location.search).get('to');
        const target = to?.startsWith('/') ? to : localStorage.getItem(LAB_SIDEBAR_RETURN_KEY);
        location.assign(target?.startsWith('/') && !target.startsWith('/lab/') ? target : '/config/aed');
        return false;
      },
    ],
    children: [],
  },
  {
    path: '',
    loadComponent: () =>
      isLabSidebarEnabled()
        ? import('./features/lab/sidebar-lab-page.component').then((m) => m.SidebarLabPageComponent)
        : import('./core/layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./core/layout/placeholder-page/placeholder-page.component').then(
            (m) => m.PlaceholderPageComponent,
          ),
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
      },
      {
        path: 'config',
        loadChildren: () => import('./features/config/config.routes').then((m) => m.configRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/supervision/supervision.routes').then((m) => m.supervisionRoutes),
      },
      {
        path: '**',
        loadComponent: () =>
          import('./core/layout/placeholder-page/placeholder-page.component').then(
            (m) => m.PlaceholderPageComponent,
          ),
      },
    ],
  },
];

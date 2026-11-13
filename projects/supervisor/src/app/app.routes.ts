import { Routes } from '@angular/router';
import { rutaInterna } from '@shared/utils/ruta-interna.core.mjs';
import { entrarEnLab } from './features/lab/horarios/lab-modo';

/**
 * Marca de la PESTAÑA: con ella la app se enmarca en el laboratorio del Sidebar en vez del shell.
 *
 * Vive en `sessionStorage` desde el 2026-09-23, y antes vivía en `localStorage`. El motivo salió
 * en cuanto el Lab de sc-docs empezó a enlazar el laboratorio: tras entrar una vez, a
 * partir de ahí **la app entera** se abría enmarcada en el laboratorio —en producción, días
 * después y tras cerrar el navegador—, sin nada en pantalla que lo dijera. Un laboratorio puede
 * cambiar el marco mientras lo estás usando; lo que no puede es quedarse. Con `sessionStorage`
 * dura lo que dura la pestaña: cerrarla siempre te saca, y el enlace que le pases a alguien no
 * le cambia su Supervisor para siempre.
 */
export const LAB_SIDEBAR_KEY = 'sc-lab-sidebar';
/** Página en la que se dejó el laboratorio: al volver a entrar se abre ahí. Esta SÍ sobrevive a
 *  la pestaña a propósito — es una comodidad, no un modo, y sola no enmarca nada. */
export const LAB_SIDEBAR_RETURN_KEY = 'sc-lab-sidebar-return';
/** Dominio del preview por rama de este experimento (`docs/colaboracion.md`): quien entra por
 * aquí ya está pidiendo el laboratorio, así que no hace falta pasar antes por `/lab/sidebar` ni
 * recordar un enlace especial para compartirlo. */
const LAB_SIDEBAR_PREVIEW_HOST = 'lab-sidebar.sc-supervisor.pages.dev';

function isLabSidebarEnabled(): boolean {
  /* Quien ya estaba dentro sale solo al desplegarse esto: la marca vieja se borra y nunca se
   * vuelve a leer. Sin esta línea, el que la tuviera puesta seguiría con ella en su navegador
   * para siempre, ya sin ningún código que la mire. */
  localStorage.removeItem(LAB_SIDEBAR_KEY);

  const explicit = sessionStorage.getItem(LAB_SIDEBAR_KEY);
  /* '0' es un apagado a propósito (Volver al shell): gana al dominio, si no nadie podría salir
   * del laboratorio estando en su propio preview. */
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
        sessionStorage.setItem(LAB_SIDEBAR_KEY, '1');
        // Solo rutas de ESTA app: `//dominio-ajeno` empieza por `/` y el navegador lo resuelve como otro dominio.
        const to = new URLSearchParams(location.search).get('to');
        const target =
          rutaInterna(to, location.origin) ?? rutaInterna(localStorage.getItem(LAB_SIDEBAR_RETURN_KEY), location.origin);
        location.assign(target && !target.startsWith('/lab/') ? target : '/config/aed');
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
        path: 'lab/tabla',
        loadComponent: () =>
          import('./features/lab/table-lab-page.component').then((m) => m.TableLabPageComponent),
      },
      /* Laboratorio «Tiempo» (horarios y festivos), versión premium: listado y editores rehechos con su propio aspecto. Lee
       * y escribe los mismos almacenes que /admin/horarios y /admin/festivos. */
      {
        path: 'lab/tiempo',
        canActivate: [entrarEnLab],
        data: { breadcrumb: [{ labelKey: 'sidebar.administration', link: false as const }, { labelKey: 'sidebar.repositories', link: '/admin/repositorios' }, { labelKey: 'Tiempo', link: '/lab/tiempo' }] },
        loadChildren: () => import('./features/lab/tiempo/tp-rutas').then((m) => m.tiempoRoutes),
      },
      /* El laboratorio anterior de Horarios lleva aquí a su equivalente de «Tiempo»: un solo rediseño a la vista. */
      {
        path: 'lab/horarios',
        children: [
          { path: '', pathMatch: 'full', redirectTo: '/lab/tiempo' },
          { path: 'crear', redirectTo: '/lab/tiempo/horario/nuevo' },
          { path: 'editar/:id', redirectTo: '/lab/tiempo/horario/:id' },
          { path: 'festivos', pathMatch: 'full', redirectTo: '/lab/tiempo?lista=festivos' },
          { path: 'festivos/crear', redirectTo: '/lab/tiempo/festivos/nueva' },
          { path: 'festivos/editar/:id', redirectTo: '/lab/tiempo/festivos/:id' },
        ],
      },
      {
        path: 'lab/arbol',
        loadComponent: () =>
          import('./features/lab/treetable-lab-page.component').then(
            (m) => m.TreetableLabPageComponent,
          ),
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

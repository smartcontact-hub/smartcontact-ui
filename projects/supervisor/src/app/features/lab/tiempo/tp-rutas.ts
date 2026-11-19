import type { CanDeactivateFn, Routes } from '@angular/router';

/** Las pantallas que pueden tener cambios sin guardar: deciden ellas si se sale (y lo preguntan con su modal). */
interface ConSalida {
  puedeSalir(): boolean | Promise<boolean>;
}

export const tpSalirGuard: CanDeactivateFn<ConSalida> = (c) => c.puedeSalir();

/**
 * CIERRE DE HORARIOS (sale de la versión premium de «Tiempo»): la lista de horarios, en la tabla de Repositorios, y su
 * editor. Lee y escribe el mismo almacén que /admin/horarios. El editor responde en las dos formas de ruta: la de la
 * lista del DS (`crear`, `editar/:id`) y la corta de la premium (`nuevo`, `:id`), para que sus enlaces sigan valiendo.
 * Las listas de festivos de la premium siguen aquí, sin cambios: pasan al calendario, que queda fuera de este cierre.
 */
const editor = () => import('./tp-horario.page').then((m) => m.TpHorarioPage);

export const tiempoRoutes: Routes = [
  { path: '', loadComponent: () => import('./tp-lista.page').then((m) => m.TpListaPage) },
  { path: 'horario/crear', canDeactivate: [tpSalirGuard], loadComponent: editor },
  { path: 'horario/nuevo', canDeactivate: [tpSalirGuard], loadComponent: editor },
  { path: 'horario/editar/:id', canDeactivate: [tpSalirGuard], loadComponent: editor },
  { path: 'horario/:id', canDeactivate: [tpSalirGuard], loadComponent: editor },
  { path: 'festivos', pathMatch: 'full', redirectTo: '/admin/festivos' },
  { path: 'festivos/nueva', canDeactivate: [tpSalirGuard], loadComponent: () => import('./tp-festivos.page').then((m) => m.TpFestivosPage) },
  { path: 'festivos/:id', canDeactivate: [tpSalirGuard], loadComponent: () => import('./tp-festivos.page').then((m) => m.TpFestivosPage) },
];

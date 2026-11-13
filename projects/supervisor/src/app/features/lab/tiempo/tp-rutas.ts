import type { CanDeactivateFn, Routes } from '@angular/router';

/** Las pantallas que pueden tener cambios sin guardar: deciden ellas si se sale (y lo preguntan con su modal). */
interface ConSalida {
  puedeSalir(): boolean | Promise<boolean>;
}

export const tpSalirGuard: CanDeactivateFn<ConSalida> = (c) => c.puedeSalir();

/**
 * LABORATORIO «Tiempo» premium: el listado (horarios y listas de festivos) y sus dos editores. Lee y escribe los mismos
 * almacenes que /admin/horarios y /admin/festivos, así que lo que se cree aquí se ve allí.
 */
export const tiempoRoutes: Routes = [
  { path: '', loadComponent: () => import('./tp-tiempo.page').then((m) => m.TpTiempoPage) },
  { path: 'horario/nuevo', canDeactivate: [tpSalirGuard], loadComponent: () => import('./tp-horario.page').then((m) => m.TpHorarioPage) },
  { path: 'horario/:id', canDeactivate: [tpSalirGuard], loadComponent: () => import('./tp-horario.page').then((m) => m.TpHorarioPage) },
  { path: 'festivos', pathMatch: 'full', redirectTo: '/lab/tiempo?lista=festivos' },
  { path: 'festivos/nueva', canDeactivate: [tpSalirGuard], loadComponent: () => import('./tp-festivos.page').then((m) => m.TpFestivosPage) },
  { path: 'festivos/:id', canDeactivate: [tpSalirGuard], loadComponent: () => import('./tp-festivos.page').then((m) => m.TpFestivosPage) },
];

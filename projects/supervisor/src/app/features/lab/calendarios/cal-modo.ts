import { type CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/**
 * PROTOTIPO DE DISCOVERY: el «modo discovery» de Horarios. Entrar una vez en /admin/calendarios (o empezar una prueba)
 * lo enciende para este navegador; desde entonces Repositorios enseña Calendarios y Horarios del prototipo y la ruta de
 * siempre (/admin/horarios) salta a la suya, así se navega por la app sin caer en la pantalla de hoy. Sin entrar, nada
 * cambia: la app y sus pruebas siguen igual. Se apaga borrando la clave del navegador.
 */
const CLAVE = 'sc-cal-discovery';

export function discoveryActivo(): boolean {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
}

export function activarDiscovery(): void {
  try {
    localStorage.setItem(CLAVE, '1');
  } catch {
    /* Sin almacenamiento, el modo dura lo que dura la pestaña en el prototipo. */
  }
}

/** En las rutas del prototipo: entrar enciende el modo. */
export const entrarEnDiscovery: CanActivateFn = () => {
  activarDiscovery();
  return true;
};

/** En las rutas de Horarios de hoy: con el modo encendido, a la lista de horarios del prototipo. */
export const aDiscovery: CanActivateFn = () => (discoveryActivo() ? inject(Router).parseUrl('/admin/semanas') : true);

import type { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * LABORATORIO: el «modo rediseño» de Horarios. Entrar una vez en /lab/horarios lo enciende para este navegador; desde
 * entonces Repositorios lleva a «Tiempo» y las rutas de siempre (/admin/horarios, /admin/festivos) saltan a su versión
 * del laboratorio, así se navega por la app sin caer en la pantalla original. «Volver a la versión original» lo apaga.
 * Sin entrar en el laboratorio, nada cambia: la app y sus pruebas siguen igual.
 */
const CLAVE = 'sc-lab-horarios';

export function labHorariosActivo(): boolean {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
}

export function activarLabHorarios(si: boolean): void {
  try {
    if (si) localStorage.setItem(CLAVE, '1');
    else localStorage.removeItem(CLAVE);
  } catch {
    /* Sin almacenamiento, el modo dura lo que dura la pestaña en el laboratorio. */
  }
}

/** En la ruta del laboratorio: entrar enciende el modo. */
export const entrarEnLab: CanActivateFn = () => {
  activarLabHorarios(true);
  return true;
};

/** En las rutas de siempre: con el modo encendido, a su equivalente del laboratorio. */
export function aLab(destino: (r: ActivatedRouteSnapshot) => string): CanActivateFn {
  return (r) => (labHorariosActivo() ? inject(Router).parseUrl(destino(r)) : true);
}

import type { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * LABORATORIO: el «modo rediseño» de Horarios. Entrar una vez en /lab/tiempo (o /lab/horarios) lo enciende para este navegador; desde
 * entonces Repositorios lleva a «Tiempo» y las rutas de siempre (/admin/horarios, /admin/festivos) saltan a su versión
 * del laboratorio, así se navega por la app sin caer en la pantalla original. «Volver a la versión original» lo apaga.
 * Sin entrar en el laboratorio, nada cambia: la app y sus pruebas siguen igual. En el preview de la rama premium nace
 * encendido (quien entra por ese dominio viene a ver el rediseño); «Ver la versión original» lo apaga también allí.
 */
const CLAVE = 'sc-lab-horarios';
const PREVIEW = 'claude-lab-horarios-premium.sc-supervisor.pages.dev';

export function labHorariosActivo(): boolean {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === '1' || (v !== '0' && location.hostname === PREVIEW);
  } catch {
    return false;
  }
}

export function activarLabHorarios(si: boolean): void {
  try {
    localStorage.setItem(CLAVE, si ? '1' : '0');
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

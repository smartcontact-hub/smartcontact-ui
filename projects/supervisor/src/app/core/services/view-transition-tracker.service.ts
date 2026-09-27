import { Injectable } from '@angular/core';
import type { ActivatedRouteSnapshot } from '@angular/router';

/**
 * Remembers the router's current view transition so a component can wait for
 * its cross-fade to end. While it runs, the browser covers the page with a
 * snapshot and nothing is under the pointer: `:hover` drops without the mouse
 * moving. The sidebar uses this to stay open after a click (SISMAC-4340).
 */
@Injectable({ providedIn: 'root' })
export class ViewTransitionTracker {
  private current: Promise<void> = Promise.resolve();

  track(transition: ViewTransition): void {
    this.current = transition.finished.then(
      () => undefined,
      () => undefined,
    );
  }

  /** Resolves when the latest transition has finished, or at once if there is none. */
  settled(): Promise<void> {
    return this.current;
  }
}

/**
 * ¿La navegación se queda en la MISMA página y solo cambia la query? Es lo que pasa al cambiar de
 * sección en una ficha o en el constructor de reglas (`?seccion=`, DD-122): cada sección es un enlace,
 * y sin esto el router fundía la página entera en cada clic del índice, porque `withViewTransitions`
 * abre una transición en toda navegación, también en las que solo cambian la query. Se compara ruta a
 * ruta, de la raíz a la hoja: la misma configuración y los mismos parámetros en cada nivel.
 *
 * Cambiar de ruta sí funde, como siempre: Contact Center (cada sección es su ruta hija), abrir una
 * ficha o pasar del alta a la edición.
 */
export function onlyQueryChanged(from: ActivatedRouteSnapshot, to: ActivatedRouteSnapshot): boolean {
  let a: ActivatedRouteSnapshot | null = from;
  let b: ActivatedRouteSnapshot | null = to;
  while (a && b) {
    if (a.routeConfig !== b.routeConfig || !sameParams(a.params, b.params)) return false;
    a = a.firstChild;
    b = b.firstChild;
  }
  return a === null && b === null;
}

function sameParams(a: Readonly<Record<string, unknown>>, b: Readonly<Record<string, unknown>>): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k]);
}

import { LocationStrategy } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';

/**
 * UN SOLO ÍNDICE, Y QUE FUNCIONE DE UNA SOLA FORMA (DD-122). Cada fila de `sc-form-section-nav` es un
 * enlace a su sitio: una ruta (Contact Center) o la misma página con `?seccion=` (fichas y
 * constructor de reglas). Este servicio hace los dos lados de ese enlace con el MISMO árbol de URL:
 *
 *   · `href(tree)` — lo que se pinta en la fila, escrito como lo escribe `routerLink` (base y
 *     estrategia de la app incluidas), para que Cmd+clic y el clic central abran esa sección en otra
 *     pestaña;
 *   · `go(tree)` — lo que hace el clic principal, cuando la página lo deja pasar (el alta de grupo no
 *     sale de General sin nombre ni canales).
 *
 * El DS no conoce el router a propósito: la página decide antes de navegar, y el componente sirve
 * igual en sc-docs, que enruta con `#`.
 */
@Injectable({ providedIn: 'root' })
export class SectionLinksService {
  private readonly router = inject(Router);
  private readonly locationStrategy = inject(LocationStrategy);

  /**
   * La misma página en otra sección: `?seccion=slug`, conservando el resto de la dirección (`type` y
   * `categoria` en el constructor). `null` quita el parámetro: la sección de aterrizaje de la página.
   */
  section(route: ActivatedRoute, slug: string | null): UrlTree {
    return this.router.createUrlTree([], {
      relativeTo: route,
      queryParams: { seccion: slug },
      queryParamsHandling: 'merge',
    });
  }

  /** La dirección de un árbol tal como va en el `href` de un enlace. */
  href(tree: UrlTree): string {
    return this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(tree));
  }

  /**
   * Navega al árbol. `replace` en los ALTAS: la sección no deja rastro en el historial, así que Atrás
   * sale del alta (y, tras crear, no vuelve a un alta vacía). Al editar cada sección es una entrada, y
   * Atrás vuelve a la anterior.
   */
  go(tree: UrlTree, { replace = false }: { replace?: boolean } = {}): Promise<boolean> {
    return this.router.navigateByUrl(tree, { replaceUrl: replace });
  }
}

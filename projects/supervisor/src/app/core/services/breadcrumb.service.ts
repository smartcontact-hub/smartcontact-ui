import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

export interface BreadcrumbItem {
  /** Label rendered as-is. Pass an i18n-translated string. */
  readonly label: string;
  /** Optional router link. The last crumb is rendered link-less. */
  readonly path?: string;
}

/**
 * Per-route breadcrumb declaration. Set on a route via `data.breadcrumb`.
 *
 * - `labelKey` — i18n key resolved by ngx-translate.
 * - `link`     — explicit override.
 *                  - `string`  → use this URL.
 *                  - `false`   → never linkable, even if not the last crumb.
 *                  - `undefined` (default) → use the URL accumulated up to
 *                    this route segment.
 *
 * A route may declare a single crumb or an array — the array form is for
 * routes that conceptually belong to a parent that doesn't appear in the
 * URL tree (e.g. `/admin/labels` is a "Repositorios" child on the breadcrumb
 * trail even though it doesn't sit under `/admin/repositorios/` in the URL).
 */
export interface BreadcrumbCrumb {
  readonly labelKey: string;
  readonly link?: string | false;
}
export type BreadcrumbDecl = BreadcrumbCrumb | readonly BreadcrumbCrumb[];

interface RouteData {
  readonly breadcrumb?: BreadcrumbDecl;
}

/**
 * Builds the breadcrumb trail from the activated route tree. Each route
 * declares its own crumb(s) via `data.breadcrumb`; the service walks the
 * tree on every `NavigationEnd`, accumulates the URL, and translates the
 * declared labels. The last crumb is always rendered link-less even if
 * a `link` was set on it.
 *
 * `set()` / `clear()` remain as escape hatches for pages that need to
 * inject runtime context the route table can't know about. Calling `set()`
 * overrides the auto-derived trail until the next navigation.
 *
 * `nombrar()` pone el nombre de lo que se edita en el último tramo («Administración › Grupos › Ventas», SISMAC-4058):
 * vale mientras la ruta a la vista sea la de la ficha que lo pone, también al cambiar de sección (`?seccion=`), que es
 * otra navegación y borraría un `set()`.
 */
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** Manual override pushed by a page; cleared on every navigation. */
  private readonly manualTrail = signal<readonly BreadcrumbItem[] | null>(null);

  /** Re-derived on every NavigationEnd (and on language change). */
  private readonly autoTrail = signal<readonly BreadcrumbItem[]>([]);

  /** La ruta de la página a la vista (la hoja del árbol), para saber si el nombre puesto es suyo. */
  private readonly hoja = signal<ActivatedRoute | null>(null);
  /** El nombre de lo que se edita, con la ruta de la ficha que lo puso (`nombrar`). */
  private readonly nombrado = signal<{ readonly ruta: ActivatedRoute; readonly nombre: string } | null>(null);

  readonly trail = computed<readonly BreadcrumbItem[]>(() => {
    const manual = this.manualTrail();
    if (manual) return manual;
    const auto = this.autoTrail();
    const nombrado = this.nombrado();
    if (!nombrado || nombrado.ruta !== this.hoja() || auto.length === 0) return auto;
    return [...auto.slice(0, -1), { label: nombrado.nombre }];
  });

  constructor() {
    this.autoTrail.set(this.computeTrail());
    this.hoja.set(this.leafRoute());

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.manualTrail.set(null);
        this.autoTrail.set(this.computeTrail());
        this.hoja.set(this.leafRoute());
      });

    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.autoTrail.set(this.computeTrail());
    });
  }

  /** Override the auto-derived trail until the next navigation. */
  set(trail: readonly BreadcrumbItem[]): void {
    this.manualTrail.set(trail);
  }

  /** Drop the manual override; the auto-derived trail takes over. */
  clear(): void {
    this.manualTrail.set(null);
  }

  /**
   * El último tramo dice `nombre` mientras `ruta` (la de la ficha) sea la página a la vista. Con `null`, lo quita, solo
   * si lo había puesto esa misma ruta: una ficha que se destruye no borra el de la siguiente.
   */
  nombrar(ruta: ActivatedRoute, nombre: string | null): void {
    if (nombre) this.nombrado.set({ ruta, nombre });
    else if (this.nombrado()?.ruta === ruta) this.nombrado.set(null);
  }

  private leafRoute(): ActivatedRoute {
    let route = this.router.routerState.root;
    while (route.firstChild) route = route.firstChild;
    return route;
  }

  private computeTrail(): readonly BreadcrumbItem[] {
    const items: { labelKey: string; link?: string | false; resolvedUrl: string }[] = [];
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    let url = '';

    while (route) {
      url = appendSegments(url, route);

      /*
       * Read from `routeConfig.data` instead of `route.data` so we see
       * only declarations the route ITSELF makes. Angular's default
       * `paramsInheritanceStrategy: 'emptyOnly'` merges parent `data`
       * into empty-path children — without this guard, the parent's
       * breadcrumb appears twice (once on the parent, once inherited
       * by the empty-path leaf), e.g. `Admin > Grupos > Grupos`.
       */
      const decl = (route.routeConfig?.data as RouteData | undefined)?.breadcrumb;
      if (decl) {
        const crumbs = Array.isArray(decl) ? decl : [decl as BreadcrumbCrumb];
        for (const c of crumbs) {
          items.push({ labelKey: c.labelKey, link: c.link, resolvedUrl: url });
        }
      }
      route = route.firstChild;
    }

    return items.map((entry, index) => {
      const isLast = index === items.length - 1;
      const label = this.translate.instant(entry.labelKey);
      if (isLast || entry.link === false) {
        return { label };
      }
      return { label, path: entry.link ?? (entry.resolvedUrl || '/') };
    });
  }
}

function appendSegments(base: string, route: ActivatedRouteSnapshot): string {
  const segments = route.url.map((s) => s.path).filter(Boolean);
  if (segments.length === 0) return base;
  const joined = segments.join('/');
  return base.endsWith('/') ? `${base}${joined}` : `${base}/${joined}`;
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { filter, map, startWith } from 'rxjs/operators';

import { ViewTransitionTracker } from '../../services/view-transition-tracker.service';
import { NAV_SECTIONS, type NavItem } from './nav-data';
import { normalizeRoutePath } from './path-utils';
import { SidebarNavItemComponent } from './sidebar-nav-item.component';
import { SidebarVariantService } from './sidebar-variant.service';

/** The `labelKey` of every parent on the way to `path`, outermost first; empty if none. */
function branchTo(items: readonly NavItem[], path: string): string[] {
  for (const item of items) {
    if (item.path === path) return [];
    if (item.children) {
      const below = branchTo(item.children, path);
      if (below.length > 0 || item.children.some((child) => child.path === path)) {
        return [item.labelKey, ...below];
      }
    }
  }
  return [];
}

/** The `labelKey` of the item whose `path` is `path`; null if no row points there. */
function keyOf(items: readonly NavItem[], path: string): string | null {
  for (const item of items) {
    if (item.path === path) return item.labelKey;
    if (item.children) {
      const found = keyOf(item.children, path);
      if (found) return found;
    }
  }
  return null;
}

/** The `labelKey` of every ancestor of the item with `key`, outermost first; null if it is not in the tree. */
function ancestorsOf(items: readonly NavItem[], key: string, trail: readonly string[] = []): string[] | null {
  for (const item of items) {
    if (item.labelKey === key) return [...trail];
    if (item.children) {
      const found = ancestorsOf(item.children, key, [...trail, item.labelKey]);
      if (found) return found;
    }
  }
  return null;
}

/** Categorías abiertas por el usuario, recordadas en este navegador (solo en la rama de comparación). */
const OPEN_KEY = 'sc-comparar-sidebar-abiertas';

function readOpen(valid: ReadonlySet<string>): readonly string[] | null {
  try {
    const raw = localStorage.getItem(OPEN_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string' && valid.has(k)) : null;
  } catch {
    return null;
  }
}

function writeOpen(keys: readonly string[]): void {
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify(keys));
  } catch {
    /* Sin almacenamiento (ventana privada): lo abierto dura lo que la pestaña. */
  }
}

/** Los `labelKey` de todos los padres del árbol. */
function parentKeys(items: readonly NavItem[]): string[] {
  return items.flatMap((item) => (item.children?.length ? [item.labelKey, ...parentKeys(item.children)] : []));
}

/**
 * Application sidebar — logo header and two-section nav tree. Reads the
 * active URL from the Router and feeds it to the recursive
 * `<sc-sidebar-nav-item>` children so they highlight properly.
 */
@Component({
  selector: 'sc-sidebar',
  imports: [RouterLink, ScIconComponent, SidebarNavItemComponent, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly transitions = inject(ViewTransitionTracker);

  /** RAMA DE COMPARACIÓN: propuesta, modo de plegado y anclado (ver el servicio). */
  protected readonly compare = inject(SidebarVariantService);

  protected readonly sections = NAV_SECTIONS;
  private readonly allItems = NAV_SECTIONS.flatMap((section) => section.items);

  /** Active URL (after stripping /crear, /editar/:id and folding repo subpaths). */
  private readonly routePath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => normalizeRoutePath(event.urlAfterRedirects)),
      startWith(normalizeRoutePath(this.router.url)),
    ),
    { initialValue: normalizeRoutePath(this.router.url) },
  );

  /** En el escaparate la fila marcada la lleva el propio sidebar, sin salir de la página. */
  protected readonly currentPath = computed(() =>
    this.compare.showcase() ? this.compare.showcasePath() : this.routePath(),
  );

  /** Plegado en modo Slim, sin anclar: raíl con el primer nivel y los hijos en un panel flotante. */
  protected readonly slimRail = computed(
    () => this.compare.collapsedMode() === 'slim' && !this.compare.fixed(),
  );

  /**
   * Las categorías abiertas (Rafa, 2026-09-16). NADA las cambia salvo el clic en su propio padre: ni abrir
   * otra, ni sacar el ratón (el sidebar se pliega a 80 y sus hijos siguen a la vista como iconos), ni
   * navegar, ni recargar (se guardan en el navegador). Solo sin nada guardado, la primera vez, arranca con
   * la rama de la página actual abierta. Lo que no cabe se recorre con el scroll del sidebar.
   */
  protected readonly openKeys = signal<readonly string[]>([]);
  private readonly validKeys = new Set(parentKeys(NAV_SECTIONS.flatMap((section) => section.items)));
  private seeded = false;

  /** Slim: la rama del panel flotante, aparte de lo abierto en Drawer, que no se toca al cambiar de modo. */
  private readonly flyoutKeys = signal<readonly string[]>([]);

  /** Holds the sidebar open while a navigation it started cross-fades (Drawer only). */
  protected readonly pinned = signal(false);

  /** Lo que se pinta abierto: en Slim, la rama del panel; si no, lo que haya abierto el usuario. */
  protected readonly shownOpenKeys = computed<readonly string[]>(() =>
    this.slimRail() ? this.flyoutKeys() : this.openKeys(),
  );

  /**
   * The one parent that wears the accent: the nearest ancestor of the current
   * page that is on screen. With every ancestor open that is the direct parent;
   * otherwise it is the outermost closed one. Lighting every ancestor left
   * several cyan icons and no single place to look.
   */
  protected readonly accentKey = computed(() => {
    const branch = branchTo(this.allItems, this.currentPath());
    const open = this.shownOpenKeys();
    return branch.find((key) => !open.includes(key)) ?? branch.at(-1) ?? null;
  });

  /** Drawer: desplegado en cuanto entra el ratón y hasta 300ms después de salir (Apollo). */
  protected readonly hovered = signal(false);
  private static readonly COLLAPSE_AFTER_LEAVE_MS = 300;
  private leaveTimer: ReturnType<typeof setTimeout> | undefined;
  private revealTimer: ReturnType<typeof setTimeout> | undefined;

  /** Slim: el padre del panel flotante y la altura a la que sale, la de su icono. */
  protected readonly flyoutItem = computed(() => {
    if (!this.slimRail()) return null;
    const key = this.flyoutKeys()[0];
    return this.allItems.find((item) => item.labelKey === key && !!item.children?.length) ?? null;
  });
  protected readonly flyoutTop = signal(0);

  constructor() {
    /* Arranque: lo guardado; si no hay nada, la rama de la página actual (en cuanto se conoce). Después,
     * navegar no abre ni cierra nada: si la fila de la página está a la vista, el sidebar baja hasta ella. */
    effect(() => {
      const path = this.currentPath();
      untracked(() => {
        if (!this.seeded) {
          const stored = readOpen(this.validKeys);
          const branch = branchTo(this.allItems, path);
          if (stored) this.openKeys.set(stored);
          else if (branch.length > 0) this.openKeys.set(branch);
          else if (!this.router.navigated && !this.compare.showcase()) return;
          this.seeded = true;
          return;
        }
        this.revealCurrent();
      });
    });

    /* Slim: navegar o cambiar de modo cierra el panel flotante. */
    effect(() => {
      this.currentPath();
      this.slimRail();
      untracked(() => this.flyoutKeys.set([]));
    });

    /**
     * After every navigation, blur whatever element inside the sidebar
     * still has focus — otherwise the `:focus-within` rule keeps the
     * sidebar in its expanded state forever after a click. The keyboard
     * `Tab` flow still works (focus is only blurred AFTER navigation
     * completes, never during user-driven traversal).
     */
    effect(() => {
      this.currentPath();
      const active = document.activeElement;
      if (active instanceof HTMLElement && this.host.nativeElement.contains(active)) {
        active.blur();
      }
    });

    /* Slim: un clic fuera del sidebar o Escape cierran el panel flotante (Apollo). */
    const doc = this.host.nativeElement.ownerDocument;
    const onDocumentClick = (event: MouseEvent): void => {
      if (this.flyoutItem() && !this.host.nativeElement.contains(event.target as Node)) this.flyoutKeys.set([]);
    };
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && this.flyoutItem()) this.flyoutKeys.set([]);
    };
    doc.addEventListener('click', onDocumentClick);
    doc.addEventListener('keydown', onKeydown);
    inject(DestroyRef).onDestroy(() => {
      doc.removeEventListener('click', onDocumentClick);
      doc.removeEventListener('keydown', onKeydown);
      clearTimeout(this.leaveTimer);
      clearTimeout(this.revealTimer);
    });
  }

  protected readonly trackBySectionTitle = (_: number, section: { titleKey: string }): string =>
    section.titleKey;

  protected readonly trackByItemKey = (_: number, item: { labelKey: string }): string =>
    item.labelKey;

  protected onEnter(): void {
    if (this.compare.collapsedMode() !== 'drawer') return;
    clearTimeout(this.leaveTimer);
    this.hovered.set(true);
  }

  protected onLeave(): void {
    if (this.compare.collapsedMode() !== 'drawer') return;
    clearTimeout(this.leaveTimer);
    this.leaveTimer = setTimeout(() => this.hovered.set(false), SidebarComponent.COLLAPSE_AFTER_LEAVE_MS);
  }

  protected onToggle(key: string): void {
    if (!this.slimRail()) {
      const open = this.openKeys();
      const next = open.includes(key) ? open.filter((k) => k !== key) : [...open, key];
      this.openKeys.set(next);
      this.seeded = true;
      writeOpen(next);
      return;
    }
    /* Slim: una sola rama, la del panel flotante. */
    const open = this.flyoutKeys().includes(key);
    const ancestors = ancestorsOf(this.allItems, key) ?? [];
    this.flyoutKeys.set(open ? ancestors : [...ancestors, key]);
    if (!open && ancestors.length === 0) this.placeFlyout(key);
  }

  /**
   * Deja a la vista la fila de la página actual, solo si está en una categoría abierta (una fila dentro de
   * una cerrada no se ve: ahí manda el acento cyan de su padre). Espera a que se asiente el sidebar
   * (`--sc-sidebar-submenu-duration`) y solo desplaza si la fila queda fuera, con una fila de aire y sin
   * animación si el sistema pide menos movimiento.
   */
  private revealCurrent(): void {
    clearTimeout(this.revealTimer);
    if (this.slimRail()) return;
    const key = keyOf(this.allItems, this.currentPath());
    const nav = this.host.nativeElement.querySelector<HTMLElement>('.sidebar__nav');
    if (!key || !nav) return;
    const open = this.openKeys();
    if (!(ancestorsOf(this.allItems, key) ?? []).every((k) => open.includes(k))) return;
    const wait = parseFloat(getComputedStyle(nav).getPropertyValue('--sc-sidebar-submenu-duration')) || 0;
    this.revealTimer = setTimeout(() => {
      const row = nav.querySelector<HTMLElement>(`[data-nav-key="${key}"]`);
      if (!row) return;
      const box = nav.getBoundingClientRect();
      const rect = row.getBoundingClientRect();
      const air = rect.height;
      let delta = 0;
      if (rect.top < box.top) delta = rect.top - box.top - air;
      else if (rect.bottom > box.bottom) delta = rect.bottom - box.bottom + air;
      if (delta === 0) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      nav.scrollBy({ top: delta, behavior: reduce ? 'auto' : 'smooth' });
    }, wait);
  }

  /** Slim: con un panel abierto, pasar el ratón por otro padre de primer nivel lo cambia (Apollo). */
  protected onRootHover(key: string): void {
    if (!this.flyoutItem() || this.flyoutKeys()[0] === key) return;
    this.flyoutKeys.set([key]);
    this.placeFlyout(key);
  }

  private placeFlyout(key: string): void {
    const row = this.host.nativeElement.querySelector<HTMLElement>(`[data-nav-key="${key}"]`);
    if (!row) return;
    this.flyoutTop.set(Math.round(row.getBoundingClientRect().top));
    /* Si no cabe por abajo, sube hasta que cabe. */
    requestAnimationFrame(() => {
      const panel = this.host.nativeElement.querySelector<HTMLElement>('.sidebar-flyout');
      if (!panel) return;
      const margin = 16;
      const max = window.innerHeight - panel.offsetHeight - margin;
      if (this.flyoutTop() > max) this.flyoutTop.set(Math.max(margin, max));
    });
  }

  protected async onNavigate(path: string): Promise<void> {
    if (this.compare.showcase()) {
      this.compare.showcasePath.set(path);
      if (this.slimRail()) this.flyoutKeys.set([]);
      return;
    }
    const drawer = this.compare.collapsedMode() === 'drawer';
    if (drawer) this.pinned.set(true);
    try {
      await this.router.navigateByUrl(path);
      if (drawer) await this.transitions.settled();
    } finally {
      this.pinned.set(false);
    }
  }
}

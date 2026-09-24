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

/** Anclado se recuerda en el navegador; sin almacenamiento (ventana privada) dura lo que la pestaña. */
const ANCHORED_KEY = 'sc-sidebar-anclado';

function readAnchored(): boolean {
  try {
    return localStorage.getItem(ANCHORED_KEY) === '1';
  } catch {
    return false;
  }
}

function storeAnchored(anchored: boolean): void {
  try {
    localStorage.setItem(ANCHORED_KEY, anchored ? '1' : '0');
  } catch {
    /* Sin almacenamiento: la elección dura lo que la pestaña. */
  }
}

/**
 * Application sidebar — logo header and two-section nav tree. Reads the
 * active URL from the Router and feeds it to the recursive
 * `<sc-sidebar-nav-item>` so each row can decide its own active state.
 *
 * Es el de `archive/comparar-sidebar-sin-cerrar-al-abrir-2026-09-16` (SISMAC-4340), el que se
 * eligió para producción el 2026-09-23: selección en cyan, plegado a 80 que se despliega con el
 * ratón (Drawer de Apollo) y se puede anclar desplegado.
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

  protected readonly sections = NAV_SECTIONS;
  private readonly allItems = NAV_SECTIONS.flatMap((section) => section.items);

  /** Active URL (after stripping /crear, /editar/:id and folding repo subpaths). */
  protected readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => normalizeRoutePath(event.urlAfterRedirects)),
      startWith(normalizeRoutePath(this.router.url)),
    ),
    { initialValue: normalizeRoutePath(this.router.url) },
  );

  /**
   * Las categorías abiertas. Desplegado, cada padre se abre y se cierra con su clic y abrir uno no
   * cierra los demás; entrar en una página abre su rama sin tocar el resto, y lo que no cabe se
   * recorre con el scroll del sidebar.
   */
  protected readonly openKeys = signal<readonly string[]>([]);

  /** Anclado: desplegado a 240 y la página le deja su hueco. */
  protected readonly anchored = signal(readAnchored());

  /** Holds the sidebar open while a navigation it started cross-fades. */
  protected readonly pinned = signal(false);

  /** Foco de teclado dentro del sidebar: lo despliega igual que el ratón (`:focus-within`). */
  protected readonly focusWithin = signal(false);

  /** Desplegado en cuanto entra el ratón y hasta 300ms después de salir (Drawer de Apollo). */
  protected readonly hovered = signal(false);
  private static readonly COLLAPSE_AFTER_LEAVE_MS = 300;
  private leaveTimer: ReturnType<typeof setTimeout> | undefined;
  private revealTimer: ReturnType<typeof setTimeout> | undefined;

  /** Desplegado a 240: con el ratón encima, anclado, sujeto durante una navegación o con el foco dentro. */
  private readonly expanded = computed(
    () => this.hovered() || this.pinned() || this.anchored() || this.focusWithin(),
  );

  /**
   * Lo que se pinta abierto. Plegado a 80 no hay sitio para acumular: solo la rama de la página
   * actual (lo que de ella siga abierto). Desplegado, todas las que haya abierto.
   */
  protected readonly shownOpenKeys = computed<readonly string[]>(() => {
    const open = this.openKeys();
    if (this.expanded()) return open;
    const shown: string[] = [];
    for (const key of branchTo(this.allItems, this.currentPath())) {
      if (!open.includes(key)) break;
      shown.push(key);
    }
    return shown;
  });

  /**
   * The one parent that wears the accent: the nearest ancestor of the current
   * page that is on screen. With every ancestor open that is the direct parent;
   * with a closed ancestor it is the outermost closed one, the row the user
   * can actually see.
   */
  protected readonly accentKey = computed(() => {
    const branch = branchTo(this.allItems, this.currentPath());
    const open = this.shownOpenKeys();
    return branch.find((key) => !open.includes(key)) ?? branch.at(-1) ?? null;
  });

  constructor() {
    /* Entrar en una página abre su rama SIN cerrar las demás, y el sidebar baja hasta ella si no se ve. */
    effect(() => {
      const branch = branchTo(this.allItems, this.currentPath());
      untracked(() => {
        const open = this.openKeys();
        this.openKeys.set([...open, ...branch.filter((key) => !open.includes(key))]);
        this.revealCurrent();
      });
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

    /* Anclado, el hueco de la página es el ancho desplegado: el sidebar deja de tapar el contenido. */
    effect(() => {
      const anchored = this.anchored();
      storeAnchored(anchored);
      const root = document.documentElement.style;
      if (anchored) root.setProperty('--sc-sidebar-width', 'var(--sc-sidebar-width-expanded)');
      else root.removeProperty('--sc-sidebar-width');
    });

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.leaveTimer);
      clearTimeout(this.revealTimer);
    });
  }

  protected readonly trackBySectionTitle = (_: number, section: { titleKey: string }): string =>
    section.titleKey;

  protected readonly trackByItemKey = (_: number, item: { labelKey: string }): string =>
    item.labelKey;

  protected onEnter(): void {
    clearTimeout(this.leaveTimer);
    this.hovered.set(true);
  }

  protected onLeave(): void {
    clearTimeout(this.leaveTimer);
    this.leaveTimer = setTimeout(() => this.hovered.set(false), SidebarComponent.COLLAPSE_AFTER_LEAVE_MS);
  }

  protected onToggle(key: string): void {
    const open = this.openKeys();
    this.openKeys.set(open.includes(key) ? open.filter((k) => k !== key) : [...open, key]);
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.nativeElement.contains(next)) this.focusWithin.set(false);
  }

  /**
   * Deja a la vista la fila de la página actual. Espera a que terminen de abrirse las categorías (su
   * duración es `--sc-sidebar-submenu-duration`) y solo desplaza si la fila queda fuera, con una fila de
   * aire y sin animación si el sistema pide menos movimiento.
   */
  private revealCurrent(): void {
    clearTimeout(this.revealTimer);
    const key = keyOf(this.allItems, this.currentPath());
    const nav = this.host.nativeElement.querySelector<HTMLElement>('.sidebar__nav');
    if (!key || !nav) return;
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

  protected async onNavigate(path: string): Promise<void> {
    this.pinned.set(true);
    try {
      await this.router.navigateByUrl(path);
      await this.transitions.settled();
    } finally {
      this.pinned.set(false);
    }
  }
}

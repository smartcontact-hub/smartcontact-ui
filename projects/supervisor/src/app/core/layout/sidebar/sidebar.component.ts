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
   * El camino abierto, como Apollo: un `labelKey` por nivel desde la raíz, así que solo hay una rama
   * abierta. Abrir un padre cierra cualquier otra; cerrarlo deja abiertos sus ancestros; entrar en
   * una página abre la suya. En Slim, su primer elemento es el padre del panel flotante.
   */
  protected readonly openKeys = signal<readonly string[]>([]);

  /**
   * The one parent that wears the accent: the nearest ancestor of the current
   * page that is on screen. With every ancestor open that is the direct parent;
   * otherwise it is the outermost closed one. Lighting every ancestor left
   * several cyan icons and no single place to look.
   */
  protected readonly accentKey = computed(() => {
    const branch = branchTo(this.allItems, this.currentPath());
    const open = this.openKeys();
    return branch.find((key) => !open.includes(key)) ?? branch.at(-1) ?? null;
  });

  /** Drawer: desplegado en cuanto entra el ratón y hasta 300ms después de salir (Apollo). */
  protected readonly hovered = signal(false);
  private static readonly COLLAPSE_AFTER_LEAVE_MS = 300;
  private leaveTimer: ReturnType<typeof setTimeout> | undefined;

  /** Slim: el padre del panel flotante y la altura a la que sale, la de su icono. */
  protected readonly flyoutItem = computed(() => {
    if (!this.slimRail()) return null;
    const key = this.openKeys()[0];
    return this.allItems.find((item) => item.labelKey === key && !!item.children?.length) ?? null;
  });
  protected readonly flyoutTop = signal(0);

  constructor() {
    /* Entrar en una página abre su rama (Apollo). En Slim no: el panel se cierra. */
    effect(() => {
      const branch = branchTo(this.allItems, this.currentPath());
      const slim = this.slimRail();
      untracked(() => this.openKeys.set(slim ? [] : branch));
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
      if (this.flyoutItem() && !this.host.nativeElement.contains(event.target as Node)) this.openKeys.set([]);
    };
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && this.flyoutItem()) this.openKeys.set([]);
    };
    doc.addEventListener('click', onDocumentClick);
    doc.addEventListener('keydown', onKeydown);
    inject(DestroyRef).onDestroy(() => {
      doc.removeEventListener('click', onDocumentClick);
      doc.removeEventListener('keydown', onKeydown);
      clearTimeout(this.leaveTimer);
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
    const ancestors = ancestorsOf(this.allItems, key) ?? [];
    const open = this.openKeys().includes(key);
    this.openKeys.set(open ? ancestors : [...ancestors, key]);
    if (!open && ancestors.length === 0 && this.slimRail()) this.placeFlyout(key);
  }

  /** Slim: con un panel abierto, pasar el ratón por otro padre de primer nivel lo cambia (Apollo). */
  protected onRootHover(key: string): void {
    if (!this.flyoutItem() || this.openKeys()[0] === key) return;
    this.openKeys.set([key]);
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

  /** Holds the sidebar open while a navigation it started cross-fades (Drawer only). */
  protected readonly pinned = signal(false);

  protected async onNavigate(path: string): Promise<void> {
    if (this.compare.showcase()) {
      this.compare.showcasePath.set(path);
      if (this.slimRail()) this.openKeys.set([]);
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

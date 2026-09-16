import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
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

/**
 * Application sidebar — logo header and two-section nav tree. Reads the
 * active URL from the Router and feeds it to the recursive
 * `<sc-sidebar-nav-item>` children so they highlight properly.
 */
@Component({
  selector: 'sc-sidebar',
  imports: [RouterLink, SidebarNavItemComponent, TranslateModule],
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
   * `labelKey` of every open parent. While the pointer is in the menu only the
   * user closes a category; entering a page opens its branch; leaving the menu
   * folds the rest (SISMAC-4340). Two other closings were tried first: an
   * accordion moved the clicked row hundreds of pixels under the pointer, and
   * closing on navigation shut categories the user had just opened.
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

  constructor() {
    /* Entering a page opens its branch; whatever else was open stays open. */
    effect(() => {
      const branch = branchTo(this.allItems, this.currentPath());
      untracked(() =>
        this.openKeys.update((open) => [...open, ...branch.filter((key) => !open.includes(key))]),
      );
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
  }

  protected readonly trackBySectionTitle = (_: number, section: { titleKey: string }): string =>
    section.titleKey;

  protected readonly trackByItemKey = (_: number, item: { labelKey: string }): string =>
    item.labelKey;

  /**
   * Leaving the menu folds every category but the current page's. It waits
   * until the sidebar has collapsed (hover-out delay plus the width
   * transition), so the rows reshuffle out of sight and brushing the edge
   * does not lose what the user had just opened.
   */
  private static readonly RESET_AFTER_LEAVE_MS = 400;
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  protected cancelReset(): void {
    clearTimeout(this.resetTimer);
  }

  protected scheduleReset(): void {
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      const aside = this.host.nativeElement.querySelector('aside');
      if (this.pinned() || aside?.matches(':hover, :focus-within')) return;
      this.openKeys.set(branchTo(this.allItems, this.currentPath()));
    }, SidebarComponent.RESET_AFTER_LEAVE_MS);
  }

  protected onToggle(key: string): void {
    const open = this.openKeys();
    this.openKeys.set(open.includes(key) ? open.filter((k) => k !== key) : [...open, key]);
  }

  /** Holds the sidebar open while a navigation it started cross-fades. */
  protected readonly pinned = signal(false);

  protected async onNavigate(path: string): Promise<void> {
    this.pinned.set(true);
    try {
      await this.router.navigateByUrl(path);
      await this.transitions.settled();
    } finally {
      this.pinned.set(false);
      /* The pointer may have left while the page cross-faded. */
      this.scheduleReset();
    }
  }

  protected readonly hasItems = computed(() => this.sections.length > 0);
}

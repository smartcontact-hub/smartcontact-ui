import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs/operators';

import { NAV_ICONS } from '../../icons/nav-icons';
import { NAV_SECTIONS } from './nav-data';
import { normalizeRoutePath } from './path-utils';
import { SidebarNavItemComponent } from './sidebar-nav-item.component';

/**
 * Application sidebar — logo header, two-section nav tree, design-decisions
 * shortcut at the foot. Reads the active URL from the Router and feeds it to
 * the recursive `<sc-sidebar-nav-item>` children so they highlight properly.
 */
@Component({
  selector: 'sc-sidebar',
  imports: [IconComponent, RouterLink, SidebarNavItemComponent, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly sections = NAV_SECTIONS;
  protected readonly externalIcon = NAV_ICONS['arrow-up-right'];

  /**
   * Where the "Decisiones de diseño" footer button points to. Open in a
   * new tab so the prototype stays in place. Opens the markdown file
   * directly on GitHub — Markdown rendering is fine and every commit
   * keeps the file fresh, no in-app panel to maintain. Prototype-only:
   * production replaces this with whatever real audit / decision-log
   * surface gets adopted.
   */
  protected readonly decisionsHref = 'https://github.com/arebury/aed/blob/main/DECISIONS.md';

  /** Active URL (after stripping /crear, /editar/:id and folding repo subpaths). */
  protected readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => normalizeRoutePath(event.urlAfterRedirects)),
      startWith(normalizeRoutePath(this.router.url)),
    ),
    { initialValue: normalizeRoutePath(this.router.url) },
  );

  constructor() {
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

  protected onNavigate(path: string): void {
    void this.router.navigateByUrl(path);
  }

  protected onOpenDesignDecisions(event: MouseEvent): void {
    /*
     * Blur the trigger so the sidebar's `:focus-within` rule doesn't
     * pin the panel expanded after the click — same reason as the
     * `RouterLink` blur effect above, but the open-in-new-tab here
     * doesn't trigger a `NavigationEnd`, so we have to blur manually.
     * The `<a target="_blank">` does the actual opening; this method
     * only handles focus housekeeping.
     */
    (event.currentTarget as HTMLElement).blur();
  }

  protected readonly hasItems = computed(() => this.sections.length > 0);
}

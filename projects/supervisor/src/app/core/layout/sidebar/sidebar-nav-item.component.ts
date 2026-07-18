import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  OnInit,
  output,
  signal,
  untracked,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { NAV_ICONS } from '../../icons/nav-icons';
import type { NavItem } from './nav-data';

/**
 * One row of the sidebar tree. Renders itself, then recursively renders any
 * children when expanded. Indentation, font size and active highlight all key
 * off the `depth` prop so a single component supports the prototype's 4+ level
 * nesting (DD#302).
 *
 * `currentPath` is a signal input — non-signal `@Input()` would break the
 * `isActive` / `isChildActive` computeds, since plain inputs don't trigger
 * computed re-evaluation when the parent route changes.
 */
@Component({
  selector: 'sc-sidebar-nav-item',
  imports: [IconComponent, TranslateModule],
  templateUrl: './sidebar-nav-item.component.html',
  styleUrl: './sidebar-nav-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarNavItemComponent implements OnInit {
  readonly item = input.required<NavItem>();
  readonly depth = input<number>(0);
  readonly currentPath = input.required<string>();

  readonly navigate = output<string>();

  protected readonly expanded = signal(false);

  ngOnInit(): void {
    if (this.item().defaultExpanded) {
      this.expanded.set(true);
    }
  }

  constructor() {
    /*
     * Auto-collapse on navigation away. When the active route leaves this
     * branch, drop any manual `expanded` state so only the active section
     * stays open. `effectivelyExpanded` already keeps the active branch
     * open via `isChildActive`, so this only affects sections the user
     * peek-opened and then navigated away from.
     */
    effect(() => {
      this.currentPath();
      const childActive = this.isChildActive();
      untracked(() => {
        if (!childActive && this.expanded()) {
          this.expanded.set(false);
        }
      });
    });
  }

  protected readonly hasChildren = computed(() => {
    const children = this.item().children;
    return !!children && children.length > 0;
  });

  protected readonly isActive = computed(
    () => !!this.item().path && this.item().path === this.currentPath(),
  );

  protected readonly isChildActive = computed(() => {
    const children = this.item().children;
    if (!children) return false;
    return this.containsActive(children, this.currentPath());
  });

  /**
   * `expanded` (manual user toggle) OR the active branch flag — when the
   * current route lives somewhere inside this section, render its children
   * automatically so the collapsed sidebar shows the active page's icon
   * without the user having to click the parent first.
   */
  protected readonly effectivelyExpanded = computed(() => this.expanded() || this.isChildActive());

  protected resolveIcon(name: keyof typeof NAV_ICONS) {
    return NAV_ICONS[name];
  }

  protected onClick(event: MouseEvent): void {
    if (this.hasChildren()) {
      this.expanded.update((v) => !v);
      /*
       * Parent click toggles expanded but doesn't navigate, so the
       * post-`NavigationEnd` blur effect on the sidebar host never
       * fires — without an explicit blur the focus stays on the
       * button and the sidebar's `:focus-within` rule keeps the
       * whole panel expanded after the cursor leaves.
       *
       * Only blur on a mouse activation (`event.detail > 0`).
       * Keyboard activations (Enter / Space) come through with
       * `detail === 0` and we keep the focus so the user can
       * `Tab` straight into the children we just revealed.
       */
      if (event.detail > 0) {
        (event.currentTarget as HTMLElement).blur();
      }
      return;
    }
    const path = this.item().path;
    if (path) {
      this.navigate.emit(path);
    }
  }

  private containsActive(items: readonly NavItem[], current: string): boolean {
    return items.some((child) => {
      if (child.path === current) return true;
      if (child.children) return this.containsActive(child.children, current);
      return false;
    });
  }
}

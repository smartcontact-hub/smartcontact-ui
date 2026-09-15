import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { NAV_ICONS } from '../../icons/nav-icons';
import type { NavItem } from './nav-data';

/**
 * One row of the sidebar tree. Renders itself, then recursively renders any
 * children when expanded. Indentation, font size and active highlight all key
 * off the `depth` prop so a single component supports the prototype's 4+ level
 * nesting (DD#302).
 *
 * Which parents are open is NOT local state: the sidebar owns `openKeys` (only
 * the user closes a category; entering a page opens its branch) and
 * `accentKey`, the single parent that marks where the current page lives
 * (SISMAC-4340).
 *
 * `currentPath` is a signal input — non-signal `@Input()` would break the
 * `isActive` computed, since plain inputs don't trigger
 * computed re-evaluation when the parent route changes.
 */
@Component({
  selector: 'sc-sidebar-nav-item',
  imports: [IconComponent, TranslateModule],
  templateUrl: './sidebar-nav-item.component.html',
  styleUrl: './sidebar-nav-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    /* The sidebar paints the open first-level category as a block when collapsed. */
    '[class.nav-group--open]': 'depth() === 0 && hasChildren() && effectivelyExpanded()',
  },
})
export class SidebarNavItemComponent {
  readonly item = input.required<NavItem>();
  readonly depth = input<number>(0);
  readonly currentPath = input.required<string>();
  readonly openKeys = input.required<readonly string[]>();
  /** `labelKey` of the single parent that marks where the current page lives. */
  readonly accentKey = input.required<string | null>();

  readonly navigate = output<string>();
  /** A parent asked to open or close; emits its `labelKey`. */
  readonly toggle = output<string>();

  protected readonly hasChildren = computed(() => {
    const children = this.item().children;
    return !!children && children.length > 0;
  });

  protected readonly isActive = computed(
    () => !!this.item().path && this.item().path === this.currentPath(),
  );

  protected readonly effectivelyExpanded = computed(
    () => this.hasChildren() && this.openKeys().includes(this.item().labelKey),
  );

  protected resolveIcon(name: keyof typeof NAV_ICONS) {
    return NAV_ICONS[name];
  }

  protected onClick(event: MouseEvent): void {
    if (this.hasChildren()) {
      this.toggle.emit(this.item().labelKey);
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
}

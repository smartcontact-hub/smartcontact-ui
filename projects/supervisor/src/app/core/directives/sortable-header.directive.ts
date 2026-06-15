import { computed, Directive, input, output } from '@angular/core';

export type SortDirection = 'asc' | 'desc' | null;

/**
 * Makes a sortable table header keyboard-accessible (WCAG AA compliant)
 * and adds the `aria-sort` attribute screen readers expect.
 *
 * Usage:
 *
 *     <th
 *       class="table__th-sort"
 *       [scSortable]="currentSortDir('name')"
 *       (activate)="toggleSort('name')"
 *     >
 *       {{ 'agents.table.name' | translate }}
 *     </th>
 *
 * The directive sets `role="button"`, `tabindex="0"`, `scope="col"`,
 * and binds Enter / Space keyboard activation to the same handler the
 * `(activate)` output exposes for clicks. Pass the column's current
 * sort direction (`'asc' | 'desc' | null`) so `aria-sort` updates as
 * the user re-sorts.
 */
@Directive({
  selector: '[scSortable]',
  standalone: true,
  host: {
    role: 'button',
    tabindex: '0',
    scope: 'col',
    '[attr.aria-sort]': 'ariaSort()',
    '(click)': 'activate.emit()',
    '(keydown.enter)': 'onKey($event)',
    '(keydown.space)': 'onKey($event)',
  },
})
export class SortableHeaderDirective {
  readonly scSortable = input.required<SortDirection>();
  readonly activate = output<void>();

  protected readonly ariaSort = computed(() => {
    const dir = this.scSortable();
    if (dir === 'asc') return 'ascending';
    if (dir === 'desc') return 'descending';
    return 'none';
  });

  protected onKey(event: Event): void {
    /* Angular 21 types host-binding `$event` as the generic `Event`
     * (not the previously inferred `KeyboardEvent`), so accept the
     * parent type and rely on `preventDefault()` being available on
     * every Event. The handler is only wired to keydown.enter /
     * keydown.space, so it's still always a KeyboardEvent at runtime. */
    event.preventDefault();
    this.activate.emit();
  }
}

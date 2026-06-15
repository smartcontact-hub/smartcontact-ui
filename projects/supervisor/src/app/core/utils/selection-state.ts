import { computed, signal } from '@angular/core';

/**
 * Reusable id-based selection state for list pages.
 *
 * Encapsulates the "which rows are selected, can I select all, did I
 * just toggle one" pattern that every admin list page (agents, groups,
 * users, labels, repositories) duplicates. Each page passes a
 * `visibleList` thunk so `allSelected` and `toggleAll` track the
 * currently filtered/sorted view, not the underlying full data.
 *
 * Usage inside a component:
 *
 *     protected readonly selection = new SelectionState(this.sorted);
 *     // template: [checked]="selection.allSelected()" (change)="selection.toggleAll()"
 *     // template per-row: (change)="selection.toggle(item.id)" [checked]="selection.has(item.id)"
 *
 * Pages can keep their existing `selectedIds` / `toggleSelect` /
 * `toggleSelectAll` / `clearSelection` member names by creating thin
 * delegates — that way templates and tests don't need to change when
 * adopting the helper.
 */
export class SelectionState<T extends { readonly id: number }> {
  private readonly visibleList: () => readonly T[];

  /** Set of currently-selected ids. Use `.has(id)` from templates. */
  readonly ids = signal<ReadonlySet<number>>(new Set());

  /** Number of currently-selected ids. */
  readonly count = computed(() => this.ids().size);

  /** True when every item in the visible list is selected (and the list is non-empty). */
  readonly allSelected = computed(() => {
    const len = this.visibleList().length;
    return len > 0 && this.ids().size === len;
  });

  /** True when at least one but not all items are selected. */
  readonly someSelected = computed(() => {
    const size = this.ids().size;
    return size > 0 && size < this.visibleList().length;
  });

  constructor(visibleList: () => readonly T[]) {
    this.visibleList = visibleList;
  }

  /** Toggle a single id in or out of the selection. */
  toggle(id: number): void {
    this.ids.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /**
   * Select every item in the visible list, OR clear the selection if
   * the visible list is already fully selected. Mirrors the standard
   * "select all" checkbox behaviour.
   */
  toggleAll(): void {
    this.ids.update((current) => {
      const visible = this.visibleList();
      if (current.size === visible.length) return new Set();
      return new Set(visible.map((item) => item.id));
    });
  }

  /** Drop every id from the selection. */
  clear(): void {
    this.ids.set(new Set());
  }

  /** Whether `id` is currently selected. */
  has(id: number): boolean {
    return this.ids().has(id);
  }
}

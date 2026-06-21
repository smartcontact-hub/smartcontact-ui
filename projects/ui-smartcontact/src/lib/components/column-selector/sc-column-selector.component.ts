import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { PopoverModule } from 'primeng/popover';


import { ScIconComponent } from '@smartcontact-hub/icons';

export interface ColumnDef {
  /** Stable key persisted in localStorage. */
  readonly key: string;
  /** Translated label shown in the dropdown. */
  readonly label: string;
  /** When true the column cannot be hidden or reordered (e.g. "Name"). */
  readonly locked?: boolean;
  /** When `false`, the column is hidden on first paint (still toggleable
   *  in the menu). Defaults to `true`. */
  readonly defaultVisible?: boolean;
}

/**
 * Visible column keys in display order. Empty entries are filtered out
 * before emit, so consumers can rely on `every entry is a real column`.
 */
type OrderedVisible = readonly string[];

/**
 * Column manager popover. Two responsibilities the user can adjust:
 *   1. **Visibility** — checkbox per column.
 *   2. **Order** — CDK Drag-Drop on a grip handle. The persisted order
 *      drives both the menu and the parent's table.
 *
 * Locked columns (e.g. "Name") stay visible AND fixed in their slot —
 * they can't be hidden, dragged, or moved over.
 *
 * State is persisted as an ordered list of visible keys under
 * `storageKey`. New columns the user has never seen (added in code
 * after persistence) get appended in their declared order, with their
 * `defaultVisible` honoured. The version suffix on `storageKey`
 * (e.g. `_v2`) lets a developer invalidate stale prefs after a
 * material change to the columns or the default order.
 *
 * The component owns the order/visible state and emits
 * `(orderedVisibleChange)` after every change. Parents stay pure
 * consumers and bind `(orderedVisibleChange)` to drive their
 * data-driven render loop.
 */
@Component({
  selector: 'sc-column-selector',
  imports: [CdkDrag, CdkDropList, ScIconComponent, PopoverModule],
  templateUrl: './sc-column-selector.component.html',
  styleUrl: './sc-column-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScColumnSelectorComponent {
  readonly columns = input.required<readonly ColumnDef[]>();
  /** localStorage key — should already include a `_v<N>` suffix so a future
   *  schema change can invalidate the cache by bumping the suffix. */
  readonly storageKey = input.required<string>();
  /** Optional aria-label override for the trigger button. */
  readonly buttonLabel = input<string>('Columnas');

  /** Ordered list of visible column keys. Locked columns are always
   *  included and cannot be removed. */
  readonly orderedVisibleChange = output<OrderedVisible>();
  /** Legacy Set-based output kept so list pages that haven't migrated
   *  to the data-driven render loop (groups, users) still receive
   *  visibility updates. New consumers should bind `orderedVisibleChange`
   *  instead — it carries order on top of visibility. */
  readonly visibilityChange = output<ReadonlySet<string>>();

  protected readonly columnsIcon = 'view_column';
  protected readonly resetIcon = 'rotate_left';
  protected readonly gripIcon = 'drag_indicator';
  protected readonly lockIcon = 'lock';

  /** Default = the column declaration order, filtered by `defaultVisible`. */
  private readonly defaultOrdered = computed<OrderedVisible>(() =>
    this.columns()
      .filter((c) => c.defaultVisible !== false)
      .map((c) => c.key),
  );

  protected readonly ordered = signal<OrderedVisible>([]);

  /**
   * The full list shown in the popover: every column from `columns()`,
   * sorted so the visible ones come first in their stored order, then
   * the hidden ones in their declared order. Locked columns always
   * pin to the very top.
   */
  protected readonly menuItems = computed<readonly ColumnDef[]>(() => {
    const cols = this.columns();
    const visible = this.ordered();
    const visibleSet = new Set(visible);
    const byKey = new Map(cols.map((c) => [c.key, c] as const));

    const locked = cols.filter((c) => c.locked);
    const lockedKeys = new Set(locked.map((c) => c.key));

    const visibleNonLocked = visible
      .filter((k) => !lockedKeys.has(k))
      .map((k) => byKey.get(k))
      .filter((c): c is ColumnDef => !!c);

    const hidden = cols.filter((c) => !c.locked && !visibleSet.has(c.key));

    return [...locked, ...visibleNonLocked, ...hidden];
  });

  protected isVisible(key: string): boolean {
    const ordered = this.ordered();
    /* Until the hydration effect emits, `ordered` is empty. Without
     * this fallback every checkbox renders unchecked on first paint —
     * misleading because the table itself defaults to declared-visible
     * columns. Mirror the same default rule the table uses (declared
     * `defaultVisible !== false` = visible) so the popover state
     * matches what the user sees in the table cells. */
    if (ordered.length === 0) {
      const col = this.columns().find((c) => c.key === key);
      return !!col && col.defaultVisible !== false;
    }
    return ordered.includes(key);
  }

  constructor() {
    // Hydrate from localStorage once we have the columns + key.
    effect(() => {
      const cols = this.columns();
      const key = this.storageKey();
      if (cols.length === 0 || !key) return;

      const persisted = readPersisted(key);
      const declared = cols.map((c) => c.key);
      const declaredSet = new Set(declared);

      let next: string[];
      if (persisted) {
        // Drop any keys that no longer exist in the declaration.
        next = persisted.filter((k) => declaredSet.has(k));
        // Append any newly-declared keys honouring their defaultVisible.
        for (const col of cols) {
          if (next.includes(col.key)) continue;
          if (col.defaultVisible === false) continue;
          next.push(col.key);
        }
      } else {
        next = [...this.defaultOrdered()];
      }

      // Ensure locked columns are present (they can't be hidden).
      for (const col of cols) {
        if (col.locked && !next.includes(col.key)) next.unshift(col.key);
      }

      this.ordered.set(next);
      this.emitChange(next);
    });
  }

  private emitChange(next: readonly string[]): void {
    this.orderedVisibleChange.emit(next);
    this.visibilityChange.emit(new Set(next));
  }

  protected toggle(col: ColumnDef): void {
    if (col.locked) return;
    /* Resolve the current visible list via `isVisible` so the fallback
     * default state is honoured. Without this, the first toggle on a
     * fresh page would operate on an empty `ordered` array — clicking
     * to UNCHECK a default-visible column would actually re-ADD it,
     * because it wasn't in `ordered` yet. */
    const current = this.menuItems()
      .filter((c) => this.isVisible(c.key))
      .map((c) => c.key);
    const idx = current.indexOf(col.key);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(col.key);
    this.commit(current);
  }

  protected onDrop(event: CdkDragDrop<readonly ColumnDef[]>): void {
    const items = [...this.menuItems()];
    const moving = items[event.previousIndex];
    const target = items[event.currentIndex];
    if (!moving || moving.locked) return;
    if (target?.locked) return; // Don't drop above a locked row.
    moveItemInArray(items, event.previousIndex, event.currentIndex);

    /* Recompute the ordered-visible list from the new menu order: a key
     * is visible iff it was already visible before the drag. We use
     * `isVisible` (not `this.ordered()` directly) so the fallback
     * default-visible state on first paint is honoured — without this,
     * dragging before the hydration effect had emitted would treat
     * every key as "not visible" and commit an empty list, dropping
     * every column from the table. */
    const next = items.filter((c) => this.isVisible(c.key)).map((c) => c.key);
    this.commit(next);
  }

  protected reset(): void {
    this.commit([...this.defaultOrdered()]);
  }

  private commit(next: readonly string[]): void {
    this.ordered.set(next);
    persistOrdered(this.storageKey(), next);
    this.emitChange(next);
  }
}

function readPersisted(key: string): string[] | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((s): s is string => typeof s === 'string');
  } catch {
    return null;
  }
}

function persistOrdered(key: string, next: readonly string[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* Quota or disabled — drop silently. */
  }
}

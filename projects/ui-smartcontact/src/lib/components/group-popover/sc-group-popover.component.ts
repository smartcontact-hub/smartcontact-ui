import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SC_GROUP_POPOVER_TRANSLATIONS } from './i18n/sc-group-popover.translations';
import { Popover, PopoverModule } from 'primeng/popover';

import type { GroupRef } from './group-popover.types';

const VISIBLE_LIMIT = 5;
const HOVER_LEAVE_DELAY_MS = 150;

/**
 * Inline cell that shows the group count and reveals a small floating list
 * on hover or keyboard focus. The list shows up to 5 group names plus a
 * "+N más" tail when the agent has more.
 *
 * Built on PrimeNG `<p-popover>` (Figma `Smart Contact Prime → ❖ Popover`)
 * since S34 — overlay rendered into `body`, anchor-positioned to the
 * trigger button by PrimeNG. The hover-or-focus open behaviour is
 * preserved by driving `show()` / `hide()` on the popover ref from
 * trigger/panel pointer events. A short leave delay lets the user cross
 * trigger→panel without the popover flickering closed.
 */
@Component({
  selector: 'sc-group-popover',
  imports: [PopoverModule, TranslateModule],
  templateUrl: './sc-group-popover.component.html',
  styleUrl: './sc-group-popover.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScGroupPopoverComponent {
  readonly groups = input.required<readonly GroupRef[]>();

  protected readonly pop = viewChild.required<Popover>('pop');
  protected readonly open = signal(false);
  private leaveTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly count = computed(() => this.groups().length);
  protected readonly visible = computed(() => this.groups().slice(0, VISIBLE_LIMIT));
  protected readonly overflowCount = computed(() => Math.max(0, this.count() - VISIBLE_LIMIT));

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    const translate = inject(TranslateService);
    for (const [language, dict] of Object.entries(SC_GROUP_POPOVER_TRANSLATIONS)) {
      translate.setTranslation(language, dict, true);
    }
    // Cancel any pending hover-leave timer if the row is removed mid-delay
    // (filter/search/sort re-render) — avoids hide() on a destroyed Popover.
    inject(DestroyRef).onDestroy(() => this.cancelLeave());
  }

  protected onTriggerEnter(event: MouseEvent): void {
    if (this.count() === 0) return;
    this.cancelLeave();
    this.pop().show(event);
    this.open.set(true);
  }

  protected onTriggerFocus(event: FocusEvent): void {
    if (this.count() === 0) return;
    this.cancelLeave();
    this.pop().show(event);
    this.open.set(true);
  }

  protected onPanelEnter(): void {
    this.cancelLeave();
  }

  protected onPointerLeave(): void {
    this.leaveTimer = setTimeout(() => {
      this.pop().hide();
      this.open.set(false);
    }, HOVER_LEAVE_DELAY_MS);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.pop().hide();
      this.open.set(false);
    }
  }

  private cancelLeave(): void {
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = null;
    }
  }
}

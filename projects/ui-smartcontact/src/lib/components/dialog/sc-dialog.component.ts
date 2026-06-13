import { ChangeDetectionStrategy, Component, computed, effect, input, model, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

import { ScIconComponent, SC_ICON_SIZE_LG } from '@smartcontact/icons';

import { ScDialogPosition } from '../../core/types/theme-component.types';

let modalIdCounter = 0;

/**
 * Canonical modal shell — Smart Contact design (Kit `❖ dialog`).
 *
 * Three slots:
 *   - **header**: leading icon (optional) + title + subtitle (optional) +
 *     close X. Rendered from inputs; not projected.
 *   - **body**: free content slot (default `<ng-content>`).
 *   - **footer**: action row, projected via `<ng-content select="[modal-actions]">`.
 *
 * Wraps PrimeNG `<p-dialog showHeader=false>` for focus trap, ESC, mask and
 * animation, but renders the whole card so the visual matches el DS 1:1.
 *
 * §4.3 (fusión Mitad B): UNA sola `sc-dialog` = la card canónica del catálogo
 * de diseño. Las props útiles del wrapper fino del catálogo de desarrollo
 * (`position`, `draggable`, `resizable`, `dismissableMask`, `modal`) se
 * absorben como passthrough sobre la card; `visible` pasa a two-way
 * (`[(visible)]`) conservando el `cancelled` semántico y la restauración de
 * foco. El caso imperativo (abrir un componente arbitrario) lo cubre
 * `ScDynamicDialogService` (`provideScDynamicDialog`), infra paralela — no un
 * segundo componente.
 *
 * Usage:
 *
 * ```html
 * <sc-dialog
 *   [(visible)]="open"
 *   title="¿Eliminar agente?"
 *   subtitle="Esta acción no se puede deshacer."
 *   icon="delete"
 * >
 *   <p>Body content goes here.</p>
 *   <div modal-actions>
 *     <sc-button label="Cancelar" variant="secondary" (clicked)="open.set(false)" />
 *     <sc-button label="Eliminar" variant="danger" (clicked)="confirm()" />
 *   </div>
 * </sc-dialog>
 * ```
 */
@Component({
  selector: 'sc-dialog',
  standalone: true,
  imports: [DialogModule, ScIconComponent],
  templateUrl: './sc-dialog.component.html',
  styleUrl: './sc-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScDialogComponent {
  /** Two-way: `[(visible)]` o `[visible]` + `(visibleChange)`. */
  readonly visible = model<boolean>(false);
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly icon = input<string | null>(null);
  readonly width = input<string>('440px');
  readonly closable = input(true);
  /** When false, the footer slot stays empty; consumers can omit `<div modal-actions>`. */
  readonly hasFooter = input(true);
  /** When true, skip the body section entirely. For confirm dialogs whose
   * description lives in the header subtitle — without this the empty body
   * still claimed its padding and rendered as a blank band. */
  readonly bodyless = input(false);
  /** aria-label del botón de cierre (resuelto por el consumidor). */
  readonly closeAriaLabel = input<string>('Cerrar');

  // ─── Passthrough del wrapper fino (catálogo de desarrollo) ─────────
  readonly modal = input<boolean>(true);
  readonly position = input<ScDialogPosition>('center');
  readonly draggable = input<boolean>(false);
  readonly resizable = input<boolean>(false);
  readonly dismissableMask = input<boolean>(false);

  /** Emitido en cualquier cierre (X, ESC, máscara). Alias semántico de `visible=false`. */
  readonly cancelled = output<void>();
  readonly shown = output<void>();
  readonly hidden = output<void>();

  protected readonly closeIcon = 'close';
  protected readonly iconSizeLg = SC_ICON_SIZE_LG;
  /** Stable ids so `aria-labelledby` / `aria-describedby` resolve correctly. */
  protected readonly id = ++modalIdCounter;
  protected readonly titleId = computed(() => `sc-dialog-${this.id}-title`);
  protected readonly subtitleId = computed(() => `sc-dialog-${this.id}-subtitle`);

  /** Element focused right before the dialog opened — focus returns here on close. */
  private triggerEl: HTMLElement | null = null;

  constructor() {
    let wasOpen = false;
    effect(() => {
      const open = this.visible();
      // On the false→true edge, remember what had focus (the opener) before
      // PrimeNG moves focus into the dialog. Restored in onClose().
      if (open && !wasOpen) {
        this.triggerEl = (document.activeElement as HTMLElement | null) ?? null;
      }
      wasOpen = open;
    });
  }

  /** PrimeNG's own dismiss (Escape/mask close) emits visibleChange(false).
   * Bridge it to `onClose()` y sincroniza el model two-way. */
  protected onVisibleChange(open: boolean): void {
    this.visible.set(open);
    if (!open) this.onClose();
  }

  protected onShow(): void {
    this.shown.emit();
  }

  protected onClose(): void {
    this.visible.set(false);
    this.cancelled.emit();
    this.hidden.emit();
    const el = this.triggerEl;
    this.triggerEl = null;
    // Return focus to the opener so keyboard / screen-reader users don't get
    // dropped at <body>. queueMicrotask lets PrimeNG finish tearing down first.
    if (el && typeof el.focus === 'function') {
      queueMicrotask(() => el.focus());
    }
  }
}

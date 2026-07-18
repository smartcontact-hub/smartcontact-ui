import { inject, Injectable } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

export interface ConfirmRequest {
  /** Resolved (translated) heading shown at the top of the dialog. */
  readonly title: string;
  /** Resolved (translated) body / subtitle. Single sentence works best. */
  readonly body: string;
  /** Resolved label for the destructive / primary action button. */
  readonly acceptLabel: string;
  /** Resolved label for the safe / cancel button. */
  readonly rejectLabel: string;
  /** Visual tone for the accept button. Defaults to `'primary'`. */
  readonly acceptTone?: 'primary' | 'danger';
  /**
   * Which button gets the primary visual weight. Defaults to `'accept'`.
   *
   * Use `'reject'` for "discard changes" prompts where the safe option
   * (keep editing) should be the recommended path — the accept button
   * stays destructive but renders subtle, and the reject button moves
   * to the trailing position with primary styling.
   */
  readonly emphasis?: 'accept' | 'reject';
}

/**
 * Programmatic confirmation. Backs every `confirm(): Promise<boolean>` call
 * across the app (route guards, "discard changes", future logout, etc.) by
 * routing through PrimeNG's `ConfirmationService` + `<p-confirmdialog>` while
 * keeping a thin Promise-based public surface so callers can `await` the
 * boolean.
 *
 * Plumbing is PrimeNG (since S34); the API is unchanged from the previous
 * sc-dialog-based implementation, so existing callers compile and behave
 * identically.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmHostService {
  private readonly confirmation = inject(ConfirmationService);

  /**
   * Show a confirmation. Resolves `true` when the user accepts, `false`
   * when they reject (button, ESC, or another `request()` superseding it).
   */
  request(req: ConfirmRequest): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const acceptTone = req.acceptTone ?? 'primary';
      const emphasizeReject = req.emphasis === 'reject';

      // Build per-button props so each variant matches the previous
      // sc-dialog-based design exactly.
      //
      // emphasis=accept (default) → accept gets weight:
      //   primary tone → accept=primary solid, reject=secondary outline
      //   danger tone  → accept=danger solid,  reject=secondary outline
      //
      // emphasis=reject → reject gets weight (used by "discard changes"):
      //   primary tone → accept=secondary outline, reject=primary solid
      //   danger tone  → accept=danger outlined,   reject=primary solid
      const acceptButtonProps = emphasizeReject
        ? acceptTone === 'danger'
          ? { severity: 'danger' as const, outlined: true, label: req.acceptLabel }
          : { severity: 'secondary' as const, label: req.acceptLabel }
        : acceptTone === 'danger'
          ? { severity: 'danger' as const, label: req.acceptLabel }
          : { label: req.acceptLabel };

      const rejectButtonProps = emphasizeReject
        ? { label: req.rejectLabel }
        : { severity: 'secondary' as const, label: req.rejectLabel };

      this.confirmation.confirm({
        header: req.title,
        message: req.body,
        icon: 'sc-icon-font sc-icon-font--warning',
        acceptButtonProps,
        rejectButtonProps,
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ConfirmDialog } from 'primeng/confirmdialog';

/**
 * Single host that renders every programmatic confirmation across the app
 * (route-guard discard, future logout, etc.) through PrimeNG's
 * `<p-confirmdialog>` (Figma `Smart Contact Prime → ❖ ConfirmDialog`,
 * canvas `6738:50207`).
 *
 * Mounted once in `app.component.html`. State + accept/reject are routed
 * through the app's `ConfirmHostService`, which wraps PrimeNG's
 * `ConfirmationService` so callers keep the `await confirm()` Promise API.
 */
@Component({
  selector: 'sc-confirm-host',
  imports: [ConfirmDialog],
  templateUrl: './confirm-host.component.html',
  styleUrl: './confirm-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmHostComponent {}

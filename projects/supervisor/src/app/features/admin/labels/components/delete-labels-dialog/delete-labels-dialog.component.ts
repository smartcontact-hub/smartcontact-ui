import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { LabelChipComponent } from '@shared/components';
import { ScDialogComponent as DialogComponent } from '@smartcontact-hub/components';
import { Label } from '../../data/labels-data';

/**
 * Confirmation dialog for deleting one or many labels. Renders as a single
 * sentence in single mode, or a stack of chips with totals in bulk mode.
 *
 * Renders through the canonical `sc-dialog` shell (Figma 1037:34069) — same
 * focus trap, ESC handling, header chrome and footer geometry as every other
 * dialog in the app.
 */
@Component({
  selector: 'sc-delete-labels-dialog',
  imports: [ButtonComponent, LabelChipComponent, DialogComponent, TranslateModule],
  templateUrl: './delete-labels-dialog.component.html',
  styleUrl: './delete-labels-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteLabelsDialogComponent {
  private readonly translate = inject(TranslateService);

  readonly labels = input.required<readonly Label[]>();
  readonly visible = input.required<boolean>();
  /** Map of labelId -> agent count, supplied by the page. */
  readonly agentCountByLabel = input<ReadonlyMap<number, number>>(new Map());

  readonly confirm = output<void>();
  readonly cancelled = output<void>();

  protected readonly trashIcon = 'delete';

  protected readonly isSingle = computed(() => this.labels().length === 1);

  protected readonly totalAffectedAgents = computed(() => {
    const counts = this.agentCountByLabel();
    return this.labels().reduce((sum, label) => sum + (counts.get(label.id) ?? 0), 0);
  });

  protected readonly dialogTitle = computed(() =>
    this.isSingle()
      ? this.translate.instant('labels.delete.title_single')
      : this.translate.instant('labels.delete.title_bulk', { count: this.labels().length }),
  );
}

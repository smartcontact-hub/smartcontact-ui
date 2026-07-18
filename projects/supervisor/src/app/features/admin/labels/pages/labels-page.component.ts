import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { ClickOutsideDirective } from '@core/directives';
import { XlsxExportService } from '@core/services';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { clampToViewport } from '@core/utils/viewport';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { IconComponent, LabelChipComponent } from '@shared/components';
import {
  ScBulkActionBarComponent as BulkActionBarComponent,
  useBulkEntityI18n,
  ScEmptyStateComponent as EmptyStateComponent,
  ScSearchComponent as SearchComponent,
} from '@smartcontact-hub/components';
import { AgentsStore } from '@features/admin/agents/state/agents.store';
import { LabelCascadeService } from '@features/admin/services/label-cascade.service';
import { Label, LabelColor } from '../data/labels-data';
import { LabelsStore } from '../state/labels.store';
import { DeleteLabelsDialogComponent } from '../components/delete-labels-dialog/delete-labels-dialog.component';
import {
  LabelFormPanelComponent,
  LabelFormSubmission,
} from '../components/label-form-panel/label-form-panel.component';

interface ContextMenuPos {
  readonly x: number;
  readonly y: number;
  readonly labelId: number;
}

@Component({
  selector: 'sc-labels-page',
  imports: [
    BulkActionBarComponent,
    ButtonComponent,
    ClickOutsideDirective,
    DeleteLabelsDialogComponent,
    EmptyStateComponent,
    FormsModule,
    IconComponent,
    LabelChipComponent,
    LabelFormPanelComponent,
    SearchComponent,
    TranslateModule,
  ],
  templateUrl: './labels-page.component.html',
  styleUrl: './labels-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelsPageComponent {
  private readonly labelsStore = inject(LabelsStore);
  private readonly agentsStore = inject(AgentsStore);
  private readonly labelCascade = inject(LabelCascadeService);
  private readonly xlsx = inject(XlsxExportService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly topBarSlot = inject(TopBarSlotService);
  private readonly destroyRef = inject(DestroyRef);

  /** CTA + panel inline proyectados a la TopBar (modelo "todo arriba" S59):
   * la banda de page-header desaparece; identidad → breadcrumb, acción → barra.
   * El panel de creación cuelga del botón en la barra (mismo anclaje relativo). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    afterNextRender(() => {
      const tpl = this.topbarActions();
      if (tpl) this.topBarSlot.setActions(tpl);
    });
    this.destroyRef.onDestroy(() => this.topBarSlot.clearActions());
  }

  protected readonly plusIcon = 'add';
  protected readonly searchIcon = 'search';
  protected readonly closeIcon = 'close';
  protected readonly downloadIcon = 'download';
  protected readonly tagIcon = 'label';
  protected readonly moreIcon = 'more_vert';
  protected readonly editIcon = 'edit';
  protected readonly trashIcon = 'delete';

  protected readonly labels = this.labelsStore.labels;
  protected readonly agentCountByLabel = this.agentsStore.agentCountByLabel;

  protected readonly searchQuery = signal('');
  protected readonly creating = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly selectedIds = signal<ReadonlySet<number>>(new Set());
  protected readonly contextMenu = signal<ContextMenuPos | null>(null);
  protected readonly openMenuId = signal<number | null>(null);
  protected readonly deleteTarget = signal<readonly Label[] | null>(null);

  protected readonly filtered = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const all = this.labels();
    if (!query) return all;
    return all.filter(
      (label) =>
        label.name.toLowerCase().includes(query) ||
        (label.description ?? '').toLowerCase().includes(query),
    );
  });

  protected readonly sorted = computed(() =>
    [...this.filtered()].sort((a, b) => a.name.localeCompare(b.name)),
  );

  protected readonly existingNames = computed(() => this.labels().map((label) => label.name));

  protected readonly allSelected = computed(() => {
    const sortedLen = this.sorted().length;
    return sortedLen > 0 && this.selectedIds().size === sortedLen;
  });

  protected readonly bulkEntity = useBulkEntityI18n({
    singular: 'common.bulk.entity.label_singular',
    plural: 'common.bulk.entity.label_plural',
    selectedOne: 'common.bulk.entity.label_selected_one',
    selectedOther: 'common.bulk.entity.label_selected_other',
  });

  protected onCreateClick(): void {
    this.editingId.set(null);
    this.creating.update((c) => !c);
  }

  protected onCreateSubmit(submission: LabelFormSubmission): void {
    const label = this.labelsStore.addLabel({
      name: submission.name,
      color: submission.color as LabelColor,
      description: submission.description || undefined,
    });
    this.creating.set(false);
    this.toastSuccess('labels.toasts.created', { name: label.name });
  }

  protected onEditSubmit(id: number, submission: LabelFormSubmission): void {
    this.labelsStore.updateLabel(id, {
      name: submission.name,
      color: submission.color as LabelColor,
      description: submission.description || undefined,
    });
    this.editingId.set(null);
    this.toastSuccess('labels.toasts.updated', { name: submission.name });
  }

  protected toggleSelect(id: number): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected toggleSelectAll(): void {
    this.selectedIds.update((current) => {
      const sorted = this.sorted();
      if (current.size === sorted.length) return new Set();
      return new Set(sorted.map((l) => l.id));
    });
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  protected requestDeleteSingle(label: Label): void {
    this.deleteTarget.set([label]);
    this.openMenuId.set(null);
    this.contextMenu.set(null);
  }

  protected requestDeleteSelection(): void {
    const ids = this.selectedIds();
    const targets = this.labels().filter((l) => ids.has(l.id));
    if (targets.length > 0) this.deleteTarget.set(targets);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    const ids = target.map((l) => l.id);

    this.labelCascade.deleteLabels(ids);

    if (ids.length === 1) {
      this.toastSuccess('labels.toasts.deleted_single', { name: target[0]!.name });
    } else {
      this.toastSuccess('labels.toasts.deleted_bulk', { count: target.length });
    }

    this.deleteTarget.set(null);
    this.clearSelection();
  }

  protected cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  protected onContextMenu(event: MouseEvent, labelId: number): void {
    event.preventDefault();
    const { x, y } = clampToViewport(event.clientX, event.clientY);
    this.contextMenu.set({ x, y, labelId });
  }

  protected closeContextMenu(): void {
    this.contextMenu.set(null);
  }

  protected toggleRowMenu(id: number): void {
    this.openMenuId.update((current) => (current === id ? null : id));
  }

  protected closeRowMenu(): void {
    this.openMenuId.set(null);
  }

  protected onContextEdit(): void {
    const ctx = this.contextMenu();
    if (!ctx) return;
    this.editingId.set(ctx.labelId);
    this.creating.set(false);
    this.contextMenu.set(null);
  }

  protected onContextDelete(): void {
    const ctx = this.contextMenu();
    if (!ctx) return;
    const label = this.labels().find((l) => l.id === ctx.labelId);
    if (label) this.deleteTarget.set([label]);
    this.contextMenu.set(null);
  }

  protected onRowEdit(label: Label): void {
    this.editingId.set(label.id);
    this.creating.set(false);
    this.openMenuId.set(null);
  }

  protected onRowDelete(label: Label): void {
    this.deleteTarget.set([label]);
    this.openMenuId.set(null);
  }

  protected closeCreatePanel(): void {
    this.creating.set(false);
  }

  protected closeEditPanel(): void {
    this.editingId.set(null);
  }

  protected onSearchKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.searchQuery()) {
        this.searchQuery.set('');
      } else {
        (event.target as HTMLInputElement).blur();
      }
    }
  }

  protected onExport(): void {
    const headers = [
      this.translate.instant('labels.export.name'),
      this.translate.instant('labels.export.color'),
      this.translate.instant('labels.export.description'),
      this.translate.instant('labels.export.assigned_agents'),
    ];
    const counts = this.agentCountByLabel();
    const rows = this.sorted().map((label) => [
      label.name,
      label.color,
      label.description ?? '',
      counts.get(label.id) ?? 0,
    ]);
    this.xlsx.export({
      headers,
      rows,
      sheetName: this.translate.instant('labels.export.sheet'),
      filePrefix: 'labels',
    });
  }

  private toastSuccess(key: string, params?: Record<string, string | number>): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(key, params),
      life: TOAST_LIFE.success,
    });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService, type MenuItem } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { ClickOutsideDirective } from '@core/directives';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { XlsxExportService } from '@core/services';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { injectLangChange } from '@core/utils/lang-change';
import { LabelChipComponent, ListPageComponent } from '@shared/components';
import {
  useBulkEntityI18n,
  type ScColumnCellContext,
  type ScColumnDef,
  ScEmptyStateComponent as EmptyStateComponent,
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

@Component({
  selector: 'sc-labels-page',
  imports: [
    ButtonComponent,
    ClickOutsideDirective,
    DeleteLabelsDialogComponent,
    EmptyStateComponent,
    FormsModule,
    IconComponent,
    LabelChipComponent,
    LabelFormPanelComponent,
    ListPageComponent,
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
  private readonly lang = injectLangChange();

  /** CTA + panel inline proyectados a la TopBar (modelo "todo arriba" S59):
   * la banda de page-header desaparece; identidad → breadcrumb, acción → barra.
   * El panel de creación cuelga del botón en la barra (mismo anclaje relativo). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly plusIcon = 'add';
  protected readonly searchIcon = 'search';
  protected readonly tagIcon = 'label';

  protected readonly labels = this.labelsStore.labels;
  protected readonly agentCountByLabel = this.agentsStore.agentCountByLabel;

  protected readonly searchQuery = signal('');
  protected readonly creating = signal(false);
  protected readonly editingId = signal<number | null>(null);
  /** Selección: la lista la marca; de ella cuelgan la barra en lote y el borrado. */
  protected readonly selectedIds = signal<ReadonlySet<Label['id']>>(new Set());
  protected readonly deleteTarget = signal<readonly Label[] | null>(null);

  /** Qué filas casan con la búsqueda (la consulta llega ya en minúsculas). */
  protected readonly matchesSearch = (label: Label, q: string): boolean =>
    label.name.toLowerCase().includes(q) || (label.description ?? '').toLowerCase().includes(q);

  /** Siempre por nombre: esta lista no tiene cabeceras para ordenar. */
  protected readonly sorted = computed(() => [...this.labels()].sort((a, b) => a.name.localeCompare(b.name)));

  protected readonly existingNames = computed(() => this.labels().map((label) => label.name));

  /* ── La tabla, ahora `sc-datatable` (B4) ──────────────────────────────
   * Las tres celdas son composiciones propias de la página (chip de color,
   * panel de edición anclado, kebab), así que van por `cellTemplate`: el DS
   * no conoce el tipo `Label` ni tiene por qué.
   *
   * `columns` es un `computed()` que LEE los `viewChild` a propósito. Esos
   * `TemplateRef` resuelven tarde, y una lista construida en el campo se
   * quedaría con `cellTemplate: undefined` para siempre — la tabla pintaría
   * `row[field]` en crudo. Al ser computed, se recalcula en cuanto resuelven.
   */
  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<Label>>>('nameTpl');
  private readonly descTpl = viewChild<TemplateRef<ScColumnCellContext<Label>>>('descTpl');

  protected readonly columns = computed<readonly ScColumnDef<Label>[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    return [
      {
        field: 'name',
        header: this.translate.instant('labels.table.name'),
        cellTemplate: this.nameTpl(),
      },
      {
        field: 'description',
        header: this.translate.instant('labels.table.description'),
        cellTemplate: this.descTpl(),
      },
    ];
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

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  protected requestDeleteSingle(label: Label): void {
    this.deleteTarget.set([label]);
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

  /** Menú de cada fila: el mismo con «⋮» y con clic derecho (lo abre la lista). */
  protected readonly rowMenu = (label: Label): MenuItem[] => this.buildMenuItems(label);

  private buildMenuItems(label: Label): MenuItem[] {
    return [
      {
        label: this.translate.instant('common.edit'),
        icon: 'sc-icon-font sc-icon-font--edit',
        command: () => this.onRowEdit(label),
      },
      { separator: true },
      {
        // Sin puntos suspensivos (C4 del plan): `sc-delete-labels-dialog` es
        // una confirmación simple (Cancelar / Eliminar), no una puerta
        // tecleada — no hay nada que rellenar antes de borrar.
        label: this.translate.instant('common.delete'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'sc-menu-item--danger',
        command: () => this.onRowDelete(label),
      },
    ];
  }

  protected onRowEdit(label: Label): void {
    this.editingId.set(label.id);
    this.creating.set(false);
  }

  protected onRowDelete(label: Label): void {
    this.deleteTarget.set([label]);
  }

  protected closeCreatePanel(): void {
    this.creating.set(false);
  }

  protected closeEditPanel(): void {
    this.editingId.set(null);
  }

  protected onExport(visibleRows: readonly Label[]): void {
    const headers = [
      this.translate.instant('labels.export.name'),
      this.translate.instant('labels.export.color'),
      this.translate.instant('labels.export.description'),
      this.translate.instant('labels.export.assigned_agents'),
    ];
    const counts = this.agentCountByLabel();
    const rows = visibleRows.map((label) => [
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

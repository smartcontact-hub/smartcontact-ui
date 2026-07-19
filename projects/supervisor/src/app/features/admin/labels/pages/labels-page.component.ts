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
import { MessageService, type MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { ClickOutsideDirective } from '@core/directives';
import { XlsxExportService } from '@core/services';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { LabelChipComponent } from '@shared/components';
import {
  ScBulkActionBarComponent as BulkActionBarComponent,
  useBulkEntityI18n,
  type ScColumnCellContext,
  type ScColumnDef,
  ScDatatableComponent as DatatableComponent,
  type ScDatatableRowEvent,
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

@Component({
  selector: 'sc-labels-page',
  imports: [
    BulkActionBarComponent,
    ButtonComponent,
    ClickOutsideDirective,
    DatatableComponent,
    DeleteLabelsDialogComponent,
    EmptyStateComponent,
    FormsModule,
    IconComponent,
    LabelChipComponent,
    LabelFormPanelComponent,
    MenuModule,
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

  protected readonly labels = this.labelsStore.labels;
  protected readonly agentCountByLabel = this.agentsStore.agentCountByLabel;

  protected readonly searchQuery = signal('');
  protected readonly creating = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly selectedIds = signal<ReadonlySet<number>>(new Set());
  /** Fila a la que apunta el kebab compartido. Ver `menuItems`. */
  protected readonly menuTargetLabel = signal<Label | null>(null);
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
  private readonly actionsTpl = viewChild<TemplateRef<ScColumnCellContext<Label>>>('actionsTpl');

  protected readonly columns = computed<readonly ScColumnDef<Label>[]>(() => [
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
    // Columna sin datos: `field` es solo su identidad, y la cabecera va vacía
    // igual que el `<th aria-hidden>` que sustituye.
    { field: 'actions', stopRowClick: true, header: '', headerAriaLabel: this.translate.instant('common.actions'), width: '48px', cellTemplate: this.actionsTpl() },
  ]);

  /* Puente de selección: la fuente de verdad sigue siendo `selectedIds` —de
   * ella cuelgan la barra masiva, el borrado y el export— y `sc-datatable`
   * habla de filas. Traducir en los dos sentidos aquí evita reescribir media
   * página por un cambio de tabla. */
  protected readonly selectedLabels = computed<readonly Label[]>(() => {
    const ids = this.selectedIds();
    return this.sorted().filter((label) => ids.has(label.id));
  });

  protected onSelectionChange(selection: Label | readonly Label[] | null): void {
    const rows = Array.isArray(selection) ? selection : selection ? [selection as Label] : [];
    this.selectedIds.set(new Set(rows.map((label) => label.id)));
  }

  /** Click derecho → el MISMO `<p-menu>` que el kebab (R3). */
  protected onRowContextMenu(event: ScDatatableRowEvent<Label>, menu: { toggle: (e: Event) => void }): void {
    this.setMenuTarget(event.row);
    menu.toggle(event.originalEvent);
  }

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

  /* `toggleSelect` / `toggleSelectAll` / `allSelected` murieron con la
   * migración a `sc-datatable`: la casilla de fila y la de cabecera las
   * sirven `p-tableCheckbox` y `p-tableHeaderCheckbox`, con la misma
   * semántica de antes (la de cabecera marca lo FILTRADO, no todo). */

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

  /* El click derecho abre EL MISMO menú que el kebab (R3): un solo motor, un
   * solo modelo, un solo sitio donde añadir una acción. Antes había un panel
   * HTML por fila MÁS un menú contextual aparte con sus propios handlers
   * duplicados — dos implementaciones que ya divergían. */

  /** Modelo del kebab compartido. Es un computed ESTABLE: solo cambia al
   *  apuntar a otra fila. Con `[model]="build(label)"` el array se recreaba en
   *  cada ciclo de CD, PrimeNG repintaba el menú y se perdía el primer clic
   *  (hacía falta doble). Mismo patrón que las tres hermanas de memory. */
  protected readonly menuItems = computed<MenuItem[]>(() => {
    const label = this.menuTargetLabel();
    return label ? this.buildMenuItems(label) : [];
  });

  protected setMenuTarget(label: Label): void {
    this.menuTargetLabel.set(label);
  }

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
        styleClass: 'rules-menu-item--danger',
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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
import { MessageService, type MenuItem } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { ClickOutsideDirective } from '@core/directives/click-outside.directive';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { XlsxExportService } from '@core/services/xlsx-export.service';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { ListPageComponent } from '@shared/components';
import {
  type ScColumnCellContext,
  type ScColumnDef,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScTagComponent as TagComponent,
} from '@smartcontact-hub/components';
import { RepoFormPanelComponent, RepoFormSubmission } from './repo-form-panel.component';
import { RepoEntity, RepoPageConfig, RepoStore } from './repo-types';

/**
 * Generic CRUD page used by all 9 repository instances. Driven by a
 * `RepoPageConfig<T>` (columns, fields, breadcrumb, copy) plus a `RepoStore<T>`
 * that supplies the data. Mirrors the prototype's `RepositoryListPage`
 * including search, sort, table with a shared row menu (kebab + right-click),
 * dynamic edit panel, bulk delete (via shared `DeleteEntityDialog`), and XLSX
 * export. La lista en sí (barra, tabla, selección, menú) la monta `sc-list-page` (DD-97).
 */
@Component({
  selector: 'sc-repo-list-page',
  imports: [
    ButtonComponent,
    ClickOutsideDirective,
    DeleteEntityDialogComponent,
    IconComponent,
    ListPageComponent,
    RepoFormPanelComponent,
    TagComponent,
    TranslateModule,
  ],
  templateUrl: './repo-list-page.component.html',
  styleUrl: './repo-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepoListPageComponent<T extends RepoEntity> {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly xlsx = inject(XlsxExportService);

  readonly config = input.required<RepoPageConfig<T>>();
  readonly store = input.required<RepoStore<T>>();

  /** CTA + panel inline proyectados a la TopBar (modelo "todo arriba" S59). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly plusIcon = 'add';

  protected readonly searchQuery = signal('');
  protected readonly creating = signal(false);
  protected readonly editingId = signal<number | null>(null);
  /** Selección: la lista la marca; de ella cuelgan la barra en lote y el borrado. */
  protected readonly selectedIds = signal<ReadonlySet<T['id']>>(new Set());
  protected readonly deleteTarget = signal<readonly T[] | null>(null);

  protected readonly items = computed(() => this.store().items());

  /** Qué filas casan con la búsqueda (la consulta llega ya en minúsculas): los campos de `searchKeys`. */
  protected readonly matchesSearch = (item: T, q: string): boolean =>
    this.config().searchKeys.some((key) => {
      const value = (item as unknown as Record<string, unknown>)[key];
      return typeof value === 'string' && value.toLowerCase().includes(q);
    });

  /** Siempre por nombre: esta lista no tiene cabeceras para ordenar. */
  protected readonly sorted = computed(() => [...this.items()].sort((a, b) => a.name.localeCompare(b.name)));

  protected readonly existingNames = computed(() => this.items().map((item) => item.name));

  protected readonly deleteItems = computed(() =>
    (this.deleteTarget() ?? []).map((item) => ({ id: item.id, name: item.name })),
  );

  /** Reactividad al cambio de idioma para resolver `entitySingularKey` y
   *  `entityPluralKey` del config (S51 sweep AED i18n). Patrón S49 reactive
   *  pattern — sin esta dependency `translate.instant` no se re-evalúa al
   *  cambio de idioma. */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang),
    ),
    { initialValue: this.translate.currentLang },
  );

  /** Nombre singular de la entidad, traducido. Dependency: config + lang. */
  protected readonly entitySingular = computed(() => {
    this.currentLang();
    return this.translate.instant(this.config().entitySingularKey);
  });

  /** Nombre plural de la entidad, traducido. */
  protected readonly entityPlural = computed(() => {
    this.currentLang();
    return this.translate.instant(this.config().entityPluralKey);
  });

  protected readonly bulkEntity = computed(() => ({
    singular: this.entitySingular(),
    plural: this.entityPlural(),
    suffixSingular: this.translate.instant('common.bulk.selected_one'),
    suffixPlural: this.translate.instant('common.bulk.selected_other'),
  }));

  /* ── La tabla, ahora `sc-datatable` (B4) ──────────────────────────────
   * Caso especial: las columnas salen de `config()`, así que NO se puede
   * declarar un `<ng-template>` por columna. Hay UNA plantilla genérica y el
   * contexto lleva la columna (`let-col="col"`) para saber qué pintar. Ese
   * hueco lo destapó esta página, no el piloto.
   */
  private readonly cellTpl = viewChild<TemplateRef<ScColumnCellContext<T>>>('cellTpl');

  protected readonly columns = computed<readonly ScColumnDef<T>[]>(() => {
    const cell = this.cellTpl();
    return this.config().columns.map((c) => ({
      field: c.key,
      header: this.translate.instant(c.labelKey),
      width: c.width,
      cellTemplate: cell,
    }));
  });

  /** ¿Esta columna es la destacada (la que ancla el panel de edición)? */
  protected isEmphasis(key: string): boolean {
    return !!this.config().columns.find((c) => c.key === key)?.emphasis;
  }

  /** ¿Esta columna es de este `kind`? (mono, truncate…) */
  protected isKind(key: string, kind: string): boolean {
    return this.config().columns.find((c) => c.key === key)?.kind === kind;
  }

  protected getCellValue(item: T, key: string): string {
    const cfg = this.config();
    const column = cfg.columns.find((c) => c.key === key);
    if (!column) return '';
    return column.accessor(item);
  }

  protected getStatusEntry(
    item: T,
    key: string,
  ): { labelKey: string; tone: 'success' | 'secondary' | 'warning' | 'danger' | 'info' } | null {
    const column = this.config().columns.find((c) => c.key === key);
    if (!column || column.kind !== 'status' || !column.statusMap) return null;
    return column.statusMap[column.accessor(item)] ?? null;
  }

  protected onCreateClick(): void {
    this.editingId.set(null);
    this.creating.update((c) => !c);
  }

  protected onCreateSubmit(submission: RepoFormSubmission): void {
    const created = this.store().addItem(submission as unknown as Omit<T, 'id'>);
    this.creating.set(false);
    this.toastSuccess('repositories.toasts.created', {
      entity: this.entitySingular(),
      name: created.name,
    });
  }

  protected onEditSubmit(id: number, submission: RepoFormSubmission): void {
    this.store().updateItem(id, submission as unknown as Partial<T>);
    this.editingId.set(null);
    const name = submission['name'] ?? '';
    this.toastSuccess('repositories.toasts.updated', {
      entity: this.entitySingular(),
      name,
    });
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  protected requestDeleteSelection(): void {
    const ids = this.selectedIds();
    const targets = this.items().filter((item) => ids.has(item.id));
    if (targets.length > 0) this.deleteTarget.set(targets);
  }

  protected confirmDelete(remainingIds: readonly number[] | null): void {
    const target = this.deleteTarget();
    if (!target) return;

    let ids: number[];
    let toasted: T[];
    if (remainingIds === null) {
      ids = target.map((t) => t.id);
      toasted = [...target];
    } else {
      const idSet = new Set(remainingIds);
      toasted = target.filter((t) => idSet.has(t.id));
      ids = toasted.map((t) => t.id);
    }

    if (ids.length === 1) {
      this.store().deleteItem(ids[0]!);
      this.toastSuccess('repositories.toasts.deleted_single', {
        entity: this.entitySingular(),
        name: toasted[0]!.name,
      });
    } else {
      this.store().deleteItems(ids);
      this.toastSuccess('repositories.toasts.deleted_bulk', {
        count: ids.length,
        entity: this.entityPlural(),
      });
    }

    this.deleteTarget.set(null);
    this.clearSelection();
  }

  protected cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  /** Menú de cada fila: el mismo con «⋮» y con clic derecho (lo abre la lista). */
  protected readonly rowMenu = (item: T): MenuItem[] => this.buildMenuItems(item);

  private buildMenuItems(item: T): MenuItem[] {
    return [
      {
        label: this.translate.instant('common.edit'),
        icon: 'sc-icon-font sc-icon-font--edit',
        command: () => this.onRowEdit(item),
      },
      { separator: true },
      {
        // Puntos suspensivos porque lleva a la puerta tecleada
        // (<sc-delete-entity-dialog>), no a un borrado inmediato (C4 del
        // plan): convención de menús de escritorio — "…" significa "esto
        // abre algo antes de hacerlo".
        label: this.translate.instant('common.delete_gate'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'sc-menu-item--danger',
        command: () => this.onRowDelete(item),
      },
    ];
  }

  protected onRowEdit(item: T): void {
    this.editingId.set(item.id);
    this.creating.set(false);
  }

  protected onRowDelete(item: T): void {
    this.deleteTarget.set([item]);
  }

  protected closeCreatePanel(): void {
    this.creating.set(false);
  }

  protected closeEditPanel(): void {
    this.editingId.set(null);
  }

  protected onExport(visibleRows: readonly T[]): void {
    const cfg = this.config();
    const headers = cfg.columns.map((c) => this.translate.instant(c.labelKey));
    const rows = visibleRows.map((item) =>
      cfg.columns.map((c) => {
        if (c.kind === 'status' && c.statusMap) {
          const entry = c.statusMap[c.accessor(item)];
          return entry ? this.translate.instant(entry.labelKey) : c.accessor(item);
        }
        return c.accessor(item);
      }),
    );
    this.xlsx.export({
      headers,
      rows,
      sheetName: this.translate.instant(cfg.sheetNameKey),
      filePrefix: cfg.filePrefix,
    });
  }

  private toastSuccess(key: string, params: Record<string, string | number>): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(key, params),
      life: TOAST_LIFE.success,
    });
  }
}

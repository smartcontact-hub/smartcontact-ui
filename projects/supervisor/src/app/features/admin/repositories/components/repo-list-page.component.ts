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
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
import { type MenuItem } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import {
  ScEmptyStateComponent as EmptyStateComponent, ScButtonComponent as ButtonComponent,
} from '@smartcontact-hub/components';

import { ClickOutsideDirective } from '@core/directives/click-outside.directive';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { LanguageService } from '@core/services/language.service';
import { XlsxExportService } from '@core/services/xlsx-export.service';
import { CeldaVaciaComponent, ListPageComponent } from '@shared/components';
import {
  type ColumnDef,
  type GroupRef,
  ScGroupPopoverComponent as GroupPopoverComponent,
  type ScColumnCellContext,
  type ScColumnDef,
  ScConfirmService,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScTagComponent as TagComponent,
} from '@smartcontact-hub/components';
import { RepoFormPanelComponent, RepoFormSubmission } from './repo-form-panel.component';
import { RepoEntity, RepoPageConfig, RepoStore } from './repo-types';
import { injectLangChange } from '@core/utils/lang-change';
import { copyName } from '@shared/utils/copy-name';
import { hoy } from '@shared/utils/today';
import { ResultadoAccionService } from '@core/services';
import { TooltipModule } from 'primeng/tooltip';

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
    TooltipModule,
    EmptyStateComponent,
    ButtonComponent,
    CeldaVaciaComponent,
    GroupPopoverComponent,
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
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly confirm = inject(ScConfirmService);
  private readonly lang = injectLangChange();
  private readonly xlsx = inject(XlsxExportService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly language = inject(LanguageService);

  readonly config = input.required<RepoPageConfig<T>>();
  readonly store = input.required<RepoStore<T>>();

  /** CTA + panel inline proyectados a la TopBar (modelo "todo arriba" S59). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly plusIcon = 'add';

  /** Con `?buscar=` (DD-164), la lista abre ya buscando: así enlaza una ficha a la tipificación que tiene, por su
   *  categoría. Se siembra al entrar y luego la búsqueda es de quien la usa. Es la de siempre, por subcadena: «Venta»
   *  encuentra también «Ventas». */
  protected readonly searchQuery = signal(this.route.snapshot.queryParamMap.get('buscar') ?? '');
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
  /**
   * El botón de crear dice qué crea: «+ Nueva agenda», «+ Nuevo horario» (revisión de producto del 2026-10-15), con el
   * título del panel de alta de cada repositorio. Sin él, «Nuevo/a {{entity}}».
   */
  protected readonly createLabelKey = computed(() => this.config().createTitleKey ?? 'repositories.form.create_title');
  /** El vacío no pasa parámetros a su botón: sin título propio, «Crear». */
  protected readonly emptyCtaKey = computed(() => this.config().createTitleKey ?? 'common.create');

  protected readonly entitySingular = computed(() => {
    this.currentLang();
    return this.translate.instant(this.config().entitySingularKey);
  });

  /** Nombre plural de la entidad, traducido. */
  protected readonly entityPlural = computed(() => {
    this.currentLang();
    return this.translate.instant(this.config().entityPluralKey);
  });

  /* ── La tabla, ahora `sc-datatable` (B4) ──────────────────────────────
   * Caso especial: las columnas salen de `config()`, así que NO se puede
   * declarar un `<ng-template>` por columna. Hay UNA plantilla genérica y el
   * contexto lleva la columna (`let-col="col"`) para saber qué pintar. Ese
   * hueco lo destapó esta página, no el piloto.
   */
  private readonly cellTpl = viewChild<TemplateRef<ScColumnCellContext<T>>>('cellTpl');

  protected readonly columns = computed<readonly ScColumnDef<T>[]>(() => {
    this.lang(); // textos al día al cambiar de idioma (ver `injectLangChange`)
    const cell = this.cellTpl();
    return this.config().columns.map((c) => ({
      field: c.key,
      header: this.translate.instant(c.labelKey),
      width: c.width,
      /* La columna del nombre es la cabecera de su fila también con ancho propio (Intenciones, Reglas IA…), DD-194. */
      rowHeader: c.emphasis,
      // El estado se pinta con su etiqueta: mientras carga, su píldora.
      skeleton: c.kind === 'status' ? 'tag' : undefined,
      cellTemplate: cell,
    }));
  });

  /** Las columnas que se pueden elegir y ordenar (solo si la pantalla lo pide): la primera, fija. */
  protected readonly columnDefs = computed<readonly ColumnDef[] | undefined>(() => {
    this.lang();
    if (!this.config().columnChoices) return undefined;
    return this.config().columns.map((c, i) => ({ key: c.key, label: this.translate.instant(c.labelKey), locked: i === 0 }));
  });

  protected readonly columnPrefKey = computed(() => `sc-${this.config().filePrefix}-columns-v1`);

  /** ¿Esta columna es la destacada (la que ancla el panel de edición)? */
  protected isEmphasis(key: string): boolean {
    return !!this.config().columns.find((c) => c.key === key)?.emphasis;
  }

  /** ¿Esta columna es de este `kind`? (mono, truncate…) */
  protected isKind(key: string, kind: string): boolean {
    return this.config().columns.find((c) => c.key === key)?.kind === kind;
  }

  /** Las cifras, con el separador de miles del idioma: en `es`, 1250 sin punto y 12.500 con él (`Intl` lo sabe). */
  private readonly formatoCifra = computed(() => new Intl.NumberFormat(this.language.locale()));

  protected getCellValue(item: T, key: string): string {
    const cfg = this.config();
    const column = cfg.columns.find((c) => c.key === key);
    if (!column) return '';
    const valor = column.accessor(item);
    if (column.kind === 'count') return this.formatoCifra().format(Number(valor));
    if (column.kind === 'date') return this.formatoFecha().format(new Date(`${valor}T00:00:00`));
    return valor;
  }

  /** Las fechas, en el formato del idioma: «2 oct 2026». */
  private readonly formatoFecha = computed(
    () => new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short', year: 'numeric' }),
  );

  /** Los grupos que usan la fila, para el desplegable de la columna `groups`. */
  protected groupsFor(item: T, key: string): readonly GroupRef[] | null {
    const column = this.config().columns.find((c) => c.key === key);
    return column?.kind === 'groups' && column.groups ? column.groups(item) : null;
  }

  /** Cómo pinta la celda de «grupos»: la cifra siempre (`count`) o, por defecto, adaptada a cuántos haya. */
  protected groupsDisplay(key: string): 'count' | 'adaptive' {
    return this.config().columns.find((c) => c.key === key)?.groupsDisplay ?? 'adaptive';
  }

  /** ¿Sin ninguno se escribe 0? (Equipos: el COA pide la cifra, no «—».) */
  protected emptyAsZero(key: string): boolean {
    return !!this.config().columns.find((c) => c.key === key)?.emptyAsZero;
  }

  /** ¿La celda no tiene dato y su columna pide el guion? */
  protected showDash(item: T, key: string): boolean {
    const column = this.config().columns.find((c) => c.key === key);
    return !!column?.emptyDash && column.accessor(item).trim() === '';
  }

  protected groupsAria(count: number, key: string): string {
    this.lang();
    const base = this.config().columns.find((c) => c.key === key)?.groupsAriaKey ?? 'repositories.groups_aria';
    return this.translate.instant(`${base}${count === 1 ? '_one' : ''}`, { count });
  }

  /** Lo que se estampa al duplicar o guardar desde el panel: la fecha de modificación, si la lista la lleva. */
  private modificada(): Partial<T> {
    const campo = this.config().modifiedField;
    return campo ? ({ [campo]: hoy() } as unknown as Partial<T>) : {};
  }

  /** Con editor propio (`editRoute`, DD-163) la fila lo abre, como en Grupos; sin él, la fila no abre nada. */
  protected readonly abreFila = computed(() => !!this.config().editRoute);

  protected onRowOpen(item: T): void {
    const base = this.config().editRoute;
    if (base) void this.router.navigateByUrl(`${base}/editar/${item.id}`);
  }

  /** El texto entero al pasar el ratón, solo en las columnas que recortan: con un dato más largo que lo medido, la
   *  celda corta con «…» (DD-124). */
  /** El texto entero de una celda que se corta, para su tooltip (`showOnEllipsis`); vacío, sin tooltip. */
  protected cellTitle(item: T, key: string): string {
    return this.isKind(key, 'truncate') ? this.getCellValue(item, key) : '';
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
    const base = this.config().editRoute;
    if (base) {
      void this.router.navigateByUrl(`${base}/crear`);
      return;
    }
    this.editingId.set(null);
    this.creating.update((c) => !c);
  }

  protected onCreateSubmit(submission: RepoFormSubmission): void {
    const created = this.store().addItem({ ...submission, ...this.modificada() } as unknown as Omit<T, 'id'>);
    this.creating.set(false);
    this.toastSuccess(this.toastKey('created', 'repositories.toasts.created'), {
      entity: this.entitySingular(),
      name: created.name,
    });
  }

  protected onEditSubmit(id: number, submission: RepoFormSubmission): void {
    this.store().updateItem(id, { ...submission, ...this.modificada() } as unknown as Partial<T>);
    this.editingId.set(null);
    const name = submission['name'] ?? '';
    this.toastSuccess(this.toastKey('updated', 'repositories.toasts.updated'), {
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
      this.toastSuccess(this.toastKey('deleted', 'repositories.toasts.deleted_single'), {
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

  /** Con varios marcados, el «⋮» y el clic derecho sobre uno de ellos ofrecen solo «Eliminar (N)». */
  protected readonly selectionMenu = (rows: readonly T[]): MenuItem[] => [
    {
      label: this.translate.instant('common.delete_count', { count: rows.length }),
      icon: 'sc-icon-font sc-icon-font--delete',
      styleClass: 'sc-menu-item--danger',
      command: () => (this.config().simpleDelete ? void this.onBulkDelete(rows) : this.deleteTarget.set(rows)),
    },
  ];

  /** Menú de cada fila: el mismo con «⋮» y con clic derecho (lo abre la lista). */
  protected readonly rowMenu = (item: T): MenuItem[] => this.buildMenuItems(item);

  private buildMenuItems(item: T): MenuItem[] {
    return [
      {
        label: this.translate.instant('common.edit'),
        icon: 'sc-icon-font sc-icon-font--edit',
        command: () => this.onRowEdit(item),
      },
      ...(this.config().duplicable
        ? [
            {
              label: this.translate.instant('common.duplicate'),
              icon: 'sc-icon-font sc-icon-font--content_copy',
              command: () => this.onRowDuplicate(item),
            },
          ]
        : []),
      { separator: true },
      {
        // Puntos suspensivos porque lleva a la puerta tecleada
        // (<sc-delete-entity-dialog>), no a un borrado inmediato (C4 del
        // plan): convención de menús de escritorio — "…" significa "esto
        // abre algo antes de hacerlo". Con confirmación simple, sin ellos (DD-215).
        label: this.translate.instant(this.config().simpleDelete ? 'common.delete' : 'common.delete_gate'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'sc-menu-item--danger',
        command: () => this.onRowDelete(item),
      },
    ];
  }

  protected onRowEdit(item: T): void {
    if (this.config().editRoute) {
      this.onRowOpen(item);
      return;
    }
    this.editingId.set(item.id);
    this.creating.set(false);
  }

  /** La copia: los mismos datos y un nombre que no se repite. Se queda en la lista, sin abrirla. */
  protected onRowDuplicate(item: T): void {
    const { id: _id, ...resto } = item;
    const name = copyName(item.name, this.store().items().map((i) => i.name), this.translate.instant('common.copy_suffix'));
    const copia = this.store().addItem({ ...resto, name, ...this.modificada() } as Omit<T, 'id'>);
    this.toastSuccess('common.duplicated_toast', { name: copia.name });
  }

  /** Eliminar una fila (sin marcar, o sola): con varias marcadas, el «⋮» y el clic derecho abren el menú de la selección. */
  protected onRowDelete(item: T): void {
    const simple = this.config().simpleDelete;
    if (!simple) {
      this.deleteTarget.set([item]);
      return;
    }
    void this.confirmarBorrado(simple.titleKey, { name: item.name }).then((ok) => {
      if (!ok) return;
      this.store().deleteItem(item.id);
      this.selectedIds.update((ids) => new Set([...ids].filter((id) => id !== item.id)));
      this.toastSuccess(this.toastKey('deleted', 'repositories.toasts.deleted_single'), {
        entity: this.entitySingular(),
        name: item.name,
      });
    });
  }

  private async onBulkDelete(items: readonly T[]): Promise<void> {
    const simple = this.config().simpleDelete;
    if (!simple || !(await this.confirmarBorrado(simple.titleBulkKey, { count: items.length }))) return;
    this.store().deleteItems(items.map((i) => i.id));
    this.clearSelection();
    this.toastSuccess('repositories.toasts.deleted_bulk', { count: items.length, entity: this.entityPlural() });
  }

  /** La confirmación simple del DS: el título pregunta, el cuerpo avisa y el botón repite el verbo. */
  private confirmarBorrado(titleKey: string, params: Record<string, string | number>): Promise<boolean> {
    return this.confirm.request({
      title: this.translate.instant(titleKey, params),
      body: this.translate.instant('common.delete_dialog.body'),
      acceptLabel: this.translate.instant('common.delete'),
      rejectLabel: this.translate.instant('common.cancel'),
      acceptTone: 'danger',
    });
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

  /** El aviso propio de la instancia, si lo declara (`toastsKey`); si no, el genérico. */
  private toastKey(corto: 'created' | 'updated' | 'deleted', generico: string): string {
    const base = this.config().toastsKey;
    return base ? `${base}.${corto}` : generico;
  }

  private toastSuccess(key: string, params: Record<string, string | number>): void {
    // El resultado, en un toast (DD-211 §5).
    this.resultado.contar(this.translate.instant(key, params));
  }
}

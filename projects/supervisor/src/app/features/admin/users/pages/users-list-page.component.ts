import { map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService, type MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { UndoStackService, XlsxExportService } from '@core/services';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { SelectionState } from '@core/utils/selection-state';
import { TOAST_LIFE } from '@core/utils/toast-life';

import {
  ScBulkActionBarComponent as BulkActionBarComponent,
  useBulkEntityI18n,
  BulkEditCommit,
  BulkEditFieldOption,
  ScBulkEditMenuComponent as BulkEditMenuComponent,
  ColumnDef,
  ScColumnSelectorComponent as ColumnSelectorComponent,
  type ScColumnCellContext,
  type ScColumnDef,
  ScDatatableComponent as DatatableComponent,
  type ScDatatableRowEvent,
  type ScDatatableRowKeyEvent,
  type ScRowStyleClassFn,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ImpactBadge,
  ImpactItem,
  ScImpactPreviewDialogComponent as ImpactPreviewDialogComponent,
  ScInlineRenameCellComponent as InlineRenameCellComponent,
  ScSearchComponent as SearchComponent,
} from '@smartcontact-hub/components';
import { USER_TYPE_LABEL_KEYS, USER_TYPES, User, UserType } from '../data/users-data';
import { UsersStore, type UserBulkField } from '../state/users.store';

const COLUMN_PREF_KEY = 'sc-users-columns-v1';

interface PendingBulkEdit {
  readonly field: UserBulkField;
  readonly fieldLabel: string;
  readonly value: unknown;
  readonly valueLabel: string;
}

@Component({
  selector: 'sc-users-list-page',
  imports: [
    BulkActionBarComponent,
    BulkEditMenuComponent,
    ButtonComponent,
    ColumnSelectorComponent,
    DatatableComponent,
    DeleteEntityDialogComponent,
    EmptyStateComponent,
    ImpactPreviewDialogComponent,
    IconComponent,
    InlineRenameCellComponent,
    MenuModule,
    SearchComponent,
    TranslateModule,
  ],
  templateUrl: './users-list-page.component.html',
  styleUrl: './users-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListPageComponent {
  private readonly usersStore = inject(UsersStore);
  private readonly xlsx = inject(XlsxExportService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly topBarSlot = inject(TopBarSlotService);
  private readonly undoStack = inject(UndoStackService);
  private readonly destroyRef = inject(DestroyRef);

  /** CTA proyectado a la TopBar (modelo "todo arriba" S59): la banda de
   * page-header desaparece; identidad → breadcrumb, acción → barra. */
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
  protected readonly moreIcon = 'more_vert';
  protected readonly emptyIcon = 'manage_accounts';
  protected readonly pageIcon = 'manage_accounts';

  protected readonly typeLabelKeys = USER_TYPE_LABEL_KEYS;
  protected readonly users = this.usersStore.users;

  /**
   * Translated user-type label table — built once on init so the filter
   * can do `O(1)` map lookups instead of calling `translate.instant()`
   * inside `.filter()` (per-row, per-keystroke). Language is static
   * (`'es'`) at runtime so the cache doesn't need an invalidation hook;
   * revisit if a runtime language switcher is ever added.
   */
  private readonly translatedTypeLabels = (() => {
    const map = new Map<UserType, string>();
    for (const t of USER_TYPES) {
      map.set(t, this.translate.instant(this.typeLabelKeys[t]));
    }
    return map;
  })();

  protected readonly searchQuery = signal('');
  /** See `agents-list-page` for the rationale behind the delegate pattern. */
  private readonly selection = new SelectionState<{ readonly id: number }>(() => this.sorted());
  protected readonly selectedIds = this.selection.ids;
  /** Fila a la que apunta el kebab compartido. Ver `menuItems`. */
  protected readonly menuTargetUser = signal<User | null>(null);
  protected readonly deleteTarget = signal<readonly User[] | null>(null);
  protected readonly renamingId = signal<number | null>(null);
  protected readonly columnPrefKey = COLUMN_PREF_KEY;
  /** Columnas elegidas en el selector, EN SU ORDEN (antes era un `Set`: el
   *  orden lo fijaba el marcado, que ya no existe). */
  protected readonly visibleColumnKeys = signal<readonly string[]>([]);

  protected readonly columnDefs = computed<readonly ColumnDef[]>(() => [
    { key: 'name', label: this.translate.instant('users.table.name'), locked: true },
    { key: 'email', label: this.translate.instant('users.table.email') },
    { key: 'identifier', label: this.translate.instant('users.table.identifier') },
    { key: 'type', label: this.translate.instant('users.table.type') },
    { key: 'status', label: this.translate.instant('users.table.status') },
  ]);

  protected readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const all = this.users();
    if (!q) return all;
    return all.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.identifier.toLowerCase().includes(q) ||
        (this.translatedTypeLabels.get(u.type) ?? '').toLowerCase().includes(q),
    );
  });

  /**
   * Lo que ve la tabla. El ORDEN ya no lo pone esta página: las columnas van
   * `sortable`, así que lo resuelve p-table client-side (y por eso `sortField`,
   * `sortDir`, `toggleSort` y `getSortDir` murieron con la migración).
   *
   * Sigue siendo una COPIA de `filtered()`, y eso no es cosmético: p-table
   * ordena el array que recibe **in place**, y `filtered()` devuelve el array
   * del store tal cual cuando no hay búsqueda. Sin la copia, ordenar la tabla
   * reordenaría el store. Como la copia es la MISMA que ordena p-table, el
   * export sigue saliendo en el orden que se ve.
   */
  protected readonly sorted = computed(() => [...this.filtered()]);

  protected readonly deleteItems = computed(() =>
    (this.deleteTarget() ?? []).map((u) => ({ id: u.id, name: u.name })),
  );

  protected readonly bulkEntity = useBulkEntityI18n({
    singular: 'common.bulk.entity.user_singular',
    plural: 'common.bulk.entity.user_plural',
  });

  protected typeLabel(type: UserType): string {
    return this.translate.instant(this.typeLabelKeys[type]);
  }

  /* ── La tabla, ahora `sc-datatable` (B4) ──────────────────────────────
   * Las seis celdas son composiciones propias de la página (renombrado
   * inline, pills, kebab) o llevan tipografía propia, así que van todas por
   * `cellTemplate`: el `<td>` lo pinta el DS y una regla encapsulada de esta
   * página no lo alcanzaría.
   *
   * `columns` es un `computed()` que LEE los `viewChild` a propósito. Esos
   * `TemplateRef` resuelven tarde, y una lista construida en el campo se
   * quedaría con `cellTemplate: undefined` para siempre — la tabla pintaría
   * `row[field]` en crudo. Al ser computed, se recalcula en cuanto resuelven.
   */
  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<User>>>('nameTpl');
  private readonly emailTpl = viewChild<TemplateRef<ScColumnCellContext<User>>>('emailTpl');
  private readonly identifierTpl =
    viewChild<TemplateRef<ScColumnCellContext<User>>>('identifierTpl');
  private readonly typeTpl = viewChild<TemplateRef<ScColumnCellContext<User>>>('typeTpl');
  private readonly statusTpl = viewChild<TemplateRef<ScColumnCellContext<User>>>('statusTpl');
  private readonly actionsTpl = viewChild<TemplateRef<ScColumnCellContext<User>>>('actionsTpl');

  /** Dependencia de IDIOMA para las cabeceras.
   *
   * `columns` es un `computed()` cuyas únicas dependencias eran los `viewChild`
   * de las plantillas de celda. Como los `header` se resuelven con
   * `translate.instant()` —no con el pipe `| translate`, que es impuro y sí
   * reaccionaba— el computed NO se re-evaluaba al cambiar de idioma y las
   * cabeceras se quedaban CONGELADAS en el idioma de carga.
   *
   * Lo destapó `audit:datatables` en su primera pasada, sobre 7 páginas. No lo
   * veía ningún gate: `i18n:check` solo compara claves y todo el e2e corre en
   * español. Mismo patrón que ya usaba `repo-list-page` para otra cosa. */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang),
    ),
    { initialValue: this.translate.currentLang },
  );

  protected readonly columns = computed<readonly ScColumnDef<User>[]>(() => [
    {
      field: 'name',
      header: this.translate.instant('users.table.name'),
      sortable: true,
      cellTemplate: this.nameTpl(),
    },
    {
      field: 'email',
      header: this.translate.instant('users.table.email'),
      sortable: true,
      cellTemplate: this.emailTpl(),
    },
    {
      field: 'identifier',
      header: this.translate.instant('users.table.identifier'),
      sortable: true,
      cellTemplate: this.identifierTpl(),
    },
    {
      field: 'type',
      header: this.translate.instant('users.table.type'),
      sortable: true,
      cellTemplate: this.typeTpl(),
    },
    {
      field: 'status',
      header: this.translate.instant('users.table.status'),
      sortable: true,
      cellTemplate: this.statusTpl(),
    },
    // Columna sin datos: `field` es solo su identidad, y la cabecera va vacía
    // igual que el `<th aria-hidden>` que sustituye.
    {
      field: 'actions', stopRowClick: true,
      header: '', headerAriaLabel: this.translate.instant('common.actions'),
      width: '48px',
      align: 'right',
      cellTemplate: this.actionsTpl(),
    },
  ]);

  /**
   * Lo que la tabla pinta de verdad: las columnas elegidas en el selector, EN
   * SU ORDEN, más la de acciones — que no es configurable y por eso no está en
   * el selector, pero sí en `columns()`. `[visibleColumns]` FILTRA por este
   * array, así que omitirla la borraría de la tabla.
   *
   * Esto sustituye a los `@if (isColVisible(...))` del marcado: la visibilidad
   * ya no se decide celda a celda, y el orden —que antes fijaba el orden de los
   * `<th>`— ahora obedece al arrastre del selector.
   */
  protected readonly tableColumns = computed<readonly string[]>(() => {
    const chosen = this.visibleColumnKeys();
    /* Hasta que el selector hidrata desde localStorage no ha emitido nada, y
     * un array vacío dejaría la tabla con solo la columna de acciones. Mismo
     * fallback que hacía `isColVisible`: las declaradas, salvo las que nazcan
     * con `defaultVisible: false`. */
    const base =
      chosen.length > 0
        ? chosen
        : this.columnDefs()
            .filter((c) => c.defaultVisible !== false)
            .map((c) => c.key);
    return [...base, 'actions'];
  });

  protected onColumnsChange(ordered: readonly string[]): void {
    this.visibleColumnKeys.set(ordered);
  }

  /**
   * Clases por fila. Solo queda el cursor: «fila seleccionada» la pinta ahora
   * la piel `.list-table` vía `p-datatable-row-selected`.
   *
   * Lee `renamingId()` a propósito, aunque no dependa de la fila: mientras se
   * renombra, `onRowClick` no abre nada, y un cursor de mano ahí mentiría.
   */
  protected readonly rowStyleClass: ScRowStyleClassFn<User> = (user) =>
    this.renamingId() === user.id ? undefined : 'table__row--clickable';

  /* Puente de selección: la fuente de verdad sigue siendo `selectedIds` —de
   * ella cuelgan la barra masiva, la edición masiva, el borrado y el export— y
   * `sc-datatable` habla de filas. Traducir en los dos sentidos aquí evita
   * reescribir media página por un cambio de tabla. */
  protected readonly selectedUsers = computed<readonly User[]>(() => {
    const ids = this.selectedIds();
    return this.sorted().filter((user) => ids.has(user.id));
  });

  protected onSelectionChange(selection: User | readonly User[] | null): void {
    const rows = Array.isArray(selection) ? selection : selection ? [selection as User] : [];
    this.selection.ids.set(new Set(rows.map((user) => user.id)));
  }

  /* `toggleSelect` / `toggleSelectAll` / `allSelected` murieron con la
   * migración a `sc-datatable`: la casilla de fila y la de cabecera las sirven
   * `p-tableCheckbox` y `p-tableHeaderCheckbox`, con la misma semántica de
   * antes (la de cabecera marca lo FILTRADO, no todo). */

  protected clearSelection(): void {
    this.selection.clear();
  }

  /* ── Edición masiva ──────────────────────────────────────────────────────
   *
   * Solo `type` y `status`. El resto de campos del usuario —nombre, email,
   * identificador— son ÚNICOS por persona: ofrecerlos en lote sería ofrecer
   * dejar a diez usuarios con el mismo email. */
  protected readonly pendingBulkEdit = signal<PendingBulkEdit | null>(null);

  protected readonly bulkEditFields = computed<readonly BulkEditFieldOption[]>(() => [
    {
      key: 'type',
      label: this.translate.instant('users.table.type'),
      values: USER_TYPES.map((t) => ({
        value: t,
        label: this.translate.instant(this.typeLabelKeys[t]),
      })),
    },
    {
      key: 'status',
      label: this.translate.instant('users.table.status'),
      values: (['active', 'inactive'] as const).map((s) => ({
        value: s,
        label: this.translate.instant(`users.status.${s}`),
      })),
    },
  ]);

  protected readonly impactItems = computed<readonly ImpactItem[]>(() => {
    const ids = this.selectedIds();
    return this.users()
      .filter((u) => ids.has(u.id))
      .map((u) => ({ id: u.id, name: u.name, hint: u.email }));
  });

  protected readonly impactBadge = computed<ImpactBadge | null>(() => {
    const op = this.pendingBulkEdit();
    return op ? { fieldLabel: op.fieldLabel, newValueLabel: op.valueLabel } : null;
  });

  protected onBulkEditCommit(commit: BulkEditCommit): void {
    this.pendingBulkEdit.set({
      field: commit.fieldKey as UserBulkField,
      fieldLabel: commit.fieldLabel,
      value: commit.value,
      valueLabel: commit.valueLabel,
    });
  }

  protected onBulkPreviewCancel(): void {
    this.pendingBulkEdit.set(null);
  }

  protected onBulkPreviewConfirm(remainingIds: readonly number[]): void {
    const op = this.pendingBulkEdit();
    if (!op) return;

    // Foto ANTES de tocar nada: es lo que devuelve el undo. Se guarda una copia
    // y no una referencia, o el "deshacer" restauraría el estado ya cambiado.
    const idSet = new Set(remainingIds);
    const snapshot = this.users()
      .filter((u) => idSet.has(u.id))
      .map((u) => ({ ...u }));

    this.usersStore.bulkUpdate(remainingIds, op.field, op.value);
    this.pendingBulkEdit.set(null);
    this.clearSelection();

    this.undoStack.push(
      this.translate.instant('common.bulk_updated', { count: remainingIds.length }),
      this.translate.instant('common.change_reverted'),
      () => {
        for (const prev of snapshot) {
          this.usersStore.updateUser(prev.id, prev);
        }
      },
    );
  }

  protected onCreateClick(): void {
    void this.router.navigateByUrl('/admin/usuarios/crear');
  }

  protected onRowClick(user: User): void {
    if (this.renamingId() === user.id) return;
    void this.router.navigateByUrl(`/admin/usuarios/editar/${user.id}`);
  }

  /** Click derecho → el MISMO `<p-menu>` que el kebab (R3). El
   *  `preventDefault()` del menú nativo lo hace ya `sc-datatable`. */
  /* WCAG 2.1.1: la fila abre la ficha con el ratón, así que tiene que abrirla
   * también con el teclado. Estas tres listas NUNCA lo tuvieron —ni antes ni
   * después de migrar; se comprobó en el árbol anterior: cero `tabindex`, cero
   * `keydown`, cero enlaces— o sea que la acción existía solo para quien usa
   * ratón. Enter abre; Espacio lo deja para la casilla, que es el reparto que
   * fijó la Ola 6 en transcripciones. */
  protected onRowKeydown(event: ScDatatableRowKeyEvent<User>): void {
    if (event.originalEvent.key !== 'Enter') return;
    event.originalEvent.preventDefault();
    this.onRowClick(event.row);
  }

  protected onRowContextMenu(
    event: ScDatatableRowEvent<User>,
    menu: { toggle: (e: Event) => void },
  ): void {
    this.setMenuTarget(event.row);
    menu.toggle(event.originalEvent);
  }

  /** Modelo del kebab compartido. Es un computed ESTABLE: solo cambia al
   *  apuntar a otra fila. Con `[model]="build(user)"` el array se recreaba en
   *  cada ciclo de CD, PrimeNG repintaba el menú y se perdía el primer clic
   *  (hacía falta doble). Mismo patrón que las tres hermanas de memory. */
  protected readonly menuItems = computed<MenuItem[]>(() => {
    const user = this.menuTargetUser();
    return user ? this.buildMenuItems(user) : [];
  });

  protected setMenuTarget(user: User): void {
    this.menuTargetUser.set(user);
  }

  private buildMenuItems(user: User): MenuItem[] {
    return [
      {
        label: this.translate.instant('common.edit'),
        icon: 'sc-icon-font sc-icon-font--edit',
        command: () => this.onRowEdit(user),
      },
      {
        label: this.translate.instant('common.duplicate'),
        icon: 'sc-icon-font sc-icon-font--content_copy',
        command: () => this.onRowDuplicate(user),
      },
      { separator: true },
      {
        // Puntos suspensivos porque lleva a la puerta tecleada, no a un
        // borrado inmediato (C4 del plan): convención de menús de escritorio
        // — "…" significa "esto abre algo antes de hacerlo".
        label: this.translate.instant('common.delete_gate'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'rules-menu-item--danger',
        command: () => this.onRowDelete(user),
      },
    ];
  }

  protected onRowEdit(user: User): void {
    void this.router.navigateByUrl(`/admin/usuarios/editar/${user.id}`);
  }

  protected onRowDuplicate(user: User): void {
    // Navega al form de creación con el source precargado vía queryParam.
    // El form-page detecta `?seedFromId` y precarga los campos copiables
    // (todos excepto los unique: name, email, identifier).
    // Si abandona sin guardar, no queda nada persistido (S47 cleanup).
    void this.router.navigate(['/admin/usuarios/crear'], {
      queryParams: { seedFromId: user.id },
    });
  }

  protected onRowDelete(user: User): void {
    this.deleteTarget.set([user]);
  }

  protected onRenameCommit(id: number, value: string): void {
    this.usersStore.updateUser(id, { name: value });
    this.renamingId.set(null);
    this.messages.add({
      severity: 'secondary',
      summary: this.translate.instant('users.toasts.duplicated', { name: value }),
      life: TOAST_LIFE.info,
    });
  }

  protected onRenameCancel(_id: number): void {
    this.renamingId.set(null);
  }

  protected requestDeleteSelection(): void {
    const ids = this.selectedIds();
    const targets = this.users().filter((u) => ids.has(u.id));
    if (targets.length > 0) this.deleteTarget.set(targets);
  }

  protected confirmDelete(remainingIds: readonly number[] | null): void {
    const target = this.deleteTarget();
    if (!target) return;

    let toasted: User[];
    if (remainingIds === null) {
      toasted = [...target];
    } else {
      const idSet = new Set(remainingIds);
      toasted = target.filter((u) => idSet.has(u.id));
    }
    const ids = toasted.map((u) => u.id);

    if (ids.length === 1) {
      this.usersStore.deleteUser(ids[0]!);
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('users.toasts.deleted_single', {
          name: toasted[0]!.name,
        }),
        life: TOAST_LIFE.success,
      });
    } else {
      this.usersStore.deleteUsers(ids);
      this.messages.add({
        severity: 'success',
        summary: this.translate.instant('users.toasts.deleted_bulk', { count: ids.length }),
        life: TOAST_LIFE.success,
      });
    }

    this.deleteTarget.set(null);
    this.clearSelection();
  }

  protected cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  /* El click derecho abre EL MISMO menú que el kebab (R3): un solo motor, un
   * solo modelo, un solo sitio donde añadir una acción. Antes había un panel
   * HTML por fila y, aparte, un menú contextual con sus propios handlers
   * duplicados — dos implementaciones que ya divergían. */

  protected onSearchKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (this.searchQuery()) {
      this.searchQuery.set('');
    } else {
      (event.target as HTMLInputElement).blur();
    }
  }

  protected onExport(): void {
    const headers = [
      this.translate.instant('users.export.code'),
      this.translate.instant('users.export.name'),
      this.translate.instant('users.export.email'),
      this.translate.instant('users.export.identifier'),
      this.translate.instant('users.export.type'),
      this.translate.instant('users.export.status'),
      this.translate.instant('users.export.created_at'),
    ];
    const rows = this.sorted().map((u) => [
      u.code,
      u.name,
      u.email,
      u.identifier,
      this.typeLabel(u.type),
      this.translate.instant(`users.status.${u.status}`),
      u.createdAt,
    ]);
    this.xlsx.export({
      headers,
      rows,
      sheetName: this.translate.instant('users.export.sheet'),
      filePrefix: 'usuarios',
    });
  }
}

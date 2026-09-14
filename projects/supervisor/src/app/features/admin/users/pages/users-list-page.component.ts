import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService, type MenuItem } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { UndoStackService, XlsxExportService } from '@core/services';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { injectLangChange } from '@core/utils/lang-change';

import { ListPageComponent } from '@shared/components';
import {
  useBulkEntityI18n,
  BulkEditCommit,
  BulkEditFieldOption,
  ScBulkEditMenuComponent as BulkEditMenuComponent,
  ColumnDef,
  type ScColumnCellContext,
  type ScColumnDef,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ImpactBadge,
  ImpactItem,
  ScImpactPreviewDialogComponent as ImpactPreviewDialogComponent,
  ScInlineRenameCellComponent as InlineRenameCellComponent,
  ScTagComponent as TagComponent,
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
    BulkEditMenuComponent,
    ButtonComponent,
    DeleteEntityDialogComponent,
    EmptyStateComponent,
    IconComponent,
    ImpactPreviewDialogComponent,
    InlineRenameCellComponent,
    ListPageComponent,
    TagComponent,
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
  private readonly lang = injectLangChange();
  private readonly router = inject(Router);
  private readonly undoStack = inject(UndoStackService);

  /** CTA proyectado a la TopBar (modelo "todo arriba" S59): la banda de
   * page-header desaparece; identidad → breadcrumb, acción → barra. */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly plusIcon = 'add';
  protected readonly emptyIcon = 'manage_accounts';

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

  /** Selección: la lista la marca; de ella cuelgan la edición en lote, el borrado y el diálogo de impacto. */
  protected readonly selectedIds = signal<ReadonlySet<User['id']>>(new Set());
  protected readonly deleteTarget = signal<readonly User[] | null>(null);
  protected readonly renamingId = signal<number | null>(null);
  protected readonly columnPrefKey = COLUMN_PREF_KEY;

  protected readonly columnDefs = computed<readonly ColumnDef[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    return [
      { key: 'name', label: this.translate.instant('users.table.name'), locked: true },
      { key: 'email', label: this.translate.instant('users.table.email') },
      { key: 'identifier', label: this.translate.instant('users.table.identifier') },
      { key: 'type', label: this.translate.instant('users.table.type') },
      { key: 'status', label: this.translate.instant('users.table.status') },
    ];
  });

  /** Qué filas casan con la búsqueda (la consulta llega ya en minúsculas). */
  protected readonly matchesSearch = (u: User, q: string): boolean =>
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.identifier.toLowerCase().includes(q) ||
    (this.translatedTypeLabels.get(u.type) ?? '').toLowerCase().includes(q);

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
  protected readonly columns = computed<readonly ScColumnDef<User>[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    return [
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
    ];
  });

  /** Mientras se renombra una fila, abrirla no hace nada (y no enseña el cursor de mano). */
  protected readonly isOpenable = (user: User): boolean => this.renamingId() !== user.id;

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
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

  protected onRowOpen(user: User): void {
    void this.router.navigateByUrl(`/admin/usuarios/editar/${user.id}`);
  }

  /** Menú de cada fila: el mismo con «⋮» y con clic derecho (lo abre la lista). */
  protected readonly rowMenu = (user: User): MenuItem[] => this.buildMenuItems(user);

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
        styleClass: 'sc-menu-item--danger',
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

  protected onExport(rows: readonly User[]): void {
    const headers = [
      this.translate.instant('users.export.code'),
      this.translate.instant('users.export.name'),
      this.translate.instant('users.export.email'),
      this.translate.instant('users.export.identifier'),
      this.translate.instant('users.export.type'),
      this.translate.instant('users.export.status'),
      this.translate.instant('users.export.created_at'),
    ];
    const data = rows.map((u) => [
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
      rows: data,
      sheetName: this.translate.instant('users.export.sheet'),
      filePrefix: 'usuarios',
    });
  }
}

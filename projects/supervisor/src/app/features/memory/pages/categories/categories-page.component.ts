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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import { MenuModule } from 'primeng/menu';
import type { MenuItem } from 'primeng/api';

import {
  type ScColumnCellContext,
  type ScColumnDef,
  ScDatatableComponent as DatatableComponent,
  type ScDatatableRowEvent,
  type ScDatatableRowKeyEvent,
  ScEmptyStateComponent as EmptyStateComponent,
  type ScRowStyleClassFn,
} from '@smartcontact-hub/components';
import { ScConfirmService } from '@smartcontact-hub/components';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { TOAST_LIFE } from '@core/utils/toast-life';

import { CategoryFormModalComponent } from '../../components/category-form-modal/category-form-modal.component';
import type { Category } from '../../data/category.types';
import { CategoriesStore } from '../../state/categories.store';
import { RulesStore } from '../../state/rules.store';

/**
 * Listado de Categorías IA · iter 11a.
 *
 * Categorías = temas/motivos de contacto que la IA etiqueta sobre las
 * conversaciones (ej. "queja facturación"). Tabla (`sc-datatable`) con
 * Nombre · Descripción · Usada en · Llamadas · Estado · Creada · Kebab.
 *
 * Iter 11b: Create/Edit panel + CategoryRuleLinking (relación
 * bidireccional con reglas).
 */
@Component({
  selector: 'sc-memory-categories-page',
  imports: [
    ButtonComponent,
    CategoryFormModalComponent,
    DatatableComponent,
    EmptyStateComponent,
    IconComponent,
    MenuModule,
    TranslateModule,
  ],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPageComponent {
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly rulesStore = inject(RulesStore);
  private readonly confirm = inject(ScConfirmService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly topBarSlot = inject(TopBarSlotService);
  private readonly destroyRef = inject(DestroyRef);

  /** CTA proyectado a la TopBar (modelo "todo arriba" S59). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    afterNextRender(() => {
      const tpl = this.topbarActions();
      if (tpl) this.topBarSlot.setActions(tpl);
    });
    this.destroyRef.onDestroy(() => this.topBarSlot.clearActions());
  }

  protected readonly categories = this.categoriesStore.categories;
  protected readonly isEmpty = this.categoriesStore.isEmpty;

  /** Derivado de `Rule.categorias` (S49 §10 #13 bidireccional) — sin estado
   *  duplicado en Category. */
  protected usedInRules(categoryId: string): number {
    return this.rulesStore.rulesUsingCategory(categoryId).length;
  }

  protected readonly formOpen = signal(false);
  protected readonly formCategory = signal<Category | null>(null);

  protected readonly tagsIcon = 'label';
  protected readonly plusIcon = 'add';
  protected readonly kebabIcon = 'more_vert';

  protected readonly menuTargetCategory = signal<Category | null>(null);

  /* ── La tabla, ahora `sc-datatable` ───────────────────────────────────
   * Las siete celdas son composiciones propias de la página (el nombre con su
   * botón, la pastilla de estado, los contadores tabulares, el kebab), así que
   * todas van por `cellTemplate`: el DS no conoce el tipo `Category`.
   *
   * `columns` es un `computed()` que LEE los `viewChild` a propósito. Esos
   * `TemplateRef` resuelven tarde, y una lista construida en el campo se
   * quedaría con `cellTemplate: undefined` para siempre — la tabla pintaría
   * `row[field]` en crudo. Al ser computed, se recalcula en cuanto resuelven.
   */
  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<Category>>>('nameTpl');
  private readonly descTpl = viewChild<TemplateRef<ScColumnCellContext<Category>>>('descTpl');
  private readonly usedInTpl = viewChild<TemplateRef<ScColumnCellContext<Category>>>('usedInTpl');
  private readonly classifiedTpl =
    viewChild<TemplateRef<ScColumnCellContext<Category>>>('classifiedTpl');
  private readonly statusTpl = viewChild<TemplateRef<ScColumnCellContext<Category>>>('statusTpl');
  private readonly createdTpl = viewChild<TemplateRef<ScColumnCellContext<Category>>>('createdTpl');
  private readonly kebabTpl = viewChild<TemplateRef<ScColumnCellContext<Category>>>('kebabTpl');

  protected readonly columns = computed<readonly ScColumnDef<Category>[]>(() => [
    {
      field: 'name',
      header: this.translate.instant('memory.categories.cols.name'),
      cellTemplate: this.nameTpl(),
    },
    {
      field: 'description',
      header: this.translate.instant('memory.categories.cols.description'),
      cellTemplate: this.descTpl(),
    },
    // `usedIn` no existe en `Category` —se deriva de `RulesStore`—, pero la
    // columna necesita igualmente un `field` único: es su identidad.
    {
      field: 'usedIn',
      header: this.translate.instant('memory.categories.cols.used_in'),
      width: '96px',
      align: 'right',
      cellTemplate: this.usedInTpl(),
    },
    {
      field: 'classifiedCalls',
      header: this.translate.instant('memory.categories.cols.classified'),
      width: '96px',
      align: 'right',
      cellTemplate: this.classifiedTpl(),
    },
    {
      field: 'status',
      header: this.translate.instant('memory.categories.cols.status'),
      width: '110px',
      cellTemplate: this.statusTpl(),
    },
    {
      field: 'createdAt',
      header: this.translate.instant('memory.categories.cols.created'),
      width: '120px',
      cellTemplate: this.createdTpl(),
    },
    // Columna sin datos: cabecera vacía, igual que el `<th aria-label>` que
    // sustituye. `stopRowClick` porque el botón para la propagación pero el
    // padding de la celda no, y fallar el kebab por dos píxeles abría la ficha.
    {
      field: 'actions',
      header: '', headerAriaLabel: this.translate.instant('common.actions'),
      width: '44px',
      stopRowClick: true,
      cellTemplate: this.kebabTpl(),
    },
  ]);

  /** Clases por fila. `table__row--clickable` (cursor) lo pinta la piel
   *  `.list-table`; `--inactive` es de esta página. */
  protected readonly rowStyleClass: ScRowStyleClassFn<Category> = (cat) =>
    cat.isActive ? 'table__row--clickable' : 'table__row--clickable categories-row--inactive';

  /** Enter sobre la fila abre la edición, igual que el clic. Se ignora cuando
   *  el foco está en un control DENTRO de la fila (el nombre, el kebab): esos
   *  ya tienen su propia acción y el evento burbujea hasta el `<tr>`. */
  protected onRowKeydown(event: ScDatatableRowKeyEvent<Category>): void {
    const native = event.originalEvent;
    if (native.key !== 'Enter') return;
    if ((native.target as HTMLElement | null)?.tagName !== 'TR') return;
    native.preventDefault();
    this.openEditForm(event.row);
  }

  /** Click derecho → el MISMO `<p-menu>` que el kebab. */
  protected onRowContextMenu(
    event: ScDatatableRowEvent<Category>,
    menu: { toggle: (e: Event) => void },
  ): void {
    this.setMenuTarget(event.row);
    menu.toggle(event.originalEvent);
  }

  /** Modelo del menú kebab (único y compartido). Es un computed estable: solo
   *  cambia al abrir otro kebab. Antes `[model]="buildMenuItems(cat)"` recreaba
   *  el array en cada ciclo de CD → PrimeNG repintaba el menú y se perdía el 1er
   *  clic (hacía falta doble). Con esto, un solo clic aplica la acción. */
  protected readonly menuItems = computed<MenuItem[]>(() => {
    const cat = this.menuTargetCategory();
    return cat ? this.buildMenuItems(cat) : [];
  });

  protected setMenuTarget(cat: Category): void {
    this.menuTargetCategory.set(cat);
  }

  protected buildMenuItems(cat: Category): MenuItem[] {
    return [
      {
        label: this.translate.instant('common.edit'),
        icon: 'sc-icon-font sc-icon-font--edit',
        command: () => this.openEditForm(cat),
      },
      {
        label: this.translate.instant('common.duplicate'),
        icon: 'sc-icon-font sc-icon-font--content_copy',
        command: () => this.duplicateCategory(cat),
      },
      {
        separator: true,
      },
      // La tabla ya pinta el estado ACTIVA/INACTIVA; sin esto no había forma de
      // cambiarlo. Mismo orden e iconos que el kebab de reglas.
      {
        label: this.translate.instant(
          cat.isActive ? 'memory.categories.menu.deactivate' : 'memory.categories.menu.activate',
        ),
        icon: cat.isActive
          ? 'sc-icon-font sc-icon-font--pause'
          : 'sc-icon-font sc-icon-font--play_arrow',
        command: () => this.categoriesStore.updateCategory(cat.id, { isActive: !cat.isActive }),
      },
      {
        label: this.translate.instant('common.delete'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'rules-menu-item--danger',
        command: () => this.confirmDelete(cat),
      },
    ];
  }

  protected onNewCategory(): void {
    this.formCategory.set(null);
    this.formOpen.set(true);
  }

  protected openEditForm(cat: Category): void {
    this.formCategory.set(cat);
    this.formOpen.set(true);
  }

  protected onFormClose(): void {
    this.formOpen.set(false);
  }

  protected onFormSaved(cat: Category): void {
    const wasEdit = this.formCategory() !== null;
    this.formOpen.set(false);
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(
        wasEdit ? 'memory.categories.form.updated_toast' : 'memory.categories.form.created_toast',
        { name: cat.name },
      ),
      life: TOAST_LIFE.success,
    });
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  private duplicateCategory(cat: Category): void {
    const copy = this.categoriesStore.duplicateCategory(cat.id);
    if (!copy) return;
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('memory.categories.duplicated_toast', { name: copy.name }),
      life: TOAST_LIFE.success,
    });
  }

  private async confirmDelete(cat: Category): Promise<void> {
    const accepted = await this.confirm.request({
      title: this.translate.instant('memory.categories.delete_title'),
      body: this.translate.instant('memory.categories.delete_body', { name: cat.name }),
      acceptLabel: this.translate.instant('common.delete'),
      rejectLabel: this.translate.instant('common.cancel'),
      acceptTone: 'danger',
    });
    if (!accepted) return;
    this.categoriesStore.deleteCategory(cat.id);
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('memory.categories.deleted_toast', { name: cat.name }),
      life: TOAST_LIFE.success,
    });
  }
}

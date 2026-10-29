import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import { injectAlertModal } from '@core/services';
import { ScTagComponent as TagComponent } from '@smartcontact-hub/components';
import type { MenuItem } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

import {
  type ScColumnCellContext,
  type ScColumnDef,
  ScEmptyStateComponent as EmptyStateComponent,
} from '@smartcontact-hub/components';
import { LanguageService, ResultadoAccionService } from '@core/services';
import { injectLangChange } from '@core/utils/lang-change';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { ListPageComponent } from '@shared/components';

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
    TooltipModule,
    TagComponent,
    ButtonComponent,
    CategoryFormModalComponent,
    EmptyStateComponent,
    IconComponent,
    ListPageComponent,
    TranslateModule,
  ],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPageComponent {
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly rulesStore = inject(RulesStore);
  private readonly alertModal = injectAlertModal();
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly language = inject(LanguageService);

  /** CTA proyectado a la TopBar (modelo "todo arriba" S59). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
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

  protected readonly columns = computed<readonly ScColumnDef<Category>[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    return [
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
        skeleton: 'tag',
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
    ];
  });

  /** La fila inactiva se atenúa (`categories-row--inactive`, en el SCSS de esta página). */
  protected readonly rowClass = (cat: Category): string | undefined =>
    cat.isActive ? undefined : 'categories-row--inactive';

  /** Menú de cada fila: el mismo con «⋮» y con clic derecho (lo abre la lista). */
  /** Filas marcadas: la lista las pinta; sin barra de lote, borrar varios va por el clic derecho sobre una marcada. */
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());

  /** Con varios marcados, el clic derecho sobre uno de ellos ofrece solo «Eliminar» (la misma regla que Grupos y Agentes). */
  protected readonly selectionMenu = (rows: readonly Category[]): MenuItem[] => [
    {
      label: this.translate.instant('common.delete_count', { count: rows.length }),
      icon: 'sc-icon-font sc-icon-font--delete',
      styleClass: 'sc-menu-item--danger',
      command: () => void this.confirmDeleteMany(rows),
    },
  ];

  protected readonly rowMenu = (cat: Category): MenuItem[] => this.buildMenuItems(cat);

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
        styleClass: 'sc-menu-item--danger',
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
    this.resultado.contar(this.translate.instant( wasEdit ? 'memory.categories.form.updated_toast' : 'memory.categories.form.created_toast', { name: cat.name }, ));
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(this.language.locale(), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  private duplicateCategory(cat: Category): void {
    const copy = this.categoriesStore.duplicateCategory(cat.id);
    if (!copy) return;
    this.resultado.contar(this.translate.instant('memory.categories.duplicated_toast', { name: copy.name }));
  }

  private async confirmDelete(cat: Category): Promise<void> {
    const accepted = await this.alertModal({
      variant: 'error',
      title: this.translate.instant('memory.categories.delete_title'),
      message: this.translate.instant('memory.categories.delete_body', { name: cat.name }),
      actionLabel: this.translate.instant('common.delete'),
      secondaryActionLabel: this.translate.instant('common.cancel'),
    });
    if (!accepted) return;
    this.categoriesStore.deleteCategory(cat.id);
    this.resultado.contar(this.translate.instant('memory.categories.deleted_toast', { name: cat.name }));
  }

  private async confirmDeleteMany(rows: readonly Category[]): Promise<void> {
    const accepted = await this.alertModal({
      variant: 'error',
      title: this.translate.instant('memory.categories.delete_title_bulk', { count: rows.length }),
      message: this.translate.instant('common.delete_dialog.body'),
      actionLabel: this.translate.instant('common.delete'),
      secondaryActionLabel: this.translate.instant('common.cancel'),
    });
    if (!accepted) return;
    for (const row of rows) this.categoriesStore.deleteCategory(row.id);
    this.selectedIds.set(new Set());
    this.resultado.contar(this.translate.instant('memory.categories.deleted_bulk_toast', { count: rows.length }));
  }
}

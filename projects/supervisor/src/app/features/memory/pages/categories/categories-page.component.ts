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
import { MessageService } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import { ScTagComponent as TagComponent } from '@smartcontact-hub/components';
import type { MenuItem } from 'primeng/api';

import {
  type ScColumnCellContext,
  type ScColumnDef,
  ScEmptyStateComponent as EmptyStateComponent,
} from '@smartcontact-hub/components';
import { ScConfirmService } from '@smartcontact-hub/components';
import { LanguageService } from '@core/services';
import { TOAST_LIFE } from '@core/utils/toast-life';
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
  private readonly confirm = inject(ScConfirmService);
  private readonly messages = inject(MessageService);
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
    return new Date(iso).toLocaleDateString(this.language.locale(), {
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

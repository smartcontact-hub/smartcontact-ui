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
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import type { MenuItem } from 'primeng/api';

import { IconComponent } from '@shared/components';
import { ScEmptyStateComponent as EmptyStateComponent } from '@smartcontact-hub/components';
import { ConfirmHostService } from '@core/services/confirm-host.service';
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
 * conversaciones (ej. "queja facturación"). Tabla con 5 cols: Nombre ·
 * Descripción · Usada en · Llamadas · Estado · Kebab.
 *
 * Iter 11b: Create/Edit panel + CategoryRuleLinking (relación
 * bidireccional con reglas).
 */
@Component({
  selector: 'sc-memory-categories-page',
  imports: [
    ButtonModule,
    CategoryFormModalComponent,
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
  private readonly confirm = inject(ConfirmHostService);
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

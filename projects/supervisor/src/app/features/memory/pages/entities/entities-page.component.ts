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
import { ScEmptyStateComponent as EmptyStateComponent } from '@smartcontact-hub/components';
import { MenuModule } from 'primeng/menu';
import type { MenuItem } from 'primeng/api';

import { ConfirmHostService } from '@core/services/confirm-host.service';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { TOAST_LIFE } from '@core/utils/toast-life';

import { EntityFormModalComponent } from '../../components/entity-form-modal/entity-form-modal.component';
import type { Entity } from '../../data/entity.types';
import { EntitiesStore } from '../../state/entities.store';

/**
 * Listado de entidades Memory · iter 10a.
 *
 * 2 secciones: User entities (editables) + System entities (inmutables,
 * lock icon). Tabla 5 cols: Nombre · Tipo · Descripción · Formato · Kebab.
 *
 * Iter 10b añade Create + Edit (modal + sidepanel).
 */
@Component({
  selector: 'sc-memory-entities-page',
  imports: [
    ButtonComponent,
    EmptyStateComponent,
    EntityFormModalComponent,
    IconComponent,
    MenuModule,
    TranslateModule,
  ],
  templateUrl: './entities-page.component.html',
  styleUrl: './entities-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntitiesPageComponent {
  private readonly entitiesStore = inject(EntitiesStore);
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

  protected readonly userEntities = this.entitiesStore.userEntities;
  protected readonly systemEntities = this.entitiesStore.systemEntities;
  protected readonly hasUserEntities = this.entitiesStore.hasUserEntities;

  protected readonly formOpen = signal(false);
  protected readonly formEntity = signal<Entity | null>(null);

  protected readonly databaseIcon = 'database';
  protected readonly plusIcon = 'add';
  protected readonly kebabIcon = 'more_vert';
  protected readonly lockIcon = 'lock';

  protected readonly menuTargetEntity = signal<Entity | null>(null);

  /** Modelo del menú kebab (único y compartido). Es un computed estable: solo
   *  cambia al abrir otro kebab. Antes `[model]="buildMenuItems(entity)"` recreaba
   *  el array en cada ciclo de CD → PrimeNG repintaba el menú y se perdía el 1er
   *  clic (hacía falta doble). Con esto, un solo clic aplica la acción. */
  protected readonly menuItems = computed<MenuItem[]>(() => {
    const entity = this.menuTargetEntity();
    return entity ? this.buildMenuItems(entity) : [];
  });

  protected setMenuTarget(entity: Entity): void {
    this.menuTargetEntity.set(entity);
  }

  protected buildMenuItems(entity: Entity): MenuItem[] {
    return [
      {
        label: this.translate.instant('common.edit'),
        icon: 'sc-icon-font sc-icon-font--edit',
        command: () => this.openEditForm(entity),
      },
      {
        separator: true,
      },
      {
        label: this.translate.instant('common.delete'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'rules-menu-item--danger',
        command: () => this.confirmDelete(entity),
      },
    ];
  }

  protected onNewEntity(): void {
    this.formEntity.set(null);
    this.formOpen.set(true);
  }

  protected openEditForm(entity: Entity): void {
    this.formEntity.set(entity);
    this.formOpen.set(true);
  }

  protected onFormClose(): void {
    this.formOpen.set(false);
  }

  protected onFormSaved(entity: Entity): void {
    const wasEdit = this.formEntity() !== null;
    this.formOpen.set(false);
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(
        wasEdit ? 'memory.entities.form.updated_toast' : 'memory.entities.form.created_toast',
        { name: entity.name },
      ),
      life: TOAST_LIFE.success,
    });
  }

  private async confirmDelete(entity: Entity): Promise<void> {
    const accepted = await this.confirm.request({
      title: this.translate.instant('memory.entities.delete_title'),
      body: this.translate.instant('memory.entities.delete_body', { name: entity.name }),
      acceptLabel: this.translate.instant('common.delete'),
      rejectLabel: this.translate.instant('common.cancel'),
      acceptTone: 'danger',
    });
    if (!accepted) return;
    this.entitiesStore.deleteEntity(entity.id);
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('memory.entities.deleted_toast', { name: entity.name }),
      life: TOAST_LIFE.success,
    });
  }
}

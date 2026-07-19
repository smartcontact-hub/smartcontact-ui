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

import {
  ScConfirmService,
  type ScColumnCellContext,
  type ScColumnDef,
  ScDatatableComponent as DatatableComponent,
  type ScDatatableRowEvent,
  type ScDatatableRowKeyEvent,
  type ScRowStyleClassFn,
} from '@smartcontact-hub/components';
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
    DatatableComponent,
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

  protected readonly userEntities = this.entitiesStore.userEntities;
  protected readonly systemEntities = this.entitiesStore.systemEntities;
  protected readonly hasUserEntities = this.entitiesStore.hasUserEntities;

  protected readonly formOpen = signal(false);
  protected readonly formEntity = signal<Entity | null>(null);

  protected readonly databaseIcon = 'database';
  protected readonly plusIcon = 'add';
  protected readonly kebabIcon = 'more_vert';
  protected readonly lockIcon = 'lock';

  /* ── Las dos tablas, ahora `sc-datatable` ─────────────────────────────
   * Las cuatro celdas de datos son composiciones propias de la página (el
   * `<code>` del nombre, el chip de tipo, la descripción con puntos
   * suspensivos, el formato en gris pequeño), así que van todas por
   * `cellTemplate`: el `<td>` lo pinta ahora el DS y una regla encapsulada de
   * esta página no lo alcanzaría. El `<span>` proyectado sí conserva el
   * `_ngcontent` de la página, y por eso los estilos de celda siguen vivos.
   *
   * `userColumns`/`systemColumns` son `computed()` que LEEN los `viewChild` a
   * propósito. Esos `TemplateRef` resuelven tarde, y una lista construida en el
   * campo se quedaría con `cellTemplate: undefined` para siempre — la tabla
   * pintaría `row[field]` en crudo. Al ser computed, se recalcula en cuanto
   * resuelven.
   *
   * Las plantillas se comparten entre las dos tablas: el chip lee `isSystem`
   * de la propia fila, que es lo que antes distinguía el markup de una sección
   * y el de la otra.
   */
  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<Entity>>>('nameTpl');
  private readonly typeTpl = viewChild<TemplateRef<ScColumnCellContext<Entity>>>('typeTpl');
  private readonly descTpl = viewChild<TemplateRef<ScColumnCellContext<Entity>>>('descTpl');
  private readonly formatTpl = viewChild<TemplateRef<ScColumnCellContext<Entity>>>('formatTpl');
  private readonly actionsTpl = viewChild<TemplateRef<ScColumnCellContext<Entity>>>('actionsTpl');

  /** Las cuatro columnas de datos, iguales en las dos secciones. */
  private readonly dataColumns = computed<readonly ScColumnDef<Entity>[]>(() => [
    {
      field: 'name',
      header: this.translate.instant('memory.entities.cols.name'),
      cellTemplate: this.nameTpl(),
    },
    {
      field: 'type',
      header: this.translate.instant('memory.entities.cols.type'),
      width: '140px',
      cellTemplate: this.typeTpl(),
    },
    {
      field: 'description',
      header: this.translate.instant('memory.entities.cols.description'),
      cellTemplate: this.descTpl(),
    },
    {
      field: 'format',
      header: this.translate.instant('memory.entities.cols.format'),
      width: '140px',
      cellTemplate: this.formatTpl(),
    },
  ]);

  protected readonly userColumns = computed<readonly ScColumnDef<Entity>[]>(() => [
    ...this.dataColumns(),
    // Columna sin datos: `field` es solo su identidad. `stopRowClick` porque el
    // kebab para la propagación pero el HUECO de la celda no, y fallar el botón
    // por unos píxeles abriría la edición.
    { field: 'actions', header: '', headerAriaLabel: this.translate.instant('common.actions'), width: '44px', stopRowClick: true, cellTemplate: this.actionsTpl() },
  ]);

  /** System entities: mismas columnas, sin kebab (son inmutables). */
  protected readonly systemColumns = this.dataColumns;

  /** La fila de user entities abre la edición: el cursor tiene que decirlo. La
   *  clase la pinta el DS en el `<tr>`, y la estiliza `_sc-datatable-list.scss`
   *  (global, porque el `<tr>` no lleva el `_ngcontent` de esta página). */
  protected readonly rowClass: ScRowStyleClassFn<Entity> = () => 'table__row--clickable';

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

  /* WCAG 2.1.1: la fila abre la edición con el ratón, así que tiene que
   * abrirla con el teclado. Antes el camino de teclado era un `<button>` con
   * el nombre dentro de la celda; ahora la fila es el objetivo focusable
   * (`rowsFocusable`) y Enter la abre. Espacio se deja libre a propósito: es
   * el gesto de la casilla en el reparto canónico, aunque esta tabla todavía
   * no tenga selección. */
  protected onRowKeydown(event: ScDatatableRowKeyEvent<Entity>): void {
    if (event.originalEvent.key !== 'Enter') return;
    event.originalEvent.preventDefault();
    this.openEditForm(event.row);
  }

  /** Click derecho → el MISMO `<p-menu>` que el kebab (R3). El DS ya canceló
   *  el menú nativo del navegador. */
  protected onRowContextMenu(
    event: ScDatatableRowEvent<Entity>,
    menu: { toggle: (e: Event) => void },
  ): void {
    this.setMenuTarget(event.row);
    menu.toggle(event.originalEvent);
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

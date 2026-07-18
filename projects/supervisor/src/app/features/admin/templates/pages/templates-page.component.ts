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
import { MessageService, type MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { ClickOutsideDirective } from '@core/directives';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { TOAST_LIFE } from '@core/utils/toast-life';

import {
  ScBulkActionBarComponent as BulkActionBarComponent,
  useBulkEntityI18n,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ScSearchComponent as SearchComponent,
} from '@smartcontact-hub/components';
import { Template, TemplateType } from '../data/templates-data';
import { TemplatesStore } from '../state/templates.store';
import {
  TemplateFormPanelComponent,
  TemplateFormSubmission,
} from '../components/template-form-panel/template-form-panel.component';

@Component({
  selector: 'sc-templates-page',
  imports: [
    BulkActionBarComponent,
    ButtonComponent,
    ClickOutsideDirective,
    DeleteEntityDialogComponent,
    EmptyStateComponent,
    IconComponent,
    MenuModule,
    SearchComponent,
    TemplateFormPanelComponent,
    TranslateModule,
  ],
  templateUrl: './templates-page.component.html',
  styleUrl: './templates-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesPageComponent {
  private readonly templatesStore = inject(TemplatesStore);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly topBarSlot = inject(TopBarSlotService);
  private readonly destroyRef = inject(DestroyRef);

  /** CTA + panel inline proyectados a la TopBar (modelo "todo arriba" S59). */
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
  protected readonly fileStackIcon = 'file_copy';
  protected readonly chatIcon = 'chat_bubble';
  protected readonly emailIcon = 'mail';
  protected readonly moreIcon = 'more_vert';

  protected readonly templates = this.templatesStore.templates;

  protected readonly activeTab = signal<TemplateType>('chat');
  protected readonly searchQuery = signal('');
  protected readonly creating = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly selectedIds = signal<ReadonlySet<number>>(new Set());
  /** Fila a la que apunta el kebab compartido. Ver `menuItems`. */
  protected readonly menuTargetTemplate = signal<Template | null>(null);
  protected readonly deleteTarget = signal<readonly Template[] | null>(null);

  protected readonly chatCount = computed(
    () => this.templates().filter((t) => t.type === 'chat').length,
  );
  protected readonly emailCount = computed(
    () => this.templates().filter((t) => t.type === 'email').length,
  );

  protected readonly filtered = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tab = this.activeTab();
    return this.templates().filter(
      (t) =>
        t.type === tab &&
        (query === '' ||
          t.title.toLowerCase().includes(query) ||
          t.body.toLowerCase().includes(query)),
    );
  });

  protected readonly sorted = computed(() =>
    [...this.filtered()].sort((a, b) => a.title.localeCompare(b.title)),
  );

  protected readonly existingTitles = computed(() => this.templates().map((t) => t.title));

  protected readonly allSelected = computed(() => {
    const sortedLen = this.sorted().length;
    return sortedLen > 0 && this.selectedIds().size === sortedLen;
  });

  protected readonly deleteItems = computed(() =>
    (this.deleteTarget() ?? []).map((t) => ({ id: t.id, name: t.title })),
  );

  protected readonly bulkEntity = useBulkEntityI18n({
    singular: 'common.bulk.entity.template_singular',
    plural: 'common.bulk.entity.template_plural',
    selectedOne: 'common.bulk.entity.template_selected_one',
    selectedOther: 'common.bulk.entity.template_selected_other',
  });

  protected switchTab(tab: TemplateType): void {
    this.activeTab.set(tab);
    this.searchQuery.set('');
    this.selectedIds.set(new Set());
    this.editingId.set(null);
    this.creating.set(false);
  }

  protected onCreateClick(): void {
    this.editingId.set(null);
    this.creating.update((c) => !c);
  }

  protected onCreateSubmit(submission: TemplateFormSubmission): void {
    const created = this.templatesStore.addTemplate({
      title: submission.title,
      type: submission.type,
      body: submission.body,
    });
    this.creating.set(false);
    // Switch to the channel of the new template so the user sees it land.
    if (created.type !== this.activeTab()) {
      this.activeTab.set(created.type);
    }
    this.toastSuccess('templates.toasts.created', { name: created.title });
  }

  protected onEditSubmit(id: number, submission: TemplateFormSubmission): void {
    this.templatesStore.updateTemplate(id, {
      title: submission.title,
      type: submission.type,
      body: submission.body,
    });
    this.editingId.set(null);
    this.toastSuccess('templates.toasts.updated', { name: submission.title });
  }

  protected toggleSelect(id: number): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected toggleSelectAll(): void {
    this.selectedIds.update((current) => {
      const sorted = this.sorted();
      if (current.size === sorted.length) return new Set();
      return new Set(sorted.map((t) => t.id));
    });
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  protected requestDeleteSelection(): void {
    const ids = this.selectedIds();
    const targets = this.templates().filter((t) => ids.has(t.id));
    if (targets.length > 0) this.deleteTarget.set(targets);
  }

  protected confirmDelete(remainingIds: readonly number[] | null): void {
    const target = this.deleteTarget();
    if (!target) return;

    let ids: number[];
    let toasted: Template[];
    if (remainingIds === null) {
      ids = target.map((t) => t.id);
      toasted = [...target];
    } else {
      const idSet = new Set(remainingIds);
      toasted = target.filter((t) => idSet.has(t.id));
      ids = toasted.map((t) => t.id);
    }

    if (ids.length === 1) {
      this.templatesStore.deleteTemplate(ids[0]!);
      this.toastSuccess('templates.toasts.deleted_single', { name: toasted[0]!.title });
    } else {
      this.templatesStore.deleteTemplates(ids);
      this.toastSuccess('templates.toasts.deleted_bulk', { count: ids.length });
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

  /** Modelo del kebab compartido. Es un computed ESTABLE: solo cambia al
   *  apuntar a otra fila. Con `[model]="build(tpl)"` el array se recreaba en
   *  cada ciclo de CD, PrimeNG repintaba el menú y se perdía el primer clic
   *  (hacía falta doble). Mismo patrón que las tres hermanas de memory. */
  protected readonly menuItems = computed<MenuItem[]>(() => {
    const tpl = this.menuTargetTemplate();
    return tpl ? this.buildMenuItems(tpl) : [];
  });

  protected setMenuTarget(tpl: Template): void {
    this.menuTargetTemplate.set(tpl);
  }

  private buildMenuItems(tpl: Template): MenuItem[] {
    return [
      {
        label: this.translate.instant('common.edit'),
        icon: 'sc-icon-font sc-icon-font--edit',
        command: () => this.onRowEdit(tpl),
      },
      { separator: true },
      {
        // Puntos suspensivos porque lleva a la puerta tecleada, no a un
        // borrado inmediato (C4 del plan): convención de menús de escritorio
        // — "…" significa "esto abre algo antes de hacerlo".
        label: this.translate.instant('common.delete_gate'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'rules-menu-item--danger',
        command: () => this.onRowDelete(tpl),
      },
    ];
  }

  protected onRowEdit(tpl: Template): void {
    this.editingId.set(tpl.id);
    this.creating.set(false);
  }

  protected onRowDelete(tpl: Template): void {
    this.deleteTarget.set([tpl]);
  }

  protected closeCreatePanel(): void {
    this.creating.set(false);
  }

  protected closeEditPanel(): void {
    this.editingId.set(null);
  }

  protected onSearchKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (this.searchQuery()) {
      this.searchQuery.set('');
    } else {
      (event.target as HTMLInputElement).blur();
    }
  }

  private toastSuccess(key: string, params?: Record<string, string | number>): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(key, params),
      life: TOAST_LIFE.success,
    });
  }
}

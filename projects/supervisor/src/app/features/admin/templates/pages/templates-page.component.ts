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
import { MessageService, type MenuItem } from 'primeng/api';
import { TabsModule } from 'primeng/tabs';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { ClickOutsideDirective } from '@core/directives';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { TOAST_LIFE } from '@core/utils/toast-life';
import { injectLangChange } from '@core/utils/lang-change';

import { ListPageComponent } from '@shared/components';
import {
  useBulkEntityI18n,
  type ScColumnCellContext,
  type ScColumnDef,
  ScDeleteEntityDialogComponent as DeleteEntityDialogComponent,
  ScEmptyStateComponent as EmptyStateComponent,
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
    TabsModule,
    ButtonComponent,
    ClickOutsideDirective,
    DeleteEntityDialogComponent,
    EmptyStateComponent,
    IconComponent,
    ListPageComponent,
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
  private readonly lang = injectLangChange();

  /** CTA + panel inline proyectados a la TopBar (modelo "todo arriba" S59). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly plusIcon = 'add';
  protected readonly searchIcon = 'search';
  protected readonly fileStackIcon = 'file_copy';

  protected readonly templates = this.templatesStore.templates;

  protected readonly activeTab = signal<TemplateType>('chat');
  protected readonly searchQuery = signal('');
  protected readonly creating = signal(false);
  protected readonly editingId = signal<number | null>(null);
  /** Selección: la lista la marca; de ella cuelgan la barra en lote y el borrado. */
  protected readonly selectedIds = signal<ReadonlySet<Template['id']>>(new Set());
  protected readonly deleteTarget = signal<readonly Template[] | null>(null);


  /** Las de la pestaña activa, por título: esta lista no tiene cabeceras para ordenar. */
  protected readonly tabRows = computed(() => {
    const tab = this.activeTab();
    return this.templates()
      .filter((t) => t.type === tab)
      .sort((a, b) => a.title.localeCompare(b.title));
  });

  /** Qué filas casan con la búsqueda (la consulta llega ya en minúsculas). */
  protected readonly matchesSearch = (t: Template, q: string): boolean =>
    t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q);

  /** Nombre de la fila para lectores de pantalla: una plantilla se llama por su título. */
  protected readonly rowLabel = (t: Template): string => t.title;

  protected readonly existingTitles = computed(() => this.templates().map((t) => t.title));

  /* ── La tabla, ahora `sc-datatable` (B4) — misma receta que labels ─────
   * `columns` es un `computed()` que lee los `viewChild`: los `TemplateRef`
   * resuelven tarde y una lista fija se quedaría sin `cellTemplate`. */
  private readonly titleTpl = viewChild<TemplateRef<ScColumnCellContext<Template>>>('titleTpl');
  private readonly bodyTpl = viewChild<TemplateRef<ScColumnCellContext<Template>>>('bodyTpl');
  private readonly updatedTpl = viewChild<TemplateRef<ScColumnCellContext<Template>>>('updatedTpl');

  protected readonly columns = computed<readonly ScColumnDef<Template>[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    return [
      {
        field: 'title',
        header: this.translate.instant('templates.table.title'),
        cellTemplate: this.titleTpl(),
      },
      {
        field: 'body',
        header: this.translate.instant('templates.table.body'),
        cellTemplate: this.bodyTpl(),
      },
      /* `updatedAt` sí lleva cellTemplate aunque sea texto plano: su tipografía
       * (12px, gris tenue) vive en el SCSS de ESTA página, y el `<td>` lo pinta
       * ahora el DS — una regla encapsulada aquí no lo alcanzaría. El `<span>`
       * proyectado sí conserva el encapsulado de la página. */
      {
        field: 'updatedAt',
        header: this.translate.instant('templates.table.updated'),
        width: '112px',
        cellTemplate: this.updatedTpl(),
      },
    ];
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

  /** `p-tabs` avisa con el `value` de la pestaña (`string | number | undefined`). */
  protected onTabChange(value: string | number | undefined): void {
    if (value === 'chat' || value === 'email') this.switchTab(value);
  }

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

  /** Menú de cada fila: el mismo con «⋮» y con clic derecho (lo abre la lista). */
  protected readonly rowMenu = (tpl: Template): MenuItem[] => this.buildMenuItems(tpl);

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
        styleClass: 'sc-menu-item--danger',
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

  private toastSuccess(key: string, params?: Record<string, string | number>): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(key, params),
      life: TOAST_LIFE.success,
    });
  }
}

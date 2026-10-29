import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import { injectAlertModal } from '@core/services';
import { ScTagComponent as TagComponent } from '@smartcontact-hub/components';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import type { MenuItem } from 'primeng/api';

import { ScEmptyStateComponent as EmptyStateComponent } from '@smartcontact-hub/components';
import { ScMessageComponent as MessageComponent } from '@smartcontact-hub/components';
import { type ScColumnCellContext, type ScColumnDef } from '@smartcontact-hub/components';
import { LanguageService, ResultadoAccionService } from '@core/services';
import { injectLangChange } from '@core/utils/lang-change';
import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { ListPageComponent } from '@shared/components';

import { ConditionResolverService } from '../../data/condition-resolver.service';
import { describeConditionTree } from '../../data/condition.types';
import type { Rule } from '../../data/rule.types';
import { RulesStore } from '../../state/rules.store';

/**
 * Listado de reglas Memory.
 *
 * Tabla única (activas primero) + kebab (Editar / Duplicar / Activar-Desactivar /
 * Eliminar con confirmación danger). Sin priorización: pueden convivir varias
 * reglas activas y el solape se resuelve por unión (DD-30).
 */
@Component({
  selector: 'sc-memory-rules-page',
  imports: [
    TagComponent,
    ButtonComponent,
    EmptyStateComponent,
    IconComponent,
    ListPageComponent,
    MenuModule,
    MessageComponent,
    RouterLink,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './rules-page.component.html',
  styleUrl: './rules-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesPageComponent {
  private readonly rulesStore = inject(RulesStore);
  private readonly resolver = inject(ConditionResolverService);
  private readonly alertModal = injectAlertModal();
  private readonly resultado = inject(ResultadoAccionService);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);

  /** CTA + menú "nueva regla" proyectados a la TopBar (modelo "todo arriba" S59). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly activeRules = this.rulesStore.activeRules;
  protected readonly inactiveRules = this.rulesStore.inactiveRules;
  protected readonly isEmpty = this.rulesStore.isEmpty;
  protected readonly hasActive = this.rulesStore.hasActive;

  /** Una sola tabla: las activas primero, luego las inactivas (cada grupo
   *  por lastModified desc). El estado va en columna, sin secciones separadas. */
  protected readonly allRules = computed(() => [
    ...this.rulesStore.activeRules(),
    ...this.rulesStore.inactiveRules(),
  ]);

  /* ── La tabla, ahora `sc-datatable` (B4) ──────────────────────────────
   * Las seis celdas son composiciones propias de la página (enlace a la
   * regla, prosa del alcance, chips de acción, pastilla de estado, fecha
   * relativa, kebab), así que van todas por `cellTemplate`: el DS no conoce
   * el tipo `Rule` ni tiene por qué.
   *
   * `columns` es un `computed()` que LEE los `viewChild` a propósito. Esos
   * `TemplateRef` resuelven tarde, y una lista construida en el campo se
   * quedaría con `cellTemplate: undefined` para siempre — la tabla pintaría
   * `row[field]` en crudo. Al ser computed, se recalcula en cuanto resuelven.
   */
  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<Rule>>>('nameTpl');
  private readonly scopeTpl = viewChild<TemplateRef<ScColumnCellContext<Rule>>>('scopeTpl');
  private readonly actionsTpl = viewChild<TemplateRef<ScColumnCellContext<Rule>>>('actionsTpl');
  private readonly statusTpl = viewChild<TemplateRef<ScColumnCellContext<Rule>>>('statusTpl');
  private readonly modifiedTpl = viewChild<TemplateRef<ScColumnCellContext<Rule>>>('modifiedTpl');

  /** Los anchos son los mismos `width` que tenían los `<th>` a mano; con
   *  `table-layout: fixed` (lo pone `.list-table`) nombre y alcance se reparten
   *  el resto, igual que antes. */
  protected readonly columns = computed<readonly ScColumnDef<Rule>[]>(() => {
    this.lang(); // cabeceras al día al cambiar de idioma (ver `injectLangChange`)
    return [
      {
        field: 'name',
        header: this.translate.instant('memory.rules.cols.name'),
        cellTemplate: this.nameTpl(),
      },
      {
        field: 'scope',
        header: this.translate.instant('memory.rules.cols.scope'),
        cellTemplate: this.scopeTpl(),
      },
      {
        field: 'actions',
        skeleton: 'tag',
        header: this.translate.instant('memory.rules.cols.actions'),
        width: '110px',
        cellTemplate: this.actionsTpl(),
      },
      {
        field: 'status',
        skeleton: 'tag',
        header: this.translate.instant('memory.rules.cols.status'),
        width: '140px',
        cellTemplate: this.statusTpl(),
      },
      {
        field: 'lastModified',
        header: this.translate.instant('memory.rules.cols.last_modified'),
        width: '120px',
        cellTemplate: this.modifiedTpl(),
      },
    ];
  });

  /** Menú de cada fila: el mismo con «⋮» y con clic derecho (lo abre la lista). */
  /** Filas marcadas: la lista las pinta; sin barra de lote, borrar varios va por el clic derecho sobre una marcada. */
  protected readonly selectedIds = signal<ReadonlySet<number>>(new Set());

  /** Con varios marcados, el clic derecho sobre uno de ellos ofrece solo «Eliminar» (la misma regla que Grupos y Agentes). */
  protected readonly selectionMenu = (rows: readonly Rule[]): MenuItem[] => [
    {
      label: this.translate.instant('common.delete_count', { count: rows.length }),
      icon: 'sc-icon-font sc-icon-font--delete',
      styleClass: 'sc-menu-item--danger',
      command: () => void this.confirmDeleteMany(rows),
    },
  ];

  protected readonly rowMenu = (rule: Rule): MenuItem[] => this.buildMenuItems(rule);

  protected readonly settingsIcon = 'tune';
  protected readonly emptyIcon = 'rule';
  protected readonly plusIcon = 'add';
  /** Mismo icono que el flujo de transcripciones (player, `description`) → ley de similitud. */
  protected readonly transcriptionIcon = 'description';
  protected readonly sparklesIcon = 'auto_awesome';

  protected onNewRule(type: 'transcription' | 'classification' = 'transcription'): void {
    this.router.navigate(['/conversaciones/reglas/nueva'], {
      queryParams: { type },
    });
  }

  /** «Nueva regla» abre un menú: lo dice, y si está abierto (DD-171). */
  protected readonly newRuleMenuOpen = signal(false);
  protected readonly newRuleMenuItems: MenuItem[] = [
    {
      label: 'Regla de transcripción',
      icon: 'sc-icon-font sc-icon-font--description',
      command: () => this.onNewRule('transcription'),
    },
    {
      label: 'Regla de clasificación con IA',
      icon: 'sc-icon-font sc-icon-font--auto_awesome',
      command: () => this.onNewRule('classification'),
    },
  ];

  /** Resumen del alcance: la PROSA del árbol (refleja tipificación/duración/
   *  contradicciones de verdad). Reglas antiguas sin árbol → fallback plano. */
  protected scopeSummary(rule: Rule): string {
    if (rule.conditionTree) {
      return describeConditionTree(rule.conditionTree, (ref) => this.resolver.label(ref));
    }
    return this.legacyScopeSummary(rule);
  }

  private legacyScopeSummary(rule: Rule): string {
    const parts: string[] = [];
    if (rule.servicios.length === 1) {
      parts.push(`Servicio ${rule.servicios[0]}`);
    } else if (rule.servicios.length > 1) {
      parts.push(`${rule.servicios.length} servicios`);
    }
    if (rule.grupos.length === 1) {
      parts.push(`grupo ${rule.grupos[0]}`);
    } else if (rule.grupos.length > 1) {
      parts.push(`${rule.grupos.length} grupos`);
    }
    if (rule.agentes.length === 1) {
      parts.push(`agente ${rule.agentes[0]}`);
    } else if (rule.agentes.length > 1) {
      parts.push(`${rule.agentes.length} agentes`);
    }
    return parts.length > 0 ? parts.join(', ') : 'Cualquier conversación';
  }

  protected formatRelativeDate(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) return this.translate.instant('memory.rules.relative.minutes_ago');
    if (diffHours < 24) return this.translate.instant('memory.rules.relative.hours_ago', { n: diffHours });
    if (diffDays === 1) return this.translate.instant('memory.rules.relative.yesterday');
    if (diffDays < 7) return this.translate.instant('memory.rules.relative.days_ago', { n: diffDays });
    return date.toLocaleDateString(this.language.locale(), { day: 'numeric', month: 'short' });
  }

  /** Click en la fila abre la regla en el constructor (la fila actúa de enlace). */
  protected openRule(rule: Rule): void {
    this.router.navigate(['/conversaciones/reglas', rule.id]);
  }

  protected buildMenuItems(rule: Rule): MenuItem[] {
    const toggleLabel = rule.active
      ? this.translate.instant('memory.rules.menu.deactivate')
      : this.translate.instant('memory.rules.menu.activate');
    return [
      {
        label: this.translate.instant('common.edit'),
        icon: 'sc-icon-font sc-icon-font--edit',
        command: () => this.router.navigate(['/conversaciones/reglas', rule.id]),
      },
      {
        label: this.translate.instant('common.duplicate'),
        icon: 'sc-icon-font sc-icon-font--content_copy',
        command: () => this.duplicateRule(rule),
      },
      {
        separator: true,
      },
      {
        label: toggleLabel,
        icon: rule.active ? 'sc-icon-font sc-icon-font--pause' : 'sc-icon-font sc-icon-font--play_arrow',
        command: () => this.rulesStore.toggleActive(rule.id),
      },
      {
        label: this.translate.instant('common.delete'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'sc-menu-item--danger',
        command: () => this.confirmDelete(rule),
      },
    ];
  }

  private duplicateRule(rule: Rule): void {
    const copy = this.rulesStore.duplicateRule(rule.id);
    if (!copy) return;
    this.resultado.contar(this.translate.instant('memory.rules.duplicated_toast'));
  }

  private async confirmDelete(rule: Rule): Promise<void> {
    const accepted = await this.alertModal({
      variant: 'error',
      title: this.translate.instant('memory.rules.delete_title'),
      message: this.translate.instant('memory.rules.delete_body', { name: rule.name }),
      actionLabel: this.translate.instant('common.delete'),
      secondaryActionLabel: this.translate.instant('common.cancel'),
    });
    if (!accepted) return;
    this.rulesStore.deleteRule(rule.id);
    this.resultado.contar(this.translate.instant('memory.rules.deleted_toast', { name: rule.name }));
  }

  private async confirmDeleteMany(rows: readonly Rule[]): Promise<void> {
    const accepted = await this.alertModal({
      variant: 'error',
      title: this.translate.instant('memory.rules.delete_title_bulk', { count: rows.length }),
      message: this.translate.instant('common.delete_dialog.body'),
      actionLabel: this.translate.instant('common.delete'),
      secondaryActionLabel: this.translate.instant('common.cancel'),
    });
    if (!accepted) return;
    for (const row of rows) this.rulesStore.deleteRule(row.id);
    this.selectedIds.set(new Set());
    this.resultado.contar(this.translate.instant('memory.rules.deleted_bulk_toast', { count: rows.length }));
  }
}

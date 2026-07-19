import { map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import { MenuModule } from 'primeng/menu';
import type { MenuItem } from 'primeng/api';

import { ScEmptyStateComponent as EmptyStateComponent } from '@smartcontact-hub/components';
import { ScMessageComponent as MessageComponent } from '@smartcontact-hub/components';
import { ScConfirmService } from '@smartcontact-hub/components';
import {
  type ScColumnCellContext,
  type ScColumnDef,
  ScDatatableComponent as DatatableComponent,
  type ScDatatableRowEvent,
  type ScDatatableRowKeyEvent,
  type ScRowStyleClassFn,
} from '@smartcontact-hub/components';
import { TopBarSlotService } from '@core/layout/top-bar/top-bar-slot.service';
import { TOAST_LIFE } from '@core/utils/toast-life';

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
    ButtonComponent,
    DatatableComponent,
    EmptyStateComponent,
    IconComponent,
    MenuModule,
    MessageComponent,
    RouterLink,
    TranslateModule,
  ],
  templateUrl: './rules-page.component.html',
  styleUrl: './rules-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesPageComponent {
  private readonly rulesStore = inject(RulesStore);
  private readonly resolver = inject(ConditionResolverService);
  private readonly confirm = inject(ScConfirmService);
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly topBarSlot = inject(TopBarSlotService);
  private readonly destroyRef = inject(DestroyRef);

  /** CTA + menú "nueva regla" proyectados a la TopBar (modelo "todo arriba" S59). */
  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');

  constructor() {
    afterNextRender(() => {
      const tpl = this.topbarActions();
      if (tpl) this.topBarSlot.setActions(tpl);
    });
    this.destroyRef.onDestroy(() => this.topBarSlot.clearActions());
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
  private readonly kebabTpl = viewChild<TemplateRef<ScColumnCellContext<Rule>>>('kebabTpl');

  /** Los anchos son los mismos `width` que tenían los `<th>` a mano; con
   *  `table-layout: fixed` (lo pone `.list-table`) nombre y alcance se reparten
   *  el resto, igual que antes. */
  /** Dependencia de IDIOMA para las cabeceras.
   *
   * `columns` es un `computed()` cuyas únicas dependencias eran los `viewChild`
   * de las plantillas de celda. Como los `header` se resuelven con
   * `translate.instant()` —no con el pipe `| translate`, que es impuro y sí
   * reaccionaba— el computed NO se re-evaluaba al cambiar de idioma y las
   * cabeceras se quedaban CONGELADAS en el idioma de carga.
   *
   * Lo destapó `audit:datatables` en su primera pasada, sobre 7 páginas. No lo
   * veía ningún gate: `i18n:check` solo compara claves y todo el e2e corre en
   * español. Mismo patrón que ya usaba `repo-list-page` para otra cosa. */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang),
    ),
    { initialValue: this.translate.currentLang },
  );

  protected readonly columns = computed<readonly ScColumnDef<Rule>[]>(() => [
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
      header: this.translate.instant('memory.rules.cols.actions'),
      width: '110px',
      cellTemplate: this.actionsTpl(),
    },
    {
      field: 'status',
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
    // Columna sin datos: `field` es solo su identidad, y la cabecera va vacía
    // igual que el `<th aria-hidden>` que sustituye. `stopRowClick` porque
    // fallar el botón por unos píxeles abría la regla: el kebab para la
    // propagación, pero el padding del `<td>` —que ahora pinta el DS— no.
    {
      field: 'kebab',
      header: '', headerAriaLabel: this.translate.instant('common.actions'),
      width: '44px',
      stopRowClick: true,
      cellTemplate: this.kebabTpl(),
    },
  ]);

  /** La fila abre la regla, y el cursor tiene que decirlo. Vive aquí y no en el
   *  SCSS de la página porque el `<tr>` lo pinta el DS; `.list-table` define
   *  `table__row--clickable`. Es constante: no lee ninguna señal. */
  protected readonly rowClass: ScRowStyleClassFn<Rule> = () => 'table__row--clickable';

  protected readonly menuTargetRule = signal<Rule | null>(null);

  /** Modelo del menú kebab (único y compartido). Es un computed estable: solo
   *  cambia al abrir otro kebab. Antes `[model]="buildMenuItems(rule)"` recreaba
   *  el array en cada ciclo de CD → PrimeNG repintaba el menú y se perdía el 1er
   *  clic (hacía falta doble). Con esto, un solo clic aplica la acción. */
  protected readonly menuItems = computed<MenuItem[]>(() => {
    const rule = this.menuTargetRule();
    return rule ? this.buildMenuItems(rule) : [];
  });

  protected readonly settingsIcon = 'tune';
  protected readonly emptyIcon = 'rule';
  protected readonly plusIcon = 'add';
  /** Mismo icono que el flujo de transcripciones (player, `description`) → ley de similitud. */
  protected readonly transcriptionIcon = 'description';
  protected readonly sparklesIcon = 'auto_awesome';
  protected readonly kebabIcon = 'more_vert';

  protected onNewRule(type: 'transcription' | 'classification' = 'transcription'): void {
    this.router.navigate(['/conversaciones/reglas/nueva'], {
      queryParams: { type },
    });
  }

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
    if (diffHours < 1) return 'hace unos minutos';
    if (diffHours < 24) return `hace ${diffHours} h`;
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  protected setMenuTarget(rule: Rule): void {
    this.menuTargetRule.set(rule);
  }

  /** Click en la fila abre la regla en el constructor (la fila actúa de enlace). */
  protected openRule(rule: Rule): void {
    this.router.navigate(['/conversaciones/reglas', rule.id]);
  }

  /* WCAG 2.1.1: la fila abre la regla con el ratón, así que tiene que abrirla
   * también con el teclado. `rowsFocusable` la hace parada de tabulador; qué
   * hace cada tecla lo decide el consumidor (el DS no interpreta ninguna). */
  protected onRowKeydown(event: ScDatatableRowKeyEvent<Rule>): void {
    if (event.originalEvent.key !== 'Enter') return;
    event.originalEvent.preventDefault();
    this.openRule(event.row);
  }

  /** Click derecho → el MISMO `<p-menu>` que el kebab (R3). El DS ya canceló
   *  el menú nativo del navegador. */
  protected onRowContextMenu(
    event: ScDatatableRowEvent<Rule>,
    menu: { toggle: (e: Event) => void },
  ): void {
    this.setMenuTarget(event.row);
    menu.toggle(event.originalEvent);
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
        styleClass: 'rules-menu-item--danger',
        command: () => this.confirmDelete(rule),
      },
    ];
  }

  private duplicateRule(rule: Rule): void {
    const copy = this.rulesStore.duplicateRule(rule.id);
    if (!copy) return;
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('memory.rules.duplicated_toast'),
      life: TOAST_LIFE.success,
    });
  }

  private async confirmDelete(rule: Rule): Promise<void> {
    const accepted = await this.confirm.request({
      title: this.translate.instant('memory.rules.delete_title'),
      body: this.translate.instant('memory.rules.delete_body', { name: rule.name }),
      acceptLabel: this.translate.instant('common.delete'),
      rejectLabel: this.translate.instant('common.cancel'),
      acceptTone: 'danger',
    });
    if (!accepted) return;
    this.rulesStore.deleteRule(rule.id);
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('memory.rules.deleted_toast', { name: rule.name }),
      life: TOAST_LIFE.success,
    });
  }
}

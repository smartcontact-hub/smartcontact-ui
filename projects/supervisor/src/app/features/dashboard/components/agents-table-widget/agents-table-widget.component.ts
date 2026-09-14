import { ChangeDetectionStrategy, Component, computed, inject, input, TemplateRef, viewChild } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScBadgeComponent as BadgeComponent, ScDatatableComponent as DatatableComponent } from '@smartcontact-hub/components';
import type { ScColumnCellContext, ScColumnDef } from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';

import type { AgentRow } from '../../data/dashboard.types';
import { formatDuration } from '../../data/format-duration';

/**
 * Tabla de agentes: la forma «tabla con totales» del original (filas con scroll dentro y la
 * fila TOTALES fija abajo). Las columnas son las que tenía «Monitor x».
 */
@Component({
  selector: 'sc-dashboard-agents-table',
  imports: [TranslateModule, BadgeComponent, DatatableComponent],
  templateUrl: './agents-table-widget.component.html',
  styleUrl: './agents-table-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentsTableWidgetComponent {
  private readonly translate = inject(TranslateService);

  readonly rows = input.required<readonly AgentRow[]>();

  protected readonly nameTpl = viewChild.required<TemplateRef<ScColumnCellContext<AgentRow>>>('nameTpl');
  protected readonly timeTpl = viewChild.required<TemplateRef<ScColumnCellContext<AgentRow>>>('timeTpl');

  /** Las cabeceras se traducen aquí (el DS no traduce): se recalculan al cambiar de idioma. */
  private readonly lang = injectLangChange();

  protected readonly columns = computed<ScColumnDef<AgentRow>[]>(() => {
    this.lang();
    const t = (k: string) => this.translate.instant(`dashboard.agents_table.${k}`);
    return [
      { field: 'name', header: t('agent'), cellTemplate: this.nameTpl() },
      { field: 'conversations', header: t('conversations'), align: 'right' },
      { field: 'attended', header: t('attended'), align: 'right' },
      { field: 'rejected', header: t('rejected'), align: 'right' },
      { field: 'transferred', header: t('transferred'), align: 'right' },
      { field: 'avgSeconds', header: t('avg_time'), align: 'right', cellTemplate: this.timeTpl() },
    ];
  });

  protected readonly totals = computed(() => {
    const rows = this.rows();
    const sum = (pick: (r: AgentRow) => number) => rows.reduce((acc, r) => acc + pick(r), 0);
    const conversations = sum((r) => r.conversations);
    return {
      conversations,
      attended: sum((r) => r.attended),
      rejected: sum((r) => r.rejected),
      transferred: sum((r) => r.transferred),
      // Media ponderada por conversaciones, no media de medias.
      avg: conversations ? formatDuration(sum((r) => r.avgSeconds * r.conversations) / conversations) : '0:00',
    };
  });

  protected readonly formatDuration = formatDuration;
}

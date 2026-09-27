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
    /* Las cifras miden lo que su dato (`1%`: se ajustan a su contenido) y el nombre se queda el resto, donde
     * recorta. Sin eso, un nombre largo empujaba las cifras fuera de la tarjeta: medido el 2026-09-27 con
     * `?datos=tortura`, 183 px, con «Transferidas» y «T. medio» fuera. La cabecera de varias palabras no se
     * parte porque su texto lleva un espacio que no separa («T.\u00a0medio», en los cuatro idiomas). */
    const cifra = { align: 'right', width: '1%' } as const;
    return [
      { field: 'name', header: t('agent'), cellTemplate: this.nameTpl() },
      { field: 'conversations', header: t('conversations'), ...cifra },
      { field: 'attended', header: t('attended'), ...cifra },
      { field: 'rejected', header: t('rejected'), ...cifra },
      { field: 'transferred', header: t('transferred'), ...cifra },
      { field: 'avgSeconds', header: t('avg_time'), ...cifra, cellTemplate: this.timeTpl() },
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

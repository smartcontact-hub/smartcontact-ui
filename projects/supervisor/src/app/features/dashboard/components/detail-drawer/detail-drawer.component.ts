import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScBadgeComponent as BadgeComponent,
  ScDatatableComponent as DatatableComponent,
  ScDrawerComponent as DrawerComponent,
} from '@smartcontact-hub/components';
import type { ScColumnCellContext, ScColumnDef } from '@smartcontact-hub/components';
import { SC_ICON_SIZE_DEFAULT, ScIconComponent as IconComponent } from '@smartcontact-hub/icons';

import { injectLangChange } from '@core/utils/lang-change';

import type { DashboardWidget } from '../../data/dashboard.types';
import {
  detailRows,
  type AgentStateRow,
  type DetailChannel,
  type DetailRequest,
  type InProgressRow,
  type WaitingRow,
} from '../../data/detail';
import { formatDuration } from '../../data/format-duration';

type DetailRow = WaitingRow | InProgressRow | AgentStateRow;

const CHANNEL_ICON: Readonly<Record<DetailChannel, string>> = { calls: 'call', chats: 'chat', emails: 'mail' };

/**
 * Panel lateral con lo que hay detrás de una cifra: las conversaciones en espera, las que están en
 * curso o los agentes de un estado. El Supervisor real no lo tiene (para verlo hay que ir a otra
 * sección); aquí es un clic desde el propio monitor.
 *
 * Las filas se calculan AL ABRIR, con la cifra de ese momento, y los tiempos siguen corriendo
 * mientras el panel está abierto: si la cifra cambia en el siguiente latido, el panel no salta
 * debajo del ratón.
 */
@Component({
  selector: 'sc-dashboard-detail-drawer',
  imports: [TranslateModule, BadgeComponent, DatatableComponent, DrawerComponent, IconComponent],
  templateUrl: './detail-drawer.component.html',
  styleUrl: './detail-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailDrawerComponent {
  readonly request = input<DetailRequest | null>(null);
  readonly widget = input<DashboardWidget | null>(null);

  readonly closed = output<void>();

  protected channelIconOf(channel: DetailChannel): string {
    return CHANNEL_ICON[channel];
  }
  protected readonly iconSize = SC_ICON_SIZE_DEFAULT;
  protected readonly formatDuration = formatDuration;

  /** Segundos desde que se abrió el panel: se suman a cada tiempo. */
  protected readonly elapsed = signal(0);
  private readonly snapshot = signal<ReturnType<typeof detailRows> | null>(null);
  protected readonly rows = this.snapshot.asReadonly();

  protected readonly open = computed(() => this.request() !== null);

  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly whoTpl = viewChild.required<TemplateRef<ScColumnCellContext<DetailRow>>>('whoTpl');
  private readonly timeTpl = viewChild.required<TemplateRef<ScColumnCellContext<DetailRow>>>('timeTpl');

  /** Dos columnas: quién (cliente o agente, con su canal o su estado) y el tiempo, que sigue corriendo. */
  protected readonly columns = computed<ScColumnDef<DetailRow>[]>(() => {
    this.lang();
    const kind = this.rows()?.kind;
    return [
      { field: 'id', header: this.translate.instant(kind === 'agents' ? 'dashboard.detail.col_agent' : 'dashboard.detail.col_conversation'), cellTemplate: this.whoTpl() },
      { field: 'seconds', header: this.translate.instant(kind === 'agents' ? 'dashboard.detail.col_in_state' : 'dashboard.detail.col_time'), align: 'right', cellTemplate: this.timeTpl() },
    ];
  });

  protected readonly emptyKey = computed(() => {
    const kind = this.rows()?.kind;
    return kind === 'in-progress' ? 'dashboard.detail.empty.in_progress' : `dashboard.detail.empty.${kind ?? 'waiting'}`;
  });

  protected readonly titleKey = computed(() => {
    const r = this.request();
    if (!r) return '';
    if (r.kind !== 'agents') return `dashboard.detail.title.${r.kind}`;
    return `dashboard.detail.title.agents_${r.presence ?? 'connected'}`;
  });

  constructor() {
    // Solo al cambiar la petición: el widget cambia en cada latido y el panel no debe saltar.
    effect(() => {
      const r = this.request();
      untracked(() => {
        const w = this.widget();
        this.elapsed.set(0);
        this.snapshot.set(r && w ? detailRows(r, w) : null);
      });
    });
    const clock = setInterval(() => {
      if (this.open()) this.elapsed.update((s) => s + 1);
    }, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(clock));
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible) this.closed.emit();
  }
}

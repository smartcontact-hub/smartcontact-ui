import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MeterGroupModule } from 'primeng/metergroup';
import type { MeterItem } from 'primeng/types/metergroup';

import type { AgentPresence, GroupPanelWidget } from '../../data/dashboard.types';
import type { DetailKind } from '../../data/widget-catalog';
import { formatDuration } from '../../data/format-duration';
import { AnimateOnChangeDirective } from '../animate-on-change.directive';

interface Stat {
  readonly key: string;
  readonly value: string;
  /** Proporción 0-100 que se pinta como barra bajo la etiqueta (disponibles sobre conectados). */
  readonly ratio?: number;
  readonly meter?: MeterItem[];
  /** Color funcional de un nivel: bien, a vigilar o mal. */
  readonly tone?: 'success' | 'warning' | 'danger';
  /** Detalle que abre la cifra al pulsarla. */
  readonly detail?: { readonly kind: DetailKind; readonly presence: AgentPresence | null };
}

/*
 * Umbrales de los niveles de servicio y atención. No salen del original (no colorea los niveles);
 * son el corte habitual de un contact center: 80 % o más es el objetivo, por debajo de 60 % es un
 * problema. Si producto tiene los suyos, se cambian aquí.
 */
const LEVEL_OK = 80;
const LEVEL_BAD = 60;

const toneFor = (pct: number): Stat['tone'] => (pct >= LEVEL_OK ? 'success' : pct >= LEVEL_BAD ? 'warning' : 'danger');

/**
 * Panel de grupos: las tres bandas del widget «Groups» del original, con los mismos datos.
 *
 * - Ahora: en espera, en curso, disponibles (sobre conectados) y conectados.
 * - Conversaciones: totales, atendidas y no atendidas; y el desglose de lo perdido.
 * - Tiempos medios y niveles de servicio y de atención.
 *
 * En el original cada cifra iba en su propia caja con borde; aquí las bandas separan y las
 * cifras no llevan caja, que con 16 cajas dentro de una tarjeta el ruido ganaba al dato.
 */
@Component({
  selector: 'sc-dashboard-group-panel',
  imports: [NgTemplateOutlet, TranslateModule, MeterGroupModule, AnimateOnChangeDirective],
  templateUrl: './group-panel-widget.component.html',
  styleUrl: './group-panel-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupPanelWidgetComponent {
  readonly data = input.required<GroupPanelWidget>();
  /** Las cifras de «Ahora» abren su detalle. En la vista previa del asistente, no. */
  readonly interactive = input(true);

  readonly open = output<{ kind: DetailKind; presence: AgentPresence | null }>();

  protected readonly now = computed<Stat[]>(() => {
    const d = this.data();
    return [
      { key: 'on_hold', value: String(d.onHold), detail: { kind: 'waiting', presence: null } },
      { key: 'in_progress', value: String(d.inProgress), detail: { kind: 'in-progress', presence: null } },
      {
        key: 'available',
        value: String(d.available),
        ratio: d.connected ? Math.round((d.available / d.connected) * 100) : 0,
        meter: [
          {
            label: 'available',
            value: d.connected ? Math.round((d.available / d.connected) * 100) : 0,
            color: 'var(--sc-presence-available)',
          },
        ],
        detail: { kind: 'agents', presence: 'available' },
      },
      { key: 'connected', value: String(d.connected), detail: { kind: 'agents', presence: null } },
    ];
  });

  protected readonly conversations = computed<Stat[]>(() => {
    const d = this.data();
    return [
      { key: 'total', value: String(d.total) },
      { key: 'attended', value: String(d.attended) },
      { key: 'not_attended', value: String(d.notAttended) },
    ];
  });

  protected readonly lost = computed<Stat[]>(() => {
    const d = this.data();
    return [
      { key: 'abandoned', value: String(d.abandoned) },
      { key: 'overflowed', value: String(d.overflowed) },
      { key: 'disconnected', value: String(d.disconnected) },
    ];
  });

  protected readonly times = computed<Stat[]>(() => {
    const d = this.data();
    return [
      { key: 'talk', value: formatDuration(d.avgTalkSeconds) },
      { key: 'post', value: formatDuration(d.avgPostSeconds) },
      { key: 'wait', value: formatDuration(d.avgWaitSeconds) },
      { key: 'abandon', value: formatDuration(d.avgAbandonSeconds) },
    ];
  });

  protected readonly levels = computed<Stat[]>(() => {
    const d = this.data();
    return [
      { key: 'service_level', value: `${d.serviceLevel}%`, tone: toneFor(d.serviceLevel) },
      { key: 'attention_level', value: `${d.attentionLevel}%`, tone: toneFor(d.attentionLevel) },
    ];
  });
}

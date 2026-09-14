import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ScGaugeComponent as GaugeComponent } from '@smartcontact-hub/components';
import { SC_ICON_SIZE_DEFAULT, ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import type { ScGaugeSegment, ScGaugeSeverity } from '@smartcontact-hub/components';

import type { AgentPresence } from '../../data/dashboard.types';
import { AnimateOnChangeDirective } from '../animate-on-change.directive';

const PRESENCE_SEVERITY: Record<AgentPresence, ScGaugeSeverity> = {
  available: 'success',
  paused: 'warning',
  offline: 'neutral',
};

/** Alto del lienzo del sparkline; el ancho es 100 y el SVG se estira sin deformar el trazo. */
const SPARK_H = 40;

/**
 * Cifra de un widget pequeño. Cubre tres de las seis formas del original:
 *
 * - con `trend`: la cifra, cuánto ha cambiado desde el primer punto y su evolución al lado;
 * - con `presence`: agentes en ese estado sobre los conectados, en un anillo (`sc-gauge`);
 * - sin nada más: la cifra y su etiqueta (una tipificación).
 *
 * Con `interactive`, la cifra es un botón que abre su detalle (quién está en espera, qué agentes).
 *
 * Candidata a `sc-kpi` en el DS si la forma aguanta: por eso no sabe nada de widgets.
 */
@Component({
  selector: 'sc-dashboard-kpi',
  imports: [NgTemplateOutlet, TranslateModule, GaugeComponent, IconComponent, AnimateOnChangeDirective],
  templateUrl: './kpi-widget.component.html',
  styleUrl: './kpi-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.kpi--trend]': 'trend().length > 1',
  },
})
export class KpiWidgetComponent {
  readonly value = input.required<number>();
  readonly label = input<string | null>(null);
  readonly trend = input<readonly number[]>([]);
  readonly presence = input<AgentPresence | null>(null);
  readonly total = input<number | null>(null);
  readonly unit = input<'percent' | null>(null);
  /** La cifra abre un detalle: se pinta como botón y emite `open`. */
  readonly interactive = input(false);

  readonly open = output<void>();

  protected readonly deltaIconSize = SC_ICON_SIZE_DEFAULT;

  /** Diferencia entre el último punto de la evolución y el primero (la última hora). */
  protected readonly delta = computed(() => {
    const t = this.trend();
    if (t.length < 2) return null;
    const d = t[t.length - 1] - t[0];
    return {
      text: d > 0 ? `+${d}` : d < 0 ? `−${Math.abs(d)}` : '0',
      icon: d > 0 ? 'trending_up' : d < 0 ? 'trending_down' : 'trending_flat',
    };
  });

  protected readonly ratio = computed(() => {
    const total = this.total();
    return total ? Math.min(100, Math.round((this.value() / total) * 100)) : 0;
  });

  /** El anillo pinta el estado; el resto hasta los conectados queda como track (`max`). */
  protected readonly ringSegments = computed<ScGaugeSegment[]>(() => {
    const presence = this.presence();
    return presence ? [{ value: this.value(), severity: PRESENCE_SEVERITY[presence] }] : [];
  });

  protected readonly sparkline = computed(() => {
    const points = this.trend();
    if (points.length < 2) return null;
    const min = Math.min(...points);
    const span = Math.max(...points) - min || 1;
    const step = 100 / (points.length - 1);
    // Un margen de 2 arriba y abajo para que el trazo no se corte en el borde.
    const coords = points.map((p, i) => `${(i * step).toFixed(2)},${(SPARK_H - 2 - ((p - min) / span) * (SPARK_H - 4)).toFixed(2)}`);
    return {
      line: coords.join(' '),
      area: `0,${SPARK_H} ${coords.join(' ')} 100,${SPARK_H}`,
      viewBox: `0 0 100 ${SPARK_H}`,
    };
  });
}

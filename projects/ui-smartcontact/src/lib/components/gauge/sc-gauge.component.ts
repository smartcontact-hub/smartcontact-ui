import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ScGaugeSegment, ScGaugeSize } from '../../core/types/gauge.types';

/**
 * Anillo radial (gauge/donut) determinista. Pinta uno o más arcos a partir de
 * `segments` (pesos relativos → fracción del anillo) y deja el centro libre por
 * proyección (`<ng-content>`) o con `label`/`sublabel`. Custom (sin PrimeNG).
 *
 * Pensado para KPIs tipo "234 / Conv. Totales" con tramo verde + rojo. El badge
 * flotante (p.ej. "No atendidas 54") lo compone el consumidor con `sc-badge`.
 *
 * SVG con `stroke-dasharray`/`stroke-dashoffset` → nítido a cualquier tamaño.
 * Colores por severidad vía tokens semánticos existentes (sin tokens nuevos).
 */
const SIZE_PX: Record<ScGaugeSize, number> = { sm: 96, md: 140, lg: 180 };
const VIEWBOX = 100;

interface GaugeArc {
  readonly severity: string;
  readonly dashArray: string;
  readonly dashOffset: number;
}

/** PURA: deriva radio, circunferencia y arcos del anillo de los segmentos. Exportada → testeable. */
export function buildGaugeArcs(
  segments: readonly ScGaugeSegment[],
  thickness: number,
): { radius: number; circumference: number; arcs: GaugeArc[] } {
  const radius = (VIEWBOX - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const arcs: GaugeArc[] = [];
  if (total > 0) {
    let cumulative = 0;
    for (const seg of segments) {
      const len = (Math.max(0, seg.value) / total) * circumference;
      arcs.push({
        severity: seg.severity,
        dashArray: `${len} ${circumference - len}`,
        dashOffset: -cumulative,
      });
      cumulative += len;
    }
  }
  return { radius, circumference, arcs };
}

@Component({
  selector: 'sc-gauge',
  standalone: true,
  imports: [],
  templateUrl: './sc-gauge.component.html',
  styleUrl: './sc-gauge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScGaugeComponent {
  /** Arcos del anillo (pesos relativos). Vacío → solo track. */
  readonly segments = input<readonly ScGaugeSegment[]>([]);
  /** Tamaño del anillo: sm 96 / md 140 / lg 180 px. */
  readonly size = input<ScGaugeSize>('md');
  /** Grosor del trazo, en unidades del viewBox (0–100). */
  readonly thickness = input<number>(12);
  /** Pinta el track de fondo bajo los arcos. */
  readonly trackVisible = input(true, { transform: booleanAttribute });
  /** Ángulo de inicio en grados (-90 = 12 en punto). */
  readonly startAngle = input<number>(-90);
  /** Etiqueta accesible del anillo (decorativo si null). */
  readonly ariaLabel = input<string | null>(null);
  /** Atajo para el centro: número grande. Ignorado si se proyecta contenido. */
  readonly label = input<string | null>(null);
  /** Atajo para el centro: texto pequeño bajo el número. */
  readonly sublabel = input<string | null>(null);

  protected readonly sizePx = computed(() => SIZE_PX[this.size()]);
  protected readonly geom = computed(() => buildGaugeArcs(this.segments(), this.thickness()));
  protected readonly rotation = computed(() => `rotate(${this.startAngle()} 50 50)`);
}

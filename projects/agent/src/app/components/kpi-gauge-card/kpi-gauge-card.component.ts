import { ChangeDetectionStrategy, Component, computed } from '@angular/core';

import { CALLS, KPIS } from '../../data/seed';
import { AgIconComponent } from '../ui/app-icon.component';

/** Tile KPI: anillo de conversaciones (estado vacío) + métricas ART / ACT. */
@Component({
  selector: 'app-kpi-gauge-card',
  standalone: true,
  imports: [AgIconComponent],
  template: `
    <div class="agent-card gauge">
      <div class="gauge__ring">
        <!--
          Anillo bicolor como el del original, que lo pinta en <canvas>. Los colores y la
          geometría salen de MUESTREAR sus píxeles: radio exterior 42.9, grosor 6.83,
          verde #0de300 (atendidas) y rojo #cc3737 (perdidas). El viewBox va en centésimas
          del lado (94.79 a 1456) para que escale con el contenedor.
        -->
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle
            class="gauge__seg gauge__seg--ok"
            cx="50"
            cy="50"
            [attr.r]="R"
            [attr.stroke-dasharray]="dash(attended())"
            transform="rotate(-90 50 50)"
          />
          <circle
            class="gauge__seg gauge__seg--lost"
            cx="50"
            cy="50"
            [attr.r]="R"
            [attr.stroke-dasharray]="dash(lost())"
            [attr.stroke-dashoffset]="-len(attended())"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div class="gauge__center">
          <div class="gauge__num">{{ total() }}</div>
          <div class="gauge__sub">Total Conv.</div>
        </div>
      </div>
      <div class="gauge__metrics">
        <div class="metric">
          <span class="metric__val">{{ kpis.art }}</span>
          <span class="metric__label"
            ><app-icon name="clock" [size]="10" /> ART</span
          >
        </div>
        <div class="metric">
          <span class="metric__val">{{ kpis.act }}</span>
          <span class="metric__label"
            ><app-icon name="clock" [size]="10" /> ACT</span
          >
        </div>
      </div>
    </div>
  `,
  styles: `
    .gauge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.51099vw;
      height: 100%;
      padding: 0.824176vw 1.098902vw;
    }
    /* 94.79 a 1456, medido en su canvas. */
    .gauge__ring svg {
      width: 6.510989vw;
      height: 6.510989vw;
    }
    /* Grosor 6.83 de 94.79 -> 7.21 en el viewBox de 100. */
    .gauge__seg {
      fill: none;
      stroke-width: 7.21;
    }
    .gauge__seg--ok {
      stroke: #0de300;
    }
    .gauge__seg--lost {
      stroke: #cc3737;
    }
    .gauge__ring {
      position: relative;
      display: inline-flex;
      flex: none;
    }
    .gauge__track {
      stroke: var(--ag-ring);
    }
    .gauge__center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.137363vw;
    }
    .gauge__num {
      font-size: 1.462913vw;
      font-weight: 400;
      color: var(--ag-text);
      line-height: 1;
    }
    .gauge__sub {
      font-size: 0.625vw;
      color: var(--ag-dim);
    }
    .gauge__metrics {
      display: flex;
      flex-direction: column;
      gap: 0.892858vw;
    }
    .metric {
      display: flex;
      flex-direction: column;
      gap: 0.137363vw;
    }
    .metric__val {
      font-size: 0.803572vw;
      font-weight: 400;
      color: var(--ag-text);
      line-height: 1;
    }
    .metric__label {
      display: inline-flex;
      align-items: center;
      gap: 0.274726vw;
      font-size: 0.625vw;
      color: var(--ag-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiGaugeCardComponent {
  protected readonly kpis = KPIS;

  /** Radio del trazo en el viewBox de 100: 42.9 exterior menos medio grosor. */
  protected readonly R = 41.66;
  private readonly C = 2 * Math.PI * this.R;

  protected readonly total = computed(() => CALLS.length);
  protected readonly attended = computed(
    () => CALLS.filter((c) => c.outcome === 'attended').length
  );
  protected readonly lost = computed(() => CALLS.length - this.attended());

  /** Longitud de arco de n conversaciones, en unidades del viewBox. */
  protected len(n: number): number {
    return this.total() ? (this.C * n) / this.total() : 0;
  }

  protected dash(n: number): string {
    const l = this.len(n);
    return `${l} ${this.C - l}`;
  }
}

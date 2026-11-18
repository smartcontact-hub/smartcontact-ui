import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';

import { injectLangChange } from '@core/utils/lang-change';

import { type Franja, type Semana, textoDeFranja } from '../../state/horarios.core.mjs';

const CLAVES_DIA = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/**
 * Una semana de un vistazo y con color: los días que comparten horas van juntos («Lun–Jue») y cada tramo es una píldora del
 * color que se pase (verde por defecto; el de su periodo en los periodos). Cerrado, una píldora gris. Si un grupo tiene muchos
 * tramos, se enseñan los primeros y un «+N» que los dice todos al pasar el ratón: el resumen no crece sin límite.
 * Pieza propia del experimento (no hay en el DS una representación de una semana).
 */
@Component({
  selector: 'sc-horario-semana-resumen',
  imports: [TooltipModule, TranslateModule],
  template: `
    <ul class="semana" role="list">
      @for (g of grupos(); track $index) {
        <li class="grupo">
          <span class="grupo__dias sc-text-caption-semibold">{{ g.etiqueta }}</span>
          <span class="grupo__tramos">
            @if (g.tramos.length === 0) {
              <span class="pildora pildora--cerrado sc-text-caption-regular" data-color="gray">{{ cerrado() }}</span>
            } @else {
              @for (t of g.visibles; track $index) {
                <span class="pildora sc-text-caption-semibold" [attr.data-color]="color()">{{ t }}</span>
              }
              @if (g.resto > 0) {
                <span class="pildora pildora--mas sc-text-caption-semibold" [attr.data-color]="color()" [pTooltip]="g.tramos.join(' · ')" tooltipPosition="top">+{{ g.resto }}</span>
              }
            }
          </span>
        </li>
      }
    </ul>
  `,
  styleUrl: './horario-semana-resumen.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioSemanaResumenComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  readonly semana = input.required<Semana>();
  /** Color del DS de las píldoras. */
  readonly color = input<string>('green');
  /** Cuántos tramos se enseñan por grupo de días antes del «+N». */
  readonly max = input(4);

  protected readonly cerrado = computed(() => (this.lang(), this.translate.instant('repositories.horarios.closed') as string));

  protected readonly grupos = computed(() => {
    this.lang();
    const nombre = (i: number): string => (this.translate.instant(`repositories.horarios.days.${CLAVES_DIA[i]}`) as string).slice(0, 3);
    const mismas = (a: readonly Franja[], b: readonly Franja[]): boolean => a.length === b.length && a.every((f, i) => f[0] === b[i][0] && f[1] === b[i][1]);
    const grupos: { desde: number; hasta: number; franjas: readonly Franja[] }[] = [];
    for (let d = 0; d < 7; d++) {
      const franjas = this.semana()[d] ?? [];
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && mismas(ultimo.franjas, franjas)) ultimo.hasta = d;
      else grupos.push({ desde: d, hasta: d, franjas });
    }
    const max = this.max();
    return grupos.map((g) => {
      const tramos = g.franjas.map(textoDeFranja);
      return {
        etiqueta: g.desde === g.hasta ? nombre(g.desde) : `${nombre(g.desde)}–${nombre(g.hasta)}`,
        tramos,
        visibles: tramos.slice(0, max),
        resto: Math.max(0, tramos.length - max),
      };
    });
  });
}

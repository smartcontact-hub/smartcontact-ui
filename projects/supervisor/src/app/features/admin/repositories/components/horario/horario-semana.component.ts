import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { TooltipModule } from 'primeng/tooltip';

import { injectLangChange } from '@core/utils/lang-change';

import type { CodigoDeSemana, Franja, Semana } from '../../state/horarios.core.mjs';
import { HorarioFranjasComponent } from './horario-franjas.component';

export const DIAS_DE_LA_SEMANA = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/**
 * Una semana, de lunes a domingo: cada día abierto o cerrado y, abierto, con sus franjas. Debajo, «Copiar» lleva las
 * franjas de un día a otros. Es la semana habitual de un horario y la de cada periodo.
 */
@Component({
  selector: 'sc-horario-semana',
  imports: [HorarioFranjasComponent, ScIconComponent, TooltipModule, TranslateModule],
  templateUrl: './horario-semana.component.html',
  styleUrl: './horario-semana.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioSemanaComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  readonly semana = input.required<Semana>();
  /** Lo que le pasa a la semana (`validarSemana`), para decirlo bajo su día; `null` si vale. */
  readonly falta = input<{ readonly dia: number; readonly codigo: CodigoDeSemana } | null>(null);
  /** Distingue los `id` cuando hay dos semanas en pantalla (la habitual y la de un periodo). */
  readonly prefijo = input('semana');
  /** Los días (0 = lunes) marcados como cerrados. */
  readonly cerrados = input<readonly number[]>([]);
  readonly semanaChange = output<Semana>();
  readonly cierreChange = output<{ readonly dia: number; readonly cerrado: boolean }>();

  protected readonly dias = computed(() => {
    this.lang();
    return DIAS_DE_LA_SEMANA.map((clave, indice) => ({
      indice,
      nombre: this.translate.instant(`repositories.horarios.days.${clave}`) as string,
      franjas: this.semana()[indice] ?? [],
      cerrado: this.cerrados().includes(indice) && (this.semana()[indice] ?? []).length === 0,
    }));
  });

  protected ponerDia(dia: number, franjas: readonly Franja[]): void {
    this.semanaChange.emit(this.semana().map((f, i) => (i === dia ? franjas : f)));
  }

  protected alternarCierre(dia: number, cerrado: boolean): void {
    this.cierreChange.emit({ dia, cerrado });
  }
}

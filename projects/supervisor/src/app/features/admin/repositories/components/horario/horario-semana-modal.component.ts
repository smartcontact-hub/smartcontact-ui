import { ChangeDetectionStrategy, Component, computed, input, type OnInit, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective } from '@smartcontact-hub/components';


import { type Semana, validarSemana } from '../../state/horarios.core.mjs';
import { HorarioSemanaComponent } from './horario-semana.component';

/**
 * La semana habitual en un diálogo (experimento): se abre con el lápiz de la tarjeta o del día elegido en el
 * calendario. Edita una copia y no toca el horario hasta «Aplicar»; así se ve el calendario cambiar de golpe.
 */
@Component({
  selector: 'sc-horario-semana-modal',
  imports: [HorarioSemanaComponent, ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective, TooltipModule, TranslateModule],
  template: `
    <sc-custom-modal [visible]="true" width="48rem" [title]="'repositories.horarios.section_week' | translate" [subtitle]="'repositories.horarios.x.week_modal.hint' | translate" (closed)="cerrado.emit()">
      <sc-horario-semana prefijo="semana-modal" [semana]="semana()" [falta]="falta()" (semanaChange)="semana.set($event)" />
      <div scCustomModalFooter>
        <sc-button size="sm" variant="secondary" appearance="outlined" [label]="'common.cancel' | translate" (clicked)="cerrado.emit()" />
        <sc-button
          size="sm"
          variant="primary"
          [disabled]="!!falta()"
          [pTooltip]="falta() ? ('repositories.horarios.errors.week_' + falta()!.codigo | translate) : ''"
          tooltipPosition="top"
          tooltipEvent="both"
          [label]="'repositories.horarios.x.week_modal.apply' | translate"
          (clicked)="guardar.emit(semana())"
        />
      </div>
    </sc-custom-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioSemanaModalComponent implements OnInit {
  readonly semanaInicial = input.required<Semana>();
  readonly guardar = output<Semana>();
  readonly cerrado = output<void>();

  protected readonly semana = signal<Semana>([]);
  protected readonly falta = computed(() => validarSemana(this.semana()));

  ngOnInit(): void {
    this.semana.set(this.semanaInicial());
  }
}

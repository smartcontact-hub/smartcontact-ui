import { ChangeDetectionStrategy, Component, computed, input, type OnInit, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScTextareaComponent } from '@smartcontact-hub/components';


import { type Semana, validarSemana } from '../../state/horarios.core.mjs';
import { HorarioSemanaComponent } from './horario-semana.component';

/**
 * La semana habitual en un diálogo (experimento): se abre con el lápiz de la tarjeta o del día elegido en el
 * calendario. Edita una copia y no toca el horario hasta «Aplicar»; así se ve el calendario cambiar de golpe.
 */
@Component({
  selector: 'sc-horario-semana-modal',
  imports: [HorarioSemanaComponent, ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScTextareaComponent, TooltipModule, TranslateModule],
  template: `
    <sc-custom-modal [visible]="true" width="48rem" [title]="'repositories.horarios.section_week' | translate" (closed)="cerrado.emit()">
      <sc-horario-semana prefijo="semana-modal" [semana]="semana()" [falta]="falta()" (semanaChange)="semana.set($event)" />
      <!-- El mensaje automático de fuera de horario del horario: lo que oye quien llama cuando no se le atiende. -->
      <sc-textarea
        class="semana-mensaje"
        inputId="semana-mensaje"
        fluid
        [rows]="3"
        [label]="'repositories.horarios.x.message.out_label' | translate"
        [placeholder]="'repositories.horarios.x.message.placeholder' | translate"
        [helperText]="'repositories.horarios.x.message.out_help' | translate"
        [value]="mensaje()"
        (valueChange)="mensaje.set($event)"
      />
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
          (clicked)="guardar.emit({ semana: semana(), mensaje: mensaje().trim() })"
        />
      </div>
    </sc-custom-modal>
  `,
  styles: `
    .semana-mensaje {
      display: block;
      margin-block-start: var(--sc-spacing-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioSemanaModalComponent implements OnInit {
  readonly semanaInicial = input.required<Semana>();
  readonly mensajeInicial = input('');
  readonly guardar = output<{ readonly semana: Semana; readonly mensaje: string }>();
  readonly cerrado = output<void>();

  protected readonly semana = signal<Semana>([]);
  protected readonly mensaje = signal('');
  protected readonly falta = computed(() => validarSemana(this.semana()));

  ngOnInit(): void {
    this.semana.set(this.semanaInicial());
    this.mensaje.set(this.mensajeInicial());
  }
}

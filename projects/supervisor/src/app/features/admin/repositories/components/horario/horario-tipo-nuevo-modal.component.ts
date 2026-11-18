import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScInputTextComponent } from '@smartcontact-hub/components';

import { type Semana, validarSemana } from '../../state/horarios.core.mjs';
import { HorarioSemanaComponent } from './horario-semana.component';

const LABORABLE = [[540, 1080]] as const;

export interface HorarioNuevo {
  readonly name: string;
  readonly description: string;
  readonly week: Semana;
}

/** Un horario nuevo: pocos datos (nombre y la semana), así que se da de alta en un diálogo sobre la lista, sin página propia. */
@Component({
  selector: 'sc-horario-tipo-nuevo-modal',
  imports: [HorarioSemanaComponent, ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScInputTextComponent, TranslateModule],
  template: `
    <sc-custom-modal [visible]="true" width="46rem" [title]="'repositories.horariosTipo.create_title' | translate" (closed)="cerrado.emit()">
      <div class="nuevo">
        <sc-inputtext
          inputId="horario-nuevo-nombre"
          fluid
          required
          [label]="'repositories.columns.name' | translate"
          [placeholder]="'repositories.horariosTipo.name_placeholder' | translate"
          [value]="nombre()"
          (valueChange)="nombre.set($event)"
        />
        <sc-horario-semana prefijo="horario-nuevo" [semana]="semana()" [falta]="falta()" (semanaChange)="semana.set($event)" />
      </div>
      <div scCustomModalFooter>
        <sc-button size="sm" variant="secondary" appearance="outlined" [label]="'common.cancel' | translate" (clicked)="cerrado.emit()" />
        <sc-button size="sm" variant="primary" [disabled]="!valido()" [label]="'common.create' | translate" (clicked)="confirmar()" />
      </div>
    </sc-custom-modal>
  `,
  styles: `
    .nuevo {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-1-5);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioTipoNuevoModalComponent {
  readonly guardar = output<HorarioNuevo>();
  readonly cerrado = output<void>();

  protected readonly nombre = signal('');
  protected readonly semana = signal<Semana>([LABORABLE, LABORABLE, LABORABLE, LABORABLE, LABORABLE, [], []]);
  protected readonly falta = computed(() => validarSemana(this.semana()));
  protected readonly valido = computed(() => this.nombre().trim() !== '' && !this.falta());

  protected confirmar(): void {
    if (!this.valido()) return;
    this.guardar.emit({ name: this.nombre().trim(), description: '', week: this.semana() });
  }
}

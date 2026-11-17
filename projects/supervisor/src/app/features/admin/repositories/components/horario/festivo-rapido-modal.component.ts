import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  ScButtonComponent,
  ScCustomModalComponent,
  ScCustomModalFooterDirective,
  ScDatepickerComponent,
  ScInputTextComponent,
  ScSelectComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';

const dosCifras = (n: number): string => String(n).padStart(2, '0');
const aIso = (f: Date): string => `${f.getFullYear()}-${dosCifras(f.getMonth() + 1)}-${dosCifras(f.getDate())}`;

export interface FestivoRapido {
  readonly calendarioId: number;
  readonly name: string;
  readonly date: string;
  readonly yearly: boolean;
}

/** Añadir un festivo desde la lista de calendarios: a cuál, qué día y si se repite. Es un día de cierre propio del calendario. */
@Component({
  selector: 'sc-festivo-rapido-modal',
  imports: [ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScDatepickerComponent, ScInputTextComponent, ScSelectComponent, ScToggleSwitchComponent, TranslateModule],
  template: `
    <sc-custom-modal [visible]="true" width="30rem" [title]="'repositories.horarios.x.quick_holiday.title' | translate" (closed)="cerrado.emit()">
      <div class="rapido">
        <sc-select
          inputId="rapido-calendario"
          filter
          required
          [label]="'repositories.horarios.x.switcher.label' | translate"
          [options]="opciones()"
          optionLabel="label"
          optionValue="value"
          [value]="calendarioId()"
          (valueChange)="calendarioId.set($any($event))"
        />
        <sc-inputtext inputId="rapido-nombre" fluid required [label]="'repositories.columns.name' | translate" [placeholder]="'repositories.festivos.day_name_placeholder' | translate" [value]="nombre()" (valueChange)="nombre.set($event)" />
        <sc-datepicker inputId="rapido-fecha" required [label]="'repositories.horarios.special_date' | translate" [value]="fecha()" (valueChange)="fecha.set($event)" />
        <div class="rapido__anual">
          <sc-toggleswitch inputId="rapido-anual" [ariaLabel]="'repositories.horarios.repeat_yearly' | translate" [checked]="cadaAnio()" (checkedChange)="cadaAnio.set($event)" />
          <label class="sc-text-body-regular" for="rapido-anual">{{ 'repositories.horarios.repeat_yearly' | translate }}</label>
        </div>
      </div>
      <div scCustomModalFooter>
        <sc-button size="sm" variant="secondary" appearance="outlined" [label]="'common.cancel' | translate" (clicked)="cerrado.emit()" />
        <sc-button size="sm" variant="primary" [disabled]="!valido()" [label]="'common.create' | translate" (clicked)="confirmar()" />
      </div>
    </sc-custom-modal>
  `,
  styles: `
    .rapido {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-1);
    }
    .rapido__anual {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-1);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FestivoRapidoModalComponent {
  readonly calendarios = input.required<readonly { readonly id: number; readonly name: string }[]>();
  readonly guardar = output<FestivoRapido>();
  readonly cerrado = output<void>();

  protected readonly calendarioId = signal<number | null>(null);
  protected readonly nombre = signal('');
  protected readonly fecha = signal<Date | null>(null);
  protected readonly cadaAnio = signal(true);

  protected readonly opciones = computed(() => this.calendarios().map((c) => ({ value: c.id, label: c.name })));
  protected readonly valido = computed(() => this.calendarioId() !== null && this.nombre().trim() !== '' && this.fecha() !== null);

  protected confirmar(): void {
    if (!this.valido()) return;
    this.guardar.emit({ calendarioId: this.calendarioId()!, name: this.nombre().trim(), date: aIso(this.fecha()!), yearly: this.cadaAnio() });
  }
}

import { ChangeDetectionStrategy, Component, input, output, signal, type OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScSelectComponent } from '@smartcontact-hub/components';

/** El horario general del calendario (lo que vale fuera de los periodos): cuál es, y un atajo para editar sus horas. */
@Component({
  selector: 'sc-horario-general-modal',
  imports: [ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScSelectComponent, TranslateModule],
  template: `
    <sc-custom-modal [visible]="true" width="30rem" [title]="'repositories.horarios.x.general_modal.title' | translate" (closed)="cerrado.emit()">
      <sc-select
        inputId="general-horario"
        filter
        [label]="'repositories.horariosTipo.x.picker.label' | translate"
        [helperText]="'repositories.horarios.x.general_modal.help' | translate"
        [options]="opciones()"
        optionLabel="label"
        optionValue="value"
        [value]="elegido()"
        (valueChange)="elegido.set($any($event))"
      />
      <div scCustomModalFooter>
        <sc-button size="sm" variant="secondary" appearance="text" icon="edit" [label]="'repositories.horarios.x.general_modal.edit_hours' | translate" (clicked)="editarHoras.emit()" />
        <sc-button size="sm" variant="primary" [disabled]="elegido() === null" [label]="'common.save' | translate" (clicked)="guardar.emit(elegido()!)" />
      </div>
    </sc-custom-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioGeneralModalComponent implements OnInit {
  readonly horarioId = input<number | null>(null);
  readonly opciones = input<readonly { readonly value: number; readonly label: string }[]>([]);
  readonly guardar = output<number>();
  readonly editarHoras = output<void>();
  readonly cerrado = output<void>();
  protected readonly elegido = signal<number | null>(null);

  ngOnInit(): void {
    this.elegido.set(this.horarioId());
  }
}

import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective } from '@smartcontact-hub/components';

/** Lo que se elige al cambiar un horario que usan otros calendarios. */
export type AlcanceDelCambio = 'todos' | 'este';

/**
 * El aviso de editar un horario compartido: dice a cuántos calendarios más afecta y deja elegir si el cambio va a todos o solo
 * a este (que se queda con una copia). Es lo que propone la página de discovery de Horarios y calendarios.
 */
@Component({
  selector: 'sc-horario-compartido-modal',
  imports: [ScButtonComponent, ScCustomModalComponent, ScCustomModalFooterDirective, TranslateModule],
  template: `
    <sc-custom-modal [visible]="true" width="36rem" [title]="'repositories.horariosTipo.x.shared.title' | translate: { name: nombre() }" (closed)="cerrado.emit()">
      <p class="compartido__texto sc-text-body-regular">{{ cuerpo() | translate: { count: cuantos(), name: nombre() } }}</p>
      <ul class="compartido__opciones sc-text-caption-regular">
        <li>
          <strong class="sc-text-caption-semibold">{{ 'repositories.horariosTipo.x.shared.all' | translate }}</strong>
          · {{ 'repositories.horariosTipo.x.shared.all_help' | translate }}
        </li>
        <li>
          <strong class="sc-text-caption-semibold">{{ 'repositories.horariosTipo.x.shared.only_this' | translate }}</strong>
          · {{ 'repositories.horariosTipo.x.shared.only_this_help' | translate }}
        </li>
      </ul>
      <div scCustomModalFooter>
        <sc-button size="sm" variant="secondary" appearance="text" [label]="'common.cancel' | translate" (clicked)="cerrado.emit()" />
        <sc-button size="sm" variant="secondary" appearance="outlined" [label]="'repositories.horariosTipo.x.shared.only_this' | translate" (clicked)="elegido.emit('este')" />
        <sc-button size="sm" variant="primary" [label]="'repositories.horariosTipo.x.shared.all' | translate" (clicked)="elegido.emit('todos')" />
      </div>
    </sc-custom-modal>
  `,
  styles: `
    .compartido__texto {
      margin: 0 0 var(--sc-spacing-1);
    }

    .compartido__opciones {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-0-5);
      margin: 0;
      padding-inline-start: var(--sc-spacing-1-25);
      color: var(--sc-text-secondary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioCompartidoModalComponent {
  /** El horario que se edita. */
  readonly nombre = input('');
  /** Cuántos calendarios más lo usan. */
  readonly cuantos = input.required<number>();
  readonly elegido = output<AlcanceDelCambio>();
  readonly cerrado = output<void>();

  protected readonly cuerpo = computed(() =>
    this.cuantos() === 1 ? 'repositories.horariosTipo.x.shared.body_one' : 'repositories.horariosTipo.x.shared.body',
  );
}

import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  ScInputTextComponent as InputTextComponent,
  ScSelectComponent as SelectComponent,
} from '@smartcontact-hub/components';

import { GROUP_PRIORITIES, GroupPriority, PRIORITY_LABEL_KEYS } from '../../data/groups-data';

/**
 * LOS DATOS DEL GRUPO: nombre, teléfono asociado y prioridad. La MISMA pieza en la sección General de la
 * ficha (sin teléfono: desde DD-121 vive en la distribución de Teléfono) y en el diálogo de duplicar.
 *
 * Por qué una pieza y no dos copias: que sea el mismo componente garantiza la rima entre lo que se pide
 * al duplicar y lo que dice la ficha: mismos campos, mismo orden, mismas palabras y mismos avisos.
 *
 * Cuántas columnas lo dice quien la usa: en el diálogo, una debajo de otra (`apilada`); en la ficha, en
 * fila, con las columnas de `.grid--3`, que son las de los canales de debajo. Hasta el 2026-10-17 lo decidía
 * una `@container` de 720 sobre la propia pieza, y en la ficha la pieza mide menos de eso entre 1340 y 1410
 * de ventana (y hacia 1024): los campos pasaban a una columna y los canales seguían en tres (DD-170 §6).
 *
 * El teléfono saliente solo con el canal Teléfono: es el número que ve el cliente cuando llama un
 * agente del grupo, y a un grupo de chat no hay que pedírselo. Con Teléfono es obligatorio y sale de los
 * números asignados, sin escribir uno nuevo (DD-142).
 */
@Component({
  selector: 'sc-group-identity-fields',
  imports: [InputTextComponent, SelectComponent, TranslateModule],
  templateUrl: './group-identity-fields.component.html',
  styleUrl: './group-identity-fields.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupIdentityFieldsComponent {
  /** Prefijo de los `id`: el diálogo y la ficha no deben compartirlos. */
  readonly idPrefix = input('group');
  readonly name = input('');
  readonly phone = input('');
  readonly priority = input<GroupPriority>('Baja');
  readonly hasPhone = input(true);
  /** Una debajo de otra, para el diálogo de duplicar; sin ella, en las tres columnas de la ficha. */
  readonly apilada = input(false, { transform: booleanAttribute });
  /** Los números asignados a la cuenta: no se escribe uno nuevo (DD-142). */
  readonly phoneOptions = input<readonly string[]>([]);
  /** Clave del aviso bajo el nombre, ya decidido por quien la usa (vacío, repetido…). */
  readonly nameError = input<string | null>(null);
  /** Clave del aviso bajo el teléfono saliente, ya decidido por quien la usa (falta, con Teléfono). */
  readonly phoneError = input<string | null>(null);

  readonly nameChange = output<string>();
  readonly phoneChange = output<string>();
  readonly priorityChange = output<GroupPriority>();
  /** Enter en el NOMBRE (no en los desplegables, donde Enter elige una opción): el diálogo lo usa para duplicar. */
  readonly enter = output<void>();

  protected readonly priorities = GROUP_PRIORITIES;
  protected readonly priorityKeys: Readonly<Record<string, string>> = PRIORITY_LABEL_KEYS;

  protected onPhone(value: unknown): void {
    this.phoneChange.emit(typeof value === 'string' ? value : '');
  }

  protected onPriority(value: unknown): void {
    if (typeof value === 'string') this.priorityChange.emit(value as GroupPriority);
  }
}

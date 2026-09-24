import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  ScInputTextComponent as InputTextComponent,
  ScSelectComponent as SelectComponent,
} from '@smartcontact-hub/components';

import { GROUP_PRIORITIES, GroupPriority, PRIORITY_LABEL_KEYS } from '../../data/groups-data';

/**
 * LOS DATOS DEL GRUPO: nombre, teléfono asociado y prioridad. La MISMA pieza en el alta y en la
 * pestaña Identidad (2026-09-24).
 *
 * Por qué una pieza y no dos copias: el alta pedía nombre y canales, y la ficha abría por la fila de
 * canales, así que lo primero que se veía al entrar era lo que se acababa de rellenar: el alta y
 * la ficha no eran consistentes, y el segundo paso repetía el primero. Ahora el alta pide lo que dice
 * la cabecera y vive en Identidad, y la ficha abre por lo siguiente, canales y agentes. Que sea el
 * mismo componente garantiza la rima: mismos campos, mismo orden, mismas palabras y mismos avisos.
 *
 * Cuántas columnas lo decide su CONTENEDOR, no la ventana: en el diálogo, una debajo de otra; en la
 * pestaña, en una fila de tres. Por eso una `@container` y no una `@media`.
 *
 * El teléfono asociado solo con el canal Teléfono: es el número que ve el cliente cuando llama un
 * agente del grupo, y a un grupo de chat no hay que pedírselo.
 */
@Component({
  selector: 'sc-group-identity-fields',
  imports: [InputTextComponent, SelectComponent, TranslateModule],
  templateUrl: './group-identity-fields.component.html',
  styleUrl: './group-identity-fields.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupIdentityFieldsComponent {
  /** Prefijo de los `id`: el alta y la ficha no deben compartirlos. */
  readonly idPrefix = input('group');
  readonly name = input('');
  readonly phone = input('');
  readonly priority = input<GroupPriority>('Baja');
  readonly hasPhone = input(true);
  /** Los números que ya usan los grupos; también se puede escribir uno nuevo. */
  readonly phoneOptions = input<readonly string[]>([]);
  /** Clave del aviso bajo el nombre, ya decidido por quien la usa (vacío, repetido…). */
  readonly nameError = input<string | null>(null);

  readonly nameChange = output<string>();
  readonly phoneChange = output<string>();
  readonly priorityChange = output<GroupPriority>();
  /** Enter en el NOMBRE (no en los desplegables, donde Enter elige una opción): el alta lo usa para crear. */
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

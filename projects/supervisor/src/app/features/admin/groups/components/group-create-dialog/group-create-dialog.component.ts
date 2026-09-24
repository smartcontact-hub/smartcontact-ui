import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  ScButtonComponent as ButtonComponent,
  ScDialogComponent as DialogComponent,
} from '@smartcontact-hub/components';

import { Group, GroupPriority } from '../../data/groups-data';
import { GroupIdentityFieldsComponent } from '../group-identity-fields/group-identity-fields.component';

/** Lo que devuelve el alta: lo que identifica al grupo y dice su cabecera, nada más. */
export interface GroupCreateSubmission {
  readonly name: string;
  readonly phone: string;
  readonly priority: GroupPriority;
}

/**
 * EL ALTA DE GRUPO: el primer paso de la ficha, no una copia de su primera pantalla.
 *
 * Crear un grupo abría la ficha entera: cinco pestañas y unos 35 campos para algo que solo pide un
 * nombre (2026-09-23, DD-119). La primera versión corta pedía nombre y CANALES, y la ficha abría por
 * la fila de canales: lo primero que se veía al entrar era lo que se acababa de rellenar. Rafa
 * (2026-09-24): «es un paso extra, al entrar tengo lo mismo que acabo de configurar; tiene que
 * rimar». Ahora el alta pide lo que dice la CABECERA de la ficha —nombre, teléfono asociado,
 * prioridad— con la misma pieza que la pestaña Identidad (`sc-group-identity-fields`), y la ficha
 * abre por lo siguiente: canales y agentes. Nada se pregunta dos veces. Los canales nacen con Teléfono,
 * como antes, y todo lo demás con los valores por defecto de Grupos.
 *
 * El mismo diálogo DUPLICA, cambiando rótulos y el punto de partida (teardown B4: un molde, dos
 * objetos). Quien lo abre decide con `source`; quien crea el grupo es la lista, no el diálogo.
 *
 * Validación, la de la casa: lo obligatorio se dice al intentar crear, no al abrir (un campo vacío
 * aún no es un error); un nombre repetido sí se dice en vivo, porque ya lo has escrito.
 */
@Component({
  selector: 'sc-group-create-dialog',
  imports: [ButtonComponent, DialogComponent, GroupIdentityFieldsComponent, TranslateModule],
  templateUrl: './group-create-dialog.component.html',
  styleUrl: './group-create-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupCreateDialogComponent {
  readonly visible = input(false);
  /** El grupo del que se parte al duplicar; `null` es un alta desde cero. */
  readonly source = input<Group | null>(null);
  /** El nombre que propone al duplicar, ya traducido («… (copia)»). */
  readonly suggestedName = input('');
  /** Los nombres que ya están cogidos. */
  readonly existingNames = input<readonly string[]>([]);
  /** Los números que ya usan los grupos, para el desplegable del teléfono asociado. */
  readonly phoneOptions = input<readonly string[]>([]);
  /** La prioridad con la que nace un grupo nuevo (valores por defecto de Grupos). */
  readonly defaultPriority = input<GroupPriority>('Baja');

  readonly cancelled = output<void>();
  readonly confirm = output<GroupCreateSubmission>();

  protected readonly name = signal('');
  protected readonly phone = signal('');
  protected readonly priority = signal<GroupPriority>('Baja');
  /** Se intentó crear: desde aquí lo que falta se dice. */
  private readonly submitted = signal(false);

  constructor() {
    // Cada apertura empieza limpia: lo que quedó de la anterior no es de este alta.
    effect(() => {
      if (!this.visible()) return;
      const source = this.source();
      this.name.set(source ? this.suggestedName() : '');
      // El teléfono asociado identifica: un duplicado no se lo lleva. La prioridad sí.
      this.phone.set('');
      this.priority.set(source ? source.priority : this.defaultPriority());
      this.submitted.set(false);
    });
  }

  private readonly taken = computed(() => {
    const wanted = this.name().trim().toLocaleLowerCase('es');
    return wanted.length > 0 && this.existingNames().some((n) => n.trim().toLocaleLowerCase('es') === wanted);
  });

  protected readonly nameError = computed<string | null>(() => {
    if (this.taken()) return 'groups.errors.name_taken';
    if (this.submitted() && !this.name().trim()) return 'groups.errors.name_required';
    return null;
  });

  /** Un grupo nuevo nace con Teléfono; un duplicado, con los canales del original. */
  protected readonly hasPhone = computed(() => {
    const source = this.source();
    return source ? source.channels.includes('phone') : true;
  });

  /** Foco al nombre y, al duplicar, seleccionado: lo normal es escribir encima de la propuesta. */
  protected onShown(): void {
    const input = document.getElementById('group-create-name') as HTMLInputElement | null;
    input?.focus();
    input?.select();
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.nameError()) {
      document.getElementById('group-create-name')?.focus();
      return;
    }
    this.confirm.emit({ name: this.name().trim(), phone: this.phone().trim(), priority: this.priority() });
  }
}

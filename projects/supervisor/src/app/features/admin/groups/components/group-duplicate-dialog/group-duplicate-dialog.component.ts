import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  ScButtonComponent as ButtonComponent,
  ScDialogComponent as DialogComponent,
} from '@smartcontact-hub/components';

import { Group, GroupIdentityDraft, GroupPriority } from '../../data/groups-data';
import { GroupIdentityFieldsComponent } from '../group-identity-fields/group-identity-fields.component';

/**
 * DUPLICAR UN GRUPO: el diálogo corto que pide lo que dice la cabecera de la copia —nombre, teléfono
 * asociado y prioridad—, con la misma pieza que la ficha (`sc-group-identity-fields`). Todo lo demás
 * (canales, distribución, colas, recursos y agentes) se copia del original.
 *
 * Hasta el 2026-09-26 este diálogo también daba de alta un grupo desde cero (DD-119). Desde DD-121 §11
 * el alta es la propia ficha en modo alta, así que aquí solo queda duplicar: el diálogo siempre parte
 * de un grupo (`source`), y quien crea la copia es el listado, no el diálogo.
 *
 * Validación, la de la casa: el nombre obligatorio se dice al intentar duplicar, no al abrir (un campo
 * vacío aún no es un error); un nombre repetido sí se dice en vivo, porque ya lo has escrito. Con Teléfono,
 * el teléfono saliente también es obligatorio (DD-142): la copia no se lleva el del original.
 */
@Component({
  selector: 'sc-group-duplicate-dialog',
  imports: [ButtonComponent, DialogComponent, GroupIdentityFieldsComponent, TranslateModule],
  templateUrl: './group-duplicate-dialog.component.html',
  styleUrl: './group-duplicate-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupDuplicateDialogComponent {
  readonly visible = input(false);
  /** El grupo que se duplica. */
  readonly source = input.required<Group>();
  /** El nombre que propone para la copia, ya traducido («… (copia)»). */
  readonly suggestedName = input('');
  /** Los nombres que ya están cogidos. */
  readonly existingNames = input<readonly string[]>([]);
  /** Los números asignados a la cuenta, para el desplegable del teléfono saliente (DD-142). */
  readonly phoneOptions = input<readonly string[]>([]);

  readonly cancelled = output<void>();
  readonly confirm = output<GroupIdentityDraft>();

  protected readonly name = signal('');
  protected readonly phone = signal('');
  protected readonly priority = signal<GroupPriority>('Baja');
  /** Se intentó duplicar: desde aquí lo que falta se dice. */
  private readonly submitted = signal(false);

  constructor() {
    // Cada apertura empieza limpia: lo que quedó de la anterior no es de esta copia.
    effect(() => {
      if (!this.visible()) return;
      this.name.set(this.suggestedName());
      // El teléfono asociado identifica: un duplicado no se lo lleva. La prioridad sí.
      this.phone.set('');
      this.priority.set(this.source().priority);
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

  /** La copia lleva los canales del original: con Teléfono, pide su número. */
  protected readonly hasPhone = computed(() => this.source().channels.includes('phone'));

  /** Con Teléfono y sin número: se dice al intentar duplicar, como el nombre vacío. */
  protected readonly phoneError = computed<string | null>(() =>
    this.submitted() && this.hasPhone() && !this.phone().trim() ? 'groups.errors.phone_required' : null,
  );

  /** Foco al nombre, seleccionado: lo normal es escribir encima de la propuesta. */
  protected onShown(): void {
    const input = document.getElementById('group-duplicate-name') as HTMLInputElement | null;
    input?.focus();
    input?.select();
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.nameError()) {
      document.getElementById('group-duplicate-name')?.focus();
      return;
    }
    if (this.phoneError()) {
      document.getElementById('group-duplicate-phone')?.focus();
      return;
    }
    this.confirm.emit({ name: this.name().trim(), phone: this.phone().trim(), priority: this.priority() });
  }
}

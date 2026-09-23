import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  ScButtonComponent as ButtonComponent,
  ScCheckboxComponent as CheckboxComponent,
  ScDialogComponent as DialogComponent,
  ScInputTextComponent as InputTextComponent,
} from '@smartcontact-hub/components';

import { CHANNEL_LABEL_KEYS, GROUP_CHANNELS, Group, GroupChannel } from '../../data/groups-data';

/** Lo que devuelve el alta: lo que identifica al grupo, nada más. */
export interface GroupCreateSubmission {
  readonly name: string;
  readonly channels: readonly GroupChannel[];
}

/**
 * EL ALTA DE GRUPO, EN CORTO (Rafa, 2026-09-23).
 *
 * Antes «Nuevo grupo» abría la ficha entera: cinco pestañas y unos 35 campos para algo que solo
 * pide un nombre. Medido en local: con el nombre escrito y Guardar, la ficha ya te dejaba en
 * «Canales y agentes» del grupo recién creado. El alta ya era de dos pasos; solo que la pantalla
 * no lo decía. Aquí se pide lo que identifica al grupo —nombre y canales— y todo lo demás nace
 * con los valores por defecto de Grupos (teardown B1: crear y editar no son el mismo formulario).
 *
 * El mismo diálogo DUPLICA, cambiando rótulos y el punto de partida (teardown B4: un molde, dos
 * objetos). Quien lo abre decide con `source`; quien crea el grupo es la lista, no el diálogo.
 *
 * Validación, la de la casa: lo obligatorio se dice al intentar crear, no al abrir (un campo
 * vacío aún no es un error); un nombre repetido sí se dice en vivo, porque ya lo has escrito.
 */
@Component({
  selector: 'sc-group-create-dialog',
  imports: [ButtonComponent, CheckboxComponent, DialogComponent, InputTextComponent, TranslateModule],
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

  readonly cancelled = output<void>();
  readonly confirm = output<GroupCreateSubmission>();

  protected readonly channelOptions = GROUP_CHANNELS;
  protected readonly channelKeys = CHANNEL_LABEL_KEYS;

  protected readonly name = signal('');
  protected readonly channels = signal<ReadonlySet<GroupChannel>>(new Set(['phone']));
  /** Se intentó crear: desde aquí lo que falta se dice. */
  private readonly submitted = signal(false);

  constructor() {
    // Cada apertura empieza limpia: lo que quedó de la anterior no es de este alta.
    effect(() => {
      if (!this.visible()) return;
      const source = this.source();
      this.name.set(source ? this.suggestedName() : '');
      this.channels.set(new Set(source ? source.channels : ['phone']));
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

  protected readonly channelsError = computed<string | null>(() =>
    this.submitted() && this.channels().size === 0 ? 'groups.errors.channels_required' : null,
  );

  protected has(channel: GroupChannel): boolean {
    return this.channels().has(channel);
  }

  protected toggle(channel: GroupChannel): void {
    this.channels.update((current) => {
      const next = new Set(current);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      return next;
    });
  }

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
    if (this.channelsError()) return;
    this.confirm.emit({
      name: this.name().trim(),
      channels: GROUP_CHANNELS.filter((c) => this.channels().has(c)),
    });
  }
}

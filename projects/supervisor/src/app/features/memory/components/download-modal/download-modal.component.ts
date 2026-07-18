import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';

import { IconComponent } from '@shared/components';
import {
  ScDialogComponent as DialogComponent,
  ScCheckboxComponent as CheckboxComponent,
} from '@smartcontact-hub/components';

/**
 * Memory · 'download' modal — opciones de qué descargar para la conversación
 * activa del player. Reemplaza el toast inmediato pre-S47 que disparaba
 * descarga implícita por aviso GDPR + selección explícita.
 *
 * Spec: `memory-migration-inventory.md §10 #4` ("Modal 'download' heredado
 * SC: checkboxes Grabaciones + Chats marcados por defecto + aviso GDPR
 * 'Deleted or empty conversations won't download'"). Trigger producción
 * real backend — hoy la confirmación dispara el toast actual de descarga.
 *
 * Comportamiento:
 * - Apertura controlada por el caller (input `visible`).
 * - Checkboxes default ON. Si alguno explícito al call site debe arrancar
 *   OFF (e.g. chat-only sin audio), el caller pre-set via input.
 * - Botón Descargar emite `confirm({ recordings, chats })`; el caller
 *   ejecuta la descarga real (hoy toast, mañana backend).
 * - Botón Cancelar / close X emiten `cancelled` igual.
 * - Aviso GDPR fijo visible — no es opcional ni colapsable.
 */
@Component({
  selector: 'sc-memory-download-modal',
  standalone: true,
  imports: [ButtonComponent, CheckboxComponent, DialogComponent, IconComponent, TranslateModule],
  templateUrl: './download-modal.component.html',
  styleUrl: './download-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadModalComponent {
  readonly visible = input<boolean>(false);
  /** Si el caller sabe que no hay grabaciones, llega con `false` para que
   * el checkbox arranque desmarcado + disabled. */
  readonly hasRecordings = input<boolean>(true);
  /** Idem para chats — modo channel-aware. */
  readonly hasChats = input<boolean>(true);

  readonly confirm = output<{ readonly recordings: boolean; readonly chats: boolean }>();
  readonly cancelled = output<void>();

  protected readonly downloadIcon = 'download';
  protected readonly infoIcon = 'info';

  protected readonly recordingsChecked = signal<boolean>(true);
  protected readonly chatsChecked = signal<boolean>(true);

  /** Bloquea Confirmar si el usuario desmarca todos los checkboxes. */
  protected readonly canConfirm = computed<boolean>(() => {
    const r = this.recordingsChecked() && this.hasRecordings();
    const c = this.chatsChecked() && this.hasChats();
    return r || c;
  });

  protected onRecordingsToggle(checked: boolean): void {
    this.recordingsChecked.set(checked);
  }

  protected onChatsToggle(checked: boolean): void {
    this.chatsChecked.set(checked);
  }

  protected onConfirm(): void {
    if (!this.canConfirm()) return;
    this.confirm.emit({
      recordings: this.recordingsChecked() && this.hasRecordings(),
      chats: this.chatsChecked() && this.hasChats(),
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}

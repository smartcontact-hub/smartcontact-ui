import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScButtonComponent as ButtonComponent } from '@smartcontact-hub/components';
import { map, startWith } from 'rxjs';

import { IconComponent } from '@shared/components';
import { ScDialogComponent as DialogComponent } from '@smartcontact-hub/components';

/**
 * RetranscriptionConfirmModal · Memory §10 #1 (S46).
 *
 * Réplica 1:1 Angular+SCDS de `RetranscriptionConfirmModal.tsx`. Modal
 * destructivo: la re-transcripción borra la transcripción actual y los
 * análisis derivados. Patrón "type CONFIRMAR" gate (mismo que
 * delete-entity-dialog) para evitar clicks accidentales.
 *
 * El parent dispatcha (reusa `ConversationsStore.dispatchTranscription`);
 * este componente solo gate-checks la confirmación.
 */
@Component({
  selector: 'sc-memory-retranscription-confirm-modal',
  imports: [ButtonComponent, FormsModule, IconComponent, DialogComponent, TranslateModule],
  templateUrl: './retranscription-confirm-modal.component.html',
  styleUrl: './retranscription-confirm-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetranscriptionConfirmModalComponent {
  readonly visible = input<boolean>(false);

  readonly cancelled = output<void>();
  readonly confirmed = output<void>();

  private readonly translate = inject(TranslateService);
  /** Reactive lang dependency — el gate token se traduce per-locale
   *  (ES "CONFIRMAR", EN "CONFIRM", FR "CONFIRMER", PT "CONFIRMAR"). */
  private readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang),
    ),
    { initialValue: this.translate.currentLang },
  );

  protected readonly gateToken = computed(() => {
    this.currentLang();
    return this.translate.instant('memory.player.retranscribe.gate_token');
  });

  protected readonly confirmText = signal('');
  protected readonly isValid = computed(() => this.confirmText() === this.gateToken());

  protected readonly retransIcon = 'rotate_left';
  protected readonly alertIcon = 'warning';

  constructor() {
    effect(() => {
      if (!this.visible()) {
        this.confirmText.set('');
      }
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  protected onConfirm(): void {
    if (!this.isValid()) return;
    this.confirmed.emit();
  }
}

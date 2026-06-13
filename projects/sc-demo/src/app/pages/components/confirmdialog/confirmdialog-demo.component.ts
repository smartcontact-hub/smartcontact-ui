import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import {
  provideScConfirm,
  ScButtonComponent,
  ScConfirmDialogComponent,
  ScConfirmService,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-confirmdialog-demo',
  imports: [ScButtonComponent, ScConfirmDialogComponent],
  providers: [provideScConfirm()],
  templateUrl: './confirmdialog-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogDemoComponent {
  private readonly confirm = inject(ScConfirmService);
  readonly result = signal<string>('—');

  async ask(tone: 'primary' | 'danger', emphasis: 'accept' | 'reject'): Promise<void> {
    const ok = await this.confirm.request({
      title: '¿Eliminar el agente?',
      body: 'Esta acción no se puede deshacer.',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptTone: tone,
      emphasis,
    });
    this.result.set(ok ? 'aceptado' : 'rechazado');
  }
}

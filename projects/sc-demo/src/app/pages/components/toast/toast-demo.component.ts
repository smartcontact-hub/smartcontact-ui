import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import {
  provideScToast,
  ScButtonComponent,
  ScToastComponent,
  ScToastService,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-toast-demo',
  imports: [ScButtonComponent, ScToastComponent],
  providers: [provideScToast()],
  templateUrl: './toast-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastDemoComponent {
  private readonly toast = inject(ScToastService);

  show(severity: 'success' | 'info' | 'warn' | 'error'): void {
    this.toast[severity]('Título del toast', 'Detalle del mensaje de ejemplo.');
  }
}

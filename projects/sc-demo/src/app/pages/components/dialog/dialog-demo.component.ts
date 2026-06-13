import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import {
  provideScDynamicDialog,
  ScButtonComponent,
  ScDialogComponent,
  ScDynamicDialogService,
} from '../../../../../../ui-smartcontact/src/public-api';
import { DynamicContentComponent } from './dynamic-content.component';

@Component({
  selector: 'app-dialog-demo',
  imports: [ScButtonComponent, ScDialogComponent],
  providers: [provideScDynamicDialog()],
  templateUrl: './dialog-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogDemoComponent {
  private readonly dynamic = inject(ScDynamicDialogService);
  readonly open = signal(false);
  readonly dynResult = signal('—');

  openDynamic(): void {
    const ref = this.dynamic.open<DynamicContentComponent, unknown, never, string>(
      DynamicContentComponent,
      { header: 'Diálogo dinámico', width: '28rem' },
    );
    ref.onClose.subscribe((r) => this.dynResult.set(r ?? 'cerrado'));
  }
}

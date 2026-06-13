import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  ScBulkTranscriptionModalComponent,
  ScBulkTranscriptionModalResult,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-bulktranscriptionmodal-demo',
  imports: [ScBulkTranscriptionModalComponent],
  templateUrl: './bulktranscriptionmodal-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkTranscriptionModalDemoComponent {
  readonly open = signal(true);
  readonly lastResult = signal<ScBulkTranscriptionModalResult | null>(null);

  onProcessed(result: ScBulkTranscriptionModalResult): void {
    this.lastResult.set(result);
    this.open.set(false);
  }

  onClosed(): void {
    this.open.set(false);
  }

  reopen(): void {
    this.lastResult.set(null);
    this.open.set(true);
  }
}

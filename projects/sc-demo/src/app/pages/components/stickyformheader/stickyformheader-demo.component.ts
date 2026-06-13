import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ScStickyFormHeaderComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-stickyformheader-demo',
  imports: [ScStickyFormHeaderComponent],
  templateUrl: './stickyformheader-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyFormHeaderDemoComponent {
  readonly name = signal('Soporte Ventas');
  readonly saved = signal(false);

  onNameChange(v: string): void {
    this.name.set(v);
  }

  onSave(): void {
    this.saved.set(true);
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import {
  ScKeyboardShortcutsComponent,
  ScKeyboardShortcutsService,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-keyboardshortcuts-demo',
  imports: [ScKeyboardShortcutsComponent],
  templateUrl: './keyboardshortcuts-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyboardShortcutsDemoComponent {
  protected readonly shortcuts = inject(ScKeyboardShortcutsService);
}

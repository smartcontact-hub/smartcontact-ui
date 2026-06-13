import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ScInlineRenameCellComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-inlinerenamecell-demo',
  imports: [ScInlineRenameCellComponent],
  templateUrl: './inlinerenamecell-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineRenameCellDemoComponent {
  readonly name = signal('Equipo de Soporte');
  readonly editing = signal(false);

  startEdit(): void {
    this.editing.set(true);
  }

  onCommit(value: string): void {
    this.name.set(value);
    this.editing.set(false);
  }

  onCancel(): void {
    this.editing.set(false);
  }
}

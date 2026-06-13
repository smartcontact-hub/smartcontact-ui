import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  ScCheckboxComponent,
  TriState,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-checkbox-demo',
  imports: [ScCheckboxComponent],
  templateUrl: './checkbox-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxDemoComponent {
  // Cabecera "select all" tri-estado sobre 3 filas.
  readonly rows = signal<boolean[]>([false, true, false]);

  headerState(): TriState {
    const sel = this.rows().filter(Boolean).length;
    return sel === 0 ? 'none' : sel === this.rows().length ? 'all' : 'some';
  }

  onHeaderCycle(next: boolean): void {
    this.rows.set(this.rows().map(() => next));
  }

  toggleRow(i: number): void {
    this.rows.update((r) => r.map((v, idx) => (idx === i ? !v : v)));
  }

  rowState(i: number): TriState {
    return this.rows()[i] ? 'all' : 'none';
  }
}

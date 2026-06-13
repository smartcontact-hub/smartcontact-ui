import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  ImpactBadge,
  ImpactItem,
  ScImpactPreviewDialogComponent,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-impactpreviewdialog-demo',
  imports: [ScImpactPreviewDialogComponent],
  templateUrl: './impactpreviewdialog-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpactPreviewDialogDemoComponent {
  readonly open = signal(false);
  readonly items = signal<ImpactItem[]>([
    { id: 1, name: 'Agente Soporte', hint: '(3 grupos)' },
    { id: 2, name: 'Agente Ventas' },
    { id: 3, name: 'Agente Postventa' },
  ]);
  readonly badge: ImpactBadge = {
    fieldLabel: 'Prioridad',
    currentValueLabel: 'Media',
    newValueLabel: 'Alta',
  };
  readonly result = signal<readonly number[] | null>(null);

  onConfirm(ids: readonly number[]): void {
    this.result.set(ids);
    this.open.set(false);
  }
}

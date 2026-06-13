import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PrimeTemplate } from 'primeng/api';

import { ScSelectComponent } from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-select-demo',
  imports: [ScSelectComponent, PrimeTemplate],
  templateUrl: './select-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectDemoComponent {
  readonly groups = ['Soporte', 'Ventas', 'Postventa', 'Calidad'];
  readonly objOptions = [
    { name: 'Alta', id: 'high' },
    { name: 'Media', id: 'mid' },
    { name: 'Baja', id: 'low' },
  ];
  readonly value = signal<string>('');
}

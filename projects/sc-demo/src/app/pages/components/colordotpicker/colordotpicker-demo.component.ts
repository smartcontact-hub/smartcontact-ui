import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  ColorDotOption,
  LABEL_COLORS,
  ScColorDotPickerComponent,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-colordotpicker-demo',
  imports: [ScColorDotPickerComponent],
  templateUrl: './colordotpicker-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorDotPickerDemoComponent {
  readonly options: ColorDotOption[] = LABEL_COLORS.map((c) => ({
    value: c,
    label: c,
    color: `var(--sc-label-${c}-dot)`,
  }));
  readonly value = signal<string>('blue');
}

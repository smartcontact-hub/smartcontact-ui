import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  FormNavSection,
  ScFormSectionNavComponent,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-formsectionnav-demo',
  imports: [ScFormSectionNavComponent],
  templateUrl: './formsectionnav-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSectionNavDemoComponent {
  readonly sections: FormNavSection[] = [
    { id: 'general', labelKey: 'General', icon: 'tune' },
    { id: 'voz', labelKey: 'Voz y saludo', icon: 'record_voice_over' },
    { id: 'horario', labelKey: 'Horario', icon: 'schedule' },
    { id: 'avanzado', labelKey: 'Avanzado', icon: 'settings' },
  ];
  readonly active = signal('general');
  readonly errors = new Set(['horario']);

  onActive(id: string): void {
    this.active.set(id);
  }
}

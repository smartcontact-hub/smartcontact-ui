import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

import {
  ScInputNumberComponent,
  ScInputTextComponent,
  ScSelectComponent,
  ScToggleSwitchComponent,
} from '../../../../ui-smartcontact/src/public-api';
import { ArgType, ScArgs } from './story.types';

/**
 * Knobs en vivo del Playground. DOGFOODING: usa los propios componentes del DS para
 * editar los args — `sc-select` (enums), `sc-toggleswitch` (boolean), `sc-inputtext`
 * (texto), `sc-inputnumber` (número), `<input type=color>` (color). Cada cambio reemite
 * `args` (objeto nuevo, inmutable) → el canvas re-bindea.
 */
@Component({
  selector: 'app-story-controls',
  imports: [ScSelectComponent, ScToggleSwitchComponent, ScInputTextComponent, ScInputNumberComponent],
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-controls">
      @if (!argTypes().length) {
        <p class="sb-controls__empty">Este componente no expone knobs configurables.</p>
      } @else {
        @for (at of argTypes(); track at.name) {
          <div class="sb-controls__label">
            <code>{{ at.label ?? at.name }}</code>
            @if (at.description) {
              <span>{{ at.description }}</span>
            }
          </div>
          <div class="sb-controls__field">
            @switch (at.control.kind) {
              @case ('boolean') {
                <sc-toggleswitch
                  [checked]="asBool(args()[at.name])"
                  (checkedChange)="setArg(at.name, $event)"
                  [ariaLabel]="at.name"
                />
              }
              @case ('select') {
                <sc-select
                  [options]="selectOptions(at)"
                  optionLabel="label"
                  optionValue="value"
                  [value]="args()[at.name]"
                  (valueChange)="setArg(at.name, $event)"
                />
              }
              @case ('number') {
                <sc-inputnumber
                  [value]="asNum(args()[at.name])"
                  (valueChange)="setArg(at.name, $event)"
                />
              }
              @case ('color') {
                <input
                  type="color"
                  class="sb-color"
                  [value]="asStr(args()[at.name]) || '#000000'"
                  (input)="setArg(at.name, $any($event.target).value)"
                />
              }
              @default {
                <sc-inputtext
                  [value]="asStr(args()[at.name])"
                  (valueChange)="setArg(at.name, $event)"
                />
              }
            }
          </div>
        }
      }
    </div>
  `,
})
export class StoryControlsComponent {
  readonly argTypes = input<readonly ArgType[]>([]);
  readonly args = model<ScArgs>({});

  protected setArg(name: string, value: unknown): void {
    this.args.set({ ...this.args(), [name]: value });
  }

  /** Opciones {label,value} para `sc-select` (narrowing del control en TS, no en plantilla). */
  protected selectOptions(at: ArgType): readonly { label: string; value: string | number }[] {
    return at.control.kind === 'select'
      ? at.control.options.map((o) => ({ label: String(o), value: o }))
      : [];
  }

  protected asStr(v: unknown): string {
    return typeof v === 'string' ? v : v == null ? '' : String(v);
  }
  protected asNum(v: unknown): number | null {
    return typeof v === 'number' ? v : null;
  }
  protected asBool(v: unknown): boolean {
    return !!v;
  }
}

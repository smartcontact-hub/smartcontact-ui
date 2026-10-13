import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

import {
  ScInputNumberComponent,
  ScInputTextComponent,
  ScSelectComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { ArgType, ScArgs } from './story.types';

/**
 * Knobs en vivo del Playground. DOGFOODING: usa los propios componentes del DS para
 * editar los args — `sc-select` (enums), `sc-toggleswitch` (boolean), `sc-inputtext`
 * (texto), `sc-inputnumber` (número), `<input type=color>` (color). Cada cambio reemite
 * `args` (objeto nuevo, inmutable) → el canvas re-bindea.
 *
 * Viven en el panel de la derecha (`story-panel.component.ts`), uno debajo de otro: nombre, para qué sirve y el campo.
 * Cada control que ya no vale lo de la ficha (`base`) lo DICE —un punto y un borde de marca— y trae su botón para volver,
 * así se ve de un vistazo qué se ha tocado y qué no.
 */
@Component({
  selector: 'app-story-controls',
  imports: [ScIconComponent, ScSelectComponent, ScToggleSwitchComponent, ScInputTextComponent, ScInputNumberComponent],
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-controls">
      @if (!argTypes().length) {
        <p class="sb-controls__empty sc-text-caption-regular">Este componente no expone knobs configurables.</p>
      } @else {
        @for (at of argTypes(); track at.name) {
          <div
            class="sb-controls__item"
            [class.sb-controls__item--cambiado]="cambiado(at.name)"
            [class.sb-controls__item--interruptor]="at.control.kind === 'boolean'"
            [attr.data-control]="at.name"
          >
            <div class="sb-controls__label">
              <code>{{ at.label ?? at.name }}</code>
              @if (at.description) {
                <span>{{ at.description }}</span>
              }
            </div>
            @if (cambiado(at.name)) {
              <button
                type="button"
                class="sb-controls__volver"
                [attr.aria-label]="'Volver ' + at.name + ' a su valor de la ficha'"
                [attr.title]="'Volver a su valor de la ficha: ' + texto(base()[at.name])"
                (click)="setArg(at.name, base()[at.name])"
              >
                <sc-icon name="undo" [size]="14" />
              </button>
            }
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
                    [ariaLabel]="at.name"
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
                    [ariaLabel]="at.name"
                    [value]="asStr(args()[at.name])"
                    (valueChange)="setArg(at.name, $event)"
                  />
                }
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class StoryControlsComponent {
  readonly argTypes = input<readonly ArgType[]>([]);
  readonly args = model<ScArgs>({});
  /** Los args de la ficha (`meta.defaultArgs`): contra ellos se mide qué se ha tocado. */
  readonly base = input<ScArgs>({});

  protected setArg(name: string, value: unknown): void {
    this.args.set({ ...this.args(), [name]: value });
  }

  /** ¿Este control vale otra cosa que en la ficha? Un texto vacío y uno sin poner cuentan igual. */
  protected cambiado(name: string): boolean {
    const a = this.args()[name];
    const b = this.base()[name];
    const vacio = (v: unknown): boolean => v === '' || v === null || v === undefined;
    return !(Object.is(a, b) || (vacio(a) && vacio(b)));
  }

  /** Opciones {label,value} para `sc-select` (narrowing del control en TS, no en plantilla). */
  protected selectOptions(at: ArgType): readonly { label: string; value: string | number }[] {
    return at.control.kind === 'select'
      ? at.control.options.map((o) => ({ label: String(o), value: o }))
      : [];
  }

  /** Un valor como se lee en el título del botón de volver: el texto vacío, dicho. */
  protected texto(v: unknown): string {
    return v === '' || v === null || v === undefined ? '(vacío)' : String(v);
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

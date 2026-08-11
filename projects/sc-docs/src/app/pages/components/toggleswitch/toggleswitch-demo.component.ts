import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScToggleSwitchComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const STATES_SNIPPET = `<sc-toggleswitch [checked]="a()" (checkedChange)="a.set($event)" ariaLabel="Activar" />
<sc-toggleswitch [checked]="b()" (checkedChange)="b.set($event)" size="sm" />
<sc-toggleswitch [checked]="true" size="lg" />
<sc-toggleswitch [checked]="true" [readonly]="true" />
<sc-toggleswitch [checked]="false" [disabled]="true" />`;

/** Demo de `sc-toggleswitch` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-toggleswitch-demo',
  imports: [ScToggleSwitchComponent, StoryHostComponent],
  templateUrl: './toggleswitch-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSwitchDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly statesTpl = viewChild<TemplateRef<StoryContext>>('states');

  readonly a = signal(false);
  readonly b = signal(true);

  protected readonly meta: StoryMeta = {
    tag: 'sc-toggleswitch',
    title: 'ToggleSwitch',
    description:
      'Interruptor accesible (wrapper de `p-toggleswitch`) con `role="switch"`, Space/Tab y form association nativos. Estado con `[checked]` + `(checkedChange)`. `readonly` bloquea la interacción sin el look disabled.',
    argTypes: [
      { name: 'checked', control: { kind: 'boolean' } },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'disabled', control: { kind: 'boolean' } },
      { name: 'readonly', control: { kind: 'boolean' } },
      { name: 'ariaLabel', control: { kind: 'text' } },
    ],
    defaultArgs: {
      checked: false,
      size: 'md',
      disabled: false,
      readonly: false,
      ariaLabel: 'Activar',
    },
    props: [
      { name: 'checked', type: 'boolean', default: 'false', description: 'Estado; emite `checkedChange`.' },
      { name: 'size', type: 'ScComponentSize', default: "'md'", description: 'sm · md · lg' },
      { name: 'disabled', type: 'boolean', default: 'false' },
      {
        name: 'readonly',
        type: 'boolean',
        default: 'false',
        description: 'Bloquea la interacción sin pintar disabled.',
      },
      { name: 'ariaLabel', type: 'string | null', default: 'null' },
      { name: 'ariaLabelledBy', type: 'string | null', default: 'null' },
      { name: 'inputId', type: 'string | null', default: 'null' },
      { name: 'checkedChange', type: 'EventEmitter<boolean>' },
      { name: 'changed', type: 'EventEmitter<unknown>', description: 'onChange nativo de PrimeNG.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const st = this.statesTpl();
    if (!pg || !st) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Estados', template: st, snippet: STATES_SNIPPET },
    ];
  });
}

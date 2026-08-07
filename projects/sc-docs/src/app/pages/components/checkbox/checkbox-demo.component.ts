import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScCheckboxComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const TRISTATE_SNIPPET = `<sc-checkbox [state]="headerState()" (cycle)="onHeaderCycle($event)" ariaLabel="Seleccionar todo" />
<sc-checkbox [state]="rowState(0)" (cycle)="toggleRow(0)" />
<sc-checkbox [state]="rowState(1)" (cycle)="toggleRow(1)" />
<sc-checkbox [state]="rowState(2)" (cycle)="toggleRow(2)" />`;

const SIZES_SNIPPET = `<sc-checkbox [state]="'all'" size="sm" />
<sc-checkbox [state]="'all'" />
<sc-checkbox [state]="'all'" size="lg" />
<sc-checkbox [state]="'some'" />
<sc-checkbox [state]="'all'" [filled]="true" />
<sc-checkbox [state]="'none'" [disabled]="true" />`;

/** Demo de `sc-checkbox` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-checkbox-demo',
  imports: [ScCheckboxComponent, StoryHostComponent],
  templateUrl: './checkbox-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly tristateTpl = viewChild<TemplateRef<StoryContext>>('tristate');
  protected readonly sizesTpl = viewChild<TemplateRef<StoryContext>>('sizes');

  protected readonly meta: StoryMeta = {
    tag: 'sc-checkbox',
    title: 'Checkbox',
    description:
      'Checkbox tri-estado (none/some/all) sobre `<input type="checkbox">` nativo. Emite `cycle(next)` con el siguiente booleano deseado (una cabecera «seleccionar todo» mapea ese booleano a su operación batch).',
    argTypes: [
      { name: 'state', control: { kind: 'select', options: ['none', 'some', 'all'] } },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'filled', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
      { name: 'ariaLabel', control: { kind: 'text' } },
    ],
    defaultArgs: {
      state: 'all',
      size: 'md',
      filled: false,
      disabled: false,
      ariaLabel: 'Seleccionar',
    },
    props: [
      {
        name: 'state',
        type: 'TriState',
        default: '—',
        description: "Requerido. 'none' · 'some' (indeterminado) · 'all'.",
      },
      { name: 'size', type: 'ScCheckboxSize', default: "'md'", description: 'sm · md · lg' },
      {
        name: 'filled',
        type: 'boolean',
        default: 'false',
        description: 'Fondo slate-50 cuando unchecked.',
      },
      { name: 'disabled', type: 'boolean', default: 'false' },
      { name: 'ariaLabel', type: 'string | null', default: 'null', description: 'Nombre accesible.' },
      { name: 'inputId', type: 'string | null', default: 'null', description: 'Id del `<input>` real.' },
      {
        name: 'cycle',
        type: 'EventEmitter<boolean>',
        description: 'Output: siguiente estado booleano deseado.',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ts = this.tristateTpl();
    const sz = this.sizesTpl();
    if (!pg || !ts || !sz) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Tri-estado (seleccionar todo)', template: ts, snippet: TRISTATE_SNIPPET },
      { name: 'Tamaños y variantes', template: sz, snippet: SIZES_SNIPPET },
    ];
  });

  // ─── Estado del ejemplo tri-estado ─────────────────────────────────
  protected readonly rows = signal<boolean[]>([false, true, false]);

  protected headerState(): 'none' | 'some' | 'all' {
    const sel = this.rows().filter(Boolean).length;
    return sel === 0 ? 'none' : sel === this.rows().length ? 'all' : 'some';
  }

  protected onHeaderCycle(next: boolean): void {
    this.rows.set(this.rows().map(() => next));
  }

  protected toggleRow(i: number): void {
    this.rows.update((r) => r.map((v, idx) => (idx === i ? !v : v)));
  }

  protected rowState(i: number): 'none' | 'all' {
    return this.rows()[i] ? 'all' : 'none';
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScSearchComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const BASIC_SNIPPET = `<sc-search placeholder="Buscar agentes…" [(value)]="term" />`;

const VARIANTS_SNIPPET = `<sc-search placeholder="Con atajo" shortcutHint="/" />
<sc-search placeholder="Small" size="sm" />
<sc-search placeholder="Filled" [filled]="true" />
<sc-search placeholder="Deshabilitado" [disabled]="true" />`;

/** Demo de `sc-search` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-search-demo',
  imports: [ScSearchComponent, StoryHostComponent],
  templateUrl: './search-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly basicTpl = viewChild<TemplateRef<StoryContext>>('basic');
  protected readonly variantsTpl = viewChild<TemplateRef<StoryContext>>('variants');

  readonly term = signal('');

  protected readonly meta: StoryMeta = {
    tag: 'sc-search',
    title: 'Search',
    description:
      'Input de búsqueda: icono overlay + botón clear (×) opcional + pista de atajo cuando está vacío y sin foco; con `/` además enfoca el campo al pulsarla. Se consume con `[(value)]` (signals).',
    argTypes: [
      { name: 'value', control: { kind: 'text' } },
      { name: 'placeholder', control: { kind: 'text' } },
      { name: 'shortcutHint', control: { kind: 'text' }, description: 'Pista visible. Con `/`, esa tecla enfoca el campo.' },
      { name: 'size', control: { kind: 'select', options: ['sm', 'md', 'lg'] } },
      { name: 'showClear', control: { kind: 'boolean' } },
      { name: 'filled', control: { kind: 'boolean' } },
      { name: 'disabled', control: { kind: 'boolean' } },
      { name: 'autoFocus', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      value: '',
      placeholder: 'Buscar agentes…',
      shortcutHint: '',
      size: 'md',
      showClear: true,
      filled: false,
      disabled: false,
      autoFocus: false,
    },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ba = this.basicTpl();
    const va = this.variantsTpl();
    if (!pg || !ba || !va) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Con valor', template: ba, snippet: BASIC_SNIPPET },
      { name: 'Variantes', template: va, snippet: VARIANTS_SNIPPET },
    ];
  });
}

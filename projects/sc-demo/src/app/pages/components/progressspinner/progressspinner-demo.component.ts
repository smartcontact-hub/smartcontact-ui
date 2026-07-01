import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScProgressSpinnerComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const DEFAULT_SNIPPET = `<sc-progressspinner />`;

/** Demo de `sc-progressspinner` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-progressspinner-demo',
  imports: [ScProgressSpinnerComponent, StoryHostComponent],
  templateUrl: './progressspinner-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressSpinnerDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly defaultTpl = viewChild<TemplateRef<StoryContext>>('default');

  protected readonly meta: StoryMeta = {
    tag: 'sc-progressspinner',
    title: 'Progress Spinner',
    description:
      'Spinner de carga indeterminado. Wrapper de PrimeNG; el trazo, el relleno y la duración de la animación son configurables.',
    argTypes: [
      { name: 'strokeWidth', control: { kind: 'text' }, description: 'Grosor del trazo (p.ej. 2)' },
      { name: 'fill', control: { kind: 'text' }, description: 'Color de relleno del círculo' },
      { name: 'animationDuration', control: { kind: 'text' }, description: 'Duración (p.ej. 2s)' },
      { name: 'ariaLabel', control: { kind: 'text' } },
    ],
    defaultArgs: {
      strokeWidth: '2',
      fill: 'transparent',
      animationDuration: '2s',
      ariaLabel: 'Cargando',
    },
    props: [
      { name: 'strokeWidth', type: 'string', default: "'2'", description: 'Grosor del trazo.' },
      {
        name: 'fill',
        type: 'string',
        default: "'transparent'",
        description: 'Color de relleno del círculo interior.',
      },
      {
        name: 'animationDuration',
        type: 'string',
        default: "'2s'",
        description: 'Duración de la rotación.',
      },
      {
        name: 'ariaLabel',
        type: 'string',
        default: "'Cargando'",
        description: 'Etiqueta accesible.',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const df = this.defaultTpl();
    if (!pg || !df) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Por defecto', template: df, snippet: DEFAULT_SNIPPET },
    ];
  });
}

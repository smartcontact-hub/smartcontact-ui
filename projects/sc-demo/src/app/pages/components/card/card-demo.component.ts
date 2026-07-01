import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScCardComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const BASIC_SNIPPET = `<sc-card header="Título de card" subheader="Subtítulo">
  Contenido proyectado de la tarjeta. Hereda tipografía y tokens del tema.
</sc-card>
<sc-card>Sin cabecera — solo contenido.</sc-card>`;

/** Demo de `sc-card` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-card-demo',
  imports: [ScCardComponent, StoryHostComponent],
  templateUrl: './card-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly basicTpl = viewChild<TemplateRef<StoryContext>>('basic');

  protected readonly meta: StoryMeta = {
    tag: 'sc-card',
    title: 'Card',
    description:
      'Tarjeta contenedora. Wrapper de PrimeNG con cabecera/subcabecera opcionales; el cuerpo es contenido proyectado que hereda tipografía y tokens del tema.',
    argTypes: [
      { name: 'header', control: { kind: 'text' } },
      { name: 'subheader', control: { kind: 'text' } },
    ],
    defaultArgs: {
      header: 'Título de card',
      subheader: 'Subtítulo',
    },
    props: [
      {
        name: 'header',
        type: 'string | null',
        default: 'null',
        description: 'Título de la cabecera. Si es null, no se pinta cabecera.',
      },
      {
        name: 'subheader',
        type: 'string | null',
        default: 'null',
        description: 'Subtítulo bajo el título.',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ba = this.basicTpl();
    if (!pg || !ba) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Básica', template: ba, snippet: BASIC_SNIPPET },
    ];
  });
}

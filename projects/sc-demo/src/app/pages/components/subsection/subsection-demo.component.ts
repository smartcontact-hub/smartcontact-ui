import { ChangeDetectionStrategy, Component, TemplateRef, computed, viewChild } from '@angular/core';

import { ScSlotComponent, ScSubsectionComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const COLLAPSIBLE_SNIPPET = `<sc-subsection titleKey="Canales" hintKey="Voz y digital" collapsible>
  <sc-slot titleKey="Voz">Extensión 204</sc-slot>
  <sc-slot titleKey="WhatsApp">+34 600 123 456</sc-slot>
</sc-subsection>`;

/** Demo de `sc-subsection` (agrupador de slots) en formato story. */
@Component({
  selector: 'app-subsection-demo',
  imports: [ScSubsectionComponent, ScSlotComponent, StoryHostComponent],
  templateUrl: './subsection-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubsectionDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly collapsibleTpl = viewChild<TemplateRef<StoryContext>>('collapsible');

  protected readonly meta: StoryMeta = {
    tag: 'sc-subsection',
    title: 'Subsection',
    description:
      'Agrupa filas (sc-slot) bajo un título. Opcionalmente colapsable. Vive dentro de un sc-section-card.',
    argTypes: [
      { name: 'titleKey', control: { kind: 'text' } },
      { name: 'hintKey', control: { kind: 'text' }, description: 'Pista bajo el título' },
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre Material opcional' },
      { name: 'collapsible', control: { kind: 'boolean' } },
      { name: 'initiallyCollapsed', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      titleKey: 'Identidad',
      hintKey: '',
      icon: '',
      collapsible: false,
      initiallyCollapsed: false,
    },
    props: [
      { name: 'titleKey', type: 'string', description: 'Título de la subsección (required).' },
      { name: 'hintKey', type: 'string | null', default: 'null', description: 'Pista bajo el título.' },
      { name: 'icon', type: 'string | null', default: 'null', description: 'Icono Material opcional.' },
      { name: 'collapsible', type: 'boolean', default: 'false', description: 'Permite plegar/desplegar.' },
      { name: 'initiallyCollapsed', type: 'boolean', default: 'false', description: 'Arranca plegada.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const co = this.collapsibleTpl();
    if (!pg || !co) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Colapsable', template: co, snippet: COLLAPSIBLE_SNIPPET },
    ];
  });
}

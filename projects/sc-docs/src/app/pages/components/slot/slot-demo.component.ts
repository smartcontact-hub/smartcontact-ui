import { ChangeDetectionStrategy, Component, TemplateRef, computed, viewChild } from '@angular/core';

import { ScSlotComponent, ScSubsectionComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const CONTEXT_SNIPPET = `<sc-subsection titleKey="Identidad">
  <sc-slot titleKey="Nombre">Laura Gómez</sc-slot>
  <sc-slot titleKey="Extensión" hintKey="Interna">204</sc-slot>
</sc-subsection>`;

/** Demo de `sc-slot` (fila etiqueta→valor) en formato story. */
@Component({
  selector: 'app-slot-demo',
  imports: [ScSlotComponent, ScSubsectionComponent, StoryHostComponent],
  templateUrl: './slot-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly contextTpl = viewChild<TemplateRef<StoryContext>>('context');

  protected readonly meta: StoryMeta = {
    tag: 'sc-slot',
    title: 'Slot',
    description:
      'Fila etiqueta→valor dentro de una subsección. Proyecta su contenido como el valor; vive normalmente dentro de un sc-subsection.',
    argTypes: [
      { name: 'titleKey', control: { kind: 'text' } },
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre Material opcional' },
      { name: 'hintKey', control: { kind: 'text' }, description: 'Pista bajo la etiqueta' },
    ],
    defaultArgs: { titleKey: 'Nombre', icon: '', hintKey: '' },
    props: [
      { name: 'titleKey', type: 'string', description: 'Etiqueta de la fila (required).' },
      { name: 'icon', type: 'string | null', default: 'null', description: 'Icono Material opcional.' },
      { name: 'hintKey', type: 'string | null', default: 'null', description: 'Pista bajo la etiqueta.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const cx = this.contextTpl();
    if (!pg || !cx) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'En contexto', template: cx, snippet: CONTEXT_SNIPPET },
    ];
  });
}

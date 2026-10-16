import { ChangeDetectionStrategy, Component, TemplateRef, computed, viewChild } from '@angular/core';

import { ScFactRowComponent, ScTagComponent } from '@smartcontact-hub/components';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const LIST_SNIPPET = `<dl>
  <div scFactRow label="Teléfono" icon="call" href="#distribucion">
    <sc-tag severity="success" rounded size="md" value="Balanceada" />
  </div>
  <div scFactRow label="Chat" icon="chat_bubble" href="#distribucion">Menos conversaciones atendidas</div>
  <div scFactRow label="Recursos" icon="library_books">11</div>
</dl>`;

const ICON_SNIPPET = `<!-- Un icono propio, proyectado en la baldosa -->
<div scFactRow label="WhatsApp">
  <svg scFactIcon width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h16v12H5.17L4 17.17V4z"/></svg>
  Sin número
</div>`;

/* Un valor largo en una columna estrecha: en una línea, con «…» y el texto entero en su tooltip. */
const TRUNCATE_SNIPPET = `<dl>
  <div scFactRow label="Teléfono" icon="call" size="sm" truncate>
    <span title="Niveles, Menos conversaciones atendidas">Niveles, Menos conversaciones atendidas</span>
  </div>
</dl>`;

/** Demo de `sc-fact-row` (`div[scFactRow]`) en formato story. */
@Component({
  selector: 'app-factrow-demo',
  imports: [ScFactRowComponent, ScTagComponent, StoryHostComponent],
  templateUrl: './factrow-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FactRowDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly listTpl = viewChild<TemplateRef<StoryContext>>('list');
  protected readonly iconTpl = viewChild<TemplateRef<StoryContext>>('iconProj');
  protected readonly truncateTpl = viewChild<TemplateRef<StoryContext>>('truncateStory');

  protected readonly meta: StoryMeta = {
    tag: 'sc-fact-row',
    title: 'FactRow',
    description:
      'Una fila de datos: la clave con su baldosa a la izquierda y el valor a la derecha (si no cabe, baja y sigue a la derecha). Va sobre un div (`<div scFactRow>`) dentro de un `dl`, para que la lista sea válida. Con href, la clave es un enlace de verdad y `open` avisa del clic. En un contenedor ancho, el valor empieza en su columna. Para una píldora como valor, `sc-tag` con `size="md"`.',
    argTypes: [
      { name: 'label', control: { kind: 'text' } },
      { name: 'icon', control: { kind: 'text' } },
      { name: 'href', control: { kind: 'text' } },
      { name: 'tone', control: { kind: 'select', options: ['default', 'strong', 'brand'] } },
      { name: 'truncate', control: { kind: 'boolean' } },
    ],
    defaultArgs: { label: 'Teléfono', icon: 'call', href: '', tone: 'default', truncate: false },
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const li = this.listTpl();
    const ic = this.iconTpl();
    const tr = this.truncateTpl();
    if (!pg || !li || !ic || !tr) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Una lista de datos', template: li, snippet: LIST_SNIPPET },
      { name: 'Con un icono propio', template: ic, snippet: ICON_SNIPPET },
      { name: 'Valor largo en una línea', template: tr, snippet: TRUNCATE_SNIPPET },
    ];
  });
}

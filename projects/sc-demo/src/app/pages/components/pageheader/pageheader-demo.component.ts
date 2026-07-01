import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScPageHeaderComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const FULL_SNIPPET = `<sc-page-header
  icon="groups"
  entityKey="CONFIGURACIÓN"
  titleKey="Agentes"
  subtitleKey="Gestiona los agentes de voz de tu organización."
>
  <button type="button" page-header-actions>Nuevo agente</button>
</sc-page-header>`;

const MINIMAL_SNIPPET = `<sc-page-header titleKey="Etiquetas" />`;

/** Demo de `sc-page-header` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-pageheader-demo',
  imports: [ScPageHeaderComponent, StoryHostComponent],
  templateUrl: './pageheader-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly fullTpl = viewChild<TemplateRef<StoryContext>>('full');
  protected readonly minimalTpl = viewChild<TemplateRef<StoryContext>>('minimal');

  protected readonly meta: StoryMeta = {
    tag: 'sc-page-header',
    title: 'PageHeader',
    description:
      'Cabecera estática de página (rutas no-entity: list / config). Icono chip 36×36, eyebrow en mayúsculas, título grande (subtitle-1) y subtítulo sutil. La acción primaria se proyecta en [page-header-actions].',
    argTypes: [
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre Material (p.ej. groups)' },
      { name: 'entityKey', control: { kind: 'text' } },
      { name: 'titleKey', control: { kind: 'text' } },
      { name: 'subtitleKey', control: { kind: 'text' } },
    ],
    defaultArgs: {
      icon: 'groups',
      entityKey: 'CONFIGURACIÓN',
      titleKey: 'Agentes',
      subtitleKey: 'Gestiona los agentes de voz de tu organización.',
    },
    props: [
      {
        name: 'entityKey',
        type: 'string | null',
        default: 'null',
        description: 'Clave i18n del eyebrow (mayúsculas) sobre el título.',
      },
      {
        name: 'titleKey',
        type: 'string',
        default: '— (requerido)',
        description: 'Clave i18n del título principal.',
      },
      {
        name: 'subtitleKey',
        type: 'string | null',
        default: 'null',
        description: 'Clave i18n del subtítulo bajo el título.',
      },
      {
        name: 'icon',
        type: 'string | null',
        default: 'null',
        description: 'Icono Material inicial (chip 36×36).',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const fu = this.fullTpl();
    const mi = this.minimalTpl();
    if (!pg || !fu || !mi) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Completa', template: fu, snippet: FULL_SNIPPET },
      { name: 'Mínima', template: mi, snippet: MINIMAL_SNIPPET },
    ];
  });
}

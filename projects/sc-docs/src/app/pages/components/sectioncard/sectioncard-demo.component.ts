import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import {
  ScSectionCardComponent,
  ScSlotComponent,
  ScSubsectionComponent,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const NESTED_SNIPPET = `<sc-section-card titleKey="Configuración del agente" icon="settings">
  <sc-subsection titleKey="Identidad">
    <sc-slot titleKey="Nombre">
      <p>Campo de nombre del agente…</p>
    </sc-slot>
    <sc-slot titleKey="Extensión">
      <p>Campo de extensión…</p>
    </sc-slot>
  </sc-subsection>
  <sc-subsection titleKey="Canales">
    <sc-slot titleKey="Voz">
      <p>Configuración de voz…</p>
    </sc-slot>
  </sc-subsection>
</sc-section-card>`;

const FLAT_SNIPPET = `<sc-section-card
  titleKey="Sección plana"
  hintKey="contenido directo, sin subsecciones"
  icon="description"
>
  <p>Contenido proyectado directo — renderiza como el card plano.</p>
</sc-section-card>`;

const COLLAPSIBLE_SNIPPET = `<sc-section-card
  titleKey="Ajustes avanzados"
  icon="tune"
  [collapsible]="true"
  [initiallyCollapsed]="true"
>
  <p>Contenido colapsable — clic en la cabecera para desplegar.</p>
</sc-section-card>

<sc-section-card titleKey="Sección flush (sin caja)" [flush]="true">
  <p>Sin fondo ni borde — el contenido va a sangre.</p>
</sc-section-card>`;

/** Demo de `sc-section-card` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-sectioncard-demo',
  imports: [ScSectionCardComponent, ScSubsectionComponent, ScSlotComponent, StoryHostComponent],
  templateUrl: './sectioncard-demo.component.html',
  styleUrl: './sectioncard-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCardDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly nestedTpl = viewChild<TemplateRef<StoryContext>>('nested');
  protected readonly flatTpl = viewChild<TemplateRef<StoryContext>>('flat');
  protected readonly collapsibleTpl = viewChild<TemplateRef<StoryContext>>('collapsible');

  protected readonly meta: StoryMeta = {
    tag: 'sc-section-card',
    title: 'SectionCard',
    description:
      'Sistema anidado Section → Subsection → Slot (§4.5, 1:1 con el nodo Figma "Section"). La sc-section-card es el contenedor gris; cada sc-subsection es una card blanca con su cabecera; cada sc-slot es una fila titulada separada por un divisor. Retrocompatible: una sección con contenido directo (sin subsecciones) sigue funcionando.',
    argTypes: [
      { name: 'titleKey', control: { kind: 'text' } },
      { name: 'hintKey', control: { kind: 'text' } },
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre Material (p.ej. settings)' },
      { name: 'collapsible', control: { kind: 'boolean' } },
      { name: 'initiallyCollapsed', control: { kind: 'boolean' } },
      { name: 'flush', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      titleKey: 'Configuración del agente',
      hintKey: '',
      icon: 'settings',
      collapsible: false,
      initiallyCollapsed: false,
      flush: false,
    },
    props: [
      {
        name: 'titleKey',
        type: 'string',
        default: '— (requerido)',
        description: 'Clave i18n del título de la sección.',
      },
      {
        name: 'hintKey',
        type: 'string | null',
        default: 'null',
        description: 'Clave i18n de la ayuda junto al título.',
      },
      {
        name: 'icon',
        type: 'string | null',
        default: 'null',
        description: 'Icono Material de la cabecera.',
      },
      {
        name: 'anchorId',
        type: 'string | null',
        default: 'null',
        description: 'Id de ancla para el scroll-spy de sc-form-section-nav.',
      },
      {
        name: 'collapsible',
        type: 'boolean',
        default: 'false',
        description: 'La cabecera actúa de toggle y el body colapsa.',
      },
      {
        name: 'initiallyCollapsed',
        type: 'boolean',
        default: 'false',
        description: 'Arranca plegada (solo si collapsible).',
      },
      {
        name: 'flush',
        type: 'boolean',
        default: 'false',
        description: 'Sin caja: quita fondo/borde/radio; el contenido va a sangre.',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ne = this.nestedTpl();
    const fl = this.flatTpl();
    const co = this.collapsibleTpl();
    if (!pg || !ne || !fl || !co) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Anidado (Section → Subsections → Slots)', template: ne, snippet: NESTED_SNIPPET },
      { name: 'Plano (retrocompatible) + hint', template: fl, snippet: FLAT_SNIPPET },
      { name: 'Colapsable + flush', template: co, snippet: COLLAPSIBLE_SNIPPET },
    ];
  });
}

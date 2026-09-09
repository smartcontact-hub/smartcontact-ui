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
} from '@smartcontact-hub/components';
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

/*
 * El snippet enseña `[headingLevel]="1"` aunque la story renderice el 2: en una pantalla es lo
 * que se escribe, y aquí no se puede porque la propia ficha ya tiene su `<h1>`.
 */
const LIENZO_SNIPPET = `<!-- Una sección que va SOLA sobre el lienzo, con el título de la
     página dentro (patrón de las pantallas con índice lateral, DD-57). -->
<sc-section-card
  titleKey="config.aed.subpages.agentes.heading"
  icon="person"
  surface="card"
  [headingLevel]="1"
>
  <p>Contenido de la sección…</p>
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
  protected readonly lienzoTpl = viewChild<TemplateRef<StoryContext>>('lienzo');

  protected readonly meta: StoryMeta = {
    tag: 'sc-section-card',
    title: 'SectionCard',
    description:
      'La ÚNICA caja de sección del repo, en dos pieles: `surface="subtle"` es el contenedor gris de formulario (sistema anidado Section → Subsection → Slot, §4.5, 1:1 con el nodo Figma "Section"), y `surface="card"` la superficie blanca con borde de una sección que va sola sobre el lienzo. Con `[headingLevel]="1"` su título es el de la PÁGINA, que es el patrón de las pantallas con índice lateral (DD-57). Retrocompatible: una sección con contenido directo, sin subsecciones, sigue funcionando.',
    argTypes: [
      { name: 'titleKey', control: { kind: 'text' } },
      { name: 'hintKey', control: { kind: 'text' } },
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre Material (p.ej. settings)' },
      {
        name: 'surface',
        control: { kind: 'select', options: ['subtle', 'card'] },
        description: 'Gris de formulario · blanca con borde sobre el lienzo',
      },
      { name: 'collapsible', control: { kind: 'boolean' } },
      { name: 'initiallyCollapsed', control: { kind: 'boolean' } },
      { name: 'flush', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      titleKey: 'Configuración del agente',
      hintKey: '',
      icon: 'settings',
      surface: 'subtle',
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
      {
        name: 'surface',
        type: "'subtle' | 'card'",
        default: "'subtle'",
        description:
          'La piel. subtle: gris plano con línea bajo la cabecera, para agrupar campos dentro de un formulario. card: blanca con borde, para una sección que va sola sobre el lienzo.',
      },
      {
        name: 'headingLevel',
        type: '1 | 2',
        default: '2',
        description:
          'Nivel del encabezado, y con él su tamaño. 2: una sección de la página (h2, 14/20 semibold). 1: el título de LA PÁGINA (h1, 18/24) — uno por documento, así que una sola card por pantalla.',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ne = this.nestedTpl();
    const fl = this.flatTpl();
    const co = this.collapsibleTpl();
    const li = this.lienzoTpl();
    if (!pg || !ne || !fl || !co || !li) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Anidado (Section → Subsections → Slots)', template: ne, snippet: NESTED_SNIPPET },
      { name: 'Plano (retrocompatible) + hint', template: fl, snippet: FLAT_SNIPPET },
      { name: 'Colapsable + flush', template: co, snippet: COLLAPSIBLE_SNIPPET },
      { name: 'Sobre el lienzo (surface=card) + título de página', template: li, snippet: LIENZO_SNIPPET },
    ];
  });
}

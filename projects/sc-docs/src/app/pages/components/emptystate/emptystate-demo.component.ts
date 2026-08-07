import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScEmptyStateComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const PLAIN_SNIPPET = `<sc-empty-state
  icon="inbox"
  titleKey="No hay agentes todavía"
  bodyKey="Crea tu primer agente para empezar a recibir llamadas."
/>`;

const CTA_SNIPPET = `<sc-empty-state
  icon="group"
  titleKey="Sin grupos"
  bodyKey="Agrupa tus agentes para organizarlos por equipo o campaña."
  ctaKey="Crear grupo"
  (cta)="onCreate()"
/>`;

/** Demo de `sc-empty-state` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-emptystate-demo',
  imports: [ScEmptyStateComponent, StoryHostComponent],
  templateUrl: './emptystate-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly plainTpl = viewChild<TemplateRef<StoryContext>>('plain');
  protected readonly ctaTpl = viewChild<TemplateRef<StoryContext>>('cta');

  protected readonly meta: StoryMeta = {
    tag: 'sc-empty-state',
    title: 'Empty State',
    description:
      'Estado vacío centrado para list pages sin filas: icono circular grande, título, cuerpo descriptivo y CTA primaria opcional. Reserva min-height para que la cabecera no salte al pasar de vacío→poblado. titleKey/bodyKey/ctaKey son claves i18n que resuelve el consumidor.',
    argTypes: [
      { name: 'icon', control: { kind: 'text' }, description: 'Nombre Material (p.ej. inbox)' },
      { name: 'titleKey', control: { kind: 'text' }, description: 'Clave i18n del título' },
      { name: 'bodyKey', control: { kind: 'text' }, description: 'Clave i18n del cuerpo' },
      {
        name: 'ctaKey',
        control: { kind: 'text' },
        description: 'Clave i18n de la CTA (vacío = sin botón)',
      },
    ],
    defaultArgs: {
      icon: 'inbox',
      titleKey: 'No hay agentes todavía',
      bodyKey: 'Crea tu primer agente para empezar a recibir llamadas.',
      ctaKey: '',
    },
    props: [
      {
        name: 'icon',
        type: 'string',
        default: '—',
        description: 'Icono Material (requerido).',
      },
      {
        name: 'titleKey',
        type: 'string',
        default: '—',
        description: 'Clave i18n del título (requerido).',
      },
      {
        name: 'bodyKey',
        type: 'string',
        default: '—',
        description: 'Clave i18n del cuerpo (requerido).',
      },
      {
        name: 'ctaKey',
        type: 'string | null',
        default: 'null',
        description: 'Clave i18n de la CTA; si se define, pinta el botón primario.',
      },
      { name: 'cta', type: 'EventEmitter<void>', description: 'Output al pulsar la CTA.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const pl = this.plainTpl();
    const ct = this.ctaTpl();
    if (!pg || !pl || !ct) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Sin CTA', template: pl, snippet: PLAIN_SNIPPET },
      { name: 'Con CTA', template: ct, snippet: CTA_SNIPPET },
    ];
  });
}

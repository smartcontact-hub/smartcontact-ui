import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScFormDangerZoneComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const BASIC_SNIPPET = `<sc-form-danger-zone
  titleKey="Zona de peligro"
  descriptionKey="Eliminar este agente es permanente. Se borrarán sus conversaciones y configuración."
  actionKey="Eliminar agente"
  (action)="onAction()"
/>`;

/** Demo de `sc-form-danger-zone` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-formdangerzone-demo',
  imports: [ScFormDangerZoneComponent, StoryHostComponent],
  templateUrl: './formdangerzone-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDangerZoneDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly basicTpl = viewChild<TemplateRef<StoryContext>>('basic');

  readonly fired = signal(false);

  onAction(): void {
    this.fired.set(true);
  }

  protected readonly meta: StoryMeta = {
    tag: 'sc-form-danger-zone',
    title: 'FormDangerZone',
    description:
      'Sección al pie del formulario para acciones irreversibles (eliminar, transferir, archivar). Es el marco visual + trigger; el diálogo de confirmación / impact-preview lo pone la página.',
    argTypes: [
      { name: 'titleKey', control: { kind: 'text' } },
      { name: 'descriptionKey', control: { kind: 'text' } },
      { name: 'actionKey', control: { kind: 'text' } },
      { name: 'disabled', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      titleKey: 'Zona de peligro',
      descriptionKey:
        'Eliminar este agente es permanente. Se borrarán sus conversaciones y configuración.',
      actionKey: 'Eliminar agente',
      disabled: false,
    },
    props: [
      {
        name: 'titleKey',
        type: 'string',
        default: "'sc.formDangerZone.title'",
        description: 'Clave i18n del título de la sección.',
      },
      {
        name: 'descriptionKey',
        type: 'string',
        default: '— (requerido)',
        description: 'Clave i18n de la descripción (la suministra el consumidor).',
      },
      {
        name: 'actionKey',
        type: 'string',
        default: "'sc.formDangerZone.action'",
        description: 'Clave i18n de la etiqueta del botón destructivo.',
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Deshabilita el trigger.' },
      { name: 'action', type: 'EventEmitter<void>', description: 'Output al pulsar la acción.' },
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

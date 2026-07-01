import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScStickyFormHeaderComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const EDIT_SNIPPET = `<sc-sticky-form-header
  mode="edit"
  entityKey="AGENTE"
  [name]="name()"
  (nameChange)="onNameChange($event)"
  (save)="onSave()"
/>`;

const CREATE_SNIPPET = `<sc-sticky-form-header
  mode="create"
  entityKey="Nuevo agente"
  [name]="''"
  namePlaceholderKey="Nombre del agente"
/>`;

/** Demo de `sc-sticky-form-header` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-stickyformheader-demo',
  imports: [ScStickyFormHeaderComponent, StoryHostComponent],
  templateUrl: './stickyformheader-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyFormHeaderDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly editTpl = viewChild<TemplateRef<StoryContext>>('edit');
  protected readonly createTpl = viewChild<TemplateRef<StoryContext>>('create');

  readonly name = signal('Soporte Ventas');
  readonly saved = signal(false);

  onNameChange(v: string): void {
    this.name.set(v);
  }

  onSave(): void {
    this.saved.set(true);
  }

  protected readonly meta: StoryMeta = {
    tag: 'sc-sticky-form-header',
    title: 'StickyFormHeader',
    description:
      '⚠️ Deprecated / retenido (rollback DD#65): ya no lo usa ningún form (los 3 shells migraron a «todo arriba»). Se conserva como red de seguridad. Header sticky de Create/Edit: eyebrow + nombre editable inline + Guardar.',
    argTypes: [
      { name: 'mode', control: { kind: 'select', options: ['create', 'edit'] } },
      { name: 'entityKey', control: { kind: 'text' } },
      { name: 'canSave', control: { kind: 'boolean' } },
      { name: 'saving', control: { kind: 'boolean' } },
      { name: 'namePlaceholderKey', control: { kind: 'text' } },
      { name: 'showBack', control: { kind: 'boolean' } },
    ],
    defaultArgs: {
      mode: 'edit',
      entityKey: 'AGENTE',
      canSave: true,
      saving: false,
      namePlaceholderKey: 'Nombre del agente',
      showBack: false,
    },
    props: [
      {
        name: 'mode',
        type: "'create' | 'edit'",
        default: '— (requerido)',
        description: 'create (input de nombre) · edit (nombre editable inline).',
      },
      {
        name: 'entityKey',
        type: 'string',
        default: '— (requerido)',
        description: 'Clave i18n del eyebrow de entidad.',
      },
      {
        name: 'name',
        type: 'string',
        default: '— (requerido)',
        description: 'Nombre actual de la entidad (display + edición).',
      },
      { name: 'canSave', type: 'boolean', default: 'true', description: 'Deshabilita Guardar si false.' },
      {
        name: 'saving',
        type: 'boolean',
        default: 'false',
        description: 'Sustituye Guardar por un spinner.',
      },
      {
        name: 'namePlaceholderKey',
        type: 'string',
        default: "'sc.stickyFormHeader.namePlaceholder'",
        description: 'Clave i18n del placeholder del input de nombre (modo create).',
      },
      {
        name: 'showBack',
        type: 'boolean',
        default: 'false',
        description: 'Muestra el botón "Atrás" en el cluster de acciones.',
      },
      { name: 'nameChange', type: 'EventEmitter<string>', description: 'Output al renombrar.' },
      { name: 'save', type: 'EventEmitter<void>', description: 'Output al pulsar Guardar.' },
      { name: 'cancelled', type: 'EventEmitter<void>', description: 'Output al cancelar.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ed = this.editTpl();
    const cr = this.createTpl();
    if (!pg || !ed || !cr) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Edit (nombre editable)', template: ed, snippet: EDIT_SNIPPET },
      { name: 'Create (input de nombre)', template: cr, snippet: CREATE_SNIPPET },
    ];
  });
}

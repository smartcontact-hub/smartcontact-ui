import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScStickyFormHeaderComponent } from '@smartcontact-hub/components';
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
      'Deprecated / retenido (rollback DD#65): ya no lo usa ningún form (los 3 shells migraron a «todo arriba»). Se conserva como red de seguridad. Header sticky de Create/Edit: eyebrow + nombre editable inline + Guardar.',
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

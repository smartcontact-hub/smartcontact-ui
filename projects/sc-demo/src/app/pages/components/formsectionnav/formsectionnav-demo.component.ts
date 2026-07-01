import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import {
  FormNavSection,
  ScFormSectionNavComponent,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const DEFAULT_SNIPPET = `<sc-form-section-nav
  [sections]="sections"
  [activeId]="active()"
  [sectionsWithErrors]="errors"
  (activeChange)="onActive($event)"
/>`;

const FLUSH_SNIPPET = `<sc-form-section-nav
  [sections]="sections"
  [activeId]="active()"
  [flush]="true"
  [sectionsWithErrors]="errors"
  (activeChange)="onActive($event)"
/>`;

/** Demo de `sc-form-section-nav` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-formsectionnav-demo',
  imports: [ScFormSectionNavComponent, StoryHostComponent],
  templateUrl: './formsectionnav-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSectionNavDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly defaultTpl = viewChild<TemplateRef<StoryContext>>('default');
  protected readonly flushTpl = viewChild<TemplateRef<StoryContext>>('flush');

  readonly sections: FormNavSection[] = [
    { id: 'general', labelKey: 'General', icon: 'tune' },
    { id: 'voz', labelKey: 'Voz y saludo', icon: 'record_voice_over' },
    { id: 'horario', labelKey: 'Horario', icon: 'schedule' },
    { id: 'avanzado', labelKey: 'Avanzado', icon: 'settings' },
  ];
  readonly active = signal('general');
  readonly errors = new Set(['horario']);

  onActive(id: string): void {
    this.active.set(id);
  }

  protected readonly meta: StoryMeta = {
    tag: 'sc-form-section-nav',
    title: 'FormSectionNav',
    description:
      'Nav de secciones controlado: el padre posee activeId y el nav emite activeChange al click. Punto rojo en las secciones con required vacíos (sectionsWithErrors). Variante flush (panel embebido del rail) opt-in.',
    argTypes: [{ name: 'flush', control: { kind: 'boolean' } }],
    defaultArgs: {
      flush: false,
    },
    props: [
      {
        name: 'sections',
        type: 'readonly FormNavSection[]',
        default: '— (requerido)',
        description: 'Secciones a mostrar ({ id, labelKey, icon? }).',
      },
      {
        name: 'activeId',
        type: 'string | null',
        default: 'null',
        description: 'Id de la sección activa (controlado por el padre).',
      },
      {
        name: 'sectionsWithErrors',
        type: 'ReadonlySet<string>',
        default: 'new Set()',
        description: 'Ids con required vacíos → punto rojo.',
      },
      {
        name: 'labelKey',
        type: 'string',
        default: "'sc.formSectionNav.label'",
        description: 'Clave i18n del rótulo accesible del <nav>.',
      },
      {
        name: 'flush',
        type: 'boolean',
        default: 'false',
        description: 'Renderiza el índice como panel embebido del rail.',
      },
      {
        name: 'activeChange',
        type: 'EventEmitter<string>',
        description: 'Output con el id de la sección al hacer click.',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const de = this.defaultTpl();
    const fl = this.flushTpl();
    if (!pg || !de || !fl) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Default', template: de, snippet: DEFAULT_SNIPPET },
      { name: 'Flush (panel embebido)', template: fl, snippet: FLUSH_SNIPPET },
    ];
  });
}

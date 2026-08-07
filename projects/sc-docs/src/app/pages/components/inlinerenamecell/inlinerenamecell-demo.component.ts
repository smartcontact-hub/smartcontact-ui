import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';

import { ScInlineRenameCellComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const DEMO_SNIPPET = `@if (editing()) {
  <sc-inline-rename-cell
    [initialValue]="name()"
    placeholder="Nombre del equipo"
    [ariaLabel]="'Renombrar ' + name()"
    (commit)="onCommit($event)"
    (cancelled)="onCancel()"
  />
} @else {
  <button type="button" (click)="startEdit()">{{ name() }}</button>
}`;

/** Demo de `sc-inline-rename-cell` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-inlinerenamecell-demo',
  imports: [ScInlineRenameCellComponent, StoryHostComponent],
  templateUrl: './inlinerenamecell-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineRenameCellDemoComponent {
  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly demoTpl = viewChild<TemplateRef<StoryContext>>('demo');

  readonly name = signal('Equipo de Soporte');
  readonly editing = signal(false);

  startEdit(): void {
    this.editing.set(true);
  }

  onCommit(value: string): void {
    this.name.set(value);
    this.editing.set(false);
  }

  onCancel(): void {
    this.editing.set(false);
  }

  protected readonly meta: StoryMeta = {
    tag: 'sc-inline-rename-cell',
    title: 'Inline Rename Cell',
    description:
      'Celda de nombre editable in-place (input nativo, no `p-inplace`). autofocus + select-all al montar; Enter o ✓ confirma (valor trimmeado), Esc o ✗ cancela; un valor vacío deshabilita el commit. Renderer agnóstico: se proyecta en cualquier celda de tabla.',
    argTypes: [
      { name: 'initialValue', control: { kind: 'text' } },
      { name: 'placeholder', control: { kind: 'text' } },
      { name: 'ariaLabel', control: { kind: 'text' } },
    ],
    defaultArgs: {
      initialValue: 'Equipo de Soporte',
      placeholder: 'Nombre del equipo',
      ariaLabel: 'Renombrar equipo',
    },
    props: [
      { name: 'initialValue', type: 'string', default: '(required)', description: 'Valor de arranque (se selecciona al montar).' },
      { name: 'placeholder', type: 'string', default: "''" },
      { name: 'ariaLabel', type: 'string', default: "''", description: 'aria-label del input.' },
      { name: 'commit', type: 'EventEmitter<string>', description: 'Enter / ✓ — valor trimmeado.' },
      { name: 'cancelled', type: 'EventEmitter<void>', description: 'Esc / ✗.' },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const de = this.demoTpl();
    if (!pg || !de) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Celda de tabla (con toggle)', template: de, snippet: DEMO_SNIPPET },
    ];
  });
}

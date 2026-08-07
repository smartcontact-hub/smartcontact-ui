import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  viewChild,
} from '@angular/core';

import { ScGroupPopoverComponent } from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

const OVERFLOW_SNIPPET = `<sc-group-popover [groups]="few" />
<sc-group-popover [groups]="many" />`;

/** Demo de `sc-group-popover` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-grouppopover-demo',
  imports: [ScGroupPopoverComponent, StoryHostComponent],
  templateUrl: './grouppopover-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupPopoverDemoComponent {
  readonly few = [{ id: 1, name: 'Soporte', active: true }, { id: 2, name: 'Ventas', active: true }];
  readonly many = [
    { id: 1, name: 'Soporte', active: true },
    { id: 2, name: 'Ventas', active: true },
    { id: 3, name: 'Postventa', active: true },
    { id: 4, name: 'Calidad', active: true },
    { id: 5, name: 'Retención', active: true },
    { id: 6, name: 'Backoffice', active: true },
    { id: 7, name: 'Incidencias', active: true },
  ];

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');
  protected readonly overflowTpl = viewChild<TemplateRef<StoryContext>>('overflow');

  protected readonly meta: StoryMeta = {
    tag: 'sc-group-popover',
    title: 'GroupPopover',
    description:
      'Celda inline con conteo de grupos; lista flotante en hover/focus (máx. 5 + «+N más»). Data-driven vía `[groups]` — no tiene inputs escalares. Pasa el ratón por encima o enfoca la celda.',
    argTypes: [],
    defaultArgs: {},
    props: [
      {
        name: 'groups',
        type: 'readonly GroupRef[]',
        description: 'Grupos a listar; { id, name, active } (requerido).',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    const ov = this.overflowTpl();
    if (!pg || !ov) return [];
    return [
      { name: 'Playground', playground: true, template: pg },
      { name: 'Overflow (+N más)', template: ov, snippet: OVERFLOW_SNIPPET },
    ];
  });
}

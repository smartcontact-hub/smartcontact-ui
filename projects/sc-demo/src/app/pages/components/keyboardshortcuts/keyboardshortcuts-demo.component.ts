import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';

import {
  ScKeyboardShortcutsComponent,
  ScKeyboardShortcutsService,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

/** Demo de `sc-keyboard-shortcuts` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-keyboardshortcuts-demo',
  imports: [ScKeyboardShortcutsComponent, StoryHostComponent],
  templateUrl: './keyboardshortcuts-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyboardShortcutsDemoComponent {
  protected readonly shortcuts = inject(ScKeyboardShortcutsService);

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');

  protected readonly meta: StoryMeta = {
    tag: 'sc-keyboard-shortcuts',
    title: 'KeyboardShortcuts',
    description:
      'Cheat-sheet de atajos (tecla ?), montada una vez en el shell; la visibilidad la posee `ScKeyboardShortcutsService`. Los grupos son data-driven (`[groups]`) con un default que cubre los atajos intrínsecos del DS (⌘K · / · ? · ↑↓ · ↵ · Esc). Suprimida mientras se tipea y no se solapa con la paleta abierta.',
    argTypes: [],
    defaultArgs: {},
    props: [
      {
        name: 'groups',
        type: 'ScShortcutGroup[]',
        description: 'Grupos de atajos (default colocado; el consumidor extiende/reemplaza).',
      },
      { name: 'open()', type: '() => void', description: 'Muestra la cheat-sheet imperativamente.' },
      {
        name: 'visible()',
        type: 'Signal<boolean>',
        description: 'Estado de visibilidad (poseído por el servicio).',
      },
    ],
  };

  protected readonly stories = computed<readonly StoryDef[]>(() => {
    const pg = this.playgroundTpl();
    if (!pg) return [];
    return [{ name: 'Playground', playground: true, template: pg }];
  });
}

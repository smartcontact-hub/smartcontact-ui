import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import {
  ScCommandPaletteComponent,
  ScCommandPaletteService,
  ScPaletteCommand,
} from '../../../../../../ui-smartcontact/src/public-api';
import { StoryContext, StoryDef, StoryHostComponent, StoryMeta } from '../../../storybook';

/** Demo de `sc-command-palette` en formato story (motor «Storybook-like»). */
@Component({
  selector: 'app-commandpalette-demo',
  imports: [ScCommandPaletteComponent, StoryHostComponent],
  templateUrl: './commandpalette-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteDemoComponent {
  protected readonly palette = inject(ScCommandPaletteService);
  protected readonly lastRun = signal<string | null>(null);

  protected readonly playgroundTpl = viewChild<TemplateRef<StoryContext>>('playground');

  protected readonly meta: StoryMeta = {
    tag: 'sc-command-palette',
    title: 'CommandPalette',
    description:
      'Paleta de comandos global (⌘K / Ctrl K), data-driven: `ScCommandPaletteService` no conoce rutas ni navegación; el consumidor publica comandos con `setCommands()` y cablea cada `action`. El host se monta una vez en el shell. Atajos: ↑↓ navegar · ↵ ejecutar · Esc cerrar · / enfoca el buscador.',
    argTypes: [],
    defaultArgs: {},
    props: [
      {
        name: 'setCommands()',
        type: '(cmds: ScPaletteCommand[]) => void',
        description: 'Publica la lista de comandos disponibles.',
      },
      { name: 'open()', type: '() => void', description: 'Abre la paleta imperativamente.' },
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

  constructor() {
    const run = (label: string) => (): void => this.lastRun.set(label);

    // El consumidor construye los comandos: label/category ya en display, icon
    // como nombre Material, y action cableada. El DS no conoce nada de esto.
    const commands: readonly ScPaletteCommand[] = [
      { id: 'page:dashboard', label: 'Dashboard', category: 'Páginas', icon: 'home', action: run('Dashboard') },
      { id: 'page:grupos', label: 'Grupos', category: 'Páginas', icon: 'groups', action: run('Grupos') },
      { id: 'page:agentes', label: 'Agentes', category: 'Páginas', icon: 'headphones', action: run('Agentes') },
      { id: 'page:usuarios', label: 'Usuarios', category: 'Páginas', icon: 'person', action: run('Usuarios') },
      {
        id: 'action:crear-grupo',
        label: 'Crear grupo',
        category: 'Acciones',
        icon: 'add',
        keywords: ['crear', 'nuevo'],
        action: run('Crear grupo'),
      },
      {
        id: 'action:crear-agente',
        label: 'Crear agente',
        category: 'Acciones',
        icon: 'person_add',
        keywords: ['crear', 'nuevo'],
        action: run('Crear agente'),
      },
    ];
    this.palette.setCommands(commands);
  }
}

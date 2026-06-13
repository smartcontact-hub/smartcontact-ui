import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import {
  ScCommandPaletteComponent,
  ScCommandPaletteService,
  ScPaletteCommand,
} from '../../../../../../ui-smartcontact/src/public-api';

@Component({
  selector: 'app-commandpalette-demo',
  imports: [ScCommandPaletteComponent],
  templateUrl: './commandpalette-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteDemoComponent {
  protected readonly palette = inject(ScCommandPaletteService);
  protected readonly lastRun = signal<string | null>(null);

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

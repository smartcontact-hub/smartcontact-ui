/**
 * Registro de páginas de componentes de la demo. Cada port añade su entrada;
 * el índice y las rutas se derivan de aquí.
 */
export interface ScDemoComponentPage {
  path: string;
  label: string;
  load: () => Promise<unknown>;
}

export const SC_DEMO_COMPONENT_PAGES = [
  {
    path: 'button',
    label: 'Button',
    load: () => import('./button/button-demo.component').then((m) => m.ButtonDemoComponent),
  },
  {
    path: 'badge',
    label: 'Badge',
    load: () => import('./badge/badge-demo.component').then((m) => m.BadgeDemoComponent),
  },
  {
    path: 'card',
    label: 'Card',
    load: () => import('./card/card-demo.component').then((m) => m.CardDemoComponent),
  },
  {
    path: 'chip',
    label: 'Chip',
    load: () => import('./chip/chip-demo.component').then((m) => m.ChipDemoComponent),
  },
  {
    path: 'tag',
    label: 'Tag',
    load: () => import('./tag/tag-demo.component').then((m) => m.TagDemoComponent),
  },
] satisfies ScDemoComponentPage[];

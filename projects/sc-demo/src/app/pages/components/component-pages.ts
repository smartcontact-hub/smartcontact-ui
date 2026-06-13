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
] satisfies ScDemoComponentPage[];

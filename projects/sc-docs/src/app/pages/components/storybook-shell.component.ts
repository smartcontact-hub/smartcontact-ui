import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Wrapper del showcase de componentes: SOLO el outlet. La navegación (secciones + lista
 * de componentes) vive ahora en la sidebar única del shell (`app.component`); antes este
 * componente tenía su PROPIA sidebar y había dos navegaciones a la vez. Se mantiene como
 * frontera lazy (`loadChildren` desde `app.routes`) para que el registro de ~60 páginas y
 * su glue de `import()` dinámico no entren en el bundle eager (main.js).
 */
@Component({
  selector: 'app-storybook-shell',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class StorybookShellComponent {}

import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Lab · Exploraciones. Nido temporal para prototipos de diseño que AÚN NO forman
 * parte del sistema, reunidos aquí para no perderlos ni dejarlos dispersos en
 * repos personales. Cada uno se etiqueta como prototipo. Las copias viven in-repo
 * bajo `public/explorations/` (no enlazamos a repos externos, que son frágiles).
 *
 * No es producto ni DS: es un guardado accesible. Llevar cada exploración a un
 * patrón/asset real del DS es trabajo aparte.
 */
@Component({
  selector: 'app-lab',
  templateUrl: './lab.component.html',
  styleUrl: './lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabComponent {}

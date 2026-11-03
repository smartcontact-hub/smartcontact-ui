import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import {
  ScButtonComponent,
  ScMessageComponent,
  ScSkeletonComponent,
  ScTagComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

/** La ilustración de cada página: de qué va, dicho con componentes. */
export type ArteCabecera =
  | 'color'
  | 'espaciado'
  | 'tipografia'
  | 'iconos'
  | 'movimiento'
  | 'patrones'
  | 'componentes'
  | 'estado'
  | 'primeng'
  | 'uso'
  | 'reglas'
  | 'novedades';

/**
 * La cabecera de las páginas de dentro: el lenguaje de la portada llevado al resto, como las páginas de Primer (título,
 * una frase y una franja ilustrada debajo).
 *
 * Título y entradilla a los tamaños de siempre (`.demo-main h1`, 18 de entradilla) y, si hace falta, una nota técnica a
 * tamaño de pie, para que lo de los paquetes y los gates no pese como la frase. La franja reutiliza las formas de la
 * portada (esfera, cristal y brillo, sacados de los círculos del logo) y pone delante componentes `sc-*` DE VERDAD que
 * dicen de qué va la página; va `inert` y oculta al lector, como las ilustraciones de la portada.
 *
 * Movimiento, el de la portada: el texto y las piezas suben escalonados una vez y las formas flotan muy despacio. Con
 * «reducir movimiento», todo quieto.
 */
@Component({
  selector: 'app-cabecera',
  imports: [
    ScButtonComponent,
    ScIconComponent,
    ScMessageComponent,
    ScSkeletonComponent,
    ScTagComponent,
    ScToggleSwitchComponent,
  ],
  templateUrl: './cabecera.component.html',
  styleUrl: './cabecera.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabeceraComponent {
  readonly titulo = input.required<string>();
  /** Una frase: qué es y para qué. Admite el marcado de las traducciones (`<code>`, `<strong>`). */
  readonly entradilla = input.required<string>();
  /** Lo técnico (paquete, gate), en pequeño debajo de la frase. */
  readonly nota = input<string | null>(null);
  readonly arte = input.required<ArteCabecera>();

  /** Color: una muestra por familia de la paleta, en su paso 500. */
  protected readonly colores = ['blue-500', 'sky-500', 'green-500', 'amber-500', 'red-500', 'slate-500'] as const;

  /** Iconos: los de solo icono de una barra (buscar, editar, archivar, más acciones). */
  protected readonly iconos = ['search', 'edit', 'archive', 'more_vert'] as const;

  /** Estado: tres fichas, una por estado. */
  protected readonly estados = [
    { nombre: 'Button', estado: 'Listo', tono: 'success' },
    { nombre: 'Gauge', estado: 'Experimental', tono: 'warn' },
    { nombre: 'Panel', estado: 'Retirado', tono: 'secondary' },
  ] as const;

  /** Todo PrimeNG: una rejilla de piezas, las que usamos en sólido y las demás en trazo. */
  protected readonly malla = [
    'table_chart',
    'calendar_today',
    'checklist',
    'tune',
    'view_carousel',
    'tab',
    'list',
    'image',
    'upload',
    'menu',
    'toggle_on',
    'grid_view',
  ] as const;
}

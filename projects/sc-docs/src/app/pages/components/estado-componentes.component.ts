import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScSearchComponent, ScSelectButtonComponent, ScSkeletonComponent } from '@smartcontact-hub/components';

import { ComponentApiService, ComponenteContrato, REPO_BLOB } from '../../storybook/component-api.service';
import { EstadoComponenteComponent } from '../../storybook/estado-componente.component';
import { fichaDe } from './fichas';

type Filtro = 'todos' | ComponenteContrato['estado'];

/** Sin tildes ni mayúsculas: «boton» encuentra «Button» por su selector y «seccion» encuentra «Section card». */
const plano = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Estado de los componentes (`/components/estado`), con la página de Primer como modelo: qué quiere decir cada estado
 * y, debajo, todos los componentes con su estado y dónde está cada pieza (su ficha, su maestro en Figma, su código).
 *
 * Nada se escribe aquí. El estado lo calcula `audit:components` (DD-190: maestro en el Kit y página de demo), el enlace
 * a Figma sale de la plantilla de Code Connect de cada componente y el del código, de su fichero. Todo llega en
 * `_component-api.json`, el mismo contrato que pinta la tabla de API de cada ficha, así que esta página no puede
 * quedarse atrás de las fichas.
 */
@Component({
  selector: 'app-estado-componentes',
  imports: [EstadoComponenteComponent, RouterLink, ScSearchComponent, ScSelectButtonComponent, ScSkeletonComponent],
  templateUrl: './estado-componentes.component.html',
  styleUrl: './estado-componentes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoComponentesComponent {
  private readonly api = inject(ComponentApiService);

  protected readonly fallo = this.api.error;
  protected readonly repo = REPO_BLOB;
  protected readonly busqueda = signal('');
  protected readonly filtro = signal<Filtro>('todos');
  protected readonly opciones: readonly { label: string; value: Filtro }[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Listo', value: 'ready' },
    { label: 'Experimental', value: 'experimental' },
    { label: 'Retirado', value: 'deprecated' },
  ];

  /** Las filas: cada componente con su nombre de ficha, ordenadas por ese nombre. */
  protected readonly filas = computed(() =>
    (this.api.todos() ?? [])
      .map((c) => ({ c, ficha: fichaDe(c.selector, c.name) }))
      .sort((a, b) => (a.ficha?.label ?? a.c.selector).localeCompare(b.ficha?.label ?? b.c.selector)),
  );

  protected readonly visibles = computed(() => {
    const q = plano(this.busqueda().trim());
    const f = this.filtro();
    return this.filas().filter(
      ({ c, ficha }) =>
        (f === 'todos' || c.estado === f) && (!q || plano(`${ficha?.label ?? ''} ${c.selector} ${c.primengBase}`).includes(q)),
    );
  });

  /** Cuántos hay en cada estado, para la línea de cuenta. */
  protected readonly cuenta = computed(() => {
    const n = { ready: 0, experimental: 0, deprecated: 0 };
    for (const { c } of this.filas()) n[c.estado]++;
    return n;
  });

  /** «primeng/button» → «button»; los nuestros de cabo a rabo dicen «Propio». */
  protected base(c: ComponenteContrato): string {
    return c.primengBase === '—' ? 'Propio' : c.primengBase.replace(/primeng\//g, '');
  }
}

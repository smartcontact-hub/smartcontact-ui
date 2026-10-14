import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  ScSearchComponent,
  ScSelectButtonComponent,
  ScSkeletonComponent,
  ScTagComponent,
} from '@smartcontact-hub/components';

type Estado = 'ds' | 'directo' | 'sin-uso';
type Filtro = 'todos' | Estado | 'obsoleto';

/** Una fila de la tabla: uno o dos módulos («IconField e InputIcon») con lo que dice el documento y lo que mide el repo. */
interface Fila {
  readonly nombres: readonly string[];
  readonly modulos: readonly string[];
  readonly enlace: string | null;
  readonly sirve: string;
  readonly cuando: string | null;
  readonly aqui: string;
  readonly estado: Estado;
  readonly wrappers: readonly string[];
  readonly apps: readonly string[];
  readonly obsoleto: boolean;
}

/** Una familia: los hermanos entre los que se elige, y la pregunta que decide entre ellos. */
interface Familia {
  readonly titulo: string;
  readonly pregunta: string | null;
  readonly filas: readonly Fila[];
}

const ESTADOS: Record<Estado, { readonly texto: string; readonly severity: 'success' | 'info' | 'secondary' }> = {
  ds: { texto: 'En el DS', severity: 'success' },
  directo: { texto: 'Sin wrapper', severity: 'info' },
  'sin-uso': { texto: 'Sin uso', severity: 'secondary' },
};

/** Sin tildes ni mayúsculas ni etiquetas: «árbol» encuentra «Arbol» y `<code>sc-search</code>` se busca como texto. */
const plano = (s: string): string =>
  s
    .replace(/<[^>]+>/g, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Los componentes de PrimeNG por familias: para qué sirve cada uno, cuándo elegirlo frente a su vecino y si lo usamos.
 *
 * El contenido NO se escribe aquí. Sale de la sección 6 de `docs/AUDIT-PRIMENG-CATALOGO.md` y del estado que mide
 * `audit:primeng-catalog` en el repo (qué envuelve el DS, qué usan las apps sin wrapper, qué marca PrimeNG como
 * obsoleto). El gate escribe el artefacto (`npm run primeng-catalog:gen`) y se pone rojo si se queda atrás. Es la
 * respuesta a «dónde vive un nativo sin wrapper» de la sección 3 del mismo documento: aquí, todos en una página.
 */
@Component({
  selector: 'app-catalogo-primeng',
  standalone: true,
  imports: [ScSearchComponent, ScSelectButtonComponent, ScSkeletonComponent, ScTagComponent],
  templateUrl: './catalogo-primeng.component.html',
  styleUrl: './catalogo-primeng.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoPrimengComponent {
  protected readonly familias = signal<readonly Familia[] | null>(null);
  /** Distingue «aún cargando» de «no se pudo»: un vacío mudo parecería que no hay nada. */
  protected readonly fallo = signal(false);

  protected readonly busqueda = signal('');
  protected readonly filtro = signal<Filtro>('todos');
  protected readonly opciones: readonly { label: string; value: Filtro }[] = [
    { label: 'Todos', value: 'todos' },
    { label: ESTADOS.ds.texto, value: 'ds' },
    { label: ESTADOS.directo.texto, value: 'directo' },
    { label: ESTADOS['sin-uso'].texto, value: 'sin-uso' },
    { label: 'Obsoletos', value: 'obsoleto' },
  ];

  protected readonly estados = ESTADOS;
  /** Las secciones y las DD que cita la tabla viven en el repositorio, no en sc-docs. */
  protected readonly repo = 'https://github.com/smartcontact-hub/smartcontact-ui/blob/main/';

  /** Las familias con las filas que pasan el filtro; una familia sin ninguna no se pinta. */
  protected readonly visibles = computed(() => {
    const q = plano(this.busqueda().trim());
    const f = this.filtro();
    const pasa = (r: Fila): boolean =>
      (f === 'todos' || (f === 'obsoleto' ? r.obsoleto : r.estado === f)) &&
      (!q || plano([r.nombres.join(' '), r.sirve, r.cuando ?? '', r.aqui].join(' ')).includes(q));
    return (this.familias() ?? [])
      .map((fam) => ({ ...fam, filas: fam.filas.filter(pasa) }))
      .filter((fam) => fam.filas.length > 0);
  });

  /** Se cuentan módulos, no filas: «IconField e InputIcon» son dos. */
  protected readonly total = computed(() => this.cuenta(this.familias() ?? []));
  protected readonly enVista = computed(() => this.cuenta(this.visibles()));

  constructor() {
    fetch('/primeng/_catalogo.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { familias: Familia[] }) => this.familias.set(d.familias))
      .catch(() => this.fallo.set(true));
  }

  /** Las familias de tres columnas (las directivas) no se eligen frente a un hermano. */
  protected conCuando(fam: Familia): boolean {
    return fam.filas.some((r) => r.cuando !== null);
  }

  private cuenta(fams: readonly Familia[]): number {
    return fams.reduce((n, fam) => n + fam.filas.reduce((m, r) => m + r.modulos.length, 0), 0);
  }
}

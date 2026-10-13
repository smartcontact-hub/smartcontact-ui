import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ScButtonComponent,
  ScColumnDef,
  ScDatatableComponent,
  ScPanelComponent,
  ScSearchComponent,
  ScSelectButtonComponent,
  ScSelectComponent,
  ScTagComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';

import { BI_LABEL, ESTADO_LABEL, GRUPOS_BI, TABLAS_BI, type BiPrioridad, type DsEstado, type TablaFila } from './tablas-bi.data';

interface Agente {
  readonly id: number;
  readonly name: string;
  readonly extension: string;
}

const AGENTES: readonly Agente[] = [
  { id: 1, name: 'Inés García', extension: '101' },
  { id: 2, name: 'Marc Soler', extension: '102' },
  { id: 3, name: 'Lucía Pérez', extension: '103' },
  { id: 4, name: 'Diego Romero', extension: '104' },
  { id: 5, name: 'Sara Vidal', extension: '105' },
];

interface Marca {
  visto: boolean;
  interesa: boolean;
}

const STORAGE_KEY = 'sc-docs.tablas-bi.checklist.v1';

/** Lee el checklist guardado por el VIEWER (conveniencia local, nunca estado compartido). */
function leerChecklistGuardado(): Record<number, Marca> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<number, Marca>) : {};
  } catch {
    return {};
  }
}

/**
 * Explorador-checklist de las 55 funcionalidades del Excel de BI, para enseñar en la reunión con
 * Producto y después con Desarrollo qué da ya `sc-datatable`, qué falta solo de front y qué pide back.
 *
 * Pensada para no-devs: una vista previa de tabla FIJA (arriba, sticky) reacciona en el momento a los
 * ~10 controles que tienen equivalente directo en el componente; el resto de filas solo llevan su
 * estado y una nota de una línea, nunca un control de mentira. El checklist («ya lo vi» / «me
 * interesa») es solo del navegador de quien lo usa: no es un registro compartido.
 *
 * No usa el motor «Storybook-like» de sc-docs (`story-host`): esto no es la doc de un componente, es
 * una pantalla de trabajo para una reunión concreta. Estructura libre; los controles y la tabla siguen
 * siendo del DS.
 */
@Component({
  selector: 'app-tablas-bi',
  imports: [
    RouterLink,
    ScButtonComponent,
    ScDatatableComponent,
    ScPanelComponent,
    ScSearchComponent,
    ScSelectButtonComponent,
    ScSelectComponent,
    ScTagComponent,
    ScToggleSwitchComponent,
  ],
  templateUrl: './tablas-bi.component.html',
  styleUrl: './tablas-bi.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablasBiComponent {
  protected readonly agentes = AGENTES;
  protected readonly columnas: readonly ScColumnDef<Agente>[] = [
    { field: 'name', header: 'Nombre', sortable: true },
    { field: 'extension', header: 'Extensión', width: '10rem', align: 'center' },
  ];

  protected readonly grupos = GRUPOS_BI;
  protected readonly biLabel = BI_LABEL;
  protected readonly estadoLabel = ESTADO_LABEL;

  protected readonly search = signal('');
  protected readonly estadoFiltro = signal<'todas' | DsEstado>('todas');
  protected readonly biFiltro = signal<'todas' | BiPrioridad>('todas');
  protected readonly soloInteresa = signal(false);

  protected readonly estadoOpciones = [
    { label: 'Todas', value: 'todas' as const },
    { label: 'Ya lo da', value: 'ya' as const },
    { label: 'Falta front', value: 'sin-back' as const },
    { label: 'Pide back', value: 'pide-back' as const },
  ];
  protected readonly biOpciones = [
    { label: 'Todas', value: 'todas' as const },
    { label: 'Sí', value: 'si' as const },
    { label: 'Tal vez', value: 'tal-vez' as const },
    { label: 'No', value: 'no' as const },
  ];

  /** Args en vivo de la vista previa fija; solo las ~10 props con control en esta pantalla. */
  protected readonly liveArgs = signal<Record<string, unknown>>({
    size: 'md',
    showGridlines: false,
    stripedRows: true,
    selectionMode: 'multiple',
    sortField: '',
    paginator: false,
    resizableColumns: false,
    reorderableColumns: false,
    loading: false,
    scrollable: false,
  });

  protected setArg(name: string, value: unknown): void {
    this.liveArgs.set({ ...this.liveArgs(), [name]: value });
  }

  /** Checklist del viewer: `visto` / `interesa` por fila, en `localStorage`. */
  protected readonly checklist = signal<Record<number, Marca>>(leerChecklistGuardado());

  constructor() {
    effect(() => {
      const valor = this.checklist();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(valor));
      } catch {
        // Cuota llena o almacenamiento bloqueado: el checklist sigue funcionando en memoria.
      }
    });
  }

  protected marca(id: number): Marca {
    return this.checklist()[id] ?? { visto: false, interesa: false };
  }

  protected toggleMarca(id: number, campo: keyof Marca): void {
    const actual = this.marca(id);
    this.checklist.set({ ...this.checklist(), [id]: { ...actual, [campo]: !actual[campo] } });
  }

  /** Totales de cobertura, derivados de los datos: no pueden quedarse desfasados. */
  protected readonly totales = computed(() => {
    let ya = 0, sinBack = 0, pideBack = 0;
    for (const f of TABLAS_BI) {
      if (f.estado === 'ya') ya++;
      else if (f.estado === 'sin-back') sinBack++;
      else pideBack++;
    }
    return { ya, sinBack, pideBack, total: TABLAS_BI.length };
  });

  protected readonly progresoChecklist = computed(() => {
    const marcas = Object.values(this.checklist());
    return {
      vistas: marcas.filter((m) => m.visto).length,
      interesan: marcas.filter((m) => m.interesa).length,
      total: TABLAS_BI.length,
    };
  });

  /** Filas visibles tras buscador + filtros, agrupadas en el orden del Excel. */
  protected readonly gruposFiltrados = computed(() => {
    const q = this.search().trim().toLowerCase();
    const estado = this.estadoFiltro();
    const bi = this.biFiltro();
    const soloInteresa = this.soloInteresa();
    const checklist = this.checklist();

    const pasaFiltro = (f: TablaFila): boolean => {
      if (estado !== 'todas' && f.estado !== estado) return false;
      if (bi !== 'todas' && f.bi !== bi) return false;
      if (soloInteresa && !checklist[f.id]?.interesa) return false;
      if (q && !`${f.grupo} ${f.nombre} ${f.nota}`.toLowerCase().includes(q)) return false;
      return true;
    };

    return this.grupos
      .map((grupo) => {
        const filas = TABLAS_BI.filter((f) => f.grupo === grupo && pasaFiltro(f));
        return {
          grupo,
          filas,
          ya: filas.filter((f) => f.estado === 'ya').length,
          sinBack: filas.filter((f) => f.estado === 'sin-back').length,
          pideBack: filas.filter((f) => f.estado === 'pide-back').length,
        };
      })
      .filter((g) => g.filas.length > 0);
  });

  /** ¿Hay algún filtro activo? Con uno puesto, los grupos que casan se abren solos: no tiene
   *  sentido buscar «lazy» y encontrarte el grupo Datos plegado. */
  protected readonly hayFiltroActivo = computed(
    () => this.search().trim() !== '' || this.estadoFiltro() !== 'todas' || this.biFiltro() !== 'todas' || this.soloInteresa(),
  );

  /** Grupos que el propio viewer abrió a mano (plegados por defecto: 17 grupos a la vez son
   *  demasiados para ver de golpe — el mismo criterio que el Playground de DataTable). */
  private readonly gruposAbiertosManual = signal<ReadonlySet<string>>(new Set());

  protected estaAbierto(grupo: string): boolean {
    return this.hayFiltroActivo() || this.gruposAbiertosManual().has(grupo);
  }

  protected toggleGrupo(grupo: string, abierto: boolean): void {
    const actual = new Set(this.gruposAbiertosManual());
    if (abierto) actual.add(grupo);
    else actual.delete(grupo);
    this.gruposAbiertosManual.set(actual);
  }

  /** Para barrer los 55 de un tirón en la reunión, en vez de grupo a grupo. */
  protected readonly todoAbierto = computed(() => this.gruposAbiertosManual().size >= this.grupos.length);

  protected alternarTodo(): void {
    this.gruposAbiertosManual.set(this.todoAbierto() ? new Set() : new Set(this.grupos));
  }

  /** Porcentajes del segmento de cobertura (el ancho del `<span>`, no el número que se lee). */
  protected readonly coberturaPct = computed(() => {
    const t = this.totales();
    return {
      ya: (t.ya / t.total) * 100,
      sinBack: (t.sinBack / t.total) * 100,
      pideBack: (t.pideBack / t.total) * 100,
    };
  });

  protected selectOptions(control: { readonly options?: readonly { label: string; value: unknown }[] }): readonly { label: string; value: unknown }[] {
    return control.options ?? [];
  }

  protected asBool(v: unknown): boolean {
    return !!v;
  }

  protected severidadEstado(estado: DsEstado): 'success' | 'warn' | 'danger' {
    if (estado === 'ya') return 'success';
    if (estado === 'sin-back') return 'warn';
    return 'danger';
  }

  protected severidadBi(bi: BiPrioridad): 'info' | 'secondary' | 'warn' {
    if (bi === 'si') return 'info';
    if (bi === 'si-pero') return 'warn';
    return 'secondary';
  }
}

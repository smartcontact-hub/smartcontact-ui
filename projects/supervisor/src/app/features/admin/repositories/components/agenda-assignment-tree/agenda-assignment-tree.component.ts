import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScCheckboxComponent as CheckboxComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ScSearchComponent as SearchComponent,
  ScSelectButtonComponent as SelectbuttonComponent,
  type TriState,
} from '@smartcontact-hub/components';
import type { TreeNode } from 'primeng/api';
import { TreeTableModule, type TreeTableNodeCollapseEvent, type TreeTableNodeExpandEvent } from 'primeng/treetable';

import { injectLangChange } from '@core/utils/lang-change';
import { CeldaVaciaComponent } from '@shared/components';
import type { Agent } from '@features/admin/agents/data/agents-data';
import {
  aplicar,
  CLAVE_SIN_GRUPO,
  claveAgente,
  claveGrupo,
  claves,
  claveSinGrupo,
  type Asignacion,
  type Estructura,
  type Intencion,
} from '../../state/agenda-asignacion.core.mjs';

type Filtro = 'all' | 'assigned';

/** Una fila del árbol: un grupo (o «Sin grupo») con sus agentes debajo, o un agente. */
interface Fila {
  readonly key: string;
  readonly tipo: 'grupo' | 'sinGrupo' | 'agente';
  /** El grupo o el agente; 0 en «Sin grupo». */
  readonly id: number;
  readonly nombre: string;
  readonly email?: string;
}

/** Un grupo para el árbol: su nombre y sus agentes, sacados de los vínculos grupo-agente. */
export interface GrupoParaAgenda {
  readonly id: number;
  readonly name: string;
  readonly miembros: readonly number[];
}

/**
 * A QUIÉN SE ASIGNA LA AGENDA (DD-211 §1): un árbol Grupo → Agentes, el `p-treetable` nativo de primeng.dev (como
 * `/lab/arbol`), con los grupos plegados, buscador, el filtro «Todos / Asignados» de la tabla de antes y, al final,
 * «Sin grupo» con los agentes que no están en ninguno.
 *
 * La selección es por persona: marcar a Ángel lo marca en todos sus grupos; marcar un grupo marca a sus agentes también
 * en los otros grupos, y un grupo entero es dinámico (quien entre después tendrá la agenda). Las reglas viven en
 * `agenda-asignacion.core.mjs`; aquí solo se pinta y se avisa: quien guarda es el editor.
 *
 * Las casillas son `sc-checkbox` (tri-estado, con el nombre de su fila para el lector y alcanzables con Tab), no la
 * casilla de la tabla: la de `p-treetable` sale con `tabindex="-1"` y sin nombre, y su propagación es por fila, no por
 * persona.
 */
@Component({
  selector: 'sc-agenda-assignment-tree',
  imports: [
    CeldaVaciaComponent,
    CheckboxComponent,
    EmptyStateComponent,
    SearchComponent,
    SelectbuttonComponent,
    TranslateModule,
    TreeTableModule,
  ],
  templateUrl: './agenda-assignment-tree.component.html',
  styleUrl: './agenda-assignment-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaAssignmentTreeComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  readonly grupos = input.required<readonly GrupoParaAgenda[]>();
  readonly agents = input.required<readonly Agent[]>();
  readonly asignacion = input.required<Asignacion>();
  readonly asignacionChange = output<Asignacion>();

  protected readonly query = signal('');
  protected readonly filter = signal<Filtro>('all');
  /** Las filas desplegadas: el árbol nace plegado y se recuerda lo que se abre aunque cambien las filas. */
  private readonly abiertas = signal<ReadonlySet<string>>(new Set());

  /** La estructura del árbol: cada grupo con sus agentes y los que no están en ninguno. */
  protected readonly estructura = computed<Estructura>(() => {
    const enGrupo = new Set(this.grupos().flatMap((g) => g.miembros));
    return {
      grupos: this.grupos().map((g) => ({ id: g.id, miembros: g.miembros })),
      sinGrupo: this.agents().filter((a) => !enGrupo.has(a.id)).map((a) => a.id),
    };
  });

  private readonly estados = computed(() => claves(this.asignacion(), this.estructura()));
  private readonly asignados = computed(() => new Set(this.asignacion().agentes));

  /** Lo que se ve: con texto, los grupos cuyo nombre coincide (con todos sus agentes) y los agentes que coinciden; con
   *  «Asignados», solo los agentes marcados. Al buscar, los grupos con algo se abren. */
  protected readonly nodos = computed<TreeNode<Fila>[]>(() => {
    const q = this.query().trim().toLowerCase();
    const soloAsignados = this.filter() === 'assigned';
    const asignados = this.asignados();
    const abiertas = this.abiertas();
    const porId = new Map(this.agents().map((a) => [a.id, a]));
    const coincide = (texto: string | undefined) => !!texto && texto.toLowerCase().includes(q);
    const hijos = (ids: readonly number[], clave: (a: number) => string, todos: boolean): TreeNode<Fila>[] =>
      ids
        .map((id) => porId.get(id))
        .filter((a): a is Agent => !!a)
        .filter((a) => (!soloAsignados || asignados.has(a.id)) && (todos || !q || coincide(a.name) || coincide(a.email)))
        .map((a) => {
          const key = clave(a.id);
          return { key, leaf: true, data: { key, tipo: 'agente', id: a.id, nombre: a.name, email: a.email } };
        });
    const padre = (key: string, tipo: Fila['tipo'], id: number, nombre: string, ids: readonly number[], clave: (a: number) => string) => {
      const todos = !!q && coincide(nombre);
      const children = hijos(ids, clave, todos);
      const visible = q || soloAsignados ? children.length > 0 || (todos && !soloAsignados) : true;
      if (!visible) return null;
      const node: TreeNode<Fila> = {
        key,
        data: { key, tipo, id, nombre },
        children,
        leaf: ids.length === 0,
        expanded: abiertas.has(key) || ((!!q || soloAsignados) && children.length > 0),
      };
      return node;
    };
    const out: TreeNode<Fila>[] = [];
    for (const g of this.grupos()) {
      const n = padre(claveGrupo(g.id), 'grupo', g.id, g.name, g.miembros, (a) => claveAgente(g.id, a));
      if (n) out.push(n);
    }
    const sueltos = this.estructura().sinGrupo;
    if (sueltos.length > 0) {
      this.lang();
      const nombre = this.translate.instant('repositories.agendas.no_group');
      const n = padre(CLAVE_SIN_GRUPO, 'sinGrupo', 0, nombre, sueltos, claveSinGrupo);
      if (n) out.push(n);
    }
    return out;
  });

  /** El estado de la casilla de una fila: la de un grupo entero o la de una persona, «parcial» si tiene a alguno. */
  protected estado(fila: Fila): TriState {
    const e = this.estados()[fila.key];
    return e?.checked ? 'all' : e?.partialChecked ? 'some' : 'none';
  }

  protected pulsar(fila: Fila, marcar: boolean): void {
    const intencion: Intencion = { tipo: fila.tipo, id: fila.id, marcar };
    this.asignacionChange.emit(aplicar(this.asignacion(), this.estructura(), intencion));
  }

  protected abrir(event: TreeTableNodeExpandEvent): void {
    const key = (event.node as TreeNode<Fila>).key;
    if (key) this.abiertas.update((s) => new Set(s).add(key));
  }

  protected cerrar(event: TreeTableNodeCollapseEvent): void {
    const key = (event.node as TreeNode<Fila>).key;
    if (!key) return;
    this.abiertas.update((s) => {
      const next = new Set(s);
      next.delete(key);
      return next;
    });
  }

  protected readonly filterOptions = computed(() => {
    this.lang();
    return [
      { label: this.translate.instant('repositories.agendas.agents_filter_all'), value: 'all' },
      {
        label: this.translate.instant('repositories.agendas.agents_filter_assigned', { count: this.asignacion().agentes.length }),
        value: 'assigned',
      },
    ];
  });

  protected readonly columnas = computed(() => {
    this.lang();
    return [
      { field: 'nombre', header: this.translate.instant('repositories.agendas.col_groups_agents') },
      { field: 'email', header: this.translate.instant('repositories.agendas.agents_email') },
    ];
  });

  /** Cuántas personas y cuántos grupos enteros la tienen. */
  protected readonly summary = computed(() => {
    this.lang();
    return this.translate.instant('repositories.agendas.assign_summary', {
      count: this.asignacion().agentes.length,
      total: this.agents().length,
      groups: this.asignacion().grupos.length,
    });
  });

  protected ariaDe(fila: Fila): string {
    this.lang();
    const key = fila.tipo === 'agente' ? 'repositories.agendas.agents_row_aria' : 'repositories.agendas.group_row_aria';
    return this.translate.instant(key, { name: fila.nombre });
  }
}

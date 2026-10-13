import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ScInputNumberComponent,
  ScInputTextComponent,
  ScSelectButtonComponent,
  ScSelectComponent,
  ScTagComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { TranslateModule } from '@ngx-translate/core';
import type { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { TreeTableModule } from 'primeng/treetable';

import { SidebarDemoService } from '../../core/services/sidebar-demo.service';
import { ThemeService, type ThemeMode } from '../../core/services/theme.service';
import { TREETABLE_LAB_TEAMS, type TreeTableAgentRow } from './treetable-lab-page.data';

type Viewport = 'desktop' | 'tablet';

/** Tipo de control (knob), mismo patrón que `table-lab-page.component.ts`. */
interface ArgType {
  readonly name: string;
  readonly label: string;
  readonly control:
    | { readonly kind: 'boolean' }
    | { readonly kind: 'select'; readonly options: readonly (string | number)[] }
    | { readonly kind: 'number'; readonly min?: number; readonly max?: number; readonly step?: number }
    | { readonly kind: 'text' };
  readonly description?: string;
}

/**
 * Knobs reales de `p-treetable` (primeng.dev/treetable): no hay wrapper del DS todavía
 * (`docs/AUDIT-PRIMENG-CATALOGO.md` lo tenía en «sin caso» hasta este laboratorio), así que es el
 * nativo tal cual, tema puesto desde `sc-preset/treetable.ts`.
 */
const ARG_TYPES: readonly ArgType[] = [
  { name: 'paginator', label: 'Paginación', control: { kind: 'boolean' }, description: 'Divide el árbol en páginas en vez de enseñarlo entero de golpe.' },
  { name: 'rows', label: 'Filas por página', control: { kind: 'number', min: 1, max: 20, step: 1 }, description: 'Cuántas filas (de cualquier nivel) entran en cada página.' },
  { name: 'showGridlines', label: 'Líneas de rejilla', control: { kind: 'boolean' }, description: 'Dibuja líneas entre todas las celdas, como una cuadrícula.' },
  { name: 'loading', label: 'Cargando', control: { kind: 'boolean' }, description: 'Muestra el aviso de «cargando» encima del árbol.' },
  { name: 'rowHover', label: 'Resaltar fila al pasar', control: { kind: 'boolean' }, description: 'La fila cambia de color al pasar el ratón por encima, aunque no se pueda seleccionar.' },
  { name: 'selectionMode', label: 'Modo de selección', control: { kind: 'select', options: ['single', 'multiple', 'checkbox'] }, description: '«single»/«multiple»: clic en la fila. «checkbox»: casilla, y marcar un equipo marca a todos sus agentes.' },
  { name: 'sortField', label: 'Ordenar por columna', control: { kind: 'text' }, description: 'Por qué columna sale ordenado el árbol nada más entrar (cada nivel se ordena por separado).' },
  { name: 'sortOrder', label: 'Sentido del orden', control: { kind: 'select', options: [1, -1] }, description: '1 ascendente, -1 descendente.' },
  { name: 'scrollable', label: 'Scroll propio', control: { kind: 'boolean' }, description: 'La cabecera se queda fija arriba y el resto del árbol hace scroll por su cuenta.' },
  { name: 'scrollHeight', label: 'Alto del scroll', control: { kind: 'text' }, description: 'Cuánto alto tiene ese scroll propio (p. ej. 320px).' },
  { name: 'resizableColumns', label: 'Redimensionar columnas', control: { kind: 'boolean' }, description: 'Se puede arrastrar el borde de una columna para hacerla más ancha o más estrecha.' },
  { name: 'columnResizeMode', label: 'Modo de redimensión', control: { kind: 'select', options: ['fit', 'expand'] }, description: '«fit»: la tabla no cambia de ancho. «expand»: crece con la columna.' },
  { name: 'reorderableColumns', label: 'Reordenar columnas', control: { kind: 'boolean' }, description: 'Se puede arrastrar una columna entera para cambiarla de sitio.' },
];

const DEFAULT_ARGS: Record<string, unknown> = {
  paginator: false,
  rows: 10,
  showGridlines: false,
  loading: false,
  rowHover: true,
  selectionMode: 'checkbox',
  sortField: '',
  sortOrder: 1,
  scrollable: false,
  scrollHeight: '320px',
  resizableColumns: false,
  columnResizeMode: 'fit',
  reorderableColumns: false,
};

const CONTROL_GROUP_DEFS: readonly { title: string; open: boolean; names: readonly string[] }[] = [
  { title: 'General', open: true, names: ['paginator', 'rows', 'showGridlines', 'loading', 'rowHover'] },
  { title: 'Selección y orden', open: false, names: ['selectionMode', 'sortField', 'sortOrder'] },
  { title: 'Scroll y tamaño', open: false, names: ['scrollable', 'scrollHeight'] },
  { title: 'Columnas', open: false, names: ['resizableColumns', 'columnResizeMode', 'reorderableColumns'] },
];

interface TreeTableColumn {
  readonly field: 'name' | 'role' | 'status' | 'tickets';
  readonly header: string;
}

const COLUMNS: readonly TreeTableColumn[] = [
  { field: 'name', header: 'Nombre' },
  { field: 'role', header: 'Tipo' },
  { field: 'status', header: 'Estado' },
  { field: 'tickets', header: 'Tickets abiertos' },
];

@Component({
  selector: 'sc-treetable-lab-page',
  imports: [
    ButtonModule,
    FormsModule,
    NgTemplateOutlet,
    PopoverModule,
    ScIconComponent,
    ScInputNumberComponent,
    ScInputTextComponent,
    ScSelectButtonComponent,
    ScSelectComponent,
    ScTagComponent,
    ScToggleSwitchComponent,
    TooltipModule,
    TranslateModule,
    TreeTableModule,
  ],
  templateUrl: './treetable-lab-page.component.html',
  styleUrl: './treetable-lab-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreetableLabPageComponent {
  protected readonly theme = inject(ThemeService);
  private readonly sidebarDemo = inject(SidebarDemoService);

  protected readonly nodes: readonly TreeNode<TreeTableAgentRow>[] = TREETABLE_LAB_TEAMS;
  protected readonly columns = COLUMNS;

  protected readonly collapsedKeys = signal<Record<string, boolean>>({});

  protected readonly liveArgs = signal<Record<string, unknown>>({ ...DEFAULT_ARGS });
  protected readonly controlGroups: readonly { title: string; open: boolean; knobs: readonly ArgType[] }[] =
    CONTROL_GROUP_DEFS.map((g) => ({
      title: g.title,
      open: g.open,
      knobs: g.names.map((n) => ARG_TYPES.find((at) => at.name === n)).filter((at): at is ArgType => !!at),
    }));

  protected setArg(name: string, value: unknown): void {
    this.liveArgs.update((args) => ({ ...args, [name]: value }));
  }

  /** `pResizableColumn`/`pReorderableColumn` crean su tirador una sola vez, en `ngAfterViewInit`
   *  (mismo límite medido en `table-lab-page.component.ts`): activarlos más tarde con el
   *  interruptor no los hace aparecer. Remontamos el árbol cuando cambia cualquiera de los dos. */
  protected readonly tableRemountKey = computed(
    () => `${this.liveArgs()['resizableColumns']}-${this.liveArgs()['reorderableColumns']}`,
  );

  protected asStr(v: unknown): string {
    return typeof v === 'string' ? v : v == null ? '' : String(v);
  }
  protected asNum(v: unknown): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  protected asBool(v: unknown): boolean {
    return !!v;
  }
  protected selectOptions(at: ArgType): readonly { label: string; value: string | number }[] {
    return at.control.kind === 'select' ? at.control.options.map((o) => ({ label: String(o), value: o })) : [];
  }

  protected expandAll(): void {
    this.collapsedKeys.set({});
  }

  protected collapseAll(): void {
    const keys: Record<string, boolean> = {};
    for (const node of this.nodes) {
      if (node.key) {
        keys[node.key] = true;
      }
    }
    this.collapsedKeys.set(keys);
  }

  protected readonly sidebarExpanded = signal(false);
  protected readonly viewport = signal<Viewport>('desktop');

  protected readonly themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Claro', icon: 'light_mode' },
    { value: 'dark', label: 'Oscuro', icon: 'dark_mode' },
    { value: 'system', label: 'Sistema', icon: 'desktop_windows' },
  ];

  protected readonly viewportOptions: { value: Viewport; label: string }[] = [
    { value: 'desktop', label: 'Escritorio' },
    { value: 'tablet', label: 'Tablet' },
  ];

  /** Mismo selector que `table-lab-page.component.ts`: navega entre `/lab/tabla` y `/lab/arbol`,
   *  no cambia un prop — son componentes distintos. */
  private readonly router = inject(Router);
  protected readonly labOptions: { value: 'tabla' | 'arbol'; label: string }[] = [
    { value: 'tabla', label: 'Tabla' },
    { value: 'arbol', label: 'Árbol' },
  ];

  protected selectLab(lab: unknown): void {
    if (lab === 'tabla' || lab === 'arbol') void this.router.navigateByUrl(`/lab/${lab}`);
  }

  constructor() {
    inject(DestroyRef).onDestroy(() => this.sidebarDemo.forcedExpanded.set(false));
  }

  protected selectTheme(mode: unknown): void {
    if (mode === 'light' || mode === 'dark' || mode === 'system') this.theme.set(mode);
  }

  protected selectViewport(viewport: unknown): void {
    if (viewport === 'desktop' || viewport === 'tablet') this.viewport.set(viewport);
  }

  protected onSidebarExpandedChange(expanded: boolean): void {
    this.sidebarExpanded.set(expanded);
    this.sidebarDemo.forcedExpanded.set(expanded);
  }

  protected roleSeverity(role: TreeTableAgentRow['role']): 'info' | 'secondary' {
    return role === 'Equipo' ? 'info' : 'secondary';
  }

  protected statusSeverity(status: TreeTableAgentRow['status']): 'success' | 'warning' | 'secondary' {
    if (status === 'online') return 'success';
    if (status === 'busy') return 'warning';
    return 'secondary';
  }

  protected statusLabel(status: TreeTableAgentRow['status']): string {
    if (status === 'online') return 'En línea';
    if (status === 'busy') return 'Ocupado';
    return 'Desconectado';
  }
}

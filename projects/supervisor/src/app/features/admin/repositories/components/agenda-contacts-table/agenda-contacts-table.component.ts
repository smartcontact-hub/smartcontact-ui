import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import {
  type ColumnDef,
  type ScColumnCellContext,
  type ScDatatableRowEvent,
  type ScDatatableRowKeyEvent,
  type ScColumnDef,
  ScButtonComponent as ButtonComponent,
  ScDatatableComponent as DatatableComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ScSearchComponent as SearchComponent,
} from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';
import { ColumnToggleComponent, normalizePrefs } from '@shared/components';

import { contactoCoincide } from '../../state/agenda-contacts.core.mjs';
import type { AgendaContact } from '../../state/agendas.store';

/** El campo de la columna del menú de fila: no es un dato del contacto. */
const ACCIONES = '__acciones';

/** Las columnas de partida, en su orden: las cinco de siempre. Las otras 29 se eligen en «Columnas». */
const COLUMNAS_DE_PARTIDA = ['name', 'surname', 'company', 'phone', 'emailWork'];

/** Dónde se recuerda qué columnas se ven: una para todas las agendas, como cada lista guarda la suya. */
const CLAVE_DE_COLUMNAS = 'sc-agenda-contacts-columns';

let agendaContactMenuIdCounter = 0;

/**
 * Los contactos de una agenda (DD-163): buscador, tabla con paginador y menú de fila (Editar, Eliminar).
 *
 * Es la tabla de una sección con campos encima, así que va como la de Agentes de la ficha (`agent-channel-table`):
 * mide lo que sus filas (con «Agentes» debajo ya no llega al pie, DD-160), y pagina
 * en vez de pintar una lista virtual, que pide un alto fijo.
 *
 * Vive en su propio componente, como las otras tablas dentro de un formulario: `audit:datatables` deduce la ruta de una
 * página por su bloque de `*.routes.ts`, y la del editor saldría `crear`. Solo pinta y avisa: los cambios los hace el
 * editor, que es quien guarda.
 */
@Component({
  selector: 'sc-agenda-contacts-table',
  imports: [
    ButtonComponent,
    ColumnToggleComponent,
    DatatableComponent,
    EmptyStateComponent,
    MenuModule,
    SearchComponent,
    TranslateModule,
  ],
  templateUrl: './agenda-contacts-table.component.html',
  styleUrl: './agenda-contacts-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaContactsTableComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  readonly contacts = input.required<readonly AgendaContact[]>();
  /** Los 34 campos de un contacto con el nombre que tienen en esta agenda (los personalizados, con su etiqueta). */
  readonly fields = input.required<readonly { readonly key: string; readonly label: string }[]>();
  /** «Añadir contacto», desde la barra o desde el vacío. */
  readonly add = output<void>();
  /** «Importar»: el editor abre su diálogo (DD-166). */
  readonly importar = output<void>();
  readonly edit = output<AgendaContact>();
  readonly remove = output<AgendaContact>();
  /** Eliminar varios (DD-227): con dos o más marcados, el clic derecho sobre uno ofrece solo «Eliminar (N)». */
  readonly removeMany = output<readonly AgendaContact[]>();

  /** La búsqueda de las listas, en el nombre y en el teléfono; un teléfono, también por sus cifras (`contactoCoincide`). */
  protected readonly query = signal('');
  protected readonly visibles = computed(() => {
    const q = this.query();
    const todos = this.contacts();
    return q.trim() ? todos.filter((c) => contactoCoincide(c, q)) : todos;
  });

  /** Los marcados, por id: si un contacto desaparece de la agenda (borrado, Deshacer), se va también de la selección. */
  protected readonly selectedIds = linkedSignal<readonly AgendaContact[], ReadonlySet<number>>({
    source: () => this.contacts(),
    computation: (contactos, antes) => {
      const vivos = new Set(contactos.map((c) => c.id));
      return new Set([...(antes?.value ?? [])].filter((id) => vivos.has(id)));
    },
  });
  protected readonly selectedRows = computed(() => this.contacts().filter((c) => this.selectedIds().has(c.id)));

  protected onSelectionChange(selection: unknown): void {
    const filas = Array.isArray(selection) ? (selection as readonly AgendaContact[]) : [];
    this.selectedIds.set(new Set(filas.map((c) => c.id)));
  }

  protected readonly rowAria = (c: AgendaContact): string => {
    this.lang();
    return this.translate.instant('repositories.agendas.select_contact_aria', { name: c.name || this.translate.instant('repositories.agendas.no_name') });
  };

  protected readonly selectAllAria = computed(() => {
    this.lang();
    return this.translate.instant('repositories.agendas.select_all_contacts_aria');
  });

  /**
   * La página abierta (`[(first)]`): vuelve a la primera al buscar y al añadir un contacto, que va arriba; al editar o
   * borrar se queda donde estaba.
   */
  protected readonly first = linkedSignal<{ readonly query: string; readonly total: number }, number>({
    source: () => ({ query: this.query(), total: this.contacts().length }),
    computation: (ahora, antes) =>
      !antes || ahora.query !== antes.source.query || ahora.total > antes.source.total ? 0 : antes.value,
  });

  /* ── Columnas: las cinco de siempre y las 34 a elegir (revisión de producto del 2026-10-15) ────────────────────── */

  /** Las de partida primero, en su orden, y luego las demás en el del formulario. Nombre es la fija. */
  private readonly choices = computed<readonly ColumnDef[]>(() => {
    const fields = this.fields();
    const enOrden = [
      ...COLUMNAS_DE_PARTIDA.map((key) => fields.find((f) => f.key === key)).filter((f) => !!f),
      ...fields.filter((f) => !COLUMNAS_DE_PARTIDA.includes(f.key)),
    ];
    return enOrden.map((f) => ({
      key: f.key,
      label: f.label,
      locked: f.key === 'name',
      defaultVisible: COLUMNAS_DE_PARTIDA.includes(f.key),
    }));
  });

  private readonly stored = signal<unknown>(this.leerColumnas());
  protected readonly prefs = computed(() => normalizePrefs(this.choices(), this.stored()));

  protected readonly toggleOptions = computed(() => {
    const choices = this.choices();
    return this.prefs().order.map((key) => {
      const c = choices.find((x) => x.key === key)!;
      return { key, label: c.label, locked: !!c.locked };
    });
  });

  /** Lo que pinta la tabla, en el orden elegido; el «⋮», siempre al final. */
  protected readonly visibleColumns = computed(() => [...this.prefs().visible, ACCIONES]);

  /** Con muchas columnas, la tabla se desplaza de lado dentro de su tarjeta en vez de estrujarlas (DD-102): unas 10rem
   *  por columna y el «⋮». */
  protected readonly tableMinWidth = computed(() => `${this.prefs().visible.length * 10 + 3.5}rem`);

  private leerColumnas(): unknown {
    try {
      const raw = localStorage.getItem(CLAVE_DE_COLUMNAS);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      /* Sin almacenamiento (ventana privada, bloqueado): la tabla sale con sus columnas de partida. */
      return undefined;
    }
  }

  private guardarColumnas(order: readonly string[], visible: readonly string[]): void {
    const next = normalizePrefs(this.choices(), { order, visible });
    this.stored.set(next);
    try {
      localStorage.setItem(CLAVE_DE_COLUMNAS, JSON.stringify({ order: next.order, visible: next.visible }));
    } catch {
      /* Sin almacenamiento: el cambio vale mientras dure la página. */
    }
  }

  protected onVisibleChange(keys: readonly string[]): void {
    const order = this.prefs().order;
    this.guardarColumnas(order, order.filter((k) => keys.includes(k) || k === 'name'));
  }

  protected onReorder(from: number, to: number): void {
    const order = [...this.prefs().order];
    const [movida] = order.splice(from, 1);
    order.splice(to, 0, movida!);
    this.guardarColumnas(order, order.filter((k) => this.prefs().visible.includes(k)));
  }

  protected onResetColumns(): void {
    const partida = normalizePrefs(this.choices(), undefined);
    this.guardarColumnas(partida.order, partida.visible);
  }

  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<AgendaContact>>>('nameTpl');
  private readonly actionsTpl = viewChild<TemplateRef<ScColumnCellContext<AgendaContact>>>('actionsTpl');

  protected readonly columns = computed<readonly ScColumnDef<AgendaContact>[]>(() => {
    this.lang();
    return [
      ...this.fields().map(
        (f): ScColumnDef<AgendaContact> =>
          f.key === 'name'
            ? // Nombre se queda fijo al desplazar la tabla de lado, como en los listados (COA SISMAC-4440).
              { field: 'name', header: f.label, rowHeader: true, frozen: true, cellTemplate: this.nameTpl() }
            : { field: f.key, header: f.label },
      ),
      {
        field: ACCIONES,
        header: '',
        headerAriaLabel: this.translate.instant('common.actions'),
        /* Relleno de celda + botón de 28 + relleno, como la columna del menú de las listas (`sc-list-page`). */
        width: 'var(--sc-spacing-4)',
        align: 'right',
        stopRowClick: true,
        // Fija a la derecha, como el «⋮» de los listados (COA SISMAC-4440).
        frozen: true,
        alignFrozen: 'right',
        cellTemplate: this.actionsTpl(),
      },
    ];
  });

  /** Pulsar una fila abre su editor, como en las listas de la plataforma (la fila se abre; «⋮» lleva el resto). Con
   *  Mayús se salta, para marcar sin abrir. */
  protected onRowClick(event: ScDatatableRowEvent<AgendaContact>): void {
    if (event.originalEvent.shiftKey) return;
    this.edit.emit(event.row);
  }

  /** WCAG 2.1.1: si la fila se abre con el ratón, se abre con el teclado: Intro, con el foco en la fila. */
  protected onRowKeydown(event: ScDatatableRowKeyEvent<AgendaContact>): void {
    const native = event.originalEvent;
    if ((native.target as HTMLElement | null)?.tagName === 'TR' && native.key === 'Enter') this.edit.emit(event.row);
  }

  protected readonly rowClass = () => 'sc-row--clickable';

  /* Un solo menú para toda la tabla, como en las listas: se repuebla al apuntar a otra fila. */
  private readonly menuTarget = signal<AgendaContact | null>(null);
  /** Con dos o más marcados y el menú sobre uno de ellos: la selección entera, y el menú ofrece solo «Eliminar (N)». */
  private readonly menuSelection = signal<readonly AgendaContact[] | null>(null);
  protected readonly menuOpen = signal(false);
  protected readonly menuId = `sc-agenda-contact-menu-${++agendaContactMenuIdCounter}`;
  /** Si el menú (uno para toda la tabla) es el de esta fila: su «⋮» dice que está abierto (DD-171). */
  protected esLaDelMenu(contacto: AgendaContact): boolean {
    return this.menuTarget() === contacto;
  }
  protected readonly menuItems = computed<MenuItem[]>(() => {
    this.lang();
    const marcados = this.menuSelection();
    if (marcados) {
      return [
        {
          label: this.translate.instant('common.delete_count', { count: marcados.length }),
          icon: 'sc-icon-font sc-icon-font--delete',
          styleClass: 'sc-menu-item--danger',
          command: () => this.removeMany.emit(marcados),
        },
      ];
    }
    const contacto = this.menuTarget();
    if (!contacto) return [];
    return [
      {
        label: this.translate.instant('common.edit'),
        icon: 'sc-icon-font sc-icon-font--edit',
        command: () => this.edit.emit(contacto),
      },
      { separator: true },
      {
        // Sin puntos suspensivos: borra en el acto, y Deshacer lo devuelve hasta que se guarda.
        label: this.translate.instant('common.delete'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'sc-menu-item--danger',
        command: () => this.remove.emit(contacto),
      },
    ];
  });

  /** Con la fila entre dos o más marcadas, su menú es el de la selección; si no, el de esa fila. */
  private apuntar(contacto: AgendaContact): void {
    const marcados = this.selectedRows();
    const deLaSeleccion = marcados.length >= 2 && marcados.includes(contacto);
    this.menuSelection.set(deLaSeleccion ? marcados : null);
    this.menuTarget.set(contacto);
  }

  protected openMenu(contacto: AgendaContact, menu: { toggle: (event: Event) => void }, event: Event): void {
    event.stopPropagation();
    this.apuntar(contacto);
    menu.toggle(event);
  }

  /** El clic derecho abre el mismo menú que el «⋮». */
  protected onRowContextMenu(event: ScDatatableRowEvent<AgendaContact>, menu: { toggle: (event: Event) => void }): void {
    this.apuntar(event.row);
    menu.toggle(event.originalEvent);
  }
}

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
  type ScColumnCellContext,
  type ScColumnDef,
  ScButtonComponent as ButtonComponent,
  ScDatatableComponent as DatatableComponent,
  ScEmptyStateComponent as EmptyStateComponent,
  ScSearchComponent as SearchComponent,
} from '@smartcontact-hub/components';

import { LlegaAlPieDirective } from '@core/directives';
import { injectLangChange } from '@core/utils/lang-change';

import { contactoCoincide } from '../../state/agenda-contacts.core.mjs';
import type { AgendaContact } from '../../state/agendas.store';

/** El campo de la columna del menú de fila: no es un dato del contacto. */
const ACCIONES = '__acciones';

/**
 * Los contactos de una agenda (DD-163): buscador, tabla con paginador y menú de fila (Editar, Eliminar).
 *
 * Es la tabla de una sección con campos encima, así que va como la de Agentes de la ficha (`agent-channel-table`):
 * llega al pie de la pantalla, medida desde donde empieza (`scLlegaAlPie` y `.table-card--al-pie`, DD-160), y pagina
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
    DatatableComponent,
    EmptyStateComponent,
    LlegaAlPieDirective,
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
  /** «Añadir contacto», desde la barra o desde el vacío. */
  readonly add = output<void>();
  readonly edit = output<AgendaContact>();
  readonly remove = output<AgendaContact>();

  /** La búsqueda de las listas, en el nombre y en el teléfono; un teléfono, también por sus cifras (`contactoCoincide`). */
  protected readonly query = signal('');
  protected readonly visibles = computed(() => {
    const q = this.query();
    const todos = this.contacts();
    return q.trim() ? todos.filter((c) => contactoCoincide(c, q)) : todos;
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

  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<AgendaContact>>>('nameTpl');
  private readonly actionsTpl = viewChild<TemplateRef<ScColumnCellContext<AgendaContact>>>('actionsTpl');

  protected readonly columns = computed<readonly ScColumnDef<AgendaContact>[]>(() => {
    this.lang();
    return [
      { field: 'name', header: this.translate.instant('repositories.columns.name'), cellTemplate: this.nameTpl() },
      { field: 'phone', header: this.translate.instant('repositories.agendas.phone') },
      {
        field: ACCIONES,
        header: '',
        headerAriaLabel: this.translate.instant('common.actions'),
        /* Relleno de celda + botón de 28 + relleno, como la columna del menú de las listas (`sc-list-page`). */
        width: 'var(--sc-spacing-4)',
        align: 'right',
        stopRowClick: true,
        cellTemplate: this.actionsTpl(),
      },
    ];
  });

  /* Un solo menú para toda la tabla, como en las listas: se repuebla al apuntar a otra fila. */
  private readonly menuTarget = signal<AgendaContact | null>(null);
  protected readonly menuItems = computed<MenuItem[]>(() => {
    this.lang();
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

  protected openMenu(contacto: AgendaContact, menu: { toggle: (event: Event) => void }, event: Event): void {
    event.stopPropagation();
    this.menuTarget.set(contacto);
    menu.toggle(event);
  }
}

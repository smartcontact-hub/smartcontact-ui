import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, type TemplateRef, viewChild } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import {
  type ScColumnCellContext,
  type ScColumnDef,
  type ScDatatableRowEvent,
  type ScDatatableRowKeyEvent,
  ScButtonComponent,
  ScDatatableComponent,
  ScEmptyStateComponent,
  ScTagComponent,
} from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';
import type { LabelColor } from '@shared/components';

/** Una fila ya escrita: sus celdas como texto y, si la primera columna es una etiqueta, su color. */
export interface FilaDeHorario {
  readonly id: number;
  readonly celdas: Readonly<Record<string, string>>;
  readonly color?: LabelColor | null;
}

/** Una columna: el campo de `celdas` que pinta, su cabecera y si es la etiqueta de color (la del periodo). */
export interface ColumnaDeHorario {
  readonly campo: string;
  readonly titulo: string;
  readonly etiqueta?: boolean;
}

/** El campo de la columna del menú de fila: no es un dato de la fila. */
const ACCIONES = '__acciones';

let menuIdCounter = 0;

/**
 * Una sublista del horario —sus periodos, sus fechas especiales, los días de un calendario de festivos— como la tabla
 * de una sección de las fichas (DD-163 §3, DD-252): la fila abre su diálogo (clic o Intro) y el «⋮» lleva Editar y
 * Eliminar, con el mismo menú en el clic derecho; «Añadir» va encima. Calca la de contactos de una agenda
 * (`agenda-contacts-table`), sin buscador ni paginador ni casillas: son pocas filas (DD-227 deja fuera las anidadas).
 * Solo pinta y avisa: los cambios los hace el editor, que es quien guarda.
 */
@Component({
  selector: 'sc-horario-filas-table',
  imports: [MenuModule, ScButtonComponent, ScDatatableComponent, ScEmptyStateComponent, ScTagComponent, TooltipModule, TranslateModule],
  templateUrl: './horario-filas-table.component.html',
  styleUrl: './horario-filas-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioFilasTableComponent {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  readonly filas = input.required<readonly FilaDeHorario[]>();
  readonly columnas = input.required<readonly ColumnaDeHorario[]>();
  /** La clave del botón de añadir, que también es la llamada del vacío. */
  readonly anadirKey = input.required<string>();
  readonly vacioKey = input.required<string>();
  readonly vacioIcono = input('event');

  readonly abrir = output<number>();
  readonly eliminar = output<number>();
  readonly anadir = output<void>();

  private readonly celdaTpl = viewChild<TemplateRef<ScColumnCellContext<FilaDeHorario>>>('celdaTpl');
  private readonly accionesTpl = viewChild<TemplateRef<ScColumnCellContext<FilaDeHorario>>>('accionesTpl');

  protected readonly columns = computed<readonly ScColumnDef<FilaDeHorario>[]>(() => {
    this.lang();
    return [
      // La primera columna nombra la fila, para el lector (DD-193).
      ...this.columnas().map(
        (c, i): ScColumnDef<FilaDeHorario> => ({ field: c.campo, header: c.titulo, rowHeader: i === 0, cellTemplate: this.celdaTpl() }),
      ),
      {
        field: ACCIONES,
        header: '',
        headerAriaLabel: this.translate.instant('common.actions'),
        width: 'var(--sc-spacing-4)',
        align: 'right',
        stopRowClick: true,
        cellTemplate: this.accionesTpl(),
      },
    ];
  });

  protected readonly etiquetas = computed(() => new Set(this.columnas().filter((c) => c.etiqueta).map((c) => c.campo)));

  /** Pulsar una fila abre su diálogo, como en la agenda; el «⋮» lleva el resto. */
  protected onRowClick(event: ScDatatableRowEvent<FilaDeHorario>): void {
    this.abrir.emit(event.row.id);
  }

  /** WCAG 2.1.1: si la fila se abre con el ratón, se abre con el teclado: Intro, con el foco en la fila. */
  protected onRowKeydown(event: ScDatatableRowKeyEvent<FilaDeHorario>): void {
    const native = event.originalEvent;
    if ((native.target as HTMLElement | null)?.tagName === 'TR' && native.key === 'Enter') this.abrir.emit(event.row.id);
  }

  protected readonly rowClass = () => 'sc-row--clickable';

  /* Un solo menú para toda la tabla, como en las listas: se repuebla al apuntar a otra fila. */
  private readonly menuTarget = signal<FilaDeHorario | null>(null);
  protected readonly menuOpen = signal(false);
  protected readonly menuId = `sc-horario-filas-menu-${++menuIdCounter}`;
  protected esLaDelMenu(fila: FilaDeHorario): boolean {
    return this.menuTarget() === fila;
  }
  protected readonly menuItems = computed<MenuItem[]>(() => {
    this.lang();
    const fila = this.menuTarget();
    if (!fila) return [];
    return [
      { label: this.translate.instant('common.edit'), icon: 'sc-icon-font sc-icon-font--edit', command: () => this.abrir.emit(fila.id) },
      { separator: true },
      {
        // Sin puntos suspensivos: quita en el acto, y Deshacer lo devuelve hasta que se guarda.
        label: this.translate.instant('common.delete'),
        icon: 'sc-icon-font sc-icon-font--delete',
        styleClass: 'sc-menu-item--danger',
        command: () => this.eliminar.emit(fila.id),
      },
    ];
  });

  protected openMenu(fila: FilaDeHorario, menu: { toggle: (event: Event) => void }, event: Event): void {
    event.stopPropagation();
    this.menuTarget.set(fila);
    menu.toggle(event);
  }

  /** El clic derecho abre el mismo menú que el «⋮». */
  protected onRowContextMenu(event: ScDatatableRowEvent<FilaDeHorario>, menu: { toggle: (event: Event) => void }): void {
    this.menuTarget.set(event.row);
    menu.toggle(event.originalEvent);
  }
}

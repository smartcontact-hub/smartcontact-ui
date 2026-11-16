import { ChangeDetectionStrategy, Component, computed, inject, type TemplateRef, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { type MenuItem } from 'primeng/api';
import { type GroupRef, type ScColumnCellContext, type ScColumnDef, ScButtonComponent, ScGroupPopoverComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { ResultadoAccionService } from '@core/services/resultado-accion.service';
import { CeldaVaciaComponent, ListPageComponent } from '@shared/components';
import { type Horario, resumenDeSemana, usosDe } from './cal-modelo';
import { CalSemanaComponent } from './cal-semana.component';
import { CalStore } from './cal-store';

interface Fila extends Horario {
  readonly resumen: string;
  readonly usos: readonly GroupRef[];
}

/**
 * PROTOTIPO DE DISCOVERY: la lista de horarios. Un horario es solo una semana tipo; la lista dice cómo es y en cuántos
 * calendarios se usa, y nada de fechas: eso es del calendario.
 */
@Component({
  selector: 'sc-cal-horarios-lista',
  imports: [CalSemanaComponent, CeldaVaciaComponent, ListPageComponent, ScButtonComponent, ScGroupPopoverComponent, ScIconComponent],
  template: `
    <ng-template #acciones>
      <sc-button class="top-bar__cta" variant="primary" (clicked)="crear()">
        <sc-icon name="add" size="inherit" />
        <span>Nuevo horario</span>
      </sc-button>
    </ng-template>

    <sc-list-page
      heading="Horarios"
      [rows]="filas()"
      [columns]="columnas()"
      searchPlaceholder="Buscar horarios"
      [searchFn]="buscar"
      [sortFn]="ordenar"
      [rowMenu]="menu"
      rowOpenable
      tableTestId="cal-horarios"
      (rowOpen)="abrir($event)"
    />

    <ng-template #nombreTpl let-h>
      <span class="sc-text-body-semibold">{{ h.nombre }}</span>
    </ng-template>
    <ng-template #semanaTpl let-h>
      <sc-cal-semana class="mini" compacta [semana]="h.semana" />
    </ng-template>
    <ng-template #resumenTpl let-h>
      <span class="sc-text-body-regular">{{ h.resumen }}</span>
    </ng-template>
    <ng-template #usosTpl let-h>
      @if (h.usos.length) {
        <sc-group-popover display="count" [groups]="h.usos" [countAriaLabel]="'Se usa en ' + h.usos.length + ' calendarios'" />
      } @else {
        <sc-celda-vacia />
      }
    </ng-template>
  `,
  styles: `
    :host { display: block; height: 100%; }
    .mini { inline-size: 12rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalHorariosListaComponent {
  private readonly store = inject(CalStore);
  private readonly router = inject(Router);
  private readonly resultado = inject(ResultadoAccionService);

  private readonly acciones = viewChild<TemplateRef<unknown>>('acciones');

  constructor() {
    useTopbarActions(this.acciones);
  }

  protected readonly filas = computed<Fila[]>(() => {
    const e = this.store.estado();
    return this.store.horarios().map((h) => ({
      ...h,
      resumen: resumenDeSemana(h.semana),
      usos: usosDe(e, h.id).map((c) => ({ id: c.id, name: c.nombre, active: true })),
    }));
  });

  private readonly nombreTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('nombreTpl');
  private readonly semanaTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('semanaTpl');
  private readonly resumenTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('resumenTpl');
  private readonly usosTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('usosTpl');

  protected readonly columnas = computed<readonly ScColumnDef<Fila>[]>(() => [
    { field: 'nombre', header: 'Nombre', sortable: true, cellTemplate: this.nombreTpl() },
    { field: 'semana', header: 'Semana', cellTemplate: this.semanaTpl(), width: '12rem' },
    { field: 'resumen', header: 'Horas', cellTemplate: this.resumenTpl() },
    { field: 'usos', header: 'Se usa en', sortable: true, cellTemplate: this.usosTpl(), width: '9rem' },
  ]);

  protected readonly buscar = (h: Fila, q: string): boolean => [h.nombre, h.resumen, ...h.usos.map((u) => u.name)].some((v) => v.toLowerCase().includes(q));

  protected readonly ordenar = (a: Fila, b: Fila, campo: string): number =>
    campo === 'usos' ? a.usos.length - b.usos.length : a.nombre.localeCompare(b.nombre, 'es');

  protected readonly menu = (h: Fila): MenuItem[] => [
    { label: 'Editar', icon: 'sc-icon-font sc-icon-font--edit', command: () => this.abrir(h) },
    {
      label: 'Duplicar',
      icon: 'sc-icon-font sc-icon-font--content_copy',
      command: () => {
        const c = this.store.copiarHorario(h);
        this.resultado.contar(`Horario «${c.nombre}» creado`);
      },
    },
    {
      label: 'Eliminar',
      icon: 'sc-icon-font sc-icon-font--delete',
      disabled: h.usos.length > 0,
      command: () => {
        this.store.borrarHorario(h.id);
        this.resultado.contar(`Horario «${h.nombre}» eliminado`);
      },
    },
  ];

  protected crear(): void {
    void this.router.navigateByUrl('/admin/semanas/crear');
  }

  protected abrir(h: Fila): void {
    void this.router.navigateByUrl(`/admin/semanas/editar/${h.id}`);
  }
}

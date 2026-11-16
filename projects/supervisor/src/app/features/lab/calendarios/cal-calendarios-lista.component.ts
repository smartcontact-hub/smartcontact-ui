import { ChangeDetectionStrategy, Component, computed, inject, signal, type TemplateRef, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { type MenuItem } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { type GroupRef, type ScColumnCellContext, type ScColumnDef, ScButtonComponent, ScGroupPopoverComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { ResultadoAccionService } from '@core/services/resultado-accion.service';
import { CeldaVaciaComponent, ListPageComponent } from '@shared/components';
import { CalFestivoDialogoComponent } from './cal-festivo-dialogo.component';
import { ahoraEn, type Calendario, mesDiaCorto, type Semana, ubicacion } from './cal-modelo';
import { CalSemanaComponent } from './cal-semana.component';
import { CalStore } from './cal-store';

interface Fila extends Calendario {
  readonly ahora: { abierto: boolean; texto: string };
  readonly horarioNombre: string;
  readonly semana: Semana | null;
  readonly periodosTexto: string;
  readonly festivosDe: string;
  readonly especialesN: number;
  readonly lo: readonly GroupRef[];
}

/**
 * PROTOTIPO DE DISCOVERY: la lista de calendarios. Es lo que busca posventa (no los horarios): cada calendario con si
 * ahora atiende, qué horario lleva, de dónde son sus festivos y qué servicios lo usan. Arriba, el atajo «Nuevo
 * festivo», el mismo en A y en B.
 */
@Component({
  selector: 'sc-cal-calendarios-lista',
  imports: [CalFestivoDialogoComponent, CalSemanaComponent, CeldaVaciaComponent, ListPageComponent, ScButtonComponent, ScGroupPopoverComponent, ScIconComponent, TooltipModule],
  template: `
    <ng-template #acciones>
      <sc-button class="top-bar__cta" variant="secondary" appearance="outlined" icon="add" label="Nuevo festivo" (clicked)="festivo.set(true)" />
      <sc-button class="top-bar__cta" variant="primary" (clicked)="crear()">
        <sc-icon name="add" size="inherit" />
        <span>Nuevo calendario</span>
      </sc-button>
    </ng-template>

    <sc-list-page
      heading="Calendarios"
      [rows]="filas()"
      [columns]="columnas()"
      searchPlaceholder="Buscar calendarios"
      [searchFn]="buscar"
      [sortFn]="ordenar"
      [rowMenu]="menu"
      rowOpenable
      tableTestId="cal-calendarios"
      (rowOpen)="abrir($event)"
    />

    <ng-template #nombreTpl let-c>
      <span class="celda sc-text-body-semibold">{{ c.nombre }}</span>
    </ng-template>
    <ng-template #ahoraTpl let-c>
      <span class="ahora sc-text-body-regular" [class.ahora--abierto]="c.ahora.abierto">{{ c.ahora.texto }}</span>
    </ng-template>
    <ng-template #semanaTpl let-c>
      @if (c.semana) {
        <sc-cal-semana class="mini" compacta [semana]="c.semana" />
      }
    </ng-template>
    <ng-template #horarioTpl let-c>
      <span class="celda celda--dos">
        <span class="sc-text-body-regular">{{ c.horarioNombre }}</span>
        @if (c.periodosTexto) {
          <span class="celda__pista sc-text-caption-regular">{{ c.periodosTexto }}</span>
        }
      </span>
    </ng-template>
    <ng-template #festivosTpl let-c>
      @if (c.festivosDe) {
        <span class="celda sc-text-body-regular">{{ c.festivosDe }}</span>
      } @else {
        <sc-celda-vacia />
      }
    </ng-template>
    <ng-template #especialesTpl let-c>
      @if (c.especialesN) {
        <span class="celda sc-text-body-regular">{{ c.especialesN }}</span>
      } @else {
        <sc-celda-vacia />
      }
    </ng-template>
    <ng-template #usanTpl let-c>
      <sc-group-popover display="adaptive" [groups]="c.lo" [countAriaLabel]="c.lo.length + ' servicios'" />
    </ng-template>

    @if (festivo()) {
      <sc-cal-festivo-dialogo (cerrado)="festivo.set(false)" />
    }
  `,
  styles: `
    :host { display: block; height: 100%; }
    .celda--dos { display: flex; flex-direction: column; }
    .celda__pista { color: var(--sc-text-secondary); }
    /* Código de color, sin punto: verde si atiende, gris si no. */
    .ahora { color: var(--sc-text-subtle); }
    .ahora--abierto { color: var(--sc-text-success); font-weight: 600; }
    .mini { display: block; inline-size: 10rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalCalendariosListaComponent {
  private readonly store = inject(CalStore);
  private readonly router = inject(Router);
  private readonly resultado = inject(ResultadoAccionService);
  protected readonly festivo = signal(false);

  private readonly acciones = viewChild<TemplateRef<unknown>>('acciones');

  constructor() {
    useTopbarActions(this.acciones);
  }

  protected readonly filas = computed<Fila[]>(() => {
    const estado = this.store.estado();
    return this.store.calendarios().map((c) => ({
      ...c,
      ahora: ahoraEn(estado, c),
      horarioNombre: this.store.horario(c.horarioId)?.nombre ?? 'Sin horario',
      semana: this.store.horario(c.horarioId)?.semana ?? null,
      periodosTexto: c.periodos.map((p) => `${p.nombre}: ${this.store.horario(p.horarioId)?.nombre ?? ''}, ${mesDiaCorto(p.desde)} a ${mesDiaCorto(p.hasta)}`).join('; '),
      festivosDe: ubicacion(c.ubicacion)?.etiqueta ?? '',
      especialesN: estado.especiales.filter((e) => e.calendarioIds.includes(c.id)).length,
      lo: c.servicios.map((s, i) => ({ id: i + 1, name: s, active: true })),
    }));
  });

  private readonly nombreTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('nombreTpl');
  private readonly ahoraTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('ahoraTpl');
  private readonly semanaTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('semanaTpl');
  private readonly horarioTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('horarioTpl');
  private readonly festivosTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('festivosTpl');
  private readonly especialesTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('especialesTpl');
  private readonly usanTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('usanTpl');

  protected readonly columnas = computed<readonly ScColumnDef<Fila>[]>(() => [
    { field: 'nombre', header: 'Nombre', sortable: true, cellTemplate: this.nombreTpl() },
    { field: 'ahora', header: 'Ahora', sortable: true, cellTemplate: this.ahoraTpl(), width: '13rem' },
    { field: 'semana', header: 'Semana', cellTemplate: this.semanaTpl(), width: '12rem' },
    { field: 'horario', header: 'Horario', cellTemplate: this.horarioTpl() },
    { field: 'festivos', header: 'Festivos de', sortable: true, cellTemplate: this.festivosTpl(), width: '15rem' },
    { field: 'especiales', header: 'Días especiales', sortable: true, cellTemplate: this.especialesTpl(), width: '9rem' },
    { field: 'usan', header: 'Lo usan', cellTemplate: this.usanTpl(), width: '9rem' },
  ]);

  protected readonly buscar = (c: Fila, q: string): boolean =>
    [c.nombre, c.horarioNombre, c.periodosTexto, c.festivosDe, ...c.servicios].some((v) => v.toLowerCase().includes(q));

  protected readonly ordenar = (a: Fila, b: Fila, campo: string): number => {
    switch (campo) {
      case 'ahora':
        return Number(b.ahora.abierto) - Number(a.ahora.abierto);
      case 'festivos':
        return a.festivosDe.localeCompare(b.festivosDe, 'es');
      case 'especiales':
        return a.especialesN - b.especialesN;
      default:
        return a.nombre.localeCompare(b.nombre, 'es');
    }
  };

  protected readonly menu = (c: Fila): MenuItem[] => [
    { label: 'Editar', icon: 'sc-icon-font sc-icon-font--edit', command: () => this.abrir(c) },
    {
      label: 'Eliminar',
      icon: 'sc-icon-font sc-icon-font--delete',
      command: () => {
        this.store.borrarCalendario(c.id);
        this.resultado.contar(`Calendario «${c.nombre}» eliminado`);
      },
    },
  ];

  protected crear(): void {
    void this.router.navigateByUrl('/admin/calendarios/crear');
  }

  protected abrir(c: Fila): void {
    void this.router.navigateByUrl(`/admin/calendarios/editar/${c.id}`);
  }
}

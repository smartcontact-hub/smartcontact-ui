import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, type TemplateRef, viewChild } from '@angular/core';
import { ScTagComponent, type ScColumnCellContext } from '@smartcontact-hub/components';
import { TooltipModule } from 'primeng/tooltip';

import { RepoListPageComponent } from '@features/admin/repositories/components/repo-list-page.component';
import type { RepoPageConfig } from '@features/admin/repositories/components/repo-types';
import { HorarioUsoService } from '@features/admin/repositories/state/horario-uso.service';
import { type Horario, HorariosStore } from '@features/admin/repositories/state/horarios.store';

import { estadoDeHorario } from '../horarios/lab-horarios-estado';
import { AplicadoEn, sitios, TIPOS_DE_USO, type Uso } from './tp-aplicado';
import { descripcionDe, soloSemana, trozosDelDia } from './tp-modelo';

/** Cuántas etiquetas caben en la celda antes del «+N». */
const A_LA_VISTA = 2;

/**
 * CIERRE DE HORARIOS: la lista de horarios, en la MISMA tabla que el resto de Repositorios (`sc-repo-list-page`): buscar,
 * columnas, exportar, duplicar y eliminar funcionan igual que en Agendas o Tipificaciones. Lo que cambia son sus
 * columnas: la semana en miniatura (verde se atiende, rojo no) con la descripción que se escribe sola, si ahora se
 * atiende, y dónde se aplica, en etiquetas por tipo. Periodos y días especiales ya no son del horario: son del calendario.
 */
@Component({
  selector: 'sc-tp-lista',
  imports: [RepoListPageComponent, ScTagComponent, TooltipModule],
  template: `
    <sc-repo-list-page [config]="config" [store]="store" [cellTemplates]="celdas()" />

    <ng-template #horarioTpl let-h>
      <span class="tl-horario">
        <span class="tl-mini" role="img" [attr.aria-label]="descripcion(h)">
          @for (d of mini(h); track d.dia) {
            <span class="tl-mini__dia">
              @for (t of d.trozos; track $index) {
                <i [style.inset-inline-start.%]="(t.desde / 1440) * 100" [style.inline-size.%]="((t.hasta - t.desde) / 1440) * 100"></i>
              }
            </span>
          }
        </span>
        <span class="tl-horario__txt sc-text-body-regular" [pTooltip]="descripcion(h)" showOnEllipsis tooltipPosition="top">{{ descripcion(h) }}</span>
      </span>
    </ng-template>

    <ng-template #aplicadoTpl let-h>
      @if (usos(h); as u) {
        @if (u.length === 0) {
          <span class="tl-libre sc-text-body-regular">Sin usar</span>
        } @else {
          <span class="tl-usos">
            @for (x of u.slice(0, aLaVista); track x.tipo + x.nombre + x.detalle) {
              <sc-tag variant="label" [labelColor]="tipos[x.tipo].color" [value]="x.nombre" [pTooltip]="tipos[x.tipo].uno + ': ' + x.detalle" tooltipPosition="top" />
            }
            @if (u.length > aLaVista) {
              <sc-tag class="tl-mas" variant="label" labelColor="gray" [value]="'+' + (u.length - aLaVista)" [pTooltip]="resto(u)" tooltipPosition="top" />
            }
          </span>
        }
      }
    </ng-template>
  `,
  styles: `
    .tl-horario {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-0-75);
      min-inline-size: 0;
      max-inline-size: 100%;
    }
    .tl-horario__txt {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-variant-numeric: tabular-nums;
    }
    /* La semana en miniatura: siete rayas de 24 h, lunes arriba; verde lo que se atiende y rojo lo que no. */
    .tl-mini {
      display: flex;
      flex: none;
      flex-direction: column;
      gap: 1px;
      inline-size: 3.5rem;
      padding: 2px;
      border-radius: var(--sc-radius-100);
      background: var(--sc-bg-subtle);
    }
    .tl-mini__dia {
      position: relative;
      display: block;
      block-size: 2px;
      border-radius: 1px;
      background: color-mix(in srgb, var(--sc-bg-danger) 22%, transparent);
      overflow: hidden;
    }
    .tl-mini__dia i {
      position: absolute;
      inset-block: 0;
      background: var(--sc-bg-success);
    }
    .tl-usos {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-0-25);
      min-inline-size: 0;
      max-inline-size: 100%;
    }
    /* Si no caben, las etiquetas se acortan (con su nombre entero al pasar) y el «+N» se queda entero. */
    .tl-usos > sc-tag {
      min-inline-size: 0;
      flex: 0 1 auto;
    }
    .tl-usos > sc-tag.tl-mas {
      flex: none;
    }
    .tl-libre {
      color: var(--sc-text-subtle);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpListaPage {
  protected readonly store = inject(HorariosStore);
  private readonly aplicado = inject(AplicadoEn);
  private readonly uso = inject(HorarioUsoService);

  protected readonly tipos = TIPOS_DE_USO;
  protected readonly aLaVista = A_LA_VISTA;

  /** El reloj: «ahora» se recalcula cada 30 s. */
  private readonly reloj = signal(new Date());
  constructor() {
    const id = setInterval(() => this.reloj.set(new Date()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  private readonly horarioTpl = viewChild<TemplateRef<ScColumnCellContext<Horario>>>('horarioTpl');
  private readonly aplicadoTpl = viewChild<TemplateRef<ScColumnCellContext<Horario>>>('aplicadoTpl');
  protected readonly celdas = computed<Readonly<Record<string, TemplateRef<ScColumnCellContext<Horario>>>>>(() => {
    const horario = this.horarioTpl();
    const aplicado = this.aplicadoTpl();
    const celdas: Record<string, TemplateRef<ScColumnCellContext<Horario>>> = {};
    if (horario) celdas['horario'] = horario;
    if (aplicado) celdas['aplicado'] = aplicado;
    return celdas;
  });

  protected descripcion(h: Horario): string {
    return descripcionDe(h.week);
  }

  protected usos(h: Horario): readonly Uso[] {
    return this.aplicado.de(h.id);
  }

  protected resto(u: readonly Uso[]): string {
    return u
      .slice(A_LA_VISTA)
      .map((x) => `${x.nombre} (${TIPOS_DE_USO[x.tipo].uno.toLowerCase()})`)
      .join(', ');
  }

  protected mini(h: Horario): { dia: number; trozos: { desde: number; hasta: number }[] }[] {
    return [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, trozos: trozosDelDia(h.week, dia) }));
  }

  private estado(h: Horario): ReturnType<typeof estadoDeHorario> {
    return estadoDeHorario(soloSemana(h), [], this.reloj());
  }

  protected readonly config: RepoPageConfig<Horario> = {
    titleKey: 'repositories.horarios.title',
    entitySingularKey: 'repositories.horarios.singular',
    createTitleKey: 'repositories.horarios.create_title',
    entityPluralKey: 'repositories.horarios.plural',
    toastsKey: 'repositories.horarios.toasts',
    simpleDelete: { titleKey: 'repositories.horarios.delete_dialog.title', titleBulkKey: 'repositories.horarios.delete_dialog.title_bulk' },
    icon: 'schedule',
    breadcrumbExtraKey: 'repositories.horarios.title',
    columns: [
      { key: 'name', labelKey: 'repositories.columns.name', kind: 'text', accessor: (h) => h.name, emphasis: true, sortable: true, width: '200px' },
      // La celda es un dibujo y un texto; buscar, ordenar y exportar leen la descripción.
      { key: 'horario', labelKey: 'repositories.horarios.col_schedule', kind: 'truncate', accessor: (h) => descripcionDe(h.week) },
      {
        key: 'now',
        labelKey: 'repositories.horarios.col_now',
        kind: 'status',
        width: '232px',
        accessor: (h) => this.estado(h).clave,
        statusDetail: (h) => this.estado(h).detalle,
        statusMap: {
          open: { labelKey: 'repositories.horarios.open', tone: 'success' },
          closed: { labelKey: 'repositories.horarios.closed', tone: 'secondary' },
          inactive: { labelKey: 'repositories.horarios.inactive', tone: 'secondary' },
        },
        sortable: true,
      },
      {
        key: 'aplicado',
        labelKey: 'repositories.horarios.col_applied',
        kind: 'text',
        width: '340px',
        accessor: (h) => this.aplicado.de(h.id).map((u) => u.nombre).join(', '),
      },
      { key: 'timezone', labelKey: 'repositories.horarios.timezone', kind: 'text', accessor: (h) => h.timezone, width: '176px', sortable: true },
    ],
    fields: [{ key: 'name', labelKey: 'repositories.columns.name', type: 'text', required: true, placeholderKey: 'repositories.horarios.name_placeholder' }],
    searchKeys: ['name', 'timezone', 'description'],
    filePrefix: 'horarios-cierre',
    sheetNameKey: 'repositories.horarios.title',
    // Eliminar dice dónde se aplica, con los mismos sitios que la columna; los grupos que lo tenían vuelven a «Siempre».
    uso: {
      aviso: (ids) => {
        const usos = ids.flatMap((id) => this.aplicado.de(id));
        return usos.length ? `Se aplica en ${sitios(usos.length)}: ${usos.map((u) => u.nombre).join(', ')}. Al eliminarlo dejarán de tenerlo.` : null;
      },
      soltar: (ids) => this.uso.soltar(ids),
    },
    editRoute: '/lab/tiempo/horario',
    duplicable: true,
    duplicateAsCreate: true,
    columnChoices: true,
  };
}

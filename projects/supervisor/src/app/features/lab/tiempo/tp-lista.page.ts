import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, type TemplateRef, viewChild, ViewEncapsulation } from '@angular/core';
import { ScTagComponent, type ScColumnCellContext } from '@smartcontact-hub/components';
import { TooltipModule } from 'primeng/tooltip';

import { RepoListPageComponent } from '@features/admin/repositories/components/repo-list-page.component';
import type { RepoPageConfig } from '@features/admin/repositories/components/repo-types';
import { HorarioUsoService } from '@features/admin/repositories/state/horario-uso.service';
import { type Horario, HorariosStore } from '@features/admin/repositories/state/horarios.store';

import { estadoDeHorario } from '../horarios/lab-horarios-estado';
import { AplicadoEn, sitios, TIPOS_DE_USO, type Uso } from './tp-aplicado';
import { capital, descripcionDe, horaCorta, NOMBRES, resumenDe, soloSemana } from './tp-modelo';

/** Cuántas etiquetas caben en la celda antes del «+N». */
const A_LA_VISTA = 2;
/** Cuántas franjas de un día dice el globo; el resto, «y N más» (el editor las enseña todas). */
const POR_DIA = 4;

/**
 * CIERRE DE HORARIOS: la lista de horarios, en la MISMA tabla que el resto de Repositorios (`sc-repo-list-page`): buscar,
 * columnas, exportar, duplicar y eliminar funcionan igual que en Agendas o Tipificaciones. A la vista, lo que se busca
 * al entrar: nombre, descripción y el horario por grupos de días (cada grupo con sus horas; el detalle por día, al
 * pasar). Si ahora se atiende, la zona horaria y dónde se aplica esperan en «Columnas».
 */
@Component({
  selector: 'sc-tp-lista',
  imports: [RepoListPageComponent, ScTagComponent, TooltipModule],
  template: `
    <sc-repo-list-page [config]="config" [store]="store" [cellTemplates]="celdas()" />

    <ng-template #horarioTpl let-h>
      @if (grupos(h); as gs) {
        @if (gs.length === 0) {
          <span class="tl-cerrado sc-text-body-regular">Cerrado toda la semana</span>
        } @else {
          <!-- El detalle por día, al pasar o al llegar con el teclado; el «+N» solo dice que hay más (la fila abre el horario). -->
          <span class="tl-sched" role="note" tabindex="0" [pTooltip]="tip" tooltipPosition="top" tooltipEvent="both" tooltipStyleClass="tl-sched-tooltip" [attr.aria-label]="descripcion(h)">
            @for (g of gs.slice(0, aLaVista); track $index) {
              <span class="tl-sched__grupo">
                <sc-tag severity="info" [value]="g.dias" />
                <span class="tl-sched__horas sc-text-caption-regular">{{ g.horas.join(', ') }}</span>
              </span>
            }
            @if (gs.length > aLaVista) {
              <span class="tl-sched__mas sc-text-caption-semibold">+{{ gs.length - aLaVista }}</span>
            }
          </span>
          <ng-template #tip>
            <div class="tl-tip">
              @for (d of porDia(h); track d.nombre) {
                <span class="tl-tip__dia">{{ d.nombre }}</span>
                <span class="tl-tip__horas" [class.is-cerrado]="d.cerrado">
                  @for (f of d.franjas; track $index; let ultima = $last) {
                    <span class="tl-tip__franja">{{ f }}</span>{{ ultima ? '' : ', ' }}
                  } @empty {
                    Cerrado
                  }
                  @if (d.mas) {
                    y {{ d.mas }} más
                  }
                </span>
              }
            </div>
          </ng-template>
        }
      }
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
              <sc-tag class="tl-mas" variant="label" labelColor="gray" [value]="'+' + (u.length - aLaVista)" [pTooltip]="restoDeUsos(u)" tooltipPosition="top" />
            }
          </span>
        }
      }
    </ng-template>
  `,
  styles: `
    /* El horario por grupos de días: cada grupo, su etiqueta y sus horas; con un mínimo para que no se apriete y un
       máximo para que un grupo con muchas franjas no se coma la celda (el resto, al pasar). */
    .tl-sched {
      display: inline-flex;
      align-items: center;
      gap: var(--sc-spacing-1);
      min-inline-size: 0;
      max-inline-size: 100%;
      white-space: nowrap;
    }
    .tl-sched__grupo {
      display: inline-flex;
      align-items: center;
      gap: var(--sc-spacing-0-5);
      min-inline-size: 7rem;
      max-inline-size: 10.5rem;
      overflow: hidden;
    }
    .tl-sched__grupo > sc-tag {
      flex: none;
    }
    .tl-sched__horas {
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--sc-text-secondary);
      font-variant-numeric: tabular-nums;
    }
    .tl-sched__mas {
      flex: none;
      padding: var(--sc-spacing-0-125) var(--sc-spacing-0-5);
      border: 1px solid var(--sc-border-default);
      border-radius: var(--sc-radius-full);
      background: var(--sc-bg-surface);
      color: var(--sc-text-primary);
      font-variant-numeric: tabular-nums;
    }
    .tl-sched:focus-visible {
      outline: 2px solid var(--sc-border-focus);
      outline-offset: 2px;
      border-radius: var(--sc-radius-sm);
    }
    /* El detalle por día, en el globo: el día y sus horas, que se parten en líneas; «Cerrado», atenuado. */
    .tl-tip {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--sc-spacing-0-25) var(--sc-spacing-0-75);
      font-variant-numeric: tabular-nums;
    }
    .tl-tip__dia {
      white-space: nowrap;
    }
    .tl-tip__horas {
      text-align: end;
    }
    .tl-tip__horas.is-cerrado {
      opacity: 0.6;
    }
    /* Una franja no se parte por su guion: el salto de línea va entre franjas. */
    .tl-tip__franja {
      white-space: nowrap;
    }
    /* El globo del DS es estrecho para una semana con horas: este, algo más ancho (el globo cuelga del body). */
    .p-tooltip.tl-sched-tooltip {
      max-inline-size: 20rem;
    }
    .tl-cerrado,
    .tl-libre {
      color: var(--sc-text-subtle);
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
  `,
  // Sin encapsular: el globo del horario cuelga del body. Todo va con el prefijo `tl-`, que no sale de esta lista.
  encapsulation: ViewEncapsulation.None,
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

  /** Los grupos de días con sus horas, como en la cabecera del editor: «L–V 9:00–14:00, 16:00–19:00». */
  protected grupos(h: Horario): ReturnType<typeof resumenDe> {
    return resumenDe(h.week);
  }

  /** Lo que dice la celda, para el lector: «L–V 9:00–18:00, S 10:00–14:00». */
  protected descripcion(h: Horario): string {
    return descripcionDe(h.week);
  }

  /** El detalle por día, para el globo: cada día con sus franjas (cuatro como mucho, y «y N más»), o «Cerrado». */
  protected porDia(h: Horario): { nombre: string; franjas: string[]; mas: number; cerrado: boolean }[] {
    return NOMBRES.map((n, d) => {
      const fs = (h.week[d] ?? []).map((f) => `${horaCorta(f[0])}–${horaCorta(f[1])}`);
      return { nombre: capital(n), franjas: fs.slice(0, POR_DIA), mas: Math.max(0, fs.length - POR_DIA), cerrado: !fs.length };
    });
  }

  protected usos(h: Horario): readonly Uso[] {
    return this.aplicado.de(h.id);
  }

  protected restoDeUsos(u: readonly Uso[]): string {
    return u
      .slice(A_LA_VISTA)
      .map((x) => `${x.nombre} (${TIPOS_DE_USO[x.tipo].uno.toLowerCase()})`)
      .join(', ');
  }

  private estado(h: Horario): ReturnType<typeof estadoDeHorario> {
    // Sin «Inactivo»: lo que no se usa ya lo dice «Aplicado en» («Sin usar»); el estado guardado no cuenta (ver el editor).
    return estadoDeHorario({ ...soloSemana(h), status: 'active' }, [], this.reloj());
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
      { key: 'name', labelKey: 'repositories.columns.name', kind: 'text', accessor: (h) => h.name, emphasis: true, sortable: true },
      { key: 'description', labelKey: 'repositories.columns.description', kind: 'truncate', accessor: (h) => h.description ?? '', sortable: true, emptyDash: true },
      // La celda es un dibujo; buscar, ordenar y exportar leen la descripción de la semana.
      { key: 'horario', labelKey: 'repositories.horarios.col_schedule', kind: 'text', width: '360px', accessor: (h) => descripcionDe(h.week) },
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
        },
        sortable: true,
        defaultVisible: false,
      },
      { key: 'timezone', labelKey: 'repositories.horarios.timezone', kind: 'text', accessor: (h) => h.timezone, width: '176px', sortable: true, defaultVisible: false },
      {
        key: 'aplicado',
        labelKey: 'repositories.horarios.col_applied',
        kind: 'text',
        width: '340px',
        accessor: (h) => this.aplicado.de(h.id).map((u) => u.nombre).join(', '),
        defaultVisible: false,
      },
    ],
    fields: [{ key: 'name', labelKey: 'repositories.columns.name', type: 'text', required: true, placeholderKey: 'repositories.horarios.name_placeholder' }],
    searchKeys: ['name', 'timezone', 'description'],
    filePrefix: 'horarios',
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

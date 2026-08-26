import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ScBadgeComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { AgentStateService } from '../../agent-state.service';
import { CALLS, PENDING, type CallRow, type PendingRow } from '../../data/seed';

type Tab = 'historial' | 'pendientes';

/**
 * Panel central del Agent: pestañas Historial / Pendientes sobre la tabla.
 *
 * «Pendientes» es el visor de conversaciones perdidas del grupo (SISMAC-3780).
 * Igual que en la app real, el contador de la pestaña es un 'sc-badge' del
 * Design System, y el icono de cada fila codifica canal x resultado x direccion
 * (ver 'iconFor'): el color es dato, no estilo.
 */
@Component({
  selector: 'app-call-table',
  standalone: true,
  imports: [ScBadgeComponent, ScIconComponent],
  template: `
    <div class="tabs" role="tablist">
      <button
        type="button"
        role="tab"
        [class.active]="tab() === 'historial'"
        [attr.aria-selected]="tab() === 'historial'"
        (click)="tab.set('historial')"
      >
        <span class="tab__label">Historial</span>
      </button>
      <button
        type="button"
        role="tab"
        [class.active]="tab() === 'pendientes'"
        [attr.aria-selected]="tab() === 'pendientes'"
        (click)="tab.set('pendientes')"
      >
        <span class="tab__label">Pendientes</span>
        <sc-badge
          class="tab__counter"
          variant="danger"
          size="md"
          [label]="pendingCount()"
        />
      </button>
    </div>

    @if (tab() === 'historial') {
    <div class="scroller">
      <table class="tbl">
        <thead>
          <tr>
            <th class="col-dir"></th>
            <th>Fecha</th>
            <th>Número</th>
            <th>Grupo</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Atención/Esp.</th>
            <th>Tipificación</th>
            <th class="col-com">Comentarios</th>
          </tr>
        </thead>
        <tbody>
          @for (r of calls; track r.id) {
          <tr>
            <td
              class="col-dir"
              [class.st-lost]="r.outcome === 'lost'"
              [class.st-expired]="r.outcome === 'expired'"
            >
              <img
                class="dir"
                [class.is-expired]="r.outcome === 'expired'"
                [src]="iconFor(r)"
                [alt]="altFor(r)"
                width="22.93"
                height="11.46"
              />
            </td>
            <td>{{ r.date }}</td>
            <td>{{ r.number }}</td>
            <td>{{ r.group }}</td>
            <td>{{ r.origin }}</td>
            <td>{{ r.destination }}</td>
            <td class="col-sw">
              <span class="sw__a">{{ r.support }}</span>
              <span class="sw__b" [class.sw__b--over]="r.waitOver">{{
                r.wait
              }}</span>
            </td>
            <td class="muted">{{ r.categorization }}</td>
            <td class="muted col-com">{{ r.comments }}</td>
          </tr>
          }
        </tbody>
      </table>
    </div>
    } @else {
    <div class="scroller">
      <table class="tbl">
        <thead>
          <tr>
            <th class="col-dir"></th>
            <th>Fecha</th>
            <th>Número</th>
            <th>Grupo</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Atención/Esp.</th>
            <th>Estado</th>
            <th class="col-com">Gestionada por</th>
          </tr>
        </thead>
        <tbody>
          @for (r of pendingView(); track r.id) {
          <tr [class.managed]="stateOf(r) === 'managed'">
            <td class="col-dir" [class.st-lost]="r.outcome === 'lost'">
              <img
                class="dir"
                [src]="iconFor(r)"
                [alt]="altFor(r)"
                width="22.93"
                height="11.46"
              />
            </td>
            <td>{{ r.date }}</td>
            <td>{{ r.number }}</td>
            <td>{{ r.group }}</td>
            <td>{{ r.origin }}</td>
            <td>{{ r.destination }}</td>
            <td class="col-sw">
              <span class="sw__a">{{ r.support }}</span>
              <span class="sw__b" [class.sw__b--over]="r.waitOver">{{
                r.wait
              }}</span>
            </td>
            <td>
              @if (stateOf(r) === 'pending') {
              <button class="manage" type="button" (click)="manage(r)">
                Gestionar
              </button>
              } @else {
              <span
                class="state"
                [class.state--managed]="stateOf(r) === 'managed'"
              >
                <sc-icon
                  [name]="stateOf(r) === 'managed' ? 'check' : 'autorenew'"
                  [size]="12"
                />
                {{ stateOf(r) === 'managed' ? 'Gestionada' : 'En gestión' }}
              </span>
              }
            </td>
            <td class="muted col-com">{{ managedByOf(r) }}</td>
          </tr>
          }
        </tbody>
      </table>
    </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }
    /* Las pestañas no se van con el scroll. */
    .tabs {
      flex: none;
    }
    /* Solo scrollea el listado; la cabecera de columnas se queda pegada arriba. */
    .scroller {
      flex: 1;
      min-height: 0;
      overflow: auto;
    }
    thead th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: var(--ag-list);
    }
    /*
     * La tabla NO es monocroma en el original: la cabecera va sobre
     * --modeTableHeadBackground (#1f2429) y el CUERPO sobre --modeTableBodyBackground
     * (#24292f), que es más claro. Aquí las filas no tenían fondo propio y heredaban el
     * del panel, así que todo salía del mismo color.
     */
    tbody td {
      background: var(--ag-body);
    }

    /* Barra de pestañas: 37px de alto en el real a 1623 → 33.2px a la escala de sc-agent. */
    .tabs {
      display: flex;
      align-items: stretch;
      gap: 1.648352vw;
      height: 2.28022vw;
      padding: 0 1.043957vw;
      background: var(--ag-list);
      border-bottom: 0.034341vw solid var(--ag-head-line);
    }
    .tabs button {
      display: inline-flex;
      align-items: center;
      gap: 0.412088vw;
      padding: 0;
      border: 0;
      border-bottom: 0.137363vw solid transparent;
      background: none;
      color: var(--ag-thead);
      font-family: inherit;
      font-size: 0.728022vw;
      font-weight: 600;
      cursor: pointer;
    }
    .tabs button.active {
      color: var(--ag-text);
      border-bottom-color: var(--ag-thead);
    }
    .tabs button:focus-visible {
      outline: 2px solid var(--ag-text);
      outline-offset: 2px;
    }
    /*
     * El contador es un sc-badge del DS. La app real le pasa shape="circle",
     * un input que el DS de este repo NO tiene, así que el círculo se fuerza aquí.
     */
    .tab__counter {
      display: inline-flex;
    }
    .tab__counter ::ng-deep .p-badge {
      /*
       * El real: texto BLANCO sobre #ef4444. La variante danger del DS saca el texto
       * oscuro y un rojo un tono más claro (#f87171), así que aquí se fija al del real.
       */
      background: #ef4444;
      color: #fff;
      font-weight: 700;
      min-width: 1.047391vw;
      width: 1.047391vw;
      height: 1.047391vw;
      padding: 0;
      border-radius: 50%;
      font-size: 0.521979vw;
      line-height: 1.047391vw;
    }

    .tbl {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.803572vw;
    }
    thead th {
      height: 2.335165vw;
      text-align: left;
      font-weight: 400;
      color: var(--ag-thead);
      padding: 0 0.978709vw;
      border-bottom: 1px solid var(--ag-head-line);
      white-space: nowrap;
    }
    tbody td {
      height: 2.884616vw;
      color: var(--ag-text);
      padding: 0 0.978709vw;
      border-bottom: 1px solid var(--ag-line-soft);
      vertical-align: middle;
      white-space: nowrap;
    }
    /* Rejilla: separador vertical SOLO en el cuerpo (el thead real no lo tiene). */
    tbody td:not(:last-child) {
      border-right: 1px solid var(--ag-line-soft);
    }
    /*
     * Columna de icono: 2.864vw del real → 41.7px, más la barra de estado
     * (columna .status de 0.261vw en el real → 3.8px) resuelta como inset
     * para no meter una celda extra en la rejilla.
     */
    .col-dir {
      width: 3.125vw;
      padding: 0;
      text-align: center;
    }
    tbody .col-dir.st-lost {
      box-shadow: inset 0.26099vw 0 0 0 #f75454;
    }
    tbody .col-dir.st-expired {
      box-shadow: inset 0.26099vw 0 0 0 #8d939d;
    }
    .col-com {
      width: 32%;
      white-space: normal;
    }
    .muted {
      color: var(--ag-muted);
    }

    /*
     * Icono de dirección + canal: SVG REAL del Agent, servido tal cual.
     * 1.575vw x 0.787vw del real → 22.93 x 11.46 px a la escala de sc-agent (1456).
     * El color NO se toca: verde/rojo/negro es dato (ver CallOutcome).
     */
    .dir {
      display: inline-block;
      width: 1.574863vw;
      height: 0.787088vw;
      vertical-align: middle;
    }
    /* El estado 'expired' en el real pinta el SVG de #8d939d; aquí se aproxima con filtro. */
    .dir.is-expired {
      filter: grayscale(1) brightness(1.35);
    }

    /*
     * Estado ya gestionado / en gestión: en el real es un p-button secundario de
     * tipo texto — gris #9d9fa3, sin fondo, con icono (check / autorenew).
     */
    /*
     * 'tr.lost-managed' del original: la fila entera baja a 0.55 cuando ya se gestionó.
     * Es lo que separa de un vistazo lo hecho de lo que queda por hacer.
     */
    tbody tr.managed {
      opacity: 0.55;
    }
    .state {
      display: inline-flex;
      align-items: center;
      gap: 0.343407vw;
      color: #fff;
      font-size: 0.803572vw;
    }
    /* '.lost-status-button.managed' — gris al 72 %, encima del 55 % de la fila. */
    .state--managed {
      color: var(--ag-thead);
      opacity: 0.72;
    }

    /* Botón «Gestionar» de Pendientes: primario del DS (#0058ff) en el real. */
    .manage {
      padding: 0.274726vw 0.686814vw;
      border: 1px solid #0058ff;
      border-radius: 0.300138vw;
      background: #0058ff;
      color: #fff;
      font-family: inherit;
      font-size: 0.70055vw;
      cursor: pointer;
    }

    /* Support/Wait: 1er tiempo plano + 2º como chip #5f6776 (rojo si supera umbral). */
    .sw__a {
      font-variant-numeric: tabular-nums;
      margin-right: 0.549451vw;
    }
    .sw__b {
      display: inline-block;
      padding: 0.068682vw 0.210852vw;
      border-radius: 0.361264vw;
      background: var(--ag-chip-bg);
      color: var(--ag-chip-text);
      font-variant-numeric: tabular-nums;
    }
    .sw__b--over {
      background: var(--ag-red);
      color: #fff;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallTableComponent {
  protected readonly calls = CALLS;
  protected readonly pending = PENDING;
  protected readonly tab = signal<Tab>('historial');
  private readonly state = inject(AgentStateService);

  /**
   * El contador del badge baja según se gestionan: cuenta las que siguen 'pending'
   * descontando las que este agente ha puesto en gestión o ya ha finalizado.
   */
  protected readonly pendingCount = computed(() =>
    String(
      PENDING.filter(
        (r) =>
          r.state === 'pending' &&
          !this.state.inManagement().includes(r.id) &&
          !this.state.managed().includes(r.id)
      ).length
    )
  );

  /**
   * Orden de la tabla, portado de 'applyLostEventsSort()' del Agent real: primero por
   * BLOQUE —pendiente, en gestión, gestionada— y dentro de cada bloque de más reciente
   * a más antigua. Para las gestionadas la fecha que cuenta es la de gestión, así que
   * la que se acaba de cerrar baja hasta justo encima de la primera ya gestionada, y
   * el bloque de lo hecho queda separado del que queda por hacer.
   */
  protected readonly pendingView = computed(() => {
    const done = this.state.managed();
    const block = (r: PendingRow): number => {
      const st = this.stateOf(r);
      return st === 'pending' ? 0 : st === 'in_management' ? 1 : 2;
    };
    // Cuanto mas tarde se gestionó, mas arriba dentro del bloque de gestionadas.
    const managedRank = (r: PendingRow): number => {
      const i = done.indexOf(r.id);
      return i === -1 ? Number.MAX_SAFE_INTEGER : done.length - 1 - i;
    };
    return [...this.pending]
      .map((r, i) => ({ r, i }))
      .sort((a, b) => {
        const d = block(a.r) - block(b.r);
        if (d !== 0) {
          return d;
        }
        const m = managedRank(a.r) - managedRank(b.r);
        return m !== 0 ? m : a.i - b.i;
      })
      .map((x) => x.r);
  });

  /** Estado efectivo de la fila: el del seed, salvo que el flujo lo haya movido. */
  protected stateOf(r: PendingRow): PendingRow['state'] {
    if (this.state.managed().includes(r.id)) {
      return 'managed';
    }
    if (this.state.inManagement().includes(r.id)) {
      return 'in_management';
    }
    return r.state;
  }

  /** «Gestionar»: carga el origen en el dialpad y abre el Comunicador. */
  protected manage(r: PendingRow): void {
    this.state.manage(r.id, r.origin);
  }

  protected managedByOf(r: PendingRow): string {
    return this.stateOf(r) === r.state ? r.managedBy : 'Rafael_3AED';
  }

  /**
   * Ruta del icono de una fila. Porta la matriz de 'getIcon()' del Agent real:
   * canal x resultado x dirección. 'transferred' (negro) solo existe en chat, y
   * 'mail' no tiene negro — igual que en el original.
   */
  protected iconFor(r: CallRow | PendingRow): string {
    const dir = r.direction === 'in' ? 'entrante' : 'saliente';
    if (r.channel === 'whatsapp') {
      return `icons/historial/whatsapp_${dir}.svg`;
    }
    const folder = r.channel === 'call' ? 'telefono' : r.channel;
    return `icons/historial/${folder}/${this.colorFor(r)}_${dir}.svg`;
  }

  private colorFor(r: CallRow | PendingRow): 'verde' | 'rojo' | 'negro' {
    if (r.outcome === 'transferred' && r.channel === 'chat') {
      return 'negro';
    }
    return r.outcome === 'attended' ? 'verde' : 'rojo';
  }

  protected altFor(r: CallRow | PendingRow): string {
    const dir = r.direction === 'in' ? 'entrante' : 'saliente';
    const state = {
      attended: 'atendida',
      lost: 'perdida',
      transferred: 'transferida',
      expired: 'caducada',
    }[r.outcome];
    return `Conversación ${dir}, ${state}`;
  }
}

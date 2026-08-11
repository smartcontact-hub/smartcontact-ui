import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CALLS } from '../../data/seed';
import { AgIconComponent } from '../ui/app-icon.component';

/** Tabla central de llamadas — rejilla fiel a la web real (dirección + canal, Support/Wait, chips). */
@Component({
  selector: 'app-call-table',
  standalone: true,
  imports: [AgIconComponent],
  template: `
    <table class="tbl">
      <thead>
        <tr>
          <th class="col-dir"></th>
          <th>Date</th>
          <th>Number</th>
          <th>Group</th>
          <th>Origin</th>
          <th>Destination</th>
          <th>Support/Wait.</th>
          <th>Categorization</th>
          <th class="col-com">Comments</th>
        </tr>
      </thead>
      <tbody>
        @for (r of calls; track r.id) {
          <tr [class.is-selected]="r.selected" [class.is-out]="r.direction === 'out'">
            <td class="col-dir">
              <span class="dir">
                <app-icon name="arrow-out" [size]="11" [class.flip]="r.direction !== 'out'" />
                <app-icon [name]="r.channel === 'chat' ? 'chat' : 'phone'" [size]="13" />
              </span>
            </td>
            <td>{{ r.date }}</td>
            <td>{{ r.number }}</td>
            <td>{{ r.group }}</td>
            <td>{{ r.origin }}</td>
            <td>{{ r.destination }}</td>
            <td class="col-sw">
              <span class="sw__a">{{ r.support }}</span>
              <span class="sw__b" [class.sw__b--over]="r.waitOver">{{ r.wait }}</span>
            </td>
            <td class="muted">{{ r.categorization }}</td>
            <td class="muted col-com">{{ r.comments }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    :host {
      display: block;
    }
    .tbl {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.7px;
    }
    thead th {
      height: 34px;
      text-align: left;
      font-weight: 400;
      color: var(--ag-thead);
      padding: 0 14.25px;
      border-bottom: 1px solid var(--ag-head-line);
      white-space: nowrap;
    }
    tbody td {
      height: 42px;
      color: var(--ag-text);
      padding: 0 14.25px;
      border-bottom: 1px solid var(--ag-line-soft);
      vertical-align: middle;
      white-space: nowrap;
    }
    /* Rejilla: separador vertical SOLO en el cuerpo (el thead real no lo tiene). */
    tbody td:not(:last-child) {
      border-right: 1px solid var(--ag-line-soft);
    }
    .col-dir {
      width: 62px;
      padding-right: 8px;
    }
    .col-com {
      width: 32%;
      white-space: normal;
    }
    .muted {
      color: var(--ag-muted);
    }

    /* Fila seleccionada: fondo sutil + barra roja izquierda + iconos rojos. */
    .is-selected td {
      background: rgba(255, 255, 255, 0.035);
    }
    .is-selected td:first-child {
      box-shadow: inset 3px 0 0 0 var(--ag-red);
    }

    /* Celda de dirección: flecha + icono de canal. Verde (in) / gris (out) / rojo (selected). */
    .dir {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--ag-green);
    }
    .is-out .dir {
      color: var(--ag-muted);
    }
    .is-selected .dir {
      color: var(--ag-red);
    }
    .dir app-icon.flip {
      transform: rotate(180deg);
    }

    /* Support/Wait: 1er tiempo plano + 2º como chip #5f6776 (rojo si supera umbral). */
    .sw__a {
      font-variant-numeric: tabular-nums;
      margin-right: 8px;
    }
    .sw__b {
      display: inline-block;
      padding: 1px 3.07px;
      border-radius: 5.26px;
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
}

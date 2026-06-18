import { ChangeDetectionStrategy, Component, computed, signal, TemplateRef, viewChild } from '@angular/core';
import {
  ScColumnCellContext,
  ScColumnDef,
  ScDatatableComponent,
  ScSearchComponent,
  ScTagComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { CALLS, type CallDirection, type CallRow, type Tipificacion } from '../../data/seed';

/** Tabla central de llamadas — sc-datatable con celdas compuestas (dirección, duración, tipificación). */
@Component({
  selector: 'app-call-table',
  standalone: true,
  imports: [ScDatatableComponent, ScSearchComponent, ScTagComponent, ScIconComponent],
  template: `
    <sc-datatable
      #table
      [value]="calls()"
      [columns]="columns()"
      dataKey="id"
      [globalFilterFields]="['numero', 'grupo', 'origen', 'destino', 'comentarios']"
      [stripedRows]="true"
    >
      <div scTableCaption class="cap">
        <sc-search
          placeholder="Buscar..."
          size="sm"
          (valueChange)="table.filterGlobal($event, 'contains')"
        />
      </div>
      <div scTableEmpty class="agent-muted">Sin llamadas</div>
    </sc-datatable>

    <ng-template #dirTpl let-row>
      <span class="dir" [class.dir--missed]="row.direction === 'missed'">
        <sc-icon [name]="dirIcon(row.direction)" [size]="16" />
      </span>
      <span class="dir__num">{{ row.numero }}</span>
    </ng-template>

    <ng-template #durTpl let-row>
      <span class="durpill">{{ row.duracion }}</span>
    </ng-template>

    <ng-template #tipoTpl let-row>
      <span class="tipos">
        @for (t of row.tipo; track t) {
          <sc-tag variant="label" [labelColor]="tipoColor(t)" [value]="t + ' ' + tipoLabel(t)" />
        }
      </span>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
    }
    .cap {
      display: flex;
      justify-content: flex-end;
    }
    .dir {
      display: inline-flex;
      vertical-align: -3px;
      margin-right: var(--sc-spacing-0-5);
      color: var(--sc-icon-success);
    }
    .dir--missed {
      color: var(--sc-icon-error);
    }
    .durpill {
      display: inline-block;
      padding: var(--sc-spacing-0-25) var(--sc-spacing-0-5);
      border-radius: var(--sc-radius-full);
      background: var(--sc-bg-success-subtle);
      color: var(--sc-text-success);
      font-variant-numeric: tabular-nums;
    }
    .tipos {
      display: inline-flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-0-5);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallTableComponent {
  private readonly dirTpl = viewChild<TemplateRef<ScColumnCellContext<CallRow>>>('dirTpl');
  private readonly durTpl = viewChild<TemplateRef<ScColumnCellContext<CallRow>>>('durTpl');
  private readonly tipoTpl = viewChild<TemplateRef<ScColumnCellContext<CallRow>>>('tipoTpl');

  protected readonly calls = signal<readonly CallRow[]>(CALLS);

  protected readonly columns = computed<readonly ScColumnDef<CallRow>[]>(() => [
    { field: 'fecha', header: 'Fecha', width: '7rem' },
    { field: 'numero', header: 'Número', width: '12rem', cellTemplate: this.dirTpl() },
    { field: 'grupo', header: 'Grupo', width: '8rem' },
    { field: 'origen', header: 'Origen', width: '7rem' },
    { field: 'destino', header: 'Destino', width: '7rem' },
    { field: 'duracion', header: 'Durac./Esp.', width: '9rem', align: 'center', cellTemplate: this.durTpl() },
    { field: 'tipo', header: 'Tipificación', width: '21rem', cellTemplate: this.tipoTpl() },
    { field: 'comentarios', header: 'Comentarios' },
  ]);

  protected dirIcon(d: CallDirection): string {
    return d === 'out' ? 'call_made' : d === 'missed' ? 'call_missed' : 'call_received';
  }

  protected tipoLabel(t: Tipificacion): string {
    return t === 'N1' ? 'Pedidos' : t === 'N2' ? 'Consultas' : 'Reclamaciones';
  }

  protected tipoColor(t: Tipificacion): 'blue' | 'amber' | 'red' {
    return t === 'N1' ? 'blue' : t === 'N2' ? 'amber' : 'red';
  }
}

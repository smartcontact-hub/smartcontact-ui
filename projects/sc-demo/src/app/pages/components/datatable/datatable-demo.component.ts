import { ChangeDetectionStrategy, Component, TemplateRef, computed, signal, viewChild } from '@angular/core';

import {
  ScColumnCellContext,
  ScColumnDef,
  ScDatatableComponent,
} from '../../../../../../ui-smartcontact/src/public-api';

interface Agent {
  id: number;
  name: string;
  extension: string;
  status: 'active' | 'inactive';
}

const AGENTS: readonly Agent[] = [
  { id: 1, name: 'Inés García', extension: '101', status: 'active' },
  { id: 2, name: 'Marc Soler', extension: '102', status: 'active' },
  { id: 3, name: 'Lucía Pérez', extension: '103', status: 'inactive' },
  { id: 4, name: 'Diego Romero', extension: '104', status: 'active' },
  { id: 5, name: 'Sara Vidal', extension: '105', status: 'inactive' },
  { id: 6, name: 'Tomás Ruiz', extension: '106', status: 'active' },
  { id: 7, name: 'Elena Marín', extension: '107', status: 'active' },
];

@Component({
  selector: 'app-datatable-demo',
  imports: [ScDatatableComponent],
  templateUrl: './datatable-demo.component.html',
  styleUrl: '../component-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatatableDemoComponent {
  protected readonly statusTpl = viewChild<TemplateRef<ScColumnCellContext<Agent>>>('statusTpl');

  protected readonly agents = signal<readonly Agent[]>(AGENTS);
  protected readonly selection = signal<readonly Agent[]>([]);

  // El consumidor construye las columns: header YA traducido, y la celda de
  // estado se compone con un cellTemplate propio (el DS no conoce el tipo).
  protected readonly columns = computed<readonly ScColumnDef<Agent>[]>(() => [
    { field: 'name', header: 'Nombre', sortable: true },
    { field: 'extension', header: 'Extensión', sortable: true, width: '10rem', align: 'center' },
    { field: 'status', header: 'Estado', align: 'center', cellTemplate: this.statusTpl() },
  ]);

  protected onSelectionChange(sel: Agent | readonly Agent[] | null): void {
    this.selection.set(Array.isArray(sel) ? (sel as readonly Agent[]) : []);
  }

  protected clear(): void {
    this.agents.set([]);
  }
}

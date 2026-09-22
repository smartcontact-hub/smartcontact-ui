import { ChangeDetectionStrategy, Component, computed, inject, type TemplateRef, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  ScButtonComponent,
  ScEmptyStateComponent,
  ScTagComponent,
  type ScColumnCellContext,
  type ScColumnDef,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { injectLangChange } from '@core/utils/lang-change';
import { IllustratedAvatarComponent, ListPageComponent } from '@shared/components';

import { GROUP_PERMISSIONS, countOf, plural, type LabGroup } from '../admin-lab.model';
import { AdminLabStore } from '../admin-lab.store';
import { LabOptionsComponent } from '../lab-options.component';

/**
 * Lista de grupos del laboratorio: la MISMA pantalla que `/admin/grupos`, montada con
 * `sc-list-page` (DD-97) y con su CTA en la barra de arriba.
 *
 * Es la puerta de entrada, y eso es lo que arregla el recorrido: se crea desde donde se
 * mira, no desde una pestaña de laboratorio pegada encima. Lo que este laboratorio propone
 * está DENTRO del formulario, no en el camino para llegar a él.
 */
@Component({
  selector: 'app-lab-grupos-list-page',
  imports: [
    IllustratedAvatarComponent,
    ListPageComponent,
    LabOptionsComponent,
    ScButtonComponent,
    ScEmptyStateComponent,
    ScIconComponent,
    ScTagComponent,
    TranslatePipe,
  ],
  templateUrl: './grupos-list-page.component.html',
  styleUrl: './grupos-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GruposListPageComponent {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly store = inject(AdminLabStore);

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');
  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<LabGroup>>>('nameTpl');
  private readonly membersTpl = viewChild<TemplateRef<ScColumnCellContext<LabGroup>>>('membersTpl');
  private readonly permsTpl = viewChild<TemplateRef<ScColumnCellContext<LabGroup>>>('permsTpl');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly plusIcon = 'add';
  protected readonly emptyIcon = 'group';
  protected readonly groups = this.store.groups;

  protected readonly columns = computed<readonly ScColumnDef<LabGroup>[]>(() => {
    this.lang();
    return [
      { field: 'name', header: this.translate.instant('groups.table.name'), sortable: true, cellTemplate: this.nameTpl() },
      { field: 'code', header: this.translate.instant('groups.table.code'), sortable: true, width: '8rem' },
      { field: 'members', header: this.translate.instant('groups.table.agents'), width: '10rem', cellTemplate: this.membersTpl() },
      { field: 'grants', header: this.translate.instant('lab.admin.table.permissions'), width: '10rem', cellTemplate: this.permsTpl() },
    ];
  });

  protected readonly matchesSearch = (row: LabGroup, query: string): boolean =>
    row.name.toLowerCase().includes(query) ||
    row.code.toLowerCase().includes(query) ||
    row.description.toLowerCase().includes(query);

  protected memberCount(group: LabGroup): string {
    return plural(group.members.length, 'agente', 'agentes');
  }

  /** «10/13», el mismo contador que enseña la ficha: el estado se lee sin entrar (B17). */
  protected permLabel(group: LabGroup): string {
    const { on, total } = countOf(GROUP_PERMISSIONS.flatMap((b) => b.nodes), new Set(group.grants));
    return on + '/' + total;
  }

  protected permSeverity(group: LabGroup): 'success' | 'secondary' {
    const { on, total } = countOf(GROUP_PERMISSIONS.flatMap((b) => b.nodes), new Set(group.grants));
    return on === total ? 'success' : 'secondary';
  }

  protected onCreateClick(): void {
    void this.router.navigate(['/lab/admin/grupos/crear']);
  }

  protected onRowOpen(group: LabGroup): void {
    void this.router.navigate(['/lab/admin/grupos/editar', group.id]);
  }
}

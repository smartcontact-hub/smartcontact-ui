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

import {
  USER_CAPABILITIES,
  USER_SECTIONS,
  USER_TYPES,
  countOf,
  driftFromPackage,
  plural,
  type LabPerson,
} from '../admin-lab.model';
import { AdminLabStore } from '../admin-lab.store';
import { LabOptionsComponent } from '../lab-options.component';

/**
 * Lista de usuarios del laboratorio: la MISMA pantalla que `/admin/usuarios`, con
 * `sc-list-page` y su CTA en la barra.
 *
 * Con una diferencia que ya es la propuesta: la columna «Tipo» dice el paquete Y cuánto se
 * aparta de él («Supervisor · 2 cambios»). Hoy esa columna enseña una etiqueta decorativa,
 * así que mirarla no dice nada sobre lo que esa persona puede hacer (A1).
 */
@Component({
  selector: 'app-lab-usuarios-list-page',
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
  templateUrl: './usuarios-list-page.component.html',
  styleUrl: './usuarios-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuariosListPageComponent {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();
  private readonly store = inject(AdminLabStore);

  private readonly topbarActions = viewChild<TemplateRef<unknown>>('topbarActions');
  private readonly nameTpl = viewChild<TemplateRef<ScColumnCellContext<LabPerson>>>('nameTpl');
  private readonly emailTpl = viewChild<TemplateRef<ScColumnCellContext<LabPerson>>>('emailTpl');
  private readonly typeTpl = viewChild<TemplateRef<ScColumnCellContext<LabPerson>>>('typeTpl');
  private readonly groupsTpl = viewChild<TemplateRef<ScColumnCellContext<LabPerson>>>('groupsTpl');

  constructor() {
    useTopbarActions(this.topbarActions);
  }

  protected readonly plusIcon = 'add';
  protected readonly emptyIcon = 'person';
  protected readonly people = this.store.people;

  protected readonly columns = computed<readonly ScColumnDef<LabPerson>[]>(() => {
    this.lang();
    return [
      { field: 'name', header: this.translate.instant('users.table.name'), sortable: true, cellTemplate: this.nameTpl() },
      { field: 'email', header: this.translate.instant('users.table.email'), sortable: true, cellTemplate: this.emailTpl() },
      /* A1 · la columna dice el PAQUETE y cuánto se aparta de él. Hoy la columna «Tipo»
       * enseña una etiqueta que no significa nada, así que no se puede fiar de ella. */
      { field: 'type', header: this.translate.instant('users.table.type'), width: '14rem', cellTemplate: this.typeTpl() },
      { field: 'groups', header: this.translate.instant('sidebar.groups'), width: '9rem', cellTemplate: this.groupsTpl() },
    ];
  });

  protected readonly matchesSearch = (row: LabPerson, query: string): boolean =>
    row.name.toLowerCase().includes(query) ||
    row.email.toLowerCase().includes(query) ||
    row.identifier.toLowerCase().includes(query);

  protected typeLabel(person: LabPerson): string {
    return USER_TYPES.find((t) => t.id === person.type)?.label ?? person.type;
  }

  /** «Supervisor · 2 cambios»: apartarse del paquete se ve desde la lista (A1 + B17). */
  protected driftLabel(person: LabPerson): string | null {
    const drift = driftFromPackage(person.type, new Set(person.grants));
    return drift === 0 ? null : plural(drift, 'cambio', 'cambios');
  }

  protected grantLabel(person: LabPerson): string {
    const granted = new Set(person.grants);
    const secciones = countOf(USER_SECTIONS, granted);
    const capacidades = countOf(USER_CAPABILITIES, granted);
    return secciones.on + '/' + secciones.total + ' · ' + capacidades.on + '/' + capacidades.total;
  }

  protected groupCount(person: LabPerson): string {
    return plural(person.groups.length, 'grupo', 'grupos');
  }

  protected onCreateClick(): void {
    void this.router.navigate(['/lab/admin/usuarios/crear']);
  }

  protected onRowOpen(person: LabPerson): void {
    void this.router.navigate(['/lab/admin/usuarios/editar', person.id]);
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScDialogComponent } from '@smartcontact-hub/components';

import type { TemplateType } from '@features/admin/templates/data/templates-data';
import {
  TemplateFormPanelComponent,
  type TemplateFormSubmission,
} from '@features/admin/templates/components/template-form-panel/template-form-panel.component';
import { TemplatesStore } from '@features/admin/templates/state/templates.store';
import { AGENDA_FIELDS } from '../../instances/agendas';
import { EQUIPO_FIELDS } from '../../instances/equipos';
import { AgendasStore } from '../../state/agendas.store';
import { EquiposStore } from '../../state/equipos.store';
import { RepoFormPanelComponent, type RepoFormSubmission } from '../repo-form-panel.component';

/** Lo que se crea o se edita desde Recursos de una ficha. */
export type TipoRecurso = 'agenda' | 'chat' | 'email' | 'equipo';

/** La ventana abierta: qué recurso, y cuál (`null` para crear uno). */
export interface RecursoAbierto {
  readonly tipo: TipoRecurso;
  readonly id: number | null;
}

const TITULOS: Readonly<Record<TipoRecurso, { readonly crear: string; readonly editar: string }>> = {
  agenda: { crear: 'groups.form.fields.agenda_new', editar: 'groups.form.fields.agenda_edit' },
  chat: { crear: 'groups.form.fields.template_new', editar: 'groups.form.fields.template_edit' },
  email: { crear: 'groups.form.fields.template_new', editar: 'groups.form.fields.template_edit' },
  equipo: { crear: 'groups.form.fields.team_new', editar: 'groups.form.fields.team_edit' },
};

/**
 * CREAR O EDITAR UN RECURSO SIN SALIR DE LA FICHA (revisión de agentes y tipificaciones, 2026-10-09): la misma ventana
 * para el «+» de un campo de Recursos y para el «Editar» de cada fila, en las fichas de grupo y de agente. Antes
 * «Editar» llevaba a Repositorios y había que volver; y solo se podía al editar, porque en un alta Atrás caía en una
 * ficha vacía. Aquí no se sale, así que también vale en un alta.
 *
 * Es el formulario de Repositorios (`sc-repo-form-panel`, `sc-template-form-panel`), con lo de siempre: nombre
 * obligatorio y sin repetir. Lo que no cabe en él (los contactos de una agenda, los agentes de un equipo) se
 * sigue editando en Repositorios. Guarda en su store y avisa con `creado` del id nuevo, para que la ficha lo añada a lo
 * elegido; al editar, las filas se ponen al día solas.
 */
@Component({
  selector: 'app-recurso-dialog',
  imports: [ScDialogComponent, RepoFormPanelComponent, TemplateFormPanelComponent, TranslateModule],
  template: `
    @let r = recurso();
    <sc-dialog [visible]="true" [title]="titulo() | translate" [hasFooter]="false" (cancelled)="cerrar.emit()">
      @switch (r.tipo) {
        @case ('agenda') {
          <sc-repo-form-panel
            flush
            [fields]="agendaFields"
            [initial]="agenda()"
            [existingNames]="nombresDeAgendas()"
            [entitySingular]="'repositories.agendas.singular' | translate"
            (save)="guardarAgenda($event)"
            (cancelled)="cerrar.emit()"
          />
        }
        @case ('equipo') {
          <sc-repo-form-panel
            flush
            [fields]="equipoFields"
            [initial]="equipo()"
            [existingNames]="nombresDeEquipos()"
            [entitySingular]="'repositories.equipos.singular' | translate"
            (save)="guardarEquipo($event)"
            (cancelled)="cerrar.emit()"
          />
        }
        @default {
          <sc-template-form-panel
            flush
            [defaultType]="tipoDePlantilla()"
            [initial]="plantilla()"
            [existingTitles]="titulosDePlantillas()"
            (save)="guardarPlantilla($event)"
            (cancelled)="cerrar.emit()"
          />
        }
      }
    </sc-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecursoDialogComponent {
  private readonly agendasStore = inject(AgendasStore);
  private readonly templatesStore = inject(TemplatesStore);
  private readonly equiposStore = inject(EquiposStore);

  readonly recurso = input.required<RecursoAbierto>();
  /** El recurso nuevo, para que la ficha lo añada a lo elegido. */
  readonly creado = output<number>();
  readonly cerrar = output<void>();

  protected readonly agendaFields = AGENDA_FIELDS;
  protected readonly equipoFields = EQUIPO_FIELDS;

  protected readonly titulo = computed(() => {
    const { tipo, id } = this.recurso();
    return id === null ? TITULOS[tipo].crear : TITULOS[tipo].editar;
  });

  private readonly id = computed(() => this.recurso().id);
  protected readonly agenda = computed(() => this.buscar(this.agendasStore.items(), this.id()));
  protected readonly equipo = computed(() => this.buscar(this.equiposStore.items(), this.id()));
  protected readonly plantilla = computed(() => this.buscar(this.templatesStore.templates(), this.id()));
  protected readonly tipoDePlantilla = computed<TemplateType>(() => (this.recurso().tipo === 'email' ? 'email' : 'chat'));

  protected readonly nombresDeAgendas = computed(() => this.agendasStore.items().map((a) => a.name));
  protected readonly nombresDeEquipos = computed(() => this.equiposStore.items().map((g) => g.name));
  protected readonly titulosDePlantillas = computed(() => this.templatesStore.templates().map((t) => t.title));

  protected guardarAgenda(s: RepoFormSubmission): void {
    const datos = { name: s['name'] ?? '', description: s['description'] ?? '', status: s['status'] || 'active' };
    const id = this.id();
    if (id === null) this.creado.emit(this.agendasStore.addItem({ ...datos, contacts: [] }).id);
    else this.agendasStore.updateItem(id, datos);
    this.cerrar.emit();
  }

  protected guardarEquipo(s: RepoFormSubmission): void {
    const datos = { name: s['name'] ?? '', description: s['description'] ?? '' };
    const id = this.id();
    if (id === null) this.creado.emit(this.equiposStore.addItem(datos).id);
    else this.equiposStore.updateItem(id, datos);
    this.cerrar.emit();
  }

  protected guardarPlantilla(s: TemplateFormSubmission): void {
    const id = this.id();
    if (id === null) this.creado.emit(this.templatesStore.addTemplate(s).id);
    else this.templatesStore.updateTemplate(id, s);
    this.cerrar.emit();
  }

  private buscar<T extends { readonly id: number }>(items: readonly T[], id: number | null): T | null {
    return id === null ? null : (items.find((i) => i.id === id) ?? null);
  }
}

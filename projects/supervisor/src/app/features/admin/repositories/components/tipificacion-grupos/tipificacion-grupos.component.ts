import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScIconComponent as IconComponent } from '@smartcontact-hub/icons';
import {
  ScButtonComponent as ButtonComponent,
  ScCheckboxComponent as CheckboxComponent,
  type ScColumnCellContext,
  type ScColumnDef,
  ScDatatableComponent as DatatableComponent,
  ScSearchComponent as SearchComponent,
  ScSelectComponent as SelectComponent,
} from '@smartcontact-hub/components';

import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';
import { CHANNEL_FAMILIES, FAMILY_LABEL_KEYS, type GroupChannel } from '@features/admin/groups/data/groups-data';
import { familiesOf } from '@features/admin/services/group-channels.core.mjs';

import type { ChoqueDeTipificacion, TipificacionCanal, TipificacionGrupo } from '../../state/tipificaciones.core.mjs';

/** Lo que la tabla necesita de un grupo. */
export interface TipificacionGrupoRef {
  readonly id: number;
  readonly name: string;
  readonly channels: readonly GroupChannel[];
}

interface Fila {
  readonly link: TipificacionGrupo;
  readonly group: TipificacionGrupoRef;
  /** Con qué otra tipificación choca en este grupo, ya en palabras; vacío si con ninguna. */
  readonly choques: readonly string[];
}

/**
 * Los grupos de una tipificación, dentro de su ficha: la tabla de los grupos de un agente
 * (`sc-group-assignment-table`) con su barra, buscar a la izquierda y «Añadir grupo…» a la derecha, y una columna por
 * familia de canales (DD-147). Sin «Habilitado» (DD-172): asignada ya es en uso, y para
 * dejar de usarla está la papelera.
 *
 * Si en un grupo otra tipificación cubre la misma dirección por el mismo canal, la fila lo dice debajo del nombre:
 * el agente no sabría cuál le toca. Guardar espera a que no quede ninguno.
 *
 * No guarda nada: emite los grupos nuevos y la ficha los lleva en su formulario.
 */
@Component({
  selector: 'sc-tipificacion-grupos',
  imports: [ButtonComponent, CheckboxComponent, DatatableComponent, IconComponent, SearchComponent, SelectComponent, TooltipModule, TranslateModule],
  templateUrl: './tipificacion-grupos.component.html',
  styleUrl: './tipificacion-grupos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipificacionGruposComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();

  readonly links = input.required<readonly TipificacionGrupo[]>();
  readonly groups = input.required<readonly TipificacionGrupoRef[]>();
  readonly choques = input<readonly ChoqueDeTipificacion[]>([]);
  readonly linksChange = output<readonly TipificacionGrupo[]>();

  private readonly groupTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('groupTpl');
  private readonly channelTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('channelTpl');
  private readonly actionsTpl = viewChild<TemplateRef<ScColumnCellContext<Fila>>>('actionsTpl');

  protected readonly columns = computed<readonly ScColumnDef<Fila>[]>(() => {
    this.lang();
    return [
      { field: 'group', header: this.translate.instant('repositories.tipificaciones.groups.col_group'), cellTemplate: this.groupTpl() },
      ...CHANNEL_FAMILIES.map((ch) => ({
        field: ch,
        header: this.translate.instant(FAMILY_LABEL_KEYS[ch]),
        width: '5.5rem',
        align: 'center' as const,
        cellTemplate: this.channelTpl(),
        stopRowClick: true,
      })),
      {
        field: 'actions',
        header: '',
        headerAriaLabel: this.translate.instant('common.actions'),
        width: '3.5rem',
        align: 'center' as const,
        cellTemplate: this.actionsTpl(),
        stopRowClick: true,
      },
    ];
  });

  protected readonly trashIcon = 'delete';
  protected readonly query = signal('');
  protected readonly addPick = signal<number | null>(null);

  private readonly groupById = computed(() => new Map(this.groups().map((g) => [g.id, g])));

  /** «Choca con «Atención al cliente» en las entrantes por Teléfono, Chat y Email»: una frase por tipificación y
   *  dirección, con sus canales juntos. */
  private frases(choques: readonly ChoqueDeTipificacion[]): string[] {
    const porClave = new Map<string, ChoqueDeTipificacion[]>();
    for (const c of choques) {
      const clave = `${c.otherId}·${c.direction}`;
      porClave.set(clave, [...(porClave.get(clave) ?? []), c]);
    }
    const lista = new Intl.ListFormat(this.language.locale(), { type: 'conjunction' });
    return [...porClave.values()].map((grupo) =>
      this.translate.instant('repositories.tipificaciones.groups.conflict', {
        name: grupo[0]!.otherName,
        direction: this.translate.instant(`repositories.tipificaciones.groups.conflict_direction.${grupo[0]!.direction}`),
        channel: lista.format(grupo.map((c) => this.translate.instant(FAMILY_LABEL_KEYS[c.channel]))),
      }),
    );
  }

  protected readonly filas = computed<readonly Fila[]>(() => {
    this.lang();
    const byId = this.groupById();
    return this.links().flatMap((link) => {
      const group = byId.get(link.groupId);
      if (!group) return [];
      return [{ link, group, choques: this.frases(this.choques().filter((c) => c.groupId === link.groupId)) }];
    });
  });

  /**
   * La línea reservada encima de la tabla: con qué choca cada grupo que choca, o, si no hay ninguno, qué se marca en
   * ella. Cambia de texto y de color, nunca de alto: el choque ya no alarga la fila de su grupo.
   */
  protected readonly estado = computed<{ readonly texto: string; readonly error: boolean }>(() => {
    this.lang();
    const conChoque = this.filas().filter((f) => f.choques.length > 0);
    if (conChoque.length === 0) {
      return { texto: this.translate.instant('repositories.tipificaciones.groups.status_ok'), error: false };
    }
    return {
      texto: conChoque.map((f) => `${f.group.name}: ${f.choques.join('; ')}`).join(' · '),
      error: true,
    };
  });

  protected readonly visibles = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.filas().filter((f) => f.group.name.toLowerCase().includes(q)) : this.filas();
  });

  /** Los grupos que aún se pueden añadir. */
  protected readonly candidatos = computed(() => {
    const usados = new Set(this.links().map((l) => l.groupId));
    return this.groups().filter((g) => !usados.has(g.id));
  });

  protected offers(group: TipificacionGrupoRef, channel: string): boolean {
    return familiesOf(group.channels).includes(channel as TipificacionCanal);
  }

  protected has(link: TipificacionGrupo, channel: string): boolean {
    return link.channels.includes(channel as TipificacionCanal);
  }

  /** Un grupo nuevo entra con todos los canales que ofrece; se desmarcan los que no tocan. */
  protected onAddPick(value: unknown): void {
    const group = this.groups().find((g) => g.id === value);
    if (group && !this.links().some((l) => l.groupId === group.id)) {
      this.linksChange.emit([...this.links(), { groupId: group.id, channels: familiesOf(group.channels) }]);
    }
    this.addPick.set(null);
  }

  protected toggle(groupId: number, field: string): void {
    const channel = field as TipificacionCanal;
    this.linksChange.emit(
      this.links().map((l) => {
        if (l.groupId !== groupId) return l;
        const channels = l.channels.includes(channel)
          ? l.channels.filter((c) => c !== channel)
          : CHANNEL_FAMILIES.filter((c) => c === channel || l.channels.includes(c));
        return { ...l, channels };
      }),
    );
  }

  protected remove(groupId: number): void {
    this.linksChange.emit(this.links().filter((l) => l.groupId !== groupId));
  }
}

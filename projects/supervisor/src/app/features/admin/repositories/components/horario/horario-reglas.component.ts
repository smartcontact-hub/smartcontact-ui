import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ScButtonComponent,
  ScMultiSelectComponent,
  ScSectionCardComponent,
  ScSelectButtonComponent,
  ScSubsectionComponent,
  ScTagComponent,
} from '@smartcontact-hub/components';

import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';

import {
  ahoraEn,
  type CalendarioDeFestivos,
  type FechaEspecial,
  type Periodo,
  resumenDeLaSemana,
  type Semana,
  textoDeFranja,
} from '../../state/horarios.core.mjs';
import { type ColumnaDeHorario, type FilaDeHorario, HorarioFilasTableComponent } from './horario-filas-table.component';

const aFecha = (iso: string): Date => new Date(`${iso}T12:00:00`);
const CLAVES_DIA = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/**
 * Las reglas del horario, en segundo plano bajo el calendario (experimento): dos filas. Arriba, la semana habitual y los
 * periodos; debajo, las fechas especiales con los festivos que aplica. Cada una es un `sc-section-card`, como el resto de
 * fichas, con las tablas de siempre (`sc-horario-filas-table`) para periodos y fechas especiales. Lo que se edita se abre
 * en un diálogo y el calendario se repinta.
 */
@Component({
  selector: 'sc-horario-reglas',
  imports: [
    HorarioFilasTableComponent,
    ScButtonComponent,
    ScMultiSelectComponent,
    ScSectionCardComponent,
    ScSelectButtonComponent,
    ScSubsectionComponent,
    ScTagComponent,
    TranslateModule,
  ],
  templateUrl: './horario-reglas.component.html',
  styleUrl: './horario-reglas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioReglasComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();

  readonly semana = input.required<Semana>();
  readonly periodos = input.required<readonly Periodo[]>();
  readonly especiales = input.required<readonly FechaEspecial[]>();
  readonly zona = input('Europe/Madrid');
  readonly calendarios = input.required<readonly CalendarioDeFestivos[]>();
  readonly festivosAplicados = input.required<readonly number[]>();
  readonly festivosHref = input('/admin/festivos');

  readonly editarSemana = output<void>();
  readonly anadirPeriodo = output<void>();
  readonly abrirPeriodo = output<number>();
  readonly eliminarPeriodo = output<number>();
  readonly anadirEspecial = output<void>();
  readonly abrirEspecial = output<number>();
  readonly eliminarEspecial = output<number>();
  readonly cambiarFestivos = output<number[]>();
  readonly gestionarFestivos = output<MouseEvent>();

  /** Los siete días con sus tramos, para leer la semana de un vistazo. */
  protected readonly dias = computed(() => {
    this.lang();
    return CLAVES_DIA.map((clave, i) => ({
      nombre: this.translate.instant(`repositories.horarios.days.${clave}`) as string,
      tramos: (this.semana()[i] ?? []).map(textoDeFranja),
    }));
  });

  private resumen(semana: Semana): string {
    const t = (k: string): string => this.translate.instant(k);
    return resumenDeLaSemana(
      semana,
      CLAVES_DIA.map((d) => t(`repositories.horarios.days_short.${d}`)),
      t('repositories.horarios.closed'),
      t('repositories.horarios.all_day'),
    );
  }

  protected readonly columnasDePeriodos = computed<readonly ColumnaDeHorario[]>(() => {
    this.lang();
    const t = (k: string): string => this.translate.instant(`repositories.horarios.cols.${k}`);
    return [
      { campo: 'nombre', titulo: t('period'), etiqueta: true },
      { campo: 'fechas', titulo: t('dates') },
      { campo: 'semana', titulo: t('week') },
    ];
  });

  protected readonly columnasDeEspeciales = computed<readonly ColumnaDeHorario[]>(() => {
    this.lang();
    const t = (k: string): string => this.translate.instant(`repositories.horarios.cols.${k}`);
    return [
      { campo: 'nombre', titulo: t('name') },
      { campo: 'fecha', titulo: t('date') },
      { campo: 'horas', titulo: t('hours') },
    ];
  });

  protected readonly filasDePeriodos = computed<readonly FilaDeHorario[]>(() => {
    this.lang();
    const dia = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short' });
    const conAnio = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short', year: 'numeric' });
    return this.periodos().map((p) => ({
      id: p.id,
      color: p.color,
      celdas: {
        nombre: p.name,
        fechas: `${dia.format(aFecha(`2024-${p.from}`))} – ${(p.year === null ? dia : conAnio).format(aFecha(`${p.year ?? 2024}-${p.to}`))}`,
        semana: this.resumen(p.week),
      },
    }));
  });

  /** Las fechas de un año que ya pasó no estorban: «Próximas» por defecto. Las que se repiten nunca pasan. */
  protected readonly verPasadas = signal(false);
  protected readonly filtroDeEspeciales = computed(() => {
    this.lang();
    return [
      { value: 'proximas', label: this.translate.instant('repositories.horarios.specials_upcoming') as string },
      { value: 'pasadas', label: this.translate.instant('repositories.horarios.specials_past') as string },
    ];
  });

  protected readonly filasDeEspeciales = computed<readonly FilaDeHorario[]>(() => {
    this.lang();
    const hoy = ahoraEn(this.zona()).fecha;
    const conAnio = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short', year: 'numeric' });
    const sinAnio = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short' });
    const pasadas = this.verPasadas();
    return [...this.especiales()]
      .filter((e) => (!e.yearly && e.date < hoy) === pasadas)
      .sort((a, b) => Number(b.yearly) - Number(a.yearly) || (a.yearly ? a.date.slice(5).localeCompare(b.date.slice(5)) : a.date.localeCompare(b.date)))
      .map((e) => ({
        id: e.id,
        celdas: {
          nombre: e.name,
          fecha: (e.yearly ? sinAnio : conAnio).format(aFecha(e.yearly ? `2024${e.date.slice(4)}` : e.date)),
          horas: e.slots.length > 0 ? e.slots.map(textoDeFranja).join(', ') : (this.translate.instant('repositories.horarios.closed') as string),
        },
      }));
  });

  protected readonly opcionesDeFestivos = computed(() =>
    this.calendarios()
      .filter((c) => c.status !== 'inactive' || this.festivosAplicados().includes(c.id))
      .map((c) => ({ value: c.id, label: c.name })),
  );
}

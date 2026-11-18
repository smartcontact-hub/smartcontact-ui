import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScButtonComponent, ScMultiSelectComponent, ScSectionCardComponent, ScSelectButtonComponent, ScSelectComponent, ScTagComponent } from '@smartcontact-hub/components';

import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';

import {
  ahoraEn,
  type CalendarioDeFestivos,
  type FechaEspecial,
  type Festivo,
  type Periodo,
  type Franja,
  resumenDeLaSemana,
  type Semana,
  textoDeFranja,
} from '../../state/horarios.core.mjs';

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
  imports: [ScButtonComponent, ScMultiSelectComponent, ScSectionCardComponent, ScSelectButtonComponent, ScSelectComponent, ScTagComponent, TooltipModule, TranslateModule],
  templateUrl: './horario-reglas.component.html',
  styleUrl: './horario-reglas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioReglasComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();

  readonly semana = input.required<Semana>();
  /** El horario del que sale la semana (`null`: una semana propia, sin vínculo), y los que se pueden elegir. */
  readonly horarioId = input<number | null>(null);
  readonly opcionesDeHorarios = input<readonly { readonly value: number; readonly label: string }[]>([]);
  /** Cuántos calendarios más usan ese horario. */
  readonly compartidoCon = input(0);
  readonly periodos = input.required<readonly Periodo[]>();
  readonly especiales = input.required<readonly FechaEspecial[]>();
  readonly zona = input('Europe/Madrid');
  readonly calendarios = input.required<readonly CalendarioDeFestivos[]>();
  readonly festivosAplicados = input.required<readonly number[]>();
  readonly festivosHref = input('/admin/festivos');
  /** Los festivos propios del calendario, los que añade el cliente. */
  readonly propios = input<readonly Festivo[]>([]);
  protected readonly cerradoTexto = computed(() => {
    this.lang();
    return this.translate.instant('repositories.horarios.closed') as string;
  });

  readonly editarSemana = output<void>();
  readonly cambiarHorario = output<number>();
  readonly gestionarHorarios = output<MouseEvent>();
  readonly anadirPeriodo = output<void>();
  readonly abrirPeriodo = output<number>();
  readonly eliminarPeriodo = output<number>();
  readonly anadirEspecial = output<void>();
  readonly abrirEspecial = output<number>();
  readonly eliminarEspecial = output<number>();
  readonly anadirPropio = output<void>();
  readonly abrirPropio = output<number>();
  readonly eliminarPropio = output<number>();
  readonly cambiarFestivos = output<number[]>();
  readonly gestionarFestivos = output<MouseEvent>();

  /** Las horas del horario general en una línea («L–J 08:00–14:00; V 08:00–14:00»). */
  protected readonly resumenGeneral = computed(() => {
    this.lang();
    const t = (k: string): string => this.translate.instant(k);
    return resumenDeLaSemana(this.semana(), CLAVES_DIA.map((d) => t(`repositories.horarios.days_short.${d}`)), t('repositories.horarios.closed'), t('repositories.horarios.all_day'));
  });

  /** La semana en grupos de días seguidos con las mismas franjas («Lun–Jue 09:00–18:00», «Sáb–Dom Cerrado»): tres filas, no siete. */
  protected readonly dias = computed(() => {
    this.lang();
    const nombre = (i: number): string => (this.translate.instant(`repositories.horarios.days.${CLAVES_DIA[i]}`) as string).slice(0, 3);
    const mismas = (a: readonly Franja[], b: readonly Franja[]): boolean => a.length === b.length && a.every((f, i) => f[0] === b[i][0] && f[1] === b[i][1]);
    const grupos: { desde: number; hasta: number; franjas: readonly Franja[] }[] = [];
    for (let d = 0; d < 7; d++) {
      const franjas = this.semana()[d] ?? [];
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && mismas(ultimo.franjas, franjas)) ultimo.hasta = d;
      else grupos.push({ desde: d, hasta: d, franjas });
    }
    return grupos.map((g) => ({
      etiqueta: g.desde === g.hasta ? nombre(g.desde) : `${nombre(g.desde)}–${nombre(g.hasta)}`,
      tramos: g.franjas.map(textoDeFranja),
    }));
  });

  protected readonly filasDePeriodos = computed(() => {
    this.lang();
    const dia = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short' });
    const conAnio = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short', year: 'numeric' });
    const t = (k: string): string => this.translate.instant(k);
    const abreviados = CLAVES_DIA.map((d) => t(`repositories.horarios.days_short.${d}`));
    return this.periodos().map((p) => ({
      horario: this.opcionesDeHorarios().find((o) => o.value === p.weekId)?.label ?? '',
      resumen: resumenDeLaSemana(p.week, abreviados, t('repositories.horarios.closed'), t('repositories.horarios.all_day')),
      id: p.id,
      nombre: p.name,
      color: p.color,
      fechas: `${dia.format(aFecha(`2024-${p.from}`))} – ${(p.year === null ? dia : conAnio).format(aFecha(`${p.year ?? 2024}-${p.to}`))}`,
      repite: p.year === null,
    }));
  });

  /** Las fechas especiales: próximas (por defecto), pasadas o todas. Las que se repiten cada año nunca pasan. */
  protected readonly filtro = signal<'proximas' | 'pasadas' | 'todas'>('proximas');
  protected readonly filtroDeEspeciales = computed(() => {
    this.lang();
    const t = (k: string): string => this.translate.instant(k);
    return [
      { value: 'proximas', label: t('repositories.horarios.specials_upcoming') },
      { value: 'pasadas', label: t('repositories.horarios.specials_past') },
      { value: 'todas', label: t('repositories.horarios.x.rules.specials_all') },
    ];
  });

  /** Qué se ve en la lista: todo, solo fechas especiales o solo festivos propios. */
  protected readonly tipoFiltro = signal<'todo' | 'especiales' | 'festivos'>('todo');
  protected readonly filtroDeTipo = computed(() => {
    this.lang();
    const t = (k: string): string => this.translate.instant(k);
    return [
      { value: 'todo', label: t('repositories.horarios.x.rules.kind_all') },
      { value: 'especiales', label: t('repositories.horarios.x.rules.kind_special') },
      { value: 'festivos', label: t('repositories.horarios.x.rules.kind_holiday') },
    ];
  });

  /** El nombre del horario general y su semana en una línea, con el mismo formato que el de un periodo. */
  protected readonly nombreGeneral = computed(() => this.opcionesDeHorarios().find((o) => o.value === this.horarioId())?.label ?? '');

  /** Las fechas especiales y los festivos propios, juntos y por orden en el año, con el filtro de tipo y el de cuándo. */
  protected readonly filasDeFechas = computed(() => {
    this.lang();
    const hoy = ahoraEn(this.zona()).fecha;
    const anio = hoy.slice(0, 4);
    const mes = new Intl.DateTimeFormat(this.language.locale(), { month: 'short' });
    const conAnio = new Intl.DateTimeFormat(this.language.locale(), { year: 'numeric' });
    const cerrado = this.translate.instant('repositories.horarios.closed') as string;
    const filtro = this.filtro();
    const tipo = this.tipoFiltro();
    const clave = (e: { date: string; yearly: boolean }): string => (e.yearly ? `${anio}${e.date.slice(4)}` : e.date);
    const filas = [
      ...(tipo === 'festivos' ? [] : this.especiales().map((e) => ({ tipo: 'especial' as const, e, detalle: e.slots.length ? e.slots.map(textoDeFranja).join(' · ') : cerrado }))),
      ...(tipo === 'especiales' ? [] : this.propios().map((e) => ({ tipo: 'festivo' as const, e: { ...e, slots: [] as Franja[] }, detalle: cerrado }))),
    ];
    return filas
      .filter((f) => filtro === 'todas' || (!f.e.yearly && f.e.date < hoy) === (filtro === 'pasadas'))
      .sort((a, b) => clave(a.e).localeCompare(clave(b.e)))
      .map((f) => {
        const iso = f.e.yearly ? `2024${f.e.date.slice(4)}` : f.e.date;
        return {
          clave: `${f.tipo}-${f.e.id}`,
          tipo: f.tipo,
          id: f.e.id,
          nombre: f.e.name,
          dia: Number(iso.slice(8)),
          mes: mes.format(aFecha(iso)).replace('.', ''),
          anio: f.e.yearly ? '' : conAnio.format(aFecha(iso)),
          repite: f.e.yearly,
          detalle: f.detalle,
        };
      });
  });

  protected readonly opcionesDeFestivos = computed(() =>
    this.calendarios()
      .filter((c) => c.status !== 'inactive' || this.festivosAplicados().includes(c.id))
      .map((c) => ({ value: c.id, label: c.name })),
  );
}

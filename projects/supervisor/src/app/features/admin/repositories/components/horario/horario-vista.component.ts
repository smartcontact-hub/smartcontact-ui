import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent, ScSelectButtonComponent, ScSelectComponent, ScTagComponent } from '@smartcontact-hub/components';

import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';

import {
  ahoraEn,
  type CalendarioDeFestivos,
  type DiaResuelto,
  diaDeLaSemana,
  type Horario,
  MINUTOS_DEL_DIA,
  rejillaDelAnio,
  resolverDia,
  sumarDias,
  textoDeFranja,
} from '../../state/horarios.core.mjs';

type Reglas = Pick<Horario, 'week' | 'periods' | 'specials' | 'holidayCalendarIds'>;
export type VistaDeHorario = 'year' | 'month' | 'week' | 'day';

/** Cuántos años atrás se puede mirar y cuántos adelante se planifica. */
export const ANIOS_ATRAS = 5;
export const ANIOS_ADELANTE = 3;

interface Celda {
  readonly fecha: string;
  readonly numero: number;
  readonly dia: DiaResuelto;
  /** Quién decide el día: `week`, `holiday`, `special` o `period:<id>`; es la clave de los filtros. */
  readonly capa: string;
  readonly color: string | null;
  readonly abierto: boolean;
  readonly horas: readonly string[];
  /** Una fecha especial o un festivo trae nombre propio: es lo que se escribe en la celda. */
  readonly nombre: string | null;
  readonly fuera: boolean;
  readonly apagada: boolean;
  readonly aria: string;
}

interface Bloque {
  readonly top: number;
  readonly alto: number;
  readonly texto: string;
}

interface Capa {
  readonly clave: string;
  readonly etiqueta: string;
  readonly color: string;
  readonly icono: string;
  readonly activa: boolean;
}

const aFecha = (iso: string): Date => new Date(`${iso}T12:00:00`);
const dosCifras = (n: number): string => String(n).padStart(2, '0');
const limites = (hoyAnio: number): { min: string; max: string } => ({ min: `${hoyAnio - ANIOS_ATRAS}-01-01`, max: `${hoyAnio + ANIOS_ADELANTE}-12-31` });
const colorDeDueno = (dia: DiaResuelto, abierto: boolean): string | null =>
  dia.tipo === 'festivo' ? 'red' : dia.tipo === 'especial' ? 'purple' : !abierto ? 'gray' : (dia.periodo?.color ?? null);
const diasDelMes = (anio: number, mes: number): number => new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();

/**
 * La vista de un horario (experimento): el calendario como protagonista de la pantalla.
 *
 * - Cuatro vistas: año (de un vistazo), mes (cada día con sus horas), semana y día (la línea del día en tramos de
 *   30 minutos, con el tramo exacto que dice el horario: 14:00–16:54 se pinta a su minuto).
 * - Los filtros van arriba, a la vista: cada capa (la semana habitual, cada periodo, los festivos, las fechas
 *   especiales, los días cerrados) se enciende o se apaga y lo apagado se atenúa en el calendario, sin esconderlo.
 * - El día elegido se lee en UNA línea fija bajo la barra: sus horas, quién las decide y dos lápices (editar eso que
 *   lo decide, o cambiar solo ese día). Sin día elegido, los lápices están apagados. «Hoy» no tiene botón: se marca en
 *   la rejilla.
 * - Se puede mirar hasta 5 años atrás y 3 adelante: las flechas se apagan en el límite y los selectores de mes y año
 *   solo ofrecen lo que se puede mirar.
 *
 * Es una rejilla propia: PrimeNG solo trae un selector de fecha, que no sirve para leer un año entero. Pieza custom del
 * experimento (barra de filtros y rejilla) sobre botones, tags e iconos del DS.
 */
@Component({
  selector: 'sc-horario-vista',
  imports: [ScButtonComponent, ScIconComponent, ScSelectButtonComponent, ScSelectComponent, ScTagComponent, TooltipModule, TranslateModule],
  templateUrl: './horario-vista.component.html',
  styleUrl: './horario-vista.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioVistaComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly reglas = input.required<Reglas>();
  readonly calendarios = input<readonly CalendarioDeFestivos[]>([]);
  readonly zona = input('Europe/Madrid');
  /** El día elegido, o `null` si todavía ninguno: no se elige hoy por defecto. */
  readonly diaElegido = model<string | null>(null);
  /** Una fecha especial para el día elegido (crearla o, si ya lo es, editarla). */
  readonly cambiarDia = output<string>();
  readonly editarPeriodo = output<number>();
  readonly editarSemana = output<void>();
  readonly editarFestivos = output<number>();

  /* ── Tiempo: hoy y la hora, en la zona del horario ────────────────────────────────────────────────────────────── */

  private readonly tic = signal(0);
  private readonly reloj = setInterval(() => this.tic.update((n) => n + 1), 60_000);
  private readonly sinReloj = inject(DestroyRef).onDestroy(() => clearInterval(this.reloj));
  private readonly ahora = computed(() => {
    this.tic();
    return ahoraEn(this.zona());
  });
  private readonly hoy = computed(() => this.ahora().fecha);
  protected readonly esHoy = (fecha: string): boolean => fecha === this.hoy();

  /** Lo que se puede mirar: 5 años atrás y 3 adelante, contando desde el año de hoy. */
  private readonly rango = computed(() => limites(Number(this.hoy().slice(0, 4))));

  /* ── Qué se mira ──────────────────────────────────────────────────────────────────────────────────────────────── */

  protected readonly vista = signal<VistaDeHorario>('month');
  /** Un día cualquiera de lo que se está mirando: el mes, la semana o el año visibles salen de él. */
  protected readonly ancla = signal<string | null>(null);
  private readonly fechaAncla = computed(() => this.limitar(this.ancla() ?? this.diaElegido() ?? this.hoy()));
  protected readonly anio = computed(() => Number(this.fechaAncla().slice(0, 4)));
  protected readonly mes = computed(() => Number(this.fechaAncla().slice(5, 7)) - 1);

  private limitar(fecha: string): string {
    const { min, max } = this.rango();
    return fecha < min ? min : fecha > max ? max : fecha;
  }

  protected readonly opcionesDeVista = computed(() => {
    this.lang();
    return (['day', 'week', 'month', 'year'] as const).map((v) => ({ value: v, label: this.translate.instant(`repositories.horarios.x.view.${v}`) as string }));
  });

  protected cambiarVista(vista: VistaDeHorario | null): void {
    if (!vista || vista === this.vista()) return;
    // Si lo elegido cabe en la vista nueva, se mira desde ahí; si no, se queda donde estaba.
    const elegido = this.diaElegido();
    if (elegido) this.ancla.set(this.limitar(elegido));
    this.vista.set(vista);
  }

  /* ── Navegar ──────────────────────────────────────────────────────────────────────────────────────────────────── */

  private mover(fecha: string, pasos: number): string {
    const v = this.vista();
    if (v === 'day') return sumarDias(fecha, pasos);
    if (v === 'week') return sumarDias(fecha, pasos * 7);
    const anio = Number(fecha.slice(0, 4));
    const mes = Number(fecha.slice(5, 7)) - 1;
    if (v === 'year') {
      const resto = fecha.slice(5);
      return `${anio + pasos}-${resto === '02-29' && diasDelMes(anio + pasos, 1) < 29 ? '02-28' : resto}`;
    }
    const destino = new Date(Date.UTC(anio, mes + pasos, 1));
    return `${destino.getUTCFullYear()}-${dosCifras(destino.getUTCMonth() + 1)}-${dosCifras(Math.min(Number(fecha.slice(8)), diasDelMes(destino.getUTCFullYear(), destino.getUTCMonth())))}`;
  }

  protected readonly puedeAnterior = computed(() => this.mover(this.fechaAncla(), -1) >= this.rango().min);
  protected readonly puedeSiguiente = computed(() => this.mover(this.fechaAncla(), 1) <= this.rango().max);

  protected ir(pasos: number): void {
    const destino = this.mover(this.fechaAncla(), pasos);
    if (destino < this.rango().min || destino > this.rango().max) return;
    this.ancla.set(destino);
  }

  protected readonly opcionesDeMes = computed(() => {
    const formato = new Intl.DateTimeFormat(this.language.locale(), { month: 'long' });
    return Array.from({ length: 12 }, (_, i) => ({ value: i, label: formato.format(new Date(2024, i, 1, 12)).replace(/^./, (c) => c.toLocaleUpperCase(this.language.locale())) }));
  });

  protected readonly opcionesDeAnio = computed(() => {
    const desde = Number(this.rango().min.slice(0, 4));
    const hasta = Number(this.rango().max.slice(0, 4));
    return Array.from({ length: hasta - desde + 1 }, (_, i) => ({ value: desde + i, label: String(desde + i) }));
  });

  protected irAlMes(mes: unknown): void {
    this.ancla.set(this.limitar(`${this.anio()}-${dosCifras(Number(mes) + 1)}-${dosCifras(Math.min(Number(this.fechaAncla().slice(8)), diasDelMes(this.anio(), Number(mes))))}`));
  }

  protected irAlAnio(anio: unknown): void {
    const a = Number(anio);
    const dia = Math.min(Number(this.fechaAncla().slice(8)), diasDelMes(a, this.mes()));
    this.ancla.set(this.limitar(`${a}-${dosCifras(this.mes() + 1)}-${dosCifras(dia)}`));
  }

  /** La etiqueta de lo que se mira cuando no la dicen los selectores: la semana o el día. */
  protected readonly titulo = computed(() => {
    this.lang();
    const f = this.fechaAncla();
    const lunes = sumarDias(f, -diaDeLaSemana(f));
    const corto = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short' });
    if (this.vista() === 'week') return `${corto.format(aFecha(lunes))} – ${corto.format(aFecha(sumarDias(lunes, 6)))}`;
    if (this.vista() === 'day') return new Intl.DateTimeFormat(this.language.locale(), { weekday: 'long', day: 'numeric' }).format(aFecha(f));
    return '';
  });

  /* ── Las capas, para filtrar ──────────────────────────────────────────────────────────────────────────────────── */

  private readonly apagadas = signal<ReadonlySet<string>>(new Set());

  protected readonly capas = computed<readonly Capa[]>(() => {
    this.lang();
    const t = (k: string): string => this.translate.instant(`repositories.horarios.x.layers.${k}`);
    const apagadas = this.apagadas();
    const r = this.reglas();
    const lista: Omit<Capa, 'activa'>[] = [
      { clave: 'week', etiqueta: t('week'), color: 'gray', icono: 'view_week' },
      ...r.periods.map((p) => ({ clave: `period:${p.id}`, etiqueta: p.name, color: p.color as string, icono: 'date_range' })),
      ...(r.holidayCalendarIds.length > 0 ? [{ clave: 'holiday', etiqueta: t('holiday'), color: 'red', icono: 'flag' }] : []),
      ...(r.specials.length > 0 ? [{ clave: 'special', etiqueta: t('special'), color: 'purple', icono: 'event' }] : []),
    ];
    return lista.map((c) => ({ ...c, activa: !apagadas.has(c.clave) }));
  });

  protected readonly hayFiltros = computed(() => this.apagadas().size > 0);

  protected alternar(clave: string): void {
    this.apagadas.update((s) => {
      const n = new Set(s);
      if (!n.delete(clave)) n.add(clave);
      return n;
    });
  }

  protected mostrarTodo(): void {
    this.apagadas.set(new Set());
  }

  /* ── Las celdas ───────────────────────────────────────────────────────────────────────────────────────────────── */

  private readonly formatos = computed(() => {
    const locale = this.language.locale();
    return {
      mes: new Intl.DateTimeFormat(locale, { month: 'long' }),
      dia: new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      diaSemana: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
      largo: new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
      inicial: new Intl.DateTimeFormat(locale, { weekday: 'narrow' }),
      sinAnio: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
    };
  });

  protected readonly iniciales = computed(() => Array.from({ length: 7 }, (_, i) => this.formatos().inicial.format(aFecha(sumarDias('2024-01-01', i)))));
  protected readonly nombresDeDia = computed(() =>
    Array.from({ length: 7 }, (_, i) => this.formatos().diaSemana.format(aFecha(sumarDias('2024-01-01', i))).replace(/\.$/, '')),
  );

  private horas(dia: DiaResuelto): readonly string[] {
    if (dia.minutosAbiertos === MINUTOS_DEL_DIA) return [this.translate.instant('repositories.horarios.all_day')];
    return dia.tramos.map(textoDeFranja);
  }

  /** Quién decide el día, en una frase corta. */
  private motivo(dia: DiaResuelto): string {
    const t = (clave: string, params?: Record<string, unknown>): string => this.translate.instant(`repositories.horarios.owner.${clave}`, params);
    if (dia.especial) return t('special', { name: dia.especial.name });
    if (dia.festivo) return t('holiday', { name: dia.festivo.name, calendar: dia.calendario?.name });
    if (dia.periodo) return t('period', { name: dia.periodo.name });
    return t('week');
  }

  private celda(fecha: string, mesVisible: number | null): Celda {
    const dia = resolverDia(this.reglas(), fecha, this.calendarios());
    const capa = dia.tipo === 'periodo' && dia.periodo ? `period:${dia.periodo.id}` : dia.tipo === 'semana' ? 'week' : dia.tipo === 'festivo' ? 'holiday' : 'special';
    const abierto = dia.tramos.length > 0;
    const apagadas = this.apagadas();
    const apagada = apagadas.has(capa);
    // Solo lo que se sale de lo habitual lleva color, y cada capa pinta lo suyo, así que los filtros conviven: el festivo,
    // rojo; la fecha especial, morado; el periodo, el suyo. La semana habitual es el fondo, sin color. Un día cerrado
    // es gris. Una capa apagada pierde su color.
    const color = apagada ? null : colorDeDueno(dia, abierto);
    return {
      fecha,
      numero: Number(fecha.slice(8)),
      dia,
      capa,
      color,
      abierto,
      horas: this.horas(dia),
      nombre: dia.especial?.name ?? dia.festivo?.name ?? null,
      fuera: mesVisible !== null && Number(fecha.slice(5, 7)) - 1 !== mesVisible,
      apagada,
      aria: `${this.formatos().dia.format(aFecha(fecha))}: ${abierto ? this.horas(dia).join(', ') : this.translate.instant('repositories.horarios.closed')}. ${this.motivo(dia)}`,
    };
  }

  /** Año: los doce meses, como una hoja de calendario. */
  protected readonly meses = computed(() => {
    this.lang();
    if (this.vista() !== 'year') return [];
    return rejillaDelAnio(this.anio()).map((m) => ({
      nombre: this.formatos().mes.format(aFecha(m.fechas[0])),
      huecos: Array.from({ length: m.huecos }),
      celdas: m.fechas.map((f) => this.celda(f, null)),
    }));
  });

  /** Mes: semanas completas, de lunes a domingo, con los días de los meses vecinos atenuados. */
  protected readonly semanas = computed(() => {
    this.lang();
    if (this.vista() !== 'month') return [];
    const primero = `${this.anio()}-${dosCifras(this.mes() + 1)}-01`;
    const huecos = diaDeLaSemana(primero);
    const total = Math.ceil((huecos + diasDelMes(this.anio(), this.mes())) / 7) * 7;
    const inicio = sumarDias(primero, -huecos);
    return Array.from({ length: total }, (_, i) => this.celda(sumarDias(inicio, i), this.mes()));
  });

  /** Semana o día: las columnas, cada una con sus tramos puestos a su hora. */
  protected readonly columnas = computed(() => {
    this.lang();
    const v = this.vista();
    if (v !== 'week' && v !== 'day') return [];
    const f = this.fechaAncla();
    const fechas = v === 'day' ? [f] : Array.from({ length: 7 }, (_, i) => sumarDias(sumarDias(f, -diaDeLaSemana(f)), i));
    return fechas.map((fecha) => {
      const celda = this.celda(fecha, null);
      const bloques: Bloque[] = celda.dia.tramos.map(([a, b]) => ({ top: (a / MINUTOS_DEL_DIA) * 100, alto: ((b - a) / MINUTOS_DEL_DIA) * 100, texto: textoDeFranja([a, b]) }));
      return { celda, bloques, cabecera: `${this.formatos().diaSemana.format(aFecha(fecha)).replace(/\.$/, '')} ${celda.numero}` };
    });
  });

  /** Las etiquetas de hora de la línea del día: una por hora, las medias horas son líneas. */
  protected readonly horasDelDia = Array.from({ length: 24 }, (_, h) => `${dosCifras(h)}:00`);

  /** La línea de «ahora», solo si hoy está entre las columnas. */
  protected readonly lineaAhora = computed(() => {
    const { fecha, minutos } = this.ahora();
    return this.columnas().some((c) => c.celda.fecha === fecha) ? { fecha, top: (minutos / MINUTOS_DEL_DIA) * 100 } : null;
  });

  private readonly lienzo = viewChild<ElementRef<HTMLElement>>('lienzo');
  private readonly alAbrirLaLinea = effect(() => {
    const v = this.vista();
    if (v !== 'week' && v !== 'day') return;
    untracked(() =>
      afterNextRender(
        () => {
          const el = this.lienzo()?.nativeElement;
          // La jornada empieza hacia las 7: la línea se abre ahí, no a medianoche.
          if (el) el.scrollTop = ((el.scrollHeight - (el.querySelector<HTMLElement>('.linea__cabecera')?.offsetHeight ?? 0)) * 7) / 24;
        },
        { injector: this.injector },
      ),
    );
  });

  /* ── El día elegido ───────────────────────────────────────────────────────────────────────────────────────────── */

  protected readonly seleccion = computed(() => this.diaElegido());

  protected readonly detalle = computed(() => {
    this.lang();
    const fecha = this.diaElegido();
    if (!fecha) return null;
    const celda = this.celda(fecha, null);
    // La línea del día lleva el color de su dueño aunque ese filtro esté apagado: es la respuesta a lo que se pregunta.
    const color = colorDeDueno(celda.dia, celda.abierto);
    const hoja = new Intl.DateTimeFormat(this.language.locale(), { month: 'short' }).format(aFecha(fecha)).replace('.', '');
    return {
      ...celda,
      color,
      hojaMes: hoja,
      titulo: this.formatos().largo.format(aFecha(fecha)),
      motivo: this.motivo(celda.dia),
      duenoColor: celda.dia.tipo === 'festivo' ? 'red' : celda.dia.tipo === 'especial' ? 'purple' : (celda.dia.periodo?.color ?? 'gray'),
    };
  });

  /** Qué lápiz de «editar lo que decide el día» corresponde: su etiqueta, o `null` si el día es una fecha especial. */
  protected readonly origen = computed(() => {
    const d = this.detalle();
    if (!d) return { clave: 'repositories.horarios.x.day.edit_origin_none', ayuda: '' };
    const tipo = d.dia.tipo;
    if (tipo === 'especial') return null;
    return { clave: `repositories.horarios.x.day.edit_${tipo === 'periodo' ? 'period' : tipo === 'festivo' ? 'holidays' : 'week'}`, ayuda: '' };
  });

  protected editarOrigen(): void {
    const d = this.detalle()?.dia;
    if (!d) return;
    if (d.tipo === 'periodo' && d.periodo) this.editarPeriodo.emit(d.periodo.id);
    else if (d.tipo === 'festivo' && d.calendario) this.editarFestivos.emit(d.calendario.id);
    else if (d.tipo === 'semana') this.editarSemana.emit();
  }

  protected elegir(fecha: string): void {
    this.diaElegido.set(fecha);
  }

  /** Teclado: las flechas mueven el día elegido (un día, o una semana arriba y abajo) y la vista lo sigue. */
  protected teclado(event: KeyboardEvent): void {
    const salto = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[event.key];
    if (!salto) return;
    event.preventDefault();
    const base = this.diaElegido() ?? this.fechaAncla();
    const fecha = this.limitar(sumarDias(base, salto));
    if (fecha === base) return;
    this.diaElegido.set(fecha);
    const v = this.vista();
    const visible = v === 'year' ? fecha.slice(0, 4) === String(this.anio()) : v === 'month' ? fecha.slice(0, 7) === this.fechaAncla().slice(0, 7) : v === 'week' ? sumarDias(fecha, -diaDeLaSemana(fecha)) === sumarDias(this.fechaAncla(), -diaDeLaSemana(this.fechaAncla())) : fecha === this.fechaAncla();
    if (!visible) this.ancla.set(fecha);
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(`[data-fecha="${fecha}"]`)?.focus(), { injector: this.injector });
  }

  /** El primer día que se ve: el que recibe el foco con Tab si no hay ninguno elegido. */
  private readonly primeraVisible = computed(() => {
    const f = this.fechaAncla();
    const v = this.vista();
    return v === 'year' ? `${this.anio()}-01-01` : v === 'month' ? `${f.slice(0, 7)}-01` : v === 'week' ? sumarDias(f, -diaDeLaSemana(f)) : f;
  });

  /** El único día con `tabindex=0`: el elegido si se ve; si no, el primero. Las flechas hacen el resto. */
  protected tabIndexDe(fecha: string): number {
    const elegido = this.diaElegido();
    const visible = elegido !== null && this.fechasVisibles().has(elegido);
    return fecha === (visible ? elegido : this.primeraVisible()) ? 0 : -1;
  }

  private readonly fechasVisibles = computed(() => {
    const v = this.vista();
    if (v === 'year') return new Set(this.meses().flatMap((m) => m.celdas.map((c) => c.fecha)));
    if (v === 'month') return new Set(this.semanas().map((c) => c.fecha));
    return new Set(this.columnas().map((c) => c.celda.fecha));
  });
}

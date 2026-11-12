import { afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, Injector, input, output, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScButtonComponent, ScTagComponent } from '@smartcontact-hub/components';

import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';

import {
  ahoraEn,
  type CalendarioDeFestivos,
  type DiaResuelto,
  type Horario,
  rejillaDelAnio,
  resolverDia,
  sumarDias,
  textoDeFranja,
} from '../../state/horarios.core.mjs';

type Reglas = Pick<Horario, 'week' | 'periods' | 'specials' | 'holidayCalendarIds'>;

interface Celda {
  readonly fecha: string;
  readonly numero: number;
  readonly dia: DiaResuelto;
  readonly abierto: boolean;
  /** El color del periodo que la cubre, o `null`. */
  readonly color: string | null;
  /** Fecha especial o festivo: lleva marca. */
  readonly excepcion: boolean;
  readonly aria: string;
}

const aFecha = (iso: string): Date => new Date(`${iso}T12:00:00`);

/**
 * El año de un horario, día a día: qué días se atiende, cuáles son de un periodo y cuáles son fecha especial o festivo.
 * Al elegir un día dice sus horas y quién las decide, y ofrece cambiarlo. Es una rejilla propia y no un `p-datepicker`:
 * aquí no se elige una fecha, se lee un año entero y se avanza de año en año.
 *
 * Teclado: un solo día recibe el foco con Tab y las flechas mueven la selección (un día, o una semana arriba y abajo).
 */
@Component({
  selector: 'sc-horario-calendario',
  imports: [ScButtonComponent, ScTagComponent, TranslateModule],
  templateUrl: './horario-calendario.component.html',
  styleUrl: './horario-calendario.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioCalendarioComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly reglas = input.required<Reglas>();
  readonly calendarios = input<readonly CalendarioDeFestivos[]>([]);
  readonly zona = input('Europe/Madrid');
  /** Pide una fecha especial para el día elegido: lleva su fecha. */
  readonly cambiarDia = output<string>();

  private readonly hoy = computed(() => ahoraEn(this.zona()).fecha);
  private readonly elegida = signal<string | null>(null);
  protected readonly seleccion = computed(() => this.elegida() ?? this.hoy());
  private readonly anioElegido = signal<number | null>(null);
  protected readonly anio = computed(() => this.anioElegido() ?? Number(this.seleccion().slice(0, 4)));

  private readonly formatos = computed(() => {
    const locale = this.language.locale();
    return {
      mes: new Intl.DateTimeFormat(locale, { month: 'long' }),
      dia: new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
      inicial: new Intl.DateTimeFormat(locale, { weekday: 'narrow' }),
    };
  });

  /** Las iniciales de lunes a domingo (el 1 de enero de 2024 fue lunes). */
  protected readonly iniciales = computed(() =>
    Array.from({ length: 7 }, (_, i) => this.formatos().inicial.format(aFecha(sumarDias('2024-01-01', i)))),
  );

  private celda(fecha: string): Celda {
    const dia = resolverDia(this.reglas(), fecha, this.calendarios());
    return {
      fecha,
      numero: Number(fecha.slice(8)),
      dia,
      abierto: dia.tramos.length > 0,
      color: dia.periodo?.color ?? null,
      excepcion: dia.tipo === 'especial' || dia.tipo === 'festivo',
      aria: `${this.formatos().dia.format(aFecha(fecha))}: ${this.horas(dia)}. ${this.motivo(dia)}`,
    };
  }

  protected readonly meses = computed(() => {
    this.lang();
    return rejillaDelAnio(this.anio()).map((m) => ({
      nombre: this.formatos().mes.format(aFecha(m.fechas[0])),
      huecos: Array.from({ length: m.huecos }),
      celdas: m.fechas.map((f) => this.celda(f)),
    }));
  });

  protected readonly detalle = computed(() => {
    this.lang();
    const celda = this.celda(this.seleccion());
    return { ...celda, titulo: this.formatos().dia.format(aFecha(celda.fecha)), horas: this.horas(celda.dia), motivo: this.motivo(celda.dia) };
  });

  /** Los periodos de este horario, para la leyenda. */
  protected readonly periodos = computed(() => this.reglas().periods);
  protected readonly hayExcepciones = computed(() => this.meses().some((m) => m.celdas.some((c) => c.excepcion)));
  protected readonly esHoy = (fecha: string): boolean => fecha === this.hoy();

  private horas(dia: DiaResuelto): string {
    if (dia.tramos.length === 0) return this.translate.instant('repositories.horarios.closed');
    if (dia.minutosAbiertos === 1440) return this.translate.instant('repositories.horarios.all_day');
    return dia.tramos.map(textoDeFranja).join(' · ');
  }

  /** Quién decide las horas de ese día, en una frase. */
  private motivo(dia: DiaResuelto): string {
    const t = (clave: string, params?: Record<string, unknown>): string => this.translate.instant(`repositories.horarios.owner.${clave}`, params);
    if (dia.especial) return t('special', { name: dia.especial.name });
    if (dia.festivo) return t('holiday', { name: dia.festivo.name, calendar: dia.calendario?.name });
    if (dia.periodo) return t('period', { name: dia.periodo.name });
    return t('week');
  }

  protected elegir(fecha: string): void {
    this.elegida.set(fecha);
    this.anioElegido.set(null);
  }

  protected moverAnio(salto: number): void {
    const anio = this.anio() + salto;
    if (anio < 1970 || anio > 2100) return;
    // El mismo día en el otro año; un 29 de febrero pasa al 28.
    const resto = this.seleccion().slice(4);
    const fecha = `${anio}${resto}`;
    this.elegida.set(Number.isNaN(Date.parse(`${fecha}T00:00:00Z`)) || new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) !== fecha ? `${anio}-02-28` : fecha);
    this.anioElegido.set(null);
  }

  protected irAHoy(): void {
    this.elegir(this.hoy());
  }

  protected teclado(event: KeyboardEvent): void {
    const salto = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!salto) return;
    event.preventDefault();
    const fecha = sumarDias(this.seleccion(), salto);
    this.elegir(fecha);
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(`[data-fecha="${fecha}"]`)?.focus(), { injector: this.injector });
  }
}

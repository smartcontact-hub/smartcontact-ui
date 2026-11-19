import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScButtonComponent } from '@smartcontact-hub/components';

import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';

import { ahoraEn, type CalendarioDeFestivos, diaDeLaSemana, type Horario, MINUTOS_DEL_DIA, resolverDia, sumarDias } from '../../state/horarios.core.mjs';

type Reglas = Pick<Horario, 'week' | 'periods' | 'specials' | 'holidayCalendarIds'>;

/** Los tramos más cortos que esto no llevan su texto dentro de la barra (no cabría): se lee en la fila. */
const MIN_ANCHO_PARA_TEXTO = 13;
const aFecha = (iso: string): Date => new Date(`${iso}T12:00:00`);
const dosCifras = (n: number): string => String(n).padStart(2, '0');
const horaTexto = (m: number): string => `${Math.floor(m / 60)}:${dosCifras(m % 60)}`;

/**
 * Una semana concreta de un horario, de un vistazo: una fila por día con la línea de las 24 horas y, sobre ella, los tramos en que
 * se atiende (verde) y lo que no (rosa), con las horas de cada día a la derecha y el total arriba. Lo que se ve es lo que RESULTA
 * de aplicar las reglas a esas fechas (semana habitual, periodos, festivos y fechas especiales), no la semana habitual a secas: un
 * festivo en esa semana sale cerrado. Se navega de semana en semana. Pieza propia del experimento.
 */
@Component({
  selector: 'sc-horario-semana-vista',
  imports: [ScButtonComponent, TranslateModule],
  templateUrl: './horario-semana-vista.component.html',
  styleUrl: './horario-semana-vista.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioSemanaVistaComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();

  readonly reglas = input.required<Reglas>();
  readonly calendarios = input<readonly CalendarioDeFestivos[]>([]);
  readonly zona = input('Europe/Madrid');

  /** Cuántas semanas se ha movido quien mira respecto de la de hoy. */
  private readonly desplazamiento = signal(0);

  private readonly hoy = computed(() => ahoraEn(this.zona()).fecha);
  private readonly lunes = computed(() => {
    const h = this.hoy();
    return sumarDias(sumarDias(h, -diaDeLaSemana(h)), this.desplazamiento() * 7);
  });
  protected readonly esLaDeHoy = computed(() => this.desplazamiento() === 0);

  protected ir(pasos: number): void {
    this.desplazamiento.update((n) => n + pasos);
  }

  protected irAHoy(): void {
    this.desplazamiento.set(0);
  }

  /** Las marcas de horas del eje: una por hora (con poco ancho se esconden las impares); la 23 se omite para que no pise al 24. */
  protected readonly marcas = Array.from({ length: 25 }, (_, i) => i).filter((m) => m !== 23);

  private formatoHoras(minutos: number): string {
    const horas = minutos / 60;
    return `${new Intl.NumberFormat(this.language.locale(), { maximumFractionDigits: 1 }).format(horas)} h`;
  }

  protected readonly dias = computed(() => {
    this.lang();
    const hoy = this.hoy();
    const letra = new Intl.DateTimeFormat(this.language.locale(), { weekday: 'narrow' });
    const largo = new Intl.DateTimeFormat(this.language.locale(), { weekday: 'long', day: 'numeric', month: 'long' });
    const cerrado = this.translate.instant('repositories.horarios.closed') as string;
    return Array.from({ length: 7 }, (_, i) => {
      const fecha = sumarDias(this.lunes(), i);
      const dia = resolverDia(this.reglas(), fecha, this.calendarios());
      const barras = dia.tramos.map(([a, b]) => ({
        izq: (a / MINUTOS_DEL_DIA) * 100,
        ancho: ((b - a) / MINUTOS_DEL_DIA) * 100,
        texto: `${horaTexto(a)}–${horaTexto(b)}`,
      }));
      // Un día cerrado dice por qué si no es por la semana: el nombre del festivo o de la fecha especial.
      const nota = dia.minutosAbiertos === 0 ? (dia.especial?.name ?? dia.festivo?.name ?? cerrado) : null;
      const horas = dia.minutosAbiertos > 0 ? this.formatoHoras(dia.minutosAbiertos) : '—';
      return {
        fecha,
        letra: letra.format(aFecha(fecha)),
        numero: Number(fecha.slice(8)),
        esHoy: fecha === hoy,
        barras: barras.map((b) => ({ ...b, conTexto: b.ancho >= MIN_ANCHO_PARA_TEXTO })),
        nota,
        cerrado: dia.minutosAbiertos === 0,
        horas,
        minutos: dia.minutosAbiertos,
        aria: `${largo.format(aFecha(fecha))}: ${dia.tramos.length > 0 ? barras.map((b) => b.texto).join(', ') : (nota ?? cerrado)}`,
      };
    });
  });

  protected readonly total = computed(() => {
    this.lang();
    return this.translate.instant('repositories.horarios.sv.total', { hours: this.formatoHoras(this.dias().reduce((s, d) => s + d.minutos, 0)) }) as string;
  });

  protected readonly rango = computed(() => {
    this.lang();
    const corto = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short' });
    return `${corto.format(aFecha(this.lunes()))} – ${corto.format(aFecha(sumarDias(this.lunes(), 6)))}`;
  });
}

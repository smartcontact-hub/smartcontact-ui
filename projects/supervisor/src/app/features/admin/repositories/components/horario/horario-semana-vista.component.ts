import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';

import { ahoraEn, diaDeLaSemana, MINUTOS_DEL_DIA, resolverDia, type Semana, sumarDias } from '../../state/horarios.core.mjs';

/** Los tramos más cortos que esto no llevan su texto dentro de la barra (no cabría): se lee en la fila. */
const MIN_ANCHO_PARA_TEXTO = 13;
const aFecha = (iso: string): Date => new Date(`${iso}T12:00:00`);
const dosCifras = (n: number): string => String(n).padStart(2, '0');
const horaTexto = (m: number): string => `${Math.floor(m / 60)}:${dosCifras(m % 60)}`;

/**
 * La semana de un horario de un vistazo: una fila por día con la línea de las 24 horas y, sobre ella, los tramos en que se atiende,
 * con las horas de cada día a la derecha. Solo la semana habitual (sin periodos ni fechas especiales): cada
 * semana es igual a la anterior. Un día cerrado se ve deshabilitado (letra tachada, línea rayada y «Cerrado»). El día de hoy lleva
 * la letra subrayada. Pieza propia del experimento.
 */
@Component({
  selector: 'sc-horario-semana-vista',
  imports: [ScIconComponent, TranslateModule],
  templateUrl: './horario-semana-vista.component.html',
  styleUrl: './horario-semana-vista.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioSemanaVistaComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();

  readonly semana = input.required<Semana>();
  readonly zona = input('Europe/Madrid');

  private readonly hoy = computed(() => ahoraEn(this.zona()).fecha);
  /** El lunes de la semana de hoy: sirve para resolver los tramos de cada día (los que cruzan la medianoche) y marcar hoy. */
  private readonly lunes = computed(() => sumarDias(this.hoy(), -diaDeLaSemana(this.hoy())));

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
      const dia = resolverDia({ week: this.semana(), periods: [], specials: [], holidayCalendarIds: [] }, fecha, []);
      const barras = dia.tramos.map(([a, b]) => ({
        izq: (a / MINUTOS_DEL_DIA) * 100,
        ancho: ((b - a) / MINUTOS_DEL_DIA) * 100,
        texto: `${horaTexto(a)}–${horaTexto(b)}`,
      }));
      const nota = dia.minutosAbiertos === 0 ? cerrado : null;
      const horas = dia.minutosAbiertos > 0 ? this.formatoHoras(dia.minutosAbiertos) : '—';
      return {
        fecha,
        letra: letra.format(aFecha(fecha)),
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
}

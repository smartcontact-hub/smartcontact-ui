import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScButtonComponent, ScMultiSelectComponent } from '@smartcontact-hub/components';

import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';

import {
  ahoraEn,
  type CalendarioDeFestivos,
  cruzaMedianoche,
  type FechaEspecial,
  MINUTOS_DEL_DIA,
  type Periodo,
  type Semana,
  textoDeFranja,
} from '../../state/horarios.core.mjs';

const aFecha = (iso: string): Date => new Date(`${iso}T12:00:00`);

/**
 * Las reglas del horario, en segundo plano (experimento): tres tarjetas compactas en una fila bajo el calendario. La
 * semana habitual, los periodos y las fechas especiales con los festivos que aplica. Cada una resume lo que hay y
 * lleva un lápiz para editarlo; lo que se edita se abre en un diálogo y el calendario de arriba se repinta.
 *
 * Los periodos son temporadas (muchos días seguidos) y las fechas especiales son días sueltos que las pisan: por eso son
 * dos listas, no una (ver el resumen de la rama). Tarjetas propias: `sc-section-card` no lleva acciones en su cabecera.
 */
@Component({
  selector: 'sc-horario-reglas',
  imports: [ScButtonComponent, ScMultiSelectComponent, TooltipModule, TranslateModule],
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
  /** Todos los calendarios de festivos y los que aplica este horario. */
  readonly calendarios = input.required<readonly CalendarioDeFestivos[]>();
  readonly festivosAplicados = input.required<readonly number[]>();

  readonly editarSemana = output<void>();
  readonly anadirPeriodo = output<void>();
  readonly abrirPeriodo = output<number>();
  readonly eliminarPeriodo = output<number>();
  readonly anadirEspecial = output<void>();
  readonly abrirEspecial = output<number>();
  readonly eliminarEspecial = output<number>();
  readonly cambiarFestivos = output<number[]>();
  readonly gestionarFestivos = output<MouseEvent>();

  /** Los siete días con su nombre corto, sus tramos y la barra de 24 horas. */
  protected readonly dias = computed(() => {
    this.lang();
    const claves = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
    return claves.map((clave, i) => {
      const franjas = this.semana()[i] ?? [];
      return {
        nombre: this.translate.instant(`repositories.horarios.days_short.${clave}`) as string,
        completo: this.translate.instant(`repositories.horarios.days.${clave}`) as string,
        texto: franjas.length === 0 ? '' : franjas[0][0] === 0 && franjas[0][1] === MINUTOS_DEL_DIA && franjas.length === 1 ? this.translate.instant('repositories.horarios.all_day') : franjas.map(textoDeFranja).join(' · '),
        barras: franjas.flatMap((f) => (cruzaMedianoche(f) ? [[f[0], MINUTOS_DEL_DIA]] : [[f[0], f[1]]])).map(([a, b]) => ({ izq: (a / MINUTOS_DEL_DIA) * 100, ancho: ((b - a) / MINUTOS_DEL_DIA) * 100 })),
      };
    });
  });

  protected readonly filasDePeriodos = computed(() => {
    this.lang();
    const formato = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short' });
    const conAnio = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short', year: 'numeric' });
    return this.periodos().map((p) => ({
      id: p.id,
      nombre: p.name,
      color: p.color,
      fechas: `${formato.format(aFecha(`2024-${p.from}`))} – ${(p.year === null ? formato : conAnio).format(aFecha(`${p.year ?? 2024}-${p.to}`))}`,
      repite: p.year === null,
    }));
  });

  /** Las fechas especiales que quedan por venir (las de un año que ya pasó no estorban), por orden de fecha en el año. */
  protected readonly proximas = computed(() => {
    this.lang();
    const hoy = ahoraEn(this.zona()).fecha;
    const conAnio = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short', year: 'numeric' });
    const sinAnio = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'short' });
    const cerrado = this.translate.instant('repositories.horarios.closed') as string;
    const todas = this.especiales();
    const vivas = todas.filter((e) => e.yearly || e.date >= hoy);
    return {
      pasadas: todas.length - vivas.length,
      filas: [...vivas]
        .sort((a, b) => Number(b.yearly) - Number(a.yearly) || (a.yearly ? a.date.slice(5).localeCompare(b.date.slice(5)) : a.date.localeCompare(b.date)))
        .map((e) => ({
          id: e.id,
          nombre: e.name,
          fecha: (e.yearly ? sinAnio : conAnio).format(aFecha(e.yearly ? `2024${e.date.slice(4)}` : e.date)),
          horas: e.slots.length > 0 ? e.slots.map(textoDeFranja).join(', ') : cerrado,
          repite: e.yearly,
        })),
    };
  });

  protected readonly opcionesDeFestivos = computed(() =>
    this.calendarios()
      .filter((c) => c.status !== 'inactive' || this.festivosAplicados().includes(c.id))
      .map((c) => ({ value: c.id, label: c.name })),
  );
}

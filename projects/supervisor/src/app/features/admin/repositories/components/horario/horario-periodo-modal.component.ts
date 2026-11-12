import { ChangeDetectionStrategy, Component, computed, inject, input, type OnInit, output, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import {
  type ColorDotOption,
  ScButtonComponent,
  ScColorDotPickerComponent,
  ScCustomModalComponent,
  ScCustomModalFooterDirective,
  ScDatepickerComponent,
  ScInputTextComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';
import { dejoElCampo } from '@shared/utils/alta-secciones';

import {
  coberturaAnual,
  COLORES_DE_PERIODO,
  type ColorDePeriodo,
  type Horario,
  type Periodo,
  type Semana,
  siguienteId,
  validarPeriodo,
} from '../../state/horarios.core.mjs';
import { HorarioSemanaComponent } from './horario-semana.component';

const dosCifras = (n: number): string => String(n).padStart(2, '0');
const mesDia = (fecha: Date): string => `${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`;

/**
 * Añadir o editar un periodo: una temporada con su propia semana («Verano, del 1 de junio al 31 de agosto»). Nace con
 * la semana habitual del horario, para cambiar solo lo que cambia. Dos periodos no comparten fechas: si chocan lo dice
 * con el nombre del otro y no deja guardar.
 */
@Component({
  selector: 'sc-horario-periodo-modal',
  imports: [
    HorarioSemanaComponent,
    ScButtonComponent,
    ScColorDotPickerComponent,
    ScCustomModalComponent,
    ScCustomModalFooterDirective,
    ScDatepickerComponent,
    ScInputTextComponent,
    ScToggleSwitchComponent,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './horario-periodo-modal.component.html',
  styleUrl: './horario-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioPeriodoModalComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly lang = injectLangChange();

  /** El periodo que se edita; `null` para uno nuevo. */
  readonly periodo = input<Periodo | null>(null);
  /** El horario al que pertenece: sus otros periodos y su semana habitual. */
  readonly horario = input.required<Pick<Horario, 'week' | 'periods' | 'specials' | 'holidayCalendarIds'>>();
  /** El año que se está mirando en el calendario: en el que se proponen las fechas. */
  readonly anio = input(new Date().getFullYear());

  readonly guardar = output<Periodo>();
  readonly cerrado = output<void>();

  protected readonly nombre = signal('');
  protected readonly rango = signal<readonly (Date | null)[] | null>(null);
  protected readonly cadaAnio = signal(true);
  protected readonly color = signal<string>('blue');
  protected readonly semana = signal<Semana>([]);
  private readonly nombreTocado = signal(false);

  protected readonly colores = computed<readonly ColorDotOption[]>(() => {
    this.lang();
    return COLORES_DE_PERIODO.map((c) => ({ value: c, label: this.translate.instant(`labels.color.${c}`), color: `var(--sc-label-${c}-dot)` }));
  });

  ngOnInit(): void {
    const p = this.periodo();
    if (!p) {
      const usados = new Set(this.horario().periods.map((x) => x.color));
      this.color.set(COLORES_DE_PERIODO.find((c) => !usados.has(c)) ?? 'blue');
      this.semana.set(this.horario().week);
      return;
    }
    const anio = p.year ?? this.anio();
    const [m1, d1] = p.from.split('-').map(Number);
    const [m2, d2] = p.to.split('-').map(Number);
    this.nombre.set(p.name);
    this.cadaAnio.set(p.year === null);
    this.color.set(p.color);
    this.semana.set(p.week);
    // Uno que cruza el fin de año acaba en el siguiente.
    this.rango.set([new Date(anio, m1 - 1, d1), new Date(p.from > p.to ? anio + 1 : anio, m2 - 1, d2)]);
  }

  /** El periodo tal como quedaría. Sin fechas elegidas, `from` y `to` van vacíos y `validarPeriodo` lo dice. */
  private readonly candidato = computed<Periodo>(() => {
    const [desde, hasta] = this.rango() ?? [];
    return {
      id: this.periodo()?.id ?? siguienteId(this.horario().periods),
      name: this.nombre().trim(),
      color: this.color() as ColorDePeriodo,
      from: desde ? mesDia(desde) : '',
      to: desde ? mesDia(hasta ?? desde) : '',
      year: this.cadaAnio() ? null : (desde?.getFullYear() ?? this.anio()),
      week: this.semana(),
    };
  });

  private readonly falta = computed(() => {
    const c = this.candidato();
    const [desde, hasta] = this.rango() ?? [];
    // De un solo año y con el fin en otro: no cabe.
    if (!this.cadaAnio() && desde && hasta && desde.getFullYear() !== hasta.getFullYear()) return { codigo: 'cruza_anio' as const };
    return validarPeriodo(this.horario(), c);
  });

  protected readonly faltaDeSemana = computed(() => {
    const f = this.falta();
    return f?.codigo === 'semana' ? { dia: f.dia, codigo: f.detalle } : null;
  });

  private readonly motivo = computed(() => {
    this.lang();
    const f = this.falta();
    if (!f) return '';
    if (f.codigo === 'solape') return this.translate.instant('repositories.horarios.errors.period_overlap', { name: f.con.name });
    if (f.codigo === 'semana') return this.translate.instant(`repositories.horarios.errors.week_${f.detalle}`);
    return this.translate.instant(`repositories.horarios.errors.period_${f.codigo}`);
  });

  protected readonly errorDeNombre = computed(() => (this.falta()?.codigo === 'nombre' && this.nombreTocado() ? this.motivo() : undefined));
  /** Lo de las fechas se dice en cuanto pasa: un solape no espera a que se intente guardar. */
  protected readonly errorDeFechas = computed(() => {
    const codigo = this.falta()?.codigo;
    return codigo === 'solape' || codigo === 'cruza_anio' ? this.motivo() : undefined;
  });
  protected readonly motivoApagado = this.motivo;
  protected readonly puedeGuardar = computed(() => this.falta() === null);

  /** Cuántos días le tocan en el año que se mira, descontados festivos y fechas especiales. */
  protected readonly resumen = computed(() => {
    this.lang();
    if (this.falta()) return '';
    const c = this.candidato();
    const anio = c.year ?? this.anio();
    const otros = this.horario().periods.filter((p) => p.id !== c.id);
    const dias = coberturaAnual({ ...this.horario(), periods: [...otros, c] }, anio).periodos.find((p) => p.id === c.id)?.dias ?? 0;
    return this.translate.instant('repositories.horarios.period_days', { count: dias, year: anio });
  });

  protected dejarNombre(event: FocusEvent): void {
    if (dejoElCampo(event)) this.nombreTocado.set(true);
  }

  protected confirmar(): void {
    if (!this.puedeGuardar()) return this.nombreTocado.set(true);
    this.guardar.emit(this.candidato());
  }
}

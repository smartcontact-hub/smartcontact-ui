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
  ScSelectComponent,
  ScTagComponent,
  ScTextareaComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';

import { injectLangChange } from '@core/utils/lang-change';
import { ayudaDeObligatorio, dejoElCampo } from '@shared/utils/alta-secciones';

import {
  coberturaAnual,
  COLORES_DE_PERIODO,
  type ColorDePeriodo,
  type Horario,
  type Periodo,
  resumenDeLaSemana,
  type Semana,
  siguienteId,
  validarPeriodo,
} from '../../state/horarios.core.mjs';
import { HorariosTipoStore } from '../../state/horarios-tipo.store';

/** Los colores en el orden del tag del DS (Figma): los nueve de etiqueta y, al final, el negro. */
const ORDEN_DEL_DS = ['gray', 'red', 'orange', 'amber', 'brown', 'green', 'teal', 'blue', 'purple', 'black'] as const;
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
    ScButtonComponent,
    ScColorDotPickerComponent,
    ScCustomModalComponent,
    ScCustomModalFooterDirective,
    ScDatepickerComponent,
    ScInputTextComponent,
    ScSelectComponent,
    ScTagComponent,
    ScTextareaComponent,
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
  private readonly tipos = inject(HorariosTipoStore);

  /** El periodo que se edita; `null` para uno nuevo. */
  readonly periodo = input<Periodo | null>(null);
  /** El horario al que pertenece: sus otros periodos y su semana habitual. */
  readonly horario = input.required<Pick<Horario, 'week' | 'weekId' | 'periods' | 'specials' | 'holidayCalendarIds'>>();
  /** El año que se está mirando en el calendario: en el que se proponen las fechas. */
  readonly anio = input(new Date().getFullYear());

  readonly guardar = output<Periodo>();
  readonly cerrado = output<void>();

  protected readonly nombre = signal('');
  protected readonly rango = signal<readonly (Date | null)[] | null>(null);
  protected readonly cadaAnio = signal(true);
  protected readonly color = signal<string>('blue');
  /** El horario que usa el periodo; su semana se copia al periodo. */
  protected readonly weekId = signal<number | null>(null);
  protected readonly semana = computed<Semana>(() => this.tipos.items().find((t) => t.id === this.weekId())?.week ?? [[], [], [], [], [], [], []]);
  protected readonly opcionesDeHorarios = computed(() => this.tipos.items().map((t) => ({ value: t.id, label: t.name })));
  /** La semana del horario elegido, en una línea por grupo de días, para ver qué se elige. */
  protected readonly resumenDeSemana = computed(() => {
    this.lang();
    const t = (k: string): string => this.translate.instant(k);
    return resumenDeLaSemana(
      this.semana(),
      ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => t(`repositories.horarios.days_short.${d}`)),
      t('repositories.horarios.closed'),
      t('repositories.horarios.all_day'),
    );
  });
  protected readonly mensaje = signal('');
  /** Lo que se leerá en la etiqueta de muestra: el nombre, o el del color mientras no lo haya. */
  protected readonly muestra = computed(() => this.nombre().trim() || (this.translate.instant(`labels.color.${this.color()}`) as string));
  private readonly nombreTocado = signal(false);

  protected readonly colores = computed<readonly ColorDotOption[]>(() => {
    this.lang();
    // El punto lleva el color del TEXTO del tag (el que se verá en la etiqueta), no el de su punto de etiqueta; el negro es el
    // tag «contrast». Así lo que se elige y lo que se ve son lo mismo.
    return ORDEN_DEL_DS.map((c) => ({
      value: c,
      label: this.translate.instant(`labels.color.${c}`),
      color: c === 'black' ? 'var(--sc-cmp-tag-contrast-background)' : `var(--sc-label-${c}-text)`,
    }));
  });

  ngOnInit(): void {
    const p = this.periodo();
    if (!p) {
      const usados = new Set(this.horario().periods.map((x) => x.color));
      this.color.set(COLORES_DE_PERIODO.find((c) => !usados.has(c)) ?? 'blue');
      this.weekId.set(this.horario().weekId ?? this.tipos.items()[0]?.id ?? null);
      return;
    }
    const anio = p.year ?? this.anio();
    const [m1, d1] = p.from.split('-').map(Number);
    const [m2, d2] = p.to.split('-').map(Number);
    this.nombre.set(p.name);
    this.cadaAnio.set(p.year === null);
    this.color.set(p.color);
    this.weekId.set(p.weekId ?? null);
    this.mensaje.set(p.outMessage ?? '');
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
      weekId: this.weekId(),
      week: this.semana(),
      outMessage: this.mensaje().trim(),
    };
  });

  private readonly falta = computed(() => {
    const c = this.candidato();
    const [desde, hasta] = this.rango() ?? [];
    // De un solo año y con el fin en otro: no cabe.
    if (!this.cadaAnio() && desde && hasta && desde.getFullYear() !== hasta.getFullYear()) return { codigo: 'cruza_anio' as const };
    return validarPeriodo(this.horario(), c);
  });

  /** Sin horario elegido no hay periodo: el periodo siempre usa uno. */
  protected readonly faltaElHorario = computed(() => this.weekId() === null);

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
  protected readonly puedeGuardar = computed(() => this.falta() === null && !this.faltaElHorario());

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

  /** El aviso de obligatorio, en gris desde el principio (DD-219); en rojo lo dice `errorDeNombre`. */
  protected readonly ayudaDeNombre = computed(() => {
    this.lang();
    return this.nombre().trim() || this.errorDeNombre() ? undefined : ayudaDeObligatorio(this.translate.instant('repositories.horarios.errors.name_required'));
  });

  /** Intro envía, como el diálogo de un contacto de la agenda; no en un botón, que ya hace lo suyo. */
  protected alPulsarIntro(event: Event): void {
    if ((event.target as HTMLElement | null)?.tagName === 'BUTTON') return;
    event.preventDefault();
    this.confirmar();
  }

  /* El diálogo abre con el foco en el nombre (`focusFirst` del DS): salir de él sin haber escrito es pasar al
   * siguiente campo, no dejarlo vacío. Se acusa en rojo si se escribió y se vació, o al pulsar «Crear» (DD-253; el
   * aviso gris de DD-219 sigue desde el principio). */
  private readonly nombreEscrito = signal(false);

  protected escribirNombre(valor: string): void {
    this.nombre.set(valor);
    this.nombreEscrito.set(true);
  }

  protected dejarNombre(event: FocusEvent): void {
    if (this.nombreEscrito() && dejoElCampo(event)) this.nombreTocado.set(true);
  }

  protected confirmar(): void {
    if (!this.puedeGuardar()) return this.nombreTocado.set(true);
    this.guardar.emit(this.candidato());
  }
}

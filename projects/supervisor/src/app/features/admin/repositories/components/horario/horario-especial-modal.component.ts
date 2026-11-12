import { ChangeDetectionStrategy, Component, computed, inject, input, type OnInit, output, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import {
  ScButtonComponent,
  ScCustomModalComponent,
  ScCustomModalFooterDirective,
  ScDatepickerComponent,
  ScInputTextComponent,
  ScSelectButtonComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';

import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';
import { dejoElCampo } from '@shared/utils/alta-secciones';

import { diaRepetido, type FechaEspecial, type Franja, validarFranjas } from '../../state/horarios.core.mjs';
import { HorarioFranjasComponent } from './horario-franjas.component';

const dosCifras = (n: number): string => String(n).padStart(2, '0');
const aIso = (fecha: Date): string => `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`;
const aFecha = (iso: string): Date => new Date(`${iso}T12:00:00`);

/** Lo que sale del diálogo: una fecha especial por día elegido; la que se editaba conserva su `id`. */
export type FechaEspecialNueva = Omit<FechaEspecial, 'id'> & { readonly id: number | null };

/**
 * Añadir o editar una fecha especial: un día con sus propias horas, o cerrado. Al añadir se marcan en el calendario
 * todos los días que hagan falta y se les pone lo mismo de una vez; al editar, es un solo día.
 */
@Component({
  selector: 'sc-horario-especial-modal',
  imports: [
    HorarioFranjasComponent,
    ScButtonComponent,
    ScCustomModalComponent,
    ScCustomModalFooterDirective,
    ScDatepickerComponent,
    ScInputTextComponent,
    ScSelectButtonComponent,
    ScToggleSwitchComponent,
    TooltipModule,
    TranslateModule,
  ],
  templateUrl: './horario-especial-modal.component.html',
  styleUrl: './horario-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioEspecialModalComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();

  /** `festivo`: un día de un calendario de festivos, que siempre es cerrado (sin modo ni franjas). */
  readonly variante = input<'especial' | 'festivo'>('especial');
  /** La que se edita; `null` para añadir. */
  readonly especial = input<FechaEspecial | null>(null);
  /** Al añadir, el día que ya viene marcado (el elegido en el calendario del año). */
  readonly fechaInicial = input<string | null>(null);
  /** Las fechas especiales que ya tiene el horario: una fecha no se repite. */
  readonly existentes = input<readonly FechaEspecial[]>([]);

  readonly guardar = output<readonly FechaEspecialNueva[]>();
  readonly eliminar = output<number>();
  readonly cerrado = output<void>();

  protected readonly nombre = signal('');
  protected readonly fechas = signal<readonly Date[]>([]);
  protected readonly cadaAnio = signal(false);
  protected readonly modo = signal<'closed' | 'open'>('closed');
  protected readonly franjas = signal<readonly Franja[]>([[540, 840]]);
  private readonly nombreTocado = signal(false);

  /** La raíz de sus textos: los de la fecha especial o los del festivo. */
  protected readonly claves = computed(() => {
    const festivo = this.variante() === 'festivo';
    const editando = this.especial() !== null;
    return {
      titulo: festivo
        ? editando ? 'repositories.festivos.day_edit' : 'repositories.festivos.day_add'
        : editando ? 'repositories.horarios.special_edit' : 'repositories.horarios.special_add',
      nombre: festivo ? 'repositories.festivos.day_name_placeholder' : 'repositories.horarios.special_name_placeholder',
      enviar: editando ? 'common.save' : festivo ? 'repositories.festivos.day_add_submit' : 'repositories.horarios.special_add_submit',
    };
  });

  protected readonly modos = computed(() => {
    this.lang();
    return [
      { value: 'closed', label: this.translate.instant('repositories.horarios.closed') },
      { value: 'open', label: this.translate.instant('repositories.horarios.special_open') },
    ];
  });

  ngOnInit(): void {
    const e = this.especial();
    if (e) {
      this.nombre.set(e.name);
      // La que se repite guarda un año cualquiera: se enseña en el actual.
      this.fechas.set([aFecha(e.yearly ? `${new Date().getFullYear()}${e.date.slice(4)}` : e.date)]);
      this.cadaAnio.set(e.yearly);
      this.modo.set(e.slots.length > 0 ? 'open' : 'closed');
      if (e.slots.length > 0) this.franjas.set(e.slots);
      return;
    }
    const inicial = this.fechaInicial();
    if (inicial) this.fechas.set([aFecha(inicial)]);
  }

  private readonly candidatas = computed<readonly FechaEspecialNueva[]>(() =>
    this.fechas().map((fecha, i) => ({
      id: i === 0 ? (this.especial()?.id ?? null) : null,
      name: this.nombre().trim(),
      date: aIso(fecha),
      yearly: this.cadaAnio(),
      slots: this.modo() === 'open' ? this.franjas() : [],
    })),
  );

  /** La primera fecha elegida que ya es otra fecha especial del horario. */
  private readonly repetida = computed(() => {
    for (const c of this.candidatas()) {
      const otra = diaRepetido(this.existentes(), { ...c, id: c.id ?? -1 });
      if (otra) return { fecha: c.date, otra };
    }
    return null;
  });

  private readonly codigoDeFranjas = computed(() => {
    if (this.modo() !== 'open') return null;
    return this.franjas().length === 0 ? 'ninguna' : validarFranjas(this.franjas());
  });

  private readonly motivo = computed(() => {
    this.lang();
    const t = (clave: string, params?: Record<string, unknown>): string => this.translate.instant(`repositories.horarios.errors.${clave}`, params);
    if (!this.nombre().trim()) return t('special_name');
    if (this.fechas().length === 0) return t('special_dates');
    const repetida = this.repetida();
    if (repetida) {
      const dia = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'long' }).format(aFecha(repetida.fecha));
      return t('special_repeated', { date: dia, name: repetida.otra.name });
    }
    const franjas = this.codigoDeFranjas();
    if (franjas) return t(`slots_${franjas}`);
    return '';
  });

  protected readonly errorDeNombre = computed(() => (!this.nombre().trim() && this.nombreTocado() ? this.motivo() : undefined));
  protected readonly errorDeFechas = computed(() => (this.nombre().trim() && this.repetida() ? this.motivo() : undefined));
  protected readonly errorDeFranjas = computed(() => (this.lang(), this.codigoDeFranjas() ? this.translate.instant(`repositories.horarios.errors.slots_${this.codigoDeFranjas()}`) : undefined));
  protected readonly motivoApagado = this.motivo;
  protected readonly puedeGuardar = computed(() => this.motivo() === '');

  protected readonly cuantas = computed(() => {
    this.lang();
    const n = this.fechas().length;
    return n > 1 ? this.translate.instant('repositories.horarios.special_count', { count: n }) : '';
  });

  protected ponerFecha(fecha: Date | null): void {
    this.fechas.set(fecha ? [fecha] : []);
  }

  protected dejarNombre(event: FocusEvent): void {
    if (dejoElCampo(event)) this.nombreTocado.set(true);
  }

  protected confirmar(): void {
    if (!this.puedeGuardar()) return this.nombreTocado.set(true);
    this.guardar.emit(this.candidatas());
  }
}

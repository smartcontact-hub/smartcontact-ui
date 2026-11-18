import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, HostListener, inject, input, output, signal, untracked } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScIconComponent } from '@smartcontact-hub/icons';
import { ScButtonComponent, ScDatepickerComponent, ScInputTextComponent, ScSelectButtonComponent, ScToggleSwitchComponent } from '@smartcontact-hub/components';

import { LanguageService } from '@core/services/language.service';
import { injectLangChange } from '@core/utils/lang-change';

import { diaRepetido, type FechaEspecial, type Franja, sumarDias, validarFranjas } from '../../state/horarios.core.mjs';
import type { FechaEspecialNueva } from './horario-especial-modal.component';
import { HorarioFranjasComponent } from './horario-franjas.component';

const dosCifras = (n: number): string => String(n).padStart(2, '0');
const aIso = (fecha: Date): string => `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`;
const aFecha = (iso: string): Date => new Date(`${iso}T12:00:00`);

/** Lo que mide el panel (px), para colocarlo sin salirse de la ventana. */
const ANCHO = 352;
const ALTO = 440;

export type TipoDeDia = 'festivo' | 'closed' | 'open';

/** Lo que el panel entrega: el tipo elegido, los días (uno por fecha del rango) y de qué lista venía el que se editaba. */
export interface DiaDelPanel {
  readonly tipo: TipoDeDia;
  readonly dias: readonly FechaEspecialNueva[];
  readonly previo: { readonly lista: 'especial' | 'propio'; readonly id: number } | null;
}

/**
 * Panel rápido de un día, como el de crear un evento de un calendario: se ancla a la celda elegida, NO tapa ni bloquea
 * el resto (otro clic en otro día lo mueve allí) y se cierra con Escape o la X. Para un solo día o, con «Hasta», un
 * rango. Lo que no cabe (el mensaje) se hace desde «Más opciones», que abre el diálogo completo.
 * Pieza propia (el DS no tiene aún un panel anclado sin bloqueo).
 */
@Component({
  selector: 'sc-horario-dia-panel',
  imports: [
    HorarioFranjasComponent,
    ScButtonComponent,
    ScDatepickerComponent,
    ScIconComponent,
    ScInputTextComponent,
    ScSelectButtonComponent,
    ScToggleSwitchComponent,
    TranslateModule,
  ],
  templateUrl: './horario-dia-panel.component.html',
  styleUrl: './horario-dia-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioDiaPanelComponent {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly lang = injectLangChange();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** El día donde se ancla y el rectángulo de su celda. */
  readonly fecha = input.required<string>();
  readonly ancla = input.required<DOMRect>();
  /** Lo que ya hay ese día (una fecha especial o un festivo propio), si es suyo; `null` para añadir. */
  readonly existente = input<{ readonly lista: 'especial' | 'propio'; readonly entrada: FechaEspecial } | null>(null);
  /** Una línea que dice qué decide el día ahora (un festivo de una lista, un periodo…); vacía si la semana. */
  readonly nota = input<string>('');
  /** Todas las fechas especiales y festivos propios: no se repite una fecha. */
  readonly existentes = input<readonly FechaEspecial[]>([]);

  readonly guardar = output<DiaDelPanel>();
  readonly eliminar = output<{ readonly lista: 'especial' | 'propio'; readonly id: number }>();
  readonly masOpciones = output<void>();
  readonly cerrado = output<void>();

  protected readonly nombre = signal('');
  protected readonly tipo = signal<TipoDeDia>('festivo');
  protected readonly desde = signal<Date>(new Date());
  protected readonly hasta = signal<Date | null>(null);
  protected readonly cadaAnio = signal(false);
  protected readonly franjas = signal<readonly Franja[]>([[540, 840]]);
  private readonly intento = signal(false);

  constructor() {
    // Cada vez que se elige otro día, el panel se rellena con lo suyo (o en blanco) sin recrearse.
    effect(() => {
      const fecha = this.fecha();
      const e = this.existente();
      untracked(() => {
        this.desde.set(aFecha(fecha));
        this.hasta.set(null);
        this.intento.set(false);
        if (e) {
          this.nombre.set(e.entrada.name);
          this.cadaAnio.set(e.entrada.yearly);
          this.tipo.set(e.lista === 'propio' ? 'festivo' : e.entrada.slots.length > 0 ? 'open' : 'closed');
          this.franjas.set(e.entrada.slots.length > 0 ? e.entrada.slots : [[540, 840]]);
        } else {
          this.nombre.set('');
          this.cadaAnio.set(false);
          this.tipo.set('festivo');
          this.franjas.set([[540, 840]]);
        }
        void fecha;
      });
    });
  }

  /** Junto a la celda: a su derecha si cabe y, si no, a su izquierda; y sin salirse de la ventana por abajo. */
  protected readonly posicion = computed(() => {
    const r = this.ancla();
    const ancho = ANCHO;
    const hueco = 8;
    const cabeDerecha = r.right + hueco + ancho <= window.innerWidth - hueco;
    const left = cabeDerecha ? r.right + hueco : Math.max(hueco, r.left - hueco - ancho);
    const top = Math.max(hueco, Math.min(r.top, window.innerHeight - ALTO - hueco));
    return { left: `${left}px`, top: `${top}px`, width: `${ancho}px` };
  });

  protected readonly tipos = computed(() => {
    this.lang();
    const t = (k: string): string => this.translate.instant(`repositories.horarios.x.panel.${k}`);
    // «Otras horas» ya no se ofrece: solo aparece para una fecha especial que ya las tiene, para no perderlas al editarla.
    const conHoras = (this.existente()?.entrada.slots.length ?? 0) > 0;
    return [
      { value: 'festivo', label: t('holiday') },
      { value: 'closed', label: t('closed') },
      ...(conHoras ? [{ value: 'open', label: t('open') }] : []),
    ];
  });

  protected readonly titulo = computed(() => {
    const d = new Intl.DateTimeFormat(this.language.locale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(aFecha(this.fecha()));
    return d.charAt(0).toUpperCase() + d.slice(1);
  });

  /** Las fechas que se escriben: la elegida o, con «Hasta», todas hasta esa. */
  private readonly fechas = computed<readonly string[]>(() => {
    const inicio = aIso(this.desde());
    const fin = this.hasta() ? aIso(this.hasta()!) : null;
    const lista = [inicio];
    if (!fin || fin <= inicio) return lista;
    for (let d = sumarDias(inicio, 1); d <= fin && lista.length < 366; d = sumarDias(d, 1)) lista.push(d);
    return lista;
  });

  protected readonly cuantos = computed(() => this.fechas().length);
  protected readonly minimo = computed(() => aFecha(sumarDias(aIso(this.desde()), 1)));

  private readonly candidatos = computed<readonly FechaEspecialNueva[]>(() => {
    const previo = this.existente();
    return this.fechas().map((date, i) => ({
      id: i === 0 && previo ? previo.entrada.id : null,
      name: this.nombre().trim(),
      date,
      yearly: this.cadaAnio(),
      slots: this.tipo() === 'open' ? this.franjas() : [],
      message: previo && i === 0 ? (previo.entrada.message ?? '') : '',
    }));
  });

  private readonly motivo = computed(() => {
    this.lang();
    const t = (clave: string, params?: Record<string, unknown>): string => this.translate.instant(`repositories.horarios.errors.${clave}`, params);
    if (!this.nombre().trim()) return t('special_name');
    const previo = this.existente()?.entrada.id;
    for (const c of this.candidatos()) {
      const otra = diaRepetido(this.existentes(), { ...c, id: c.id ?? -1 });
      if (otra && otra.id !== previo) {
        const dia = new Intl.DateTimeFormat(this.language.locale(), { day: 'numeric', month: 'long' }).format(aFecha(c.date));
        return t('special_repeated', { date: dia, name: otra.name });
      }
    }
    if (this.tipo() === 'open') {
      if (this.franjas().length === 0) return t('slots_ninguna');
      const codigo = validarFranjas(this.franjas());
      if (codigo) return t(`slots_${codigo}`);
    }
    return '';
  });

  protected readonly error = computed(() => (this.intento() ? this.motivo() : ''));
  protected readonly errorDeNombre = computed(() => (this.intento() && !this.nombre().trim() ? this.motivo() : undefined));

  protected confirmar(): void {
    if (this.motivo()) {
      this.intento.set(true);
      return;
    }
    const previo = this.existente();
    this.guardar.emit({ tipo: this.tipo(), dias: this.candidatos(), previo: previo ? { lista: previo.lista, id: previo.entrada.id } : null });
  }

  /** Intro guarda (no sobre un botón, que ya hace lo suyo). */
  protected alIntro(event: Event): void {
    if ((event.target as HTMLElement | null)?.closest('button, sc-datepicker')) return;
    event.preventDefault();
    this.confirmar();
  }

  protected quitar(): void {
    const e = this.existente();
    if (e) this.eliminar.emit({ lista: e.lista, id: e.entrada.id });
  }

  protected ponerDesde(fecha: Date | null): void {
    if (!fecha) return;
    this.desde.set(fecha);
    if (this.hasta() && aIso(this.hasta()!) <= aIso(fecha)) this.hasta.set(null);
  }

  protected ponerHasta(fecha: Date | null): void {
    this.hasta.set(fecha);
  }

  @HostListener('document:keydown.escape')
  protected alEscape(): void {
    this.cerrado.emit();
  }

  /** Un clic fuera del panel y del calendario lo cierra; sobre un día, no (ese día lo mueve). El desplegable del
   *  selector de fecha cuelga del body: también cuenta como dentro. */
  @HostListener('document:pointerdown', ['$event'])
  protected alPulsarFuera(event: PointerEvent): void {
    const el = event.target as HTMLElement | null;
    if (!el || this.host.nativeElement.contains(el)) return;
    if (el.closest('[data-fecha], .p-datepicker, .p-datepicker-panel, .p-overlay, .p-select-overlay, .p-popover')) return;
    this.cerrado.emit();
  }
}

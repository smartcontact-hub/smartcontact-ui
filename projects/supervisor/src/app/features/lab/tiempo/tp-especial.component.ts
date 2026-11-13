import { ChangeDetectionStrategy, Component, computed, input, type OnInit, output, signal } from '@angular/core';

import {
  ahoraEn,
  diaDeLaSemana,
  diaRepetido,
  type FechaEspecial,
  type Franja,
  type Semana,
  validarFranjas,
} from '@features/admin/repositories/state/horarios.core.mjs';

import { TpIconoComponent } from './tp-icono.component';
import { capital, fmtLargo, MESES } from './tp-modelo';
import { TpHoraComponent, TpLineaComponent, TpModalComponent, TpSegComponent } from './tp-piezas';
import { T } from './tp-textos';

type Nueva = Omit<FechaEspecial, 'id'> & { id: number | null };

const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * Un día especial: un día con sus propias horas o cerrado. Manda sobre todo lo demás (festivos, periodos y la semana),
 * así que también sirve para abrir un festivo. Sus horas se ven en una línea de 24 h mientras se escriben.
 */
@Component({
  selector: 'sc-tp-especial',
  imports: [TpHoraComponent, TpIconoComponent, TpLineaComponent, TpModalComponent, TpSegComponent],
  template: `
    <sc-tp-modal [titulo]="especial() ? 'Editar día especial' : 'Día especial'" [subtitulo]="subtitulo()" ancho="34rem" icono="star" tono="especial" (cerrar)="cerrado.emit()">
      <div class="tp-form-fila">
        <div class="tp-field">
          <span class="tp-label">Fecha</span>
          <div class="tp-fecha">
            <input class="tp-input tp-input--dia t-num" type="number" min="1" max="31" [attr.aria-label]="t.dia1" [value]="dia()" (change)="dia.set(clamp(+$any($event.target).value))" />
            <select class="tp-select" [attr.aria-label]="t.mes" (change)="mes.set(+$any($event.target).value)">
              @for (m of meses; track $index) {
                <option [value]="$index + 1" [selected]="$index + 1 === mes()">{{ m }}</option>
              }
            </select>
            @if (!cadaAnio()) {
              <select class="tp-select" [attr.aria-label]="t.anio" (change)="anio.set(+$any($event.target).value)">
                @for (a of anios(); track a) {
                  <option [value]="a" [selected]="a === anio()">{{ a }}</option>
                }
              </select>
            }
          </div>
        </div>
        <label class="tp-field tp-field--grow">
          <span class="tp-label">{{ t.nombre }}</span>
          <input class="tp-input" [attr.aria-label]="t.nombre" [placeholder]="t.ejemploEspecial" [value]="nombre()" (input)="nombre.set($any($event.target).value)" />
        </label>
      </div>

      <label class="tp-check-fila">
        <button type="button" class="tp-switch" role="switch" [attr.aria-checked]="cadaAnio()" [attr.aria-label]="t.cadaAnio" (click)="cadaAnio.set(!cadaAnio())"></button>
        <span class="t-small">Se repite cada año el {{ dia() }} de {{ meses[mes() - 1] }}</span>
      </label>

      <div class="tp-field">
        <sc-tp-seg [etiqueta]="t.modo" [opciones]="modos" [valor]="horasPropias() ? 'horas' : 'cerrado'" (cambio)="cambiarModo($event)" />
      </div>

      @if (horasPropias()) {
        <div class="tp-especial__franjas">
          @for (f of franjas(); track $index; let j = $index) {
            <div class="tp-franja">
              <sc-tp-hora [valor]="f[0]" [etiqueta]="t.desde" (cambio)="poner(j, 0, $event)" />
              <span class="tp-franja__a" aria-hidden="true"></span>
              <sc-tp-hora [valor]="f[1]" fin [etiqueta]="t.hasta" (cambio)="poner(j, 1, $event)" />
              @if (franjas().length > 1) {
                <button type="button" class="tp-btn tp-btn--ghost tp-btn--icon tp-btn--sm" [attr.aria-label]="t.quitarFranja" (click)="quitarFranja(j)">
                  <sc-tp-icono nombre="x" [tam]="14" />
                </button>
              }
            </div>
          }
          <button type="button" class="tp-btn tp-btn--ghost tp-btn--sm" (click)="anadirFranja()">
            <sc-tp-icono nombre="plus" [tam]="14" />
            Franja
          </button>
        </div>
      }

      <div class="tp-especial__vista">
        <sc-tp-linea [trozos]="trozos()" color="var(--tp-especial)" />
        <div class="tp-ficha__eje t-num" aria-hidden="true">
          @for (h of [0, 6, 12, 18, 24]; track h) {
            <span>{{ h }}</span>
          }
        </div>
      </div>

      @if (error(); as e) {
        <p class="tp-error" role="alert"><sc-tp-icono nombre="alert" [tam]="14" />{{ e }}</p>
      }

      <div tpPie class="tp-modal__acciones">
        @if (especial(); as e) {
          <button type="button" class="tp-btn tp-btn--ghost tp-btn--peligro" (click)="quitar.emit(e.id)">
            <sc-tp-icono nombre="trash" [tam]="14" />
            Quitar
          </button>
        }
        <span class="tp-spacer"></span>
        <button type="button" class="tp-btn" (click)="cerrado.emit()">Cancelar</button>
        <button type="button" class="tp-btn tp-btn--primary" [disabled]="!!error()" (click)="confirmar()">{{ especial() ? 'Guardar' : 'Añadir día' }}</button>
      </div>
    </sc-tp-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpEspecialComponent implements OnInit {
  protected readonly t = T;
  readonly especial = input<FechaEspecial | null>(null);
  readonly fecha = input<string | null>(null);
  /** Empieza con horas (p. ej. para abrir un festivo). */
  readonly abrir = input(false);
  readonly existentes = input<readonly FechaEspecial[]>([]);
  readonly semana = input<Semana>([]);
  readonly guardar = output<Nueva>();
  readonly quitar = output<number>();
  readonly cerrado = output<void>();

  protected readonly meses = MESES;
  protected readonly modos = [
    { valor: 'cerrado', etiqueta: 'Cerrado todo el día', icono: 'lock' as const },
    { valor: 'horas', etiqueta: 'Otras horas', icono: 'clock' as const },
  ];

  protected readonly dia = signal(1);
  protected readonly mes = signal(1);
  protected readonly anio = signal(2026);
  protected readonly cadaAnio = signal(false);
  protected readonly nombre = signal('');
  protected readonly horasPropias = signal(false);
  protected readonly franjas = signal<Franja[]>([[540, 840]]);

  ngOnInit(): void {
    const e = this.especial();
    const base = e?.date ?? this.fecha() ?? ahoraEn('Europe/Madrid').fecha;
    this.anio.set(Number(base.slice(0, 4)));
    this.mes.set(Number(base.slice(5, 7)));
    this.dia.set(Number(base.slice(8)));
    if (e) {
      this.cadaAnio.set(e.yearly);
      this.nombre.set(e.name);
      this.horasPropias.set(e.slots.length > 0);
      if (e.slots.length) this.franjas.set([...e.slots]);
      return;
    }
    // Por defecto, las horas de ese día de la semana (lo normal es recortarlas, no inventarlas).
    const habitual = this.semana()[diaDeLaSemana(base)] ?? [];
    if (habitual.length) this.franjas.set([...habitual]);
    this.horasPropias.set(this.abrir());
    this.nombre.set(this.abrir() ? 'Abierto' : '');
  }

  protected readonly anios = computed(() => {
    const a = Number(ahoraEn('Europe/Madrid').fecha.slice(0, 4));
    return [a - 1, a, a + 1, a + 2];
  });

  protected clamp(n: number): number {
    return Math.min(31, Math.max(1, Math.round(n) || 1));
  }

  private readonly iso = computed(() => {
    const max = new Date(Date.UTC(this.anio(), this.mes(), 0)).getUTCDate();
    return `${this.anio()}-${pad(this.mes())}-${pad(Math.min(this.dia(), max))}`;
  });

  protected readonly subtitulo = computed(() => capital(fmtLargo(this.iso())) + (this.cadaAnio() ? ', cada año' : ''));

  protected readonly trozos = computed(() =>
    this.horasPropias() ? this.franjas().map((f) => ({ desde: f[0], hasta: f[1] > f[0] ? f[1] : 1440, arrastre: false })) : [],
  );

  protected cambiarModo(v: string): void {
    this.horasPropias.set(v === 'horas');
  }

  protected poner(j: number, lado: 0 | 1, m: number): void {
    this.franjas.update((l) => l.map((f, k) => (k === j ? ((lado === 0 ? [m, f[1]] : [f[0], m]) as Franja) : f)));
  }

  protected anadirFranja(): void {
    this.franjas.update((l) => {
      const u = l[l.length - 1];
      const desde = Math.min((u ? u[1] : 840) + 60, 1380);
      return [...l, [desde, Math.min(desde + 120, 1440)]];
    });
  }

  protected quitarFranja(j: number): void {
    this.franjas.update((l) => l.filter((_, k) => k !== j));
  }

  private readonly borrador = computed<Nueva>(() => ({
    id: this.especial()?.id ?? null,
    name: this.nombre().trim() || (this.horasPropias() ? 'Horario especial' : 'Cerrado'),
    date: this.iso(),
    yearly: this.cadaAnio(),
    slots: this.horasPropias() ? this.franjas() : [],
  }));

  protected readonly error = computed(() => {
    const b = this.borrador();
    if (this.horasPropias()) {
      const f = validarFranjas(b.slots);
      if (f === 'solape') return 'Dos franjas se pisan';
      if (f) return 'Revisa las horas';
    }
    const rep = diaRepetido(this.existentes(), { ...b, id: b.id ?? -1 });
    return rep ? `Ya hay un día especial ese día: «${rep.name}»` : '';
  });

  protected confirmar(): void {
    if (!this.error()) this.guardar.emit(this.borrador());
  }
}

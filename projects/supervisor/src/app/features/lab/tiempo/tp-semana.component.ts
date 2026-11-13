import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { type Franja, type Semana, validarSemana } from '@features/admin/repositories/state/horarios.core.mjs';

import { TpIconoComponent } from './tp-icono.component';
import { COLORES_DE_TRAMO, horas, LETRAS, NOMBRES, semanaDe, type Tramo, tramosDe, trozosDelDia, textoDeFranja } from './tp-modelo';
import { TpHoraComponent } from './tp-piezas';
import { T } from './tp-textos';

const PROBLEMA: Record<string, string> = {
  hora: 'falta una hora o no es válida',
  vacia: 'una franja empieza y acaba a la vez',
  solape: 'dos franjas se pisan',
  noche: 'solo la última franja puede pasar de medianoche',
  pisa_siguiente: 'la franja de noche pisa la mañana siguiente',
};

/**
 * La semana habitual, en dos piezas que se miran: arriba la semana dibujada (siete líneas de 24 h, cada tramo con su
 * color) y debajo los tramos que la forman (unos días y sus franjas). Pasar por una fila enciende su tramo y al revés.
 * Un día solo vive en un tramo: marcarlo en otro lo mueve.
 */
@Component({
  selector: 'sc-tp-semana',
  imports: [TpHoraComponent, TpIconoComponent],
  template: `
    <div class="tp-sem" [class.tp-sem--compacta]="compacta()">
      <!-- La semana dibujada -->
      <div class="tp-sem__mapa" role="img" [attr.aria-label]="resumenAccesible()">
        <div class="tp-sem__eje t-micro t-3 t-num" aria-hidden="true">
          <span></span>
          <span class="tp-sem__horas">
            @for (h of marcas; track h) {
              <span [style.left.%]="(h / 24) * 100">{{ h }}</span>
            }
          </span>
          <span></span>
        </div>
        @for (f of filas(); track f.dia) {
          <div
            class="tp-sem__fila"
            [class.is-on]="filaEncendida(f.dia)"
            [class.is-hoy]="ahora()?.dia === f.dia"
            [class.is-mal]="error()?.dia === f.dia"
            [class.is-senalado]="senalado() === f.dia"
            (mouseenter)="activo.set(f.tramo)"
            (mouseleave)="activo.set(null)"
          >
            <span class="tp-sem__letra t-micro t-strong">{{ letras[f.dia] }}</span>
            <span class="tp-sem__pista" [class.tp-linea--cerrada]="f.trozos.length === 0">
              <span class="tp-sem__guias" aria-hidden="true"></span>
              @for (t of f.trozos; track $index) {
                <span
                  class="tp-linea__tramo"
                  [class.tp-linea__tramo--arrastre]="t.arrastre"
                  [style.--c]="t.color"
                  [style.left.%]="(t.desde / 1440) * 100"
                  [style.width.%]="((t.hasta - t.desde) / 1440) * 100"
                  [attr.data-tip]="t.texto"
                ></span>
              }
              @if (ahora()?.dia === f.dia) {
                <span class="tp-linea__ahora" [style.left.%]="(ahora()!.minutos / 1440) * 100"></span>
              }
            </span>
            <span class="tp-sem__total t-micro t-num" [class.t-3]="f.minutos === 0">{{ f.minutos === 0 ? 'Cerrado' : horasTxt(f.minutos) }}</span>
          </div>
        }
        @if (error(); as e) {
          <p class="tp-error tp-sem__error" role="alert">
            <sc-tp-icono nombre="alert" [tam]="14" />
            {{ capital(nombres[e.dia]) }}: {{ problema[e.codigo] }}
          </p>
        }
      </div>

      <!-- Los tramos que la forman -->
      <ol class="tp-tramos" role="list">
        @for (tramo of tramos(); track $index; let i = $index) {
          <li
            class="tp-tramo"
            [class.is-on]="activo() === i"
            [style.--c]="color(i)"
            (mouseenter)="activo.set(i)"
            (mouseleave)="activo.set(null)"
            (focusin)="activo.set(i)"
            (focusout)="activo.set(null)"
          >
            <div class="tp-tramo__dias" role="group" [attr.aria-label]="t.diasDelTramo(i)">
              @for (l of letras; track d; let d = $index) {
                <button type="button" class="tp-chip" [attr.aria-pressed]="tramo.dias.includes(d)" [attr.aria-label]="nombres[d]" [attr.data-tip]="capital(nombres[d])" (click)="alternar(i, d)">{{ l }}</button>
              }
              <span class="tp-spacer"></span>
              <button type="button" class="tp-btn tp-btn--ghost tp-btn--sm tp-tramo__24" [attr.aria-pressed]="es24(tramo)" (click)="poner24(i)">24 h</button>
              <button type="button" class="tp-btn tp-btn--ghost tp-btn--icon tp-btn--sm" [attr.aria-label]="t.quitarTramo(i)" (click)="quitar(i)">
                <sc-tp-icono nombre="x" [tam]="14" />
              </button>
            </div>
            <div class="tp-tramo__franjas">
              @if (es24(tramo)) {
                <span class="tp-tramo__siempre t-small t-2"><sc-tp-icono nombre="clock" [tam]="14" />Todo el día, de 00:00 a 24:00</span>
              } @else {
                @for (f of tramo.franjas; track $index; let j = $index) {
                  <div class="tp-franja">
                    <sc-tp-hora [valor]="f[0]" [etiqueta]="t.desde" (cambio)="ponerHora(i, j, 0, $event)" />
                    <span class="tp-franja__a" aria-hidden="true"></span>
                    <sc-tp-hora [valor]="f[1]" fin [etiqueta]="t.hasta" (cambio)="ponerHora(i, j, 1, $event)" />
                    @if (f[1] <= f[0]) {
                      <span class="tp-pill tp-pill--accent tp-franja__noche" data-tip="Acaba al día siguiente"><sc-tp-icono nombre="moon" [tam]="12" />+1</span>
                    }
                    @if (tramo.franjas.length > 1) {
                      <button type="button" class="tp-btn tp-btn--ghost tp-btn--icon tp-btn--sm tp-franja__x" [attr.aria-label]="t.quitarFranja" (click)="quitarFranja(i, j)">
                        <sc-tp-icono nombre="x" [tam]="14" />
                      </button>
                    }
                  </div>
                }
                <button type="button" class="tp-btn tp-btn--ghost tp-btn--sm tp-tramo__mas" (click)="anadirFranja(i)">
                  <sc-tp-icono nombre="plus" [tam]="14" />
                  Franja
                </button>
              }
            </div>
          </li>
        }
      </ol>

      <div class="tp-sem__pie">
        <button type="button" class="tp-btn tp-btn--sm" [disabled]="cerrados().length === 0" (click)="anadir()">
          <sc-tp-icono nombre="plus" [tam]="14" />
          Días con otro horario
        </button>
        @if (cerrados().length > 0 && cerrados().length < 7) {
          <span class="t-micro t-3">Cerrado {{ cerradosTexto() }}</span>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpSemanaComponent {
  protected readonly t = T;
  readonly semana = input.required<Semana>();
  /** Un día a señalar (lo pide el calendario al pulsar la inicial de un día). */
  readonly senalado = input<number | null>(null);
  /** El día de la semana y el minuto de ahora, para la raya roja. */
  readonly ahora = input<{ dia: number; minutos: number } | null>(null);
  readonly compacta = input(false, { transform: booleanAttribute });
  readonly semanaChange = output<Semana>();

  protected readonly letras = LETRAS;
  protected readonly nombres = NOMBRES;
  protected readonly problema = PROBLEMA;
  protected readonly marcas = [0, 6, 12, 18, 24];
  protected readonly capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
  protected readonly horasTxt = horas;
  protected readonly activo = signal<number | null>(null);

  /* Los tramos viven aparte mientras se editan: uno recién añadido aún no tiene días y la semana no puede contarlo. Se
   * recalculan cuando la semana llega de fuera (deshacer, cargar). */
  private ultima: Semana | null = null;
  private borrador: Tramo[] = [];
  protected readonly tramos = computed<Tramo[]>(() => {
    const s = this.semana();
    if (s !== this.ultima) this.borrador = tramosDe(s);
    return this.borrador;
  });

  protected color(i: number): string {
    return COLORES_DE_TRAMO[i % COLORES_DE_TRAMO.length];
  }

  private tramoDe(dia: number): number {
    return this.tramos().findIndex((t) => t.dias.includes(dia));
  }

  protected readonly filas = computed(() => {
    const s = this.semana();
    const tramos = this.tramos();
    return [0, 1, 2, 3, 4, 5, 6].map((dia) => {
      const trozos = trozosDelDia(s, dia).map((tz) => {
        const de = tz.arrastre ? (dia + 6) % 7 : dia;
        const i = tramos.findIndex((t) => t.dias.includes(de));
        return { ...tz, color: this.color(Math.max(0, i)), texto: tz.arrastre ? `Viene de la noche anterior, hasta las ${textoDeFranja(tz.franja).split('–')[1]}` : textoDeFranja(tz.franja) };
      });
      return { dia, trozos, tramo: this.tramoDe(dia), minutos: trozos.reduce((n, t) => n + t.hasta - t.desde, 0) };
    });
  });

  protected filaEncendida(dia: number): boolean {
    const a = this.activo();
    return a !== null && a >= 0 && (this.tramos()[a]?.dias.includes(dia) ?? false);
  }

  protected readonly error = computed(() => validarSemana(this.semana()));

  protected readonly cerrados = computed(() => {
    const usados = new Set(this.tramos().flatMap((t) => t.dias));
    return [0, 1, 2, 3, 4, 5, 6].filter((d) => !usados.has(d));
  });
  protected readonly cerradosTexto = computed(() => {
    const n = this.cerrados().map((d) => NOMBRES[d]);
    return n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}` : n[0];
  });

  protected readonly resumenAccesible = computed(() =>
    this.filas()
      .map((f) => `${NOMBRES[f.dia]}: ${f.trozos.length ? f.trozos.map((t) => t.texto).join(', ') : 'cerrado'}`)
      .join('; '),
  );

  protected es24(t: Tramo): boolean {
    return t.franjas.length === 1 && t.franjas[0][0] === 0 && t.franjas[0][1] === 1440;
  }

  private emitir(tramos: Tramo[]): void {
    this.borrador = tramos;
    const s = semanaDe(tramos);
    this.ultima = s;
    this.semanaChange.emit(s);
  }

  protected alternar(i: number, dia: number): void {
    const tramos = this.tramos();
    const ya = tramos[i].dias.includes(dia);
    this.emitir(tramos.map((t, j) => (j === i ? { ...t, dias: ya ? t.dias.filter((d) => d !== dia) : [...t.dias, dia].sort() } : ya ? t : { ...t, dias: t.dias.filter((d) => d !== dia) })));
  }

  protected ponerHora(i: number, j: number, lado: 0 | 1, minutos: number): void {
    this.emitir(
      this.tramos().map((t, k) => (k === i ? { ...t, franjas: t.franjas.map((f, m) => (m === j ? ((lado === 0 ? [minutos, f[1]] : [f[0], minutos]) as Franja) : f)) } : t)),
    );
  }

  protected poner24(i: number): void {
    this.emitir(this.tramos().map((t, k) => (k === i ? { ...t, franjas: this.es24(t) ? [[540, 1080] as Franja] : [[0, 1440] as Franja] } : t)));
  }

  protected anadirFranja(i: number): void {
    this.emitir(
      this.tramos().map((t, k) => {
        if (k !== i) return t;
        const ultima = t.franjas[t.franjas.length - 1];
        if (!ultima) return { ...t, franjas: [[540, 1080] as Franja] };
        const desde = Math.min((ultima[1] > ultima[0] ? ultima[1] : 1380) + 60, 1380);
        return { ...t, franjas: [...t.franjas, [desde, Math.min(desde + 180, 1440)] as Franja] };
      }),
    );
  }

  protected quitarFranja(i: number, j: number): void {
    this.emitir(this.tramos().map((t, k) => (k === i ? { ...t, franjas: t.franjas.filter((_, m) => m !== j) } : t)));
  }

  protected quitar(i: number): void {
    this.activo.set(null);
    this.emitir(this.tramos().filter((_, j) => j !== i));
  }

  /** El tramo nuevo nace con los días que quedan cerrados y 10:00–14:00: lo normal es que sea el fin de semana. */
  protected anadir(): void {
    this.emitir([...this.tramos(), { dias: this.cerrados(), franjas: [[600, 840]] }]);
  }
}

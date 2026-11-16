import { ChangeDetectionStrategy, Component, computed, DestroyRef, DOCUMENT, inject, input, output, signal } from '@angular/core';

import { diaDeLaSemana, LETRAS, MESES } from './cal-modelo';

/** Cómo se pinta un día: su tono, la regla que lo decide (para resaltarla) y lo que oye el lector. */
export interface DiaVista {
  readonly tono: 'abierto' | 'cerrado' | 't-info' | 't-violet' | 't-success' | 't-primary' | 't-warning' | 't-danger';
  readonly clave: string;
  readonly etiqueta: string;
  /** Cerrado todo el día: se raya (en la vista por locución, donde el color ya no lo dice). */
  readonly rayado?: boolean;
}

export interface Rango {
  readonly desde: string;
  readonly hasta: string;
}

const normal = (a: string, b: string): Rango => (a <= b ? { desde: a, hasta: b } : { desde: b, hasta: a });

/**
 * PROTOTIPO DE DISCOVERY: el año entero en doce meses, cada día un color con su leyenda, como el Excel que ya usa
 * posventa. Cabe en una pantalla porque las celdas no llevan texto, solo el número. En modo `elegir` se pulsa un día o
 * se arrastra sobre varios (Mayúsculas amplía desde el último); en modo `leer` solo se pulsa un día para ver qué pasa.
 */
@Component({
  selector: 'sc-cal-anio',
  template: `
    @for (mes of meses(); track mes.indice) {
      <section class="mes" [attr.aria-label]="mes.nombre">
        <h3 class="mes__nombre sc-text-caption-semibold">{{ mes.nombre }}</h3>
        <div class="mes__rejilla">
          @for (l of letras; track $index) {
            <span class="mes__letra sc-text-caption-regular" aria-hidden="true">{{ l }}</span>
          }
          @for (h of mes.huecos; track $index) {
            <span aria-hidden="true"></span>
          }
          @for (d of mes.dias; track d.iso) {
            @let v = dias().get(d.iso);
            <button
              type="button"
              class="dia sc-text-caption-regular"
              [attr.data-tono]="v?.tono ?? 'abierto'"
              [class.dia--rayado]="v?.rayado"
              [class.dia--hoy]="d.iso === hoy()"
              [class.dia--sel]="enSeleccion(d.iso)"
              [class.dia--apagado]="resaltar() !== null && v?.clave !== resaltar()"
              [attr.aria-label]="v?.etiqueta ?? d.iso"
              [attr.aria-pressed]="enSeleccion(d.iso)"
              (pointerdown)="bajar($event, d.iso)"
              (pointerenter)="entrar(d.iso)"
              (pointerleave)="encima.emit(null)"
              (focus)="encima.emit(d.iso)"
              (click)="pulsar($event, d.iso)"
            >{{ d.n }}</button>
          }
        </div>
      </section>
    }
  `,
  host: { '[class.grande]': "tamano() === 'grande'", '[class.elegir]': "modo() === 'elegir'" },
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--sc-spacing-1) var(--sc-spacing-1-25);
      user-select: none;
    }
    :host(.grande) { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--sc-spacing-1) var(--sc-spacing-2); }
    :host(.grande) .dia { aspect-ratio: 1.45; }
    .mes { min-inline-size: 0; }
    .mes__nombre { margin: 0 0 var(--sc-spacing-0-25); color: var(--sc-text-heading); text-transform: capitalize; }
    .mes__rejilla { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: var(--sc-spacing-0-25) var(--sc-spacing-0-125); }
    .mes__letra { text-align: center; color: var(--sc-text-subtle); }
    /* VISUAL (fuera del DS a propósito): el DS solo tiene el tinte -subtle (50) y el sólido; aquí hace falta un tinte medio
       que se lea a un vistazo. Se mezcla el sólido semántico con la superficie, así sigue al tema oscuro. Candidato al Kit. */
    .dia {
      --tinte: transparent;
      position: relative;
      display: grid; place-items: center;
      aspect-ratio: 1.2;
      min-inline-size: 0;
      padding: 0;
      border: 0;
      border-radius: var(--sc-radius-sm);
      background: var(--tinte);
      color: var(--sc-text-heading);
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition: opacity 150ms ease-out, box-shadow 150ms ease-out, transform 150ms ease-out;
      &:focus-visible { outline: 2px solid var(--sc-border-focus); outline-offset: 1px; z-index: 1; }
    }
    .dia[data-tono='abierto'] { --tinte: color-mix(in srgb, var(--sc-text-heading) 6%, var(--sc-bg-surface)); }
    .dia[data-tono='cerrado'] { color: var(--sc-text-subtle); }
    .dia[data-tono='t-info'] { --tinte: color-mix(in srgb, var(--sc-bg-info) 34%, var(--sc-bg-surface)); }
    .dia[data-tono='t-violet'] { --tinte: color-mix(in srgb, var(--sc-bg-violet) 30%, var(--sc-bg-surface)); }
    .dia[data-tono='t-success'] { --tinte: color-mix(in srgb, var(--sc-bg-success) 30%, var(--sc-bg-surface)); }
    .dia[data-tono='t-primary'] { --tinte: color-mix(in srgb, var(--sc-bg-primary) 26%, var(--sc-bg-surface)); }
    .dia[data-tono='t-warning'] { --tinte: color-mix(in srgb, var(--sc-bg-warning) 55%, var(--sc-bg-surface)); }
    .dia[data-tono='t-danger'] { --tinte: color-mix(in srgb, var(--sc-bg-danger) 72%, var(--sc-bg-surface)); color: var(--sc-text-on-error); font-weight: 600; }
    .dia--rayado {
      background-image: repeating-linear-gradient(135deg, transparent 0 3px, color-mix(in srgb, currentColor 22%, transparent) 3px 4px);
    }
    .dia--hoy { box-shadow: 0 0 0 2px var(--sc-text-heading); font-weight: 600; z-index: 1; }
    .dia--apagado { opacity: 0.28; }
    .dia--sel { box-shadow: inset 0 0 0 2px var(--sc-border-primary); background-color: var(--sc-bg-primary-subtle-active); color: var(--sc-text-heading); }
    .dia:hover { transform: scale(1.08); z-index: 1; }
    .dia--sel:hover { box-shadow: inset 0 0 0 2px var(--sc-border-primary); }
    @media (prefers-reduced-motion: reduce) { .dia { transition: none; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalAnioComponent {
  readonly anio = input.required<number>();
  readonly dias = input.required<ReadonlyMap<string, DiaVista>>();
  readonly seleccion = input<Rango | null>(null);
  readonly modo = input<'leer' | 'elegir'>('leer');
  readonly tamano = input<'compacto' | 'grande'>('compacto');
  /** La clave de una regla: sus días se quedan con su color y los demás se apagan. */
  readonly resaltar = input<string | null>(null);
  readonly hoy = input('');
  readonly seleccionChange = output<Rango | null>();
  readonly encima = output<string | null>();

  protected readonly letras = LETRAS;
  private arrastre: string | null = null;
  private ancla: string | null = null;
  private readonly provisional = signal<Rango | null>(null);
  private readonly visible = computed(() => this.provisional() ?? this.seleccion());

  protected readonly meses = computed(() => {
    const anio = this.anio();
    return MESES.map((nombre, indice) => {
      const total = new Date(Date.UTC(anio, indice + 1, 0)).getUTCDate();
      const primero = `${anio}-${String(indice + 1).padStart(2, '0')}-01`;
      return {
        indice,
        nombre,
        huecos: Array.from({ length: diaDeLaSemana(primero) }),
        dias: Array.from({ length: total }, (_, i) => ({ n: i + 1, iso: `${anio}-${String(indice + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}` })),
      };
    });
  });

  constructor() {
    const doc = inject(DOCUMENT);
    const soltar = (): void => {
      if (this.arrastre === null) return;
      this.arrastre = null;
      const r = this.provisional();
      this.provisional.set(null);
      if (r) this.seleccionChange.emit(r);
    };
    doc.addEventListener('pointerup', soltar);
    inject(DestroyRef).onDestroy(() => doc.removeEventListener('pointerup', soltar));
  }

  protected enSeleccion(iso: string): boolean {
    const r = this.visible();
    return !!r && iso >= r.desde && iso <= r.hasta;
  }

  protected bajar(ev: PointerEvent, iso: string): void {
    if (ev.button !== 0) return;
    if (this.modo() !== 'elegir') return;
    if (ev.shiftKey && this.ancla) {
      this.seleccionChange.emit(normal(this.ancla, iso));
      return;
    }
    this.arrastre = iso;
    this.ancla = iso;
    this.provisional.set({ desde: iso, hasta: iso });
  }

  protected entrar(iso: string): void {
    this.encima.emit(iso);
    if (this.arrastre !== null) this.provisional.set(normal(this.arrastre, iso));
  }

  /** Con el ratón, la selección ya la ha hecho el arrastre; esto es para el teclado y para el modo `leer`. */
  protected pulsar(ev: MouseEvent, iso: string): void {
    if (this.modo() === 'leer') {
      const r = this.seleccion();
      this.seleccionChange.emit(r && r.desde === iso && r.hasta === iso ? null : { desde: iso, hasta: iso });
      return;
    }
    if (ev.detail !== 0) return;
    if (ev.shiftKey && this.ancla) this.seleccionChange.emit(normal(this.ancla, iso));
    else {
      this.ancla = iso;
      this.seleccionChange.emit({ desde: iso, hasta: iso });
    }
  }
}

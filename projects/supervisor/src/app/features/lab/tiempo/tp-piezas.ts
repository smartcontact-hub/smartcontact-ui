import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  type ElementRef,
  HostListener,
  inject,
  Injectable,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { horaDe } from '@features/admin/repositories/state/horarios.core.mjs';

import { type NombreDeIcono, TpIconoComponent } from './tp-icono.component';
import type { Trozo } from './tp-modelo';

/* ── Control segmentado ─────────────────────────────────────────────────────────────────────────────────────────── */

export interface OpcionSeg<V extends string = string> {
  readonly valor: V;
  readonly etiqueta: string;
  readonly n?: number;
  readonly icono?: NombreDeIcono;
}

/** Opciones en una pastilla; el fondo de la elegida se desliza hasta ella (no salta). */
@Component({
  selector: 'sc-tp-seg',
  imports: [TpIconoComponent],
  template: `
    <div #raiz class="tp-seg" [class.tp-seg--sm]="pequeno()" role="group" [attr.aria-label]="etiqueta()">
      <span class="tp-seg__thumb" [style.translate]="x() + 'px 0'" [style.inline-size.px]="w()" [style.transition]="listo() ? null : 'none'"></span>
      @for (o of opciones(); track o.valor) {
        <button type="button" class="tp-seg__opt" [attr.aria-pressed]="o.valor === valor()" [attr.data-v]="o.valor" (click)="cambio.emit(o.valor)">
          @if (o.icono) {
            <sc-tp-icono [nombre]="o.icono" [tam]="14" />
          }
          {{ o.etiqueta }}
          @if (o.n !== undefined) {
            <span class="tp-seg__n">{{ o.n }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: `:host { display: inline-flex; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpSegComponent {
  readonly opciones = input.required<readonly OpcionSeg[]>();
  readonly valor = input.required<string>();
  readonly etiqueta = input('');
  readonly pequeno = input(false, { transform: booleanAttribute });
  readonly cambio = output<string>();

  private readonly raiz = viewChild.required<ElementRef<HTMLElement>>('raiz');
  protected readonly x = signal(0);
  protected readonly w = signal(0);
  /** La primera medida se pinta sin transición: la pastilla no entra deslizándose al cargar. */
  protected readonly listo = signal(false);

  constructor() {
    afterRenderEffect(() => {
      this.valor();
      this.opciones();
      this.medir();
    });
    const ro = new ResizeObserver(() => this.medir());
    afterNextRender(() => {
      ro.observe(this.raiz().nativeElement);
      requestAnimationFrame(() => this.listo.set(true));
    });
    inject(DestroyRef).onDestroy(() => ro.disconnect());
  }

  private medir(): void {
    const b = this.raiz().nativeElement.querySelector<HTMLElement>(`[data-v="${CSS.escape(this.valor())}"]`);
    if (!b) return;
    this.x.set(b.offsetLeft);
    this.w.set(b.offsetWidth);
  }
}

/* ── Hora ───────────────────────────────────────────────────────────────────────────────────────────────────────── */

/** «9» → 540, «930» → 570, «9:30», «21h». `null` si no se entiende. */
export function leerHora(texto: string, permiteFin: boolean): number | null {
  const t = texto.trim().toLowerCase().replace(/h$/, '').replace('.', ':');
  let h: number;
  let m = 0;
  if (/^\d{1,2}:\d{1,2}$/.test(t)) [h, m] = t.split(':').map(Number);
  else if (/^\d{1,2}$/.test(t)) h = Number(t);
  else if (/^\d{3,4}$/.test(t)) [h, m] = [Number(t.slice(0, -2)), Number(t.slice(-2))];
  else return null;
  if (m > 59 || h > 24 || (h === 24 && (m !== 0 || !permiteFin))) return null;
  return h * 60 + m;
}

/** Un campo de hora corto: se escribe como sea («9», «930», «21h») y las flechas suben o bajan 15 minutos. */
@Component({
  selector: 'sc-tp-hora',
  template: `
    <input
      class="tp-hora"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      maxlength="5"
      [value]="texto()"
      [attr.aria-label]="etiqueta()"
      [attr.aria-invalid]="mal() || null"
      (focus)="$any($event.target).select()"
      (input)="mal.set(false)"
      (keydown)="tecla($event)"
      (blur)="fijar($any($event.target))"
    />
  `,
  styles: `:host { display: inline-flex; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpHoraComponent {
  readonly valor = input.required<number>();
  /** Si es el fin de una franja: admite 24:00. */
  readonly fin = input(false, { transform: booleanAttribute });
  readonly etiqueta = input('');
  readonly cambio = output<number>();
  protected readonly mal = signal(false);
  protected readonly texto = computed(() => horaDe(this.valor()));

  protected tecla(e: KeyboardEvent): void {
    const input = e.target as HTMLInputElement;
    if (e.key === 'Enter') {
      this.fijar(input);
      return;
    }
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const paso = (e.shiftKey ? 60 : 15) * (e.key === 'ArrowUp' ? 1 : -1);
    const tope = this.fin() ? 1440 : 1425;
    const base = leerHora(input.value, this.fin()) ?? this.valor();
    const n = Math.min(tope, Math.max(0, Math.round((base + paso) / 15) * 15));
    input.value = horaDe(n);
    this.cambio.emit(n);
  }

  protected fijar(input: HTMLInputElement): void {
    const n = leerHora(input.value, this.fin());
    if (n === null) {
      this.mal.set(input.value.trim() !== '');
      input.value = horaDe(this.valor());
      return;
    }
    this.mal.set(false);
    input.value = horaDe(n);
    if (n !== this.valor()) this.cambio.emit(n);
  }
}

/* ── La línea de 24 h ───────────────────────────────────────────────────────────────────────────────────────────── */

/** Un día de 0 a 24 h con sus tramos abiertos. El tramo que viene de la víspera va rayado; «ahora», una raya roja. */
@Component({
  selector: 'sc-tp-linea',
  template: `
    <span class="tp-linea" [class.tp-linea--cerrada]="cerrada() && trozos().length === 0" [style.--c]="color()">
      @for (t of trozos(); track $index) {
        <span class="tp-linea__tramo" [class.tp-linea__tramo--arrastre]="t.arrastre" [style.left.%]="(t.desde / 1440) * 100" [style.width.%]="((t.hasta - t.desde) / 1440) * 100"></span>
      }
      @if (ahora() !== null) {
        <span class="tp-linea__ahora" [style.left.%]="(ahora()! / 1440) * 100"></span>
      }
    </span>
  `,
  styles: `:host { display: block; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpLineaComponent {
  readonly trozos = input.required<readonly Pick<Trozo, 'desde' | 'hasta' | 'arrastre'>[]>();
  readonly color = input<string | null>(null);
  readonly ahora = input<number | null>(null);
  readonly cerrada = input(true);
}

/* ── Avisos ─────────────────────────────────────────────────────────────────────────────────────────────────────── */

export interface Aviso {
  readonly id: number;
  readonly texto: string;
  readonly accion?: { readonly etiqueta: string; readonly hacer: () => void };
}

/** Los avisos de las pantallas de Tiempo: un texto corto y, si se puede, «Deshacer». */
@Injectable({ providedIn: 'root' })
export class TpAvisos {
  readonly lista = signal<readonly Aviso[]>([]);
  private n = 0;

  decir(texto: string, accion?: Aviso['accion']): void {
    const id = ++this.n;
    this.lista.update((l) => [...l.slice(-2), { id, texto, accion }]);
    setTimeout(() => this.quitar(id), accion ? 6000 : 3200);
  }

  quitar(id: number): void {
    this.lista.update((l) => l.filter((a) => a.id !== id));
  }
}

@Component({
  selector: 'sc-tp-avisos',
  imports: [TpIconoComponent],
  template: `
    <div class="tp-toasts" role="status" aria-live="polite">
      @for (a of avisos.lista(); track a.id) {
        <div class="tp-toast" animate.leave="tp-out">
          <sc-tp-icono nombre="check" [tam]="16" [trazo]="2" />
          <span>{{ a.texto }}</span>
          @if (a.accion; as acc) {
            <button type="button" class="tp-btn tp-btn--sm" (click)="acc.hacer(); avisos.quitar(a.id)">
              <sc-tp-icono nombre="undo" [tam]="14" />
              {{ acc.etiqueta }}
            </button>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpAvisosComponent {
  protected readonly avisos = inject(TpAvisos);
}

/* ── Modal ──────────────────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * La capa de los diálogos: fondo desenfocado, el panel entra creciendo de 0,96 y sale apagándose. Esc y pulsar fuera
 * cierran. El foco entra en el primer campo y vuelve a donde estaba al cerrar.
 */
@Component({
  selector: 'sc-tp-modal',
  imports: [TpIconoComponent],
  template: `
    <div class="tp-capa" (pointerdown)="fuera($event)" animate.leave="tp-capa--sale">
      <div #panel class="tp-modal" role="dialog" aria-modal="true" [attr.aria-label]="titulo()" [style.--w]="ancho()">
        <header class="tp-modal__head">
          @if (icono(); as i) {
            <span [class]="'tp-mark tp-mark--' + tono()" [style.--c]="color()"><sc-tp-icono [nombre]="i" [tam]="16" /></span>
          }
          <div class="tp-modal__titles">
            <h2 class="t-title">{{ titulo() }}</h2>
            @if (subtitulo()) {
              <p class="t-small t-3">{{ subtitulo() }}</p>
            }
          </div>
          <button type="button" class="tp-btn tp-btn--ghost tp-btn--icon tp-btn--sm" [attr.aria-label]="cerrarTexto" (click)="cerrar.emit()">
            <sc-tp-icono nombre="x" [tam]="16" />
          </button>
        </header>
        <div class="tp-modal__body"><ng-content /></div>
        <footer class="tp-modal__foot"><ng-content select="[tpPie]" /></footer>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpModalComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
  readonly ancho = input('32rem');
  readonly icono = input<NombreDeIcono | null>(null);
  readonly tono = input<'festivo' | 'especial' | 'periodo' | 'neutro'>('neutro');
  readonly color = input<string | null>(null);
  readonly cerrar = output<void>();
  protected readonly cerrarTexto = 'Cerrar';

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly antes = document.activeElement as HTMLElement | null;

  constructor() {
    afterNextRender(() => {
      const primero = this.panel().nativeElement.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea, .tp-modal__body button');
      primero?.focus();
    });
    inject(DestroyRef).onDestroy(() => this.antes?.focus?.());
  }

  protected fuera(e: PointerEvent): void {
    if (e.target === e.currentTarget) this.cerrar.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected esc(e: Event): void {
    e.stopPropagation();
    this.cerrar.emit();
  }
}

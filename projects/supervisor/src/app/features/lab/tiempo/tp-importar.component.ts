import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';

import { type CalendarioDeFestivos, type Festivo, FestivosStore } from '@features/admin/repositories/state/festivos.store';

import { diasDe, esFija, REGIONES } from '../horarios/lab-festivos-catalogo';
import { TpIconoComponent } from './tp-icono.component';
import { fmtDia, MESES_CORTOS, NOMBRES } from './tp-modelo';
import { TpModalComponent } from './tp-piezas';
import { T } from './tp-textos';

type DiaNuevo = Omit<Festivo, 'id'>;

/** Banderas dibujadas con CSS: nítidas a cualquier tamaño y sin depender de imágenes. */
export const BANDERAS: Record<string, string> = {
  es: 'linear-gradient(#c60b1e 25%, #ffc400 25% 75%, #c60b1e 75%)',
  'es-md': 'radial-gradient(circle at 50% 50%, #fff 0 8%, transparent 9%), #c8102e',
  'es-ct': 'repeating-linear-gradient(#fcdd09 0 11.11%, #da121a 11.11% 22.22%)',
  'es-an': 'linear-gradient(#007a33 33.3%, #fff 33.3% 66.6%, #007a33 66.6%)',
  mx: 'linear-gradient(90deg, #006847 33.3%, #fff 33.3% 66.6%, #ce1126 66.6%)',
};

/** Lo que se dice de cada región en su tarjeta. */
const CORTO: Record<string, string> = {
  es: 'Nacionales',
  'es-md': 'Madrid',
  'es-ct': 'Cataluña',
  'es-an': 'Andalucía',
  mx: 'México',
};

/**
 * Traer festivos del calendario oficial sin teclearlos: se elige la región en tarjetas con su bandera, se quitan los
 * días que no apliquen y se decide dónde van. Tres usos: crear una lista (Tiempo), sumar días a la lista que se edita,
 * o, desde un horario, como lista compartida o solo para ese horario.
 */
@Component({
  selector: 'sc-tp-importar',
  imports: [TpIconoComponent, TpModalComponent],
  template: `
    <sc-tp-modal titulo="Importar festivos oficiales" subtitulo="Calendario de 2026, datos de ejemplo del laboratorio" ancho="40rem" icono="download" tono="festivo" (cerrar)="cerrado.emit()">
      @if (modo() === 'horario' && aplicables().length > 0) {
        <section class="tp-imp__bloque">
          <h3 class="t-eyebrow">Listas que ya tienes</h3>
          <div class="tp-imp__ya">
            @for (c of aplicables(); track c.id) {
              <button type="button" class="tp-imp__lista" (click)="aplicar.emit(c.id)">
                <span class="tp-mark tp-mark--festivo"><sc-tp-icono nombre="calendar-x" [tam]="14" /></span>
                <span class="tp-imp__lista-txt">
                  <span class="t-small t-strong t-trunc">{{ c.name }}</span>
                  <span class="t-micro t-3">{{ c.days.length }} días</span>
                </span>
                <span class="tp-imp__aplicar t-micro t-strong">Aplicar</span>
              </button>
            }
          </div>
        </section>
      }

      <section class="tp-imp__bloque">
        <h3 class="t-eyebrow">País o región</h3>
        <div class="tp-imp__regiones" role="radiogroup" [attr.aria-label]="t.region">
          @for (r of regiones; track r.id) {
            <button type="button" class="tp-imp__region" role="radio" [attr.aria-checked]="r.id === region()" (click)="cambiar(r.id)">
              <span class="tp-flag" [style.background]="banderas[r.id]"></span>
              <span class="t-small t-strong">{{ corto[r.id] }}</span>
              <span class="t-micro t-3">{{ total(r.id) }} días</span>
            </button>
          }
        </div>
      </section>

      <section class="tp-imp__bloque">
        <div class="tp-imp__cab">
          <h3 class="t-eyebrow">Días <span class="t-num">{{ elegidos().length }}/{{ dias().length }}</span></h3>
          <span class="tp-spacer"></span>
          <button type="button" class="tp-btn tp-btn--ghost tp-btn--sm" (click)="todos()">{{ fuera().size === 0 ? 'Ninguno' : 'Todos' }}</button>
        </div>
        <ul class="tp-imp__dias" role="list">
          @for (d of dias(); track d.date) {
            <li>
              <label class="tp-imp__dia" [class.is-fuera]="fuera().has(d.date)">
                <input type="checkbox" class="tp-check" [checked]="!fuera().has(d.date)" (change)="alternar(d.date)" />
                <span class="tp-imp__fecha t-micro t-strong t-num"><span class="tp-imp__mes">{{ mes(d.date) }}</span>{{ +d.date.slice(8) }}</span>
                <span class="t-small t-trunc">{{ d.name }}</span>
                <span class="t-micro t-3 tp-imp__sem">{{ semana(d.date) }}</span>
              </label>
            </li>
          }
        </ul>
      </section>

      @if (modo() === 'horario') {
        <section class="tp-imp__bloque">
          <h3 class="t-eyebrow">Dónde guardarlos</h3>
          <div class="tp-imp__destinos" role="radiogroup" [attr.aria-label]="t.destino">
            <button type="button" class="tp-imp__destino" role="radio" [attr.aria-checked]="destino() === 'lista'" (click)="destino.set('lista')">
              <span class="t-small t-strong">Como lista compartida</span>
              <span class="t-micro t-2">Se mantiene una vez y otros horarios pueden aplicarla.</span>
            </button>
            <button type="button" class="tp-imp__destino" role="radio" [attr.aria-checked]="destino() === 'horario'" (click)="destino.set('horario')">
              <span class="t-small t-strong">Solo en este horario</span>
              <span class="t-micro t-2">Días especiales que puedes retocar, p. ej. abrir de 09:00 a 14:00.</span>
            </button>
          </div>
        </section>
      }

      <div tpPie class="tp-imp__pie">
        <span class="t-micro t-3 tp-imp__nota">{{ nota() }}</span>
        <button type="button" class="tp-btn" (click)="cerrado.emit()">Cancelar</button>
        <button type="button" class="tp-btn tp-btn--primary" [disabled]="elegidos().length === 0" (click)="hacer()">{{ boton() }}</button>
      </div>
    </sc-tp-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpImportarComponent {
  private readonly store = inject(FestivosStore);
  protected readonly t = T;
  /** 'lista': crea una lista en Tiempo · 'dias': entrega los días a la lista que se edita · 'horario': desde un horario. */
  readonly modo = input<'lista' | 'dias' | 'horario'>('lista');
  /** Desde un horario: las listas que ya aplica, para no ofrecerlas otra vez. */
  readonly aplicadas = input<readonly number[]>([]);
  readonly lista = output<CalendarioDeFestivos>();
  readonly diasElegidos = output<readonly DiaNuevo[]>();
  readonly aplicar = output<number>();
  readonly cerrado = output<void>();

  protected readonly regiones = REGIONES;
  protected readonly banderas = BANDERAS;
  protected readonly corto = CORTO;
  protected readonly region = signal('es-md');
  protected readonly fuera = signal<ReadonlySet<string>>(new Set());
  protected readonly destino = signal<'lista' | 'horario'>('lista');

  protected readonly dias = computed(() => diasDe(this.region()));
  protected readonly elegidos = computed(() => this.dias().filter((d) => !this.fuera().has(d.date)));
  protected readonly nombre = computed(() => `Festivos ${REGIONES.find((r) => r.id === this.region())?.nombre ?? ''} 2026`);
  protected readonly existente = computed(() => this.store.items().find((c) => c.name === this.nombre()) ?? null);
  protected readonly aplicables = computed(() => this.store.items().filter((c) => c.status !== 'inactive' && !this.aplicadas().includes(c.id)));

  protected readonly porLista = computed(() => this.modo() === 'lista' || (this.modo() === 'horario' && this.destino() === 'lista'));

  protected readonly nota = computed(() => {
    if (this.modo() === 'dias') return 'Los que ya estén en la lista no se repiten.';
    if (!this.porLista()) return 'Se copian como días especiales de este horario.';
    return this.existente() ? `Ya tienes «${this.nombre()}»: se usará esa.` : `Se crea «${this.nombre()}».`;
  });

  protected readonly boton = computed(() => {
    const n = this.elegidos().length;
    if (this.modo() === 'dias' || !this.porLista()) return `Añadir ${n} días`;
    if (this.existente()) return this.modo() === 'horario' ? 'Aplicar la que ya hay' : 'Abrir la que ya hay';
    return `Crear lista con ${n} días`;
  });

  protected total(id: string): number {
    return diasDe(id).length;
  }

  protected mes(iso: string): string {
    return MESES_CORTOS[Number(iso.slice(5, 7)) - 1];
  }

  protected semana(iso: string): string {
    return NOMBRES[(new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7];
  }

  protected cambiar(id: string): void {
    this.region.set(id);
    this.fuera.set(new Set());
  }

  protected alternar(date: string): void {
    this.fuera.update((s) => {
      const n = new Set(s);
      if (n.has(date)) n.delete(date);
      else n.add(date);
      return n;
    });
  }

  protected todos(): void {
    this.fuera.set(this.fuera().size === 0 ? new Set(this.dias().map((d) => d.date)) : new Set());
  }

  protected hacer(): void {
    const dias = this.elegidos().map((d) => ({ name: d.name, date: d.date, yearly: esFija(d.date) }));
    if (!this.porLista()) {
      this.diasElegidos.emit(dias);
      return;
    }
    const ya = this.existente();
    if (ya) {
      this.lista.emit(ya);
      return;
    }
    this.lista.emit(
      this.store.addItem({
        name: this.nombre(),
        description: 'Importada del calendario oficial',
        status: 'active',
        days: dias.map((d, i) => ({ id: i + 1, ...d })),
      }),
    );
  }

  protected readonly fmt = fmtDia;
}

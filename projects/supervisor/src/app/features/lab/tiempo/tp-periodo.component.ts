import { ChangeDetectionStrategy, Component, computed, input, type OnInit, output, signal } from '@angular/core';

import {
  COLORES_DE_PERIODO,
  type ColorDePeriodo,
  fechasEntre,
  type Horario,
  type Periodo,
  periodoCubre,
  type Semana,
  siguienteId,
  validarPeriodo,
} from '@features/admin/repositories/state/horarios.core.mjs';

import { TpIconoComponent } from './tp-icono.component';
import { colorDePeriodo, MESES, MESES_CORTOS, trozosDelAnio } from './tp-modelo';
import { TpModalComponent } from './tp-piezas';
import { TpSemanaComponent } from './tp-semana.component';
import { T } from './tp-textos';

const FALTA: Record<string, string> = {
  nombre: 'Ponle un nombre',
  fechas: 'Revisa las fechas',
  cruza_anio: 'En un solo año, el fin no puede ir antes del inicio',
  semana: 'Revisa la semana del periodo',
};

const pad = (n: number): string => String(n).padStart(2, '0');
const diasDelMes = (m: number): number => new Date(Date.UTC(2024, m, 0)).getUTCDate();

/**
 * Un periodo: una temporada con su propia semana («Verano, del 1 de junio al 31 de agosto, de 08:00 a 15:00»). Las
 * fechas se eligen con día y mes, sin calendarios emergentes; la barra del año enseña dónde cae y choca en rojo si se
 * pisa con otro periodo. Su semana se edita igual que la habitual.
 */
@Component({
  selector: 'sc-tp-periodo',
  imports: [TpIconoComponent, TpModalComponent, TpSemanaComponent],
  template: `
    <sc-tp-modal [titulo]="periodo() ? 'Editar periodo' : 'Nuevo periodo'" subtitulo="Una temporada con su propia semana" ancho="44rem" icono="sun" tono="periodo" [color]="colorCss()" (cerrar)="cerrado.emit()">
      <div class="tp-form-fila">
        <label class="tp-field tp-field--grow">
          <span class="tp-label">{{ t.nombre }}</span>
          <input class="tp-input" [attr.aria-label]="t.nombre" [placeholder]="t.ejemploPeriodo" [value]="nombre()" (input)="nombre.set($any($event.target).value)" />
        </label>
        <div class="tp-field">
          <span class="tp-label">{{ t.color }}</span>
          <div class="tp-colores" role="radiogroup" [attr.aria-label]="t.color">
            @for (c of colores; track c) {
              <button type="button" class="tp-color" role="radio" [attr.aria-checked]="c === color()" [attr.aria-label]="c" [style.--c]="css(c)" (click)="color.set(c)">
                <sc-tp-icono nombre="check" [tam]="12" [trazo]="2.5" />
              </button>
            }
          </div>
        </div>
      </div>

      <div class="tp-form-fila tp-form-fila--fechas">
        <div class="tp-field">
          <span class="tp-label">{{ t.desde }}</span>
          <div class="tp-fecha">
            <input class="tp-input tp-input--dia t-num" type="number" min="1" [max]="maxDia(desdeMes())" [attr.aria-label]="t.dia1" [value]="desdeDia()" (change)="desdeDia.set(dia($any($event.target).value, desdeMes()))" />
            <select class="tp-select" [attr.aria-label]="t.mes" (change)="desdeMes.set(+$any($event.target).value)">
              @for (m of meses; track $index) {
                <option [value]="$index + 1" [selected]="$index + 1 === desdeMes()">{{ m }}</option>
              }
            </select>
          </div>
        </div>
        <span class="tp-fecha__a" aria-hidden="true"><sc-tp-icono nombre="chevron-right" [tam]="14" /></span>
        <div class="tp-field">
          <span class="tp-label">{{ t.hasta }}</span>
          <div class="tp-fecha">
            <input class="tp-input tp-input--dia t-num" type="number" min="1" [max]="maxDia(hastaMes())" [attr.aria-label]="t.dia1" [value]="hastaDia()" (change)="hastaDia.set(dia($any($event.target).value, hastaMes()))" />
            <select class="tp-select" [attr.aria-label]="t.mes" (change)="hastaMes.set(+$any($event.target).value)">
              @for (m of meses; track $index) {
                <option [value]="$index + 1" [selected]="$index + 1 === hastaMes()">{{ m }}</option>
              }
            </select>
          </div>
        </div>
        <span class="tp-spacer"></span>
        <div class="tp-field">
          <span class="tp-label">Se repite</span>
          <div class="tp-fecha">
            <button type="button" class="tp-switch" role="switch" [attr.aria-checked]="cadaAnio()" [attr.aria-label]="t.cadaAnio" (click)="cadaAnio.set(!cadaAnio())"></button>
            @if (cadaAnio()) {
              <span class="t-small">Cada año</span>
            } @else {
              <select class="tp-select" [attr.aria-label]="t.anio" (change)="anioFijo.set(+$any($event.target).value)">
                @for (a of anios(); track a) {
                  <option [value]="a" [selected]="a === anioFijo()">Solo {{ a }}</option>
                }
              </select>
            }
          </div>
        </div>
      </div>

      <!-- Dónde cae en el año, junto a los demás periodos -->
      <div class="tp-anio-barra">
        <div class="tp-anio-barra__pista">
          @for (o of otros(); track o.id) {
            @for (b of o.barra; track $index) {
              <i class="is-otro" [style.left.%]="b.desde * 100" [style.width.%]="(b.hasta - b.desde) * 100" [style.background]="o.color" [attr.data-tip]="o.nombre"></i>
            }
          }
          @for (b of barra(); track $index) {
            <i class="is-este" [class.is-choca]="choca()" [style.left.%]="b.desde * 100" [style.width.%]="(b.hasta - b.desde) * 100" [style.background]="choca() ? null : colorCss()"></i>
          }
        </div>
        <div class="tp-anio-barra__meses t-micro t-3" aria-hidden="true">
          @for (m of cortos; track m) {
            <span>{{ m }}</span>
          }
        </div>
        <p class="t-small t-2 tp-anio-barra__txt">
          <span class="t-num t-strong">{{ dias() }} días</span>
          {{ cadaAnio() ? 'cada año' : 'en ' + anioFijo() }}
          @if (falta() && falta()!.codigo !== 'nombre') {
            <span class="tp-error"><sc-tp-icono nombre="alert" [tam]="14" />{{ textoFalta() }}</span>
          }
        </p>
      </div>

      <div class="tp-field">
        <span class="tp-label">Su semana</span>
        <sc-tp-semana compacta [semana]="semana()" (semanaChange)="semana.set($event)" />
      </div>

      <div tpPie class="tp-modal__acciones">
        @if (periodo(); as p) {
          <button type="button" class="tp-btn tp-btn--ghost tp-btn--peligro" (click)="quitar.emit(p.id)">
            <sc-tp-icono nombre="trash" [tam]="14" />
            Quitar
          </button>
        }
        <span class="tp-spacer"></span>
        <button type="button" class="tp-btn" (click)="cerrado.emit()">Cancelar</button>
        <button type="button" class="tp-btn tp-btn--primary" [disabled]="!!falta()" (click)="confirmar()">{{ periodo() ? 'Guardar' : 'Crear periodo' }}</button>
      </div>
    </sc-tp-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpPeriodoComponent implements OnInit {
  protected readonly t = T;
  readonly periodo = input<Periodo | null>(null);
  readonly rango = input<readonly [string, string] | null>(null);
  readonly horario = input.required<Pick<Horario, 'periods' | 'week'>>();
  readonly anio = input.required<number>();
  readonly guardar = output<Periodo>();
  readonly quitar = output<number>();
  readonly cerrado = output<void>();

  protected readonly colores = COLORES_DE_PERIODO;
  protected readonly meses = MESES;
  protected readonly cortos = MESES_CORTOS;
  protected readonly css = colorDePeriodo;

  protected readonly nombre = signal('');
  protected readonly color = signal<ColorDePeriodo>('teal');
  protected readonly desdeDia = signal(1);
  protected readonly desdeMes = signal(6);
  protected readonly hastaDia = signal(31);
  protected readonly hastaMes = signal(8);
  protected readonly cadaAnio = signal(true);
  protected readonly anioFijo = signal(2026);
  protected readonly semana = signal<Semana>([]);

  ngOnInit(): void {
    const p = this.periodo();
    const r = this.rango();
    this.anioFijo.set(this.anio());
    if (p) {
      this.nombre.set(p.name);
      this.color.set(p.color);
      [this.desdeMes, this.desdeDia].forEach((s, i) => s.set(Number(p.from.split('-')[i])));
      [this.hastaMes, this.hastaDia].forEach((s, i) => s.set(Number(p.to.split('-')[i])));
      this.cadaAnio.set(p.year === null);
      if (p.year !== null) this.anioFijo.set(p.year);
      this.semana.set(p.week);
      return;
    }
    const usados = new Set(this.horario().periods.map((x) => x.color));
    this.color.set(COLORES_DE_PERIODO.find((c) => !usados.has(c) && c !== 'red') ?? 'teal');
    this.semana.set(this.horario().week);
    if (r) {
      this.desdeMes.set(Number(r[0].slice(5, 7)));
      this.desdeDia.set(Number(r[0].slice(8)));
      this.hastaMes.set(Number(r[1].slice(5, 7)));
      this.hastaDia.set(Number(r[1].slice(8)));
      this.cadaAnio.set(false);
      this.anioFijo.set(Number(r[0].slice(0, 4)));
    }
  }

  protected maxDia(m: number): number {
    return diasDelMes(m);
  }

  protected dia(v: string, m: number): number {
    return Math.min(diasDelMes(m), Math.max(1, Math.round(Number(v) || 1)));
  }

  protected readonly anios = computed(() => [this.anio() - 1, this.anio(), this.anio() + 1, this.anio() + 2]);
  protected readonly colorCss = computed(() => colorDePeriodo(this.color()));

  private readonly borrador = computed<Periodo>(() => ({
    id: this.periodo()?.id ?? siguienteId(this.horario().periods),
    name: this.nombre().trim(),
    color: this.color(),
    from: `${pad(this.desdeMes())}-${pad(Math.min(this.desdeDia(), diasDelMes(this.desdeMes())))}`,
    to: `${pad(this.hastaMes())}-${pad(Math.min(this.hastaDia(), diasDelMes(this.hastaMes())))}`,
    year: this.cadaAnio() ? null : this.anioFijo(),
    week: this.semana(),
  }));

  protected readonly falta = computed(() => validarPeriodo(this.horario(), this.borrador()));
  protected readonly choca = computed(() => this.falta()?.codigo === 'solape');
  protected readonly textoFalta = computed(() => {
    const f = this.falta();
    if (!f) return '';
    if (f.codigo === 'solape') return `Se pisa con «${f.con.name}»`;
    return FALTA[f.codigo] ?? '';
  });

  protected readonly barra = computed(() => trozosDelAnio(this.borrador()));
  protected readonly dias = computed(() => {
    const p = this.borrador();
    const y = p.year ?? this.anio();
    return fechasEntre(`${y}-01-01`, `${y}-12-31`).filter((d) => periodoCubre(p, d)).length;
  });
  protected readonly otros = computed(() =>
    this.horario()
      .periods.filter((p) => p.id !== this.periodo()?.id)
      .map((p) => ({ id: p.id, nombre: p.name, color: colorDePeriodo(p.color), barra: trozosDelAnio(p) })),
  );

  protected confirmar(): void {
    if (!this.falta()) this.guardar.emit(this.borrador());
  }
}

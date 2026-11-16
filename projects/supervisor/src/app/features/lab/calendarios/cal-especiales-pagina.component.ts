import { ChangeDetectionStrategy, Component, computed, inject, signal, type TemplateRef, viewChild } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { ScButtonComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { useTopbarActions } from '@core/layout/top-bar/use-topbar-actions';
import { CalAnioComponent, type DiaVista } from './cal-anio.component';
import { CalFestivoDialogoComponent } from './cal-festivo-dialogo.component';
import {
  ANIO,
  type Calendario,
  cadenaDe,
  type DiaEspecial,
  diaDeLaSemana,
  DIAS,
  diasDelAnio,
  festivosDe,
  HOY,
  MESES_CORTOS,
  resumenDeFestivos,
  textoDeFranjas,
  ubicacion,
} from './cal-modelo';
import { CalStore } from './cal-store';

interface Ficha {
  readonly mes: string;
  readonly dia: number;
}

interface Propio {
  readonly e: DiaEspecial;
  readonly clave: string;
  readonly ficha: Ficha;
  readonly cuando: string;
  readonly horas: string;
  readonly cerrado: boolean;
  readonly calendarios: readonly Calendario[];
  readonly pasado: boolean;
}

interface Oficial {
  readonly id: string;
  readonly clave: string;
  readonly etiqueta: string;
  readonly resumen: string;
  readonly proximos: readonly { readonly ficha: Ficha; readonly nombre: string; readonly fecha: string }[];
  readonly calendarios: readonly Calendario[];
}

const ficha = (iso: string): Ficha => ({ mes: MESES_CORTOS[+iso.slice(5, 7) - 1]!, dia: +iso.slice(8, 10) });
const enAnio = (e: DiaEspecial, iso: string): string => (e.cadaAnio ? `${ANIO}${iso.slice(4)}` : iso);
const iniciales = (nombre: string): string =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

/** La primera fecha que queda por llegar (o la última, si ya pasaron todas). */
function proxima(e: DiaEspecial): { iso: string; pasado: boolean } {
  const fechas = e.fechas.map((f) => enAnio(e, f)).sort();
  const futura = fechas.find((f) => f >= HOY);
  return futura ? { iso: futura, pasado: false } : { iso: fechas.at(-1) ?? HOY, pasado: true };
}

/**
 * PROTOTIPO DE DISCOVERY: los días especiales como repositorio propio, a la par que Horarios. Cada día especial es un
 * objeto con sus fechas, cómo queda el día y los calendarios que lo usan (el «special date» de Aircall, que también se
 * reutiliza en varios números). A diferencia de Aircall, los festivos oficiales no se teclean: vienen por la ubicación
 * del calendario y se renuevan solos; aquí solo se ven, para comprobar.
 *
 * VISUAL, FUERA DEL DS A PROPÓSITO: fichas de fecha («DIC 24»), tintes medios y avatares de calendario. Son candidatas al
 * Kit si la prueba las valida; no se usan fuera de esta carpeta.
 */
@Component({
  selector: 'sc-cal-especiales-pagina',
  imports: [CalAnioComponent, CalFestivoDialogoComponent, ScButtonComponent, ScIconComponent, TooltipModule],
  template: `
    <ng-template #acciones>
      <sc-button class="top-bar__cta" variant="primary" (clicked)="nuevo.set(true)">
        <sc-icon name="add" size="inherit" />
        <span>Nuevo día especial</span>
      </sc-button>
    </ng-template>

    <header class="cabeza">
      <h1 class="sc-text-heading-2xl">Días especiales</h1>
      <p class="sc-text-body-regular">Los días que no siguen el horario de siempre: los festivos oficiales y los vuestros.</p>
    </header>

    <div class="resumen">
      @if (siguiente(); as s) {
        <article class="tile">
          <p class="tile__rotulo sc-text-caption-semibold">Próximo</p>
          <div class="tile__fila">
            <span class="fecha" [attr.data-tipo]="s.tipo"><b>{{ s.ficha.mes }}</b><span>{{ s.ficha.dia }}</span></span>
            <span class="tile__texto">
              <span class="sc-text-body-semibold">{{ s.nombre }}</span>
              <span class="tenue sc-text-body-regular">{{ s.detalle }}</span>
            </span>
          </div>
        </article>
      }
      <article class="tile">
        <p class="tile__rotulo sc-text-caption-semibold">Vuestros</p>
        <div class="tile__fila">
          <span class="cifra">{{ propios().length }}</span>
          <span class="tenue sc-text-body-regular">días especiales en {{ usanPropios() }} {{ usanPropios() === 1 ? 'calendario' : 'calendarios' }}</span>
        </div>
      </article>
      <article class="tile">
        <p class="tile__rotulo sc-text-caption-semibold">Oficiales</p>
        <div class="tile__fila">
          <span class="cifra">{{ totalOficiales() }}</span>
          <span class="tenue sc-text-body-regular">festivos en {{ anio }}, de {{ oficiales().length }} {{ oficiales().length === 1 ? 'ubicación' : 'ubicaciones' }}. Se actualizan solos.</span>
        </div>
      </article>
    </div>

    <div class="cuerpo">
      <section class="tarjeta anio" aria-label="El año">
        <div class="anio__cabeza">
          <h2 class="sc-text-heading-md">{{ anio }}</h2>
          <ul class="leyenda" role="list">
            <li class="sc-text-caption-regular"><i data-tipo="oficial"></i>Festivo oficial</li>
            <li class="sc-text-caption-regular"><i data-tipo="propio"></i>Vuestro</li>
          </ul>
        </div>
        <sc-cal-anio [anio]="anio" [dias]="dias()" [hoy]="hoy" [resaltar]="resaltar()" />
      </section>

      <div class="lado">
        <section class="tarjeta" aria-labelledby="propios-t">
          <h2 id="propios-t" class="lado__titulo sc-text-heading-sm">Vuestros <span class="tenue">{{ propios().length }}</span></h2>
          <ul class="lista" role="list">
            @for (p of propios(); track p.e.id) {
              <li>
                <button
                  type="button"
                  class="item"
                  [class.item--pasado]="p.pasado"
                  (pointerenter)="resaltar.set(p.clave)"
                  (pointerleave)="resaltar.set(null)"
                  (focus)="resaltar.set(p.clave)"
                  (blur)="resaltar.set(null)"
                  (click)="editando.set(p.e)"
                >
                  <span class="fecha" data-tipo="propio"><b>{{ p.ficha.mes }}</b><span>{{ p.ficha.dia }}</span></span>
                  <span class="item__texto">
                    <span class="sc-text-body-semibold">{{ p.e.nombre }}</span>
                    <span class="tenue sc-text-caption-regular">{{ p.cuando }}, {{ p.horas }}</span>
                  </span>
                  <span class="avatares" role="img" [attr.aria-label]="p.calendarios.length + ' calendarios'">
                    @for (c of p.calendarios.slice(0, 3); track c.id) {
                      <span class="avatar sc-text-caption-semibold" [pTooltip]="c.nombre" tooltipPosition="top">{{ iniciales(c.nombre) }}</span>
                    }
                    @if (p.calendarios.length > 3) {
                      <span class="avatar avatar--mas sc-text-caption-semibold">+{{ p.calendarios.length - 3 }}</span>
                    }
                  </span>
                </button>
              </li>
            } @empty {
              <li class="tenue sc-text-body-regular">Ninguno todavía.</li>
            }
          </ul>
        </section>

        <section class="tarjeta" aria-labelledby="oficiales-t">
          <h2 id="oficiales-t" class="lado__titulo sc-text-heading-sm">Festivos oficiales</h2>
          <ul class="lista" role="list">
            @for (o of oficiales(); track o.id) {
              <li
                class="oficial"
                (pointerenter)="resaltar.set(o.clave)"
                (pointerleave)="resaltar.set(null)"
              >
                <div class="oficial__cabeza">
                  <span class="sc-text-body-semibold">{{ o.etiqueta }}</span>
                  <span class="avatares">
                    @for (c of o.calendarios.slice(0, 3); track c.id) {
                      <span class="avatar sc-text-caption-semibold" [pTooltip]="c.nombre" tooltipPosition="top">{{ iniciales(c.nombre) }}</span>
                    }
                  </span>
                </div>
                <span class="tenue sc-text-caption-regular">{{ o.resumen }}</span>
                <div class="proximos">
                  @for (x of o.proximos; track x.fecha) {
                    <span class="mini" [pTooltip]="x.nombre" tooltipPosition="top">
                      <span class="fecha fecha--mini" data-tipo="oficial"><b>{{ x.ficha.mes }}</b><span>{{ x.ficha.dia }}</span></span>
                      <span class="sc-text-caption-regular">{{ x.nombre }}</span>
                    </span>
                  }
                </div>
              </li>
            } @empty {
              <li class="tenue sc-text-body-regular">Ningún calendario tiene ubicación.</li>
            }
          </ul>
        </section>
      </div>
    </div>

    @if (nuevo()) {
      <sc-cal-festivo-dialogo (cerrado)="nuevo.set(false)" />
    }
    @if (editando(); as e) {
      <sc-cal-festivo-dialogo [especial]="e" (cerrado)="editando.set(null)" />
    }
  `,
  styles: `
    :host {
      block-size: 100%; overflow: hidden;
      --tinte-oficial: color-mix(in srgb, var(--sc-bg-danger) 72%, var(--sc-bg-surface));
      --tinte-propio: color-mix(in srgb, var(--sc-bg-warning) 55%, var(--sc-bg-surface));
      display: flex; flex-direction: column; gap: var(--sc-spacing-1-5);
      padding: var(--sc-spacing-2);
      background: var(--sc-bg-canvas, var(--sc-bg-subtle));
    }
    h1, h2, p { margin: 0; }
    .cabeza { display: flex; flex-direction: column; gap: var(--sc-spacing-0-25); }
    .cabeza h1 { color: var(--sc-text-heading); letter-spacing: -0.01em; }
    .cabeza p, .tenue { color: var(--sc-text-secondary); }
    .resumen { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sc-spacing-1); }
    .tile, .tarjeta {
      border-radius: var(--sc-radius-lg);
      background: var(--sc-bg-surface);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--sc-text-heading) 6%, transparent), 0 1px 2px color-mix(in srgb, var(--sc-text-heading) 5%, transparent);
    }
    .tile { display: flex; flex-direction: column; gap: var(--sc-spacing-0-5); padding: var(--sc-spacing-1) var(--sc-spacing-1-25); }
    .tile__rotulo { color: var(--sc-text-subtle); text-transform: uppercase; letter-spacing: 0.06em; }
    .tile__fila { display: flex; align-items: center; gap: var(--sc-spacing-0-75); }
    .tile__texto, .item__texto { display: flex; flex-direction: column; min-inline-size: 0; }
    .cifra { font-size: 2rem; line-height: 1; font-weight: 600; color: var(--sc-text-heading); font-variant-numeric: tabular-nums; }

    .fecha {
      display: inline-flex; flex-direction: column; align-items: center; flex: none;
      inline-size: 2.75rem; overflow: hidden;
      border-radius: var(--sc-radius-md);
      background: var(--sc-bg-surface);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--sc-text-heading) 10%, transparent);
      color: var(--sc-text-heading); font-variant-numeric: tabular-nums;
    }
    .fecha b { align-self: stretch; text-align: center; font-size: 0.6875rem; line-height: 1.1rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--sc-text-on-error); background: var(--sc-bg-danger); }
    .fecha[data-tipo='propio'] b { background: var(--sc-bg-warning); color: var(--sc-text-on-warning); }
    .fecha > span { font-size: 1.125rem; line-height: 1.6rem; font-weight: 600; }
    .fecha--mini { inline-size: 2.25rem; }
    .fecha--mini b { font-size: 0.5625rem; line-height: 0.9rem; }
    .fecha--mini > span { font-size: 0.875rem; line-height: 1.25rem; }

    .cuerpo { min-block-size: 0; flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 21rem; gap: var(--sc-spacing-1); align-items: start; }
    .anio { display: flex; flex-direction: column; gap: var(--sc-spacing-1); padding: var(--sc-spacing-1-5); }
    /* Seis meses por fila: el año entero cabe sin scroll. */
    sc-cal-anio { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: var(--sc-spacing-1) var(--sc-spacing-1-25); }
    .anio__cabeza { display: flex; align-items: baseline; justify-content: space-between; }
    .anio__cabeza h2 { color: var(--sc-text-heading); }
    .leyenda { display: flex; gap: var(--sc-spacing-1); margin: 0; padding: 0; list-style: none; color: var(--sc-text-secondary); }
    .leyenda li { display: inline-flex; align-items: center; gap: var(--sc-spacing-0-375, var(--sc-spacing-0-25)); }
    .leyenda i { inline-size: 0.75rem; block-size: 0.75rem; border-radius: var(--sc-radius-xs); background: var(--tinte-oficial); }
    .leyenda i[data-tipo='propio'] { background: var(--tinte-propio); }

    .lado { display: flex; flex-direction: column; gap: var(--sc-spacing-1); max-block-size: 100%; min-block-size: 0; overflow: auto; }
    .lado .tarjeta { padding: var(--sc-spacing-1-25) var(--sc-spacing-0-75) var(--sc-spacing-0-75); }
    .lado__titulo { padding-inline: var(--sc-spacing-0-5); margin-block-end: var(--sc-spacing-0-5); color: var(--sc-text-heading); }
    .lista { display: flex; flex-direction: column; gap: var(--sc-spacing-0-125); margin: 0; padding: 0; list-style: none; }
    .item {
      display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--sc-spacing-0-75);
      inline-size: 100%; padding: var(--sc-spacing-0-5);
      border: 0; border-radius: var(--sc-radius-md); background: transparent; text-align: start; color: var(--sc-text-primary);
      cursor: pointer; transition: background-color 150ms ease-out, transform 150ms ease-out;
      &:hover { background: color-mix(in srgb, var(--sc-text-heading) 4%, transparent); }
      &:active { transform: scale(0.99); }
      &:focus-visible { outline: 2px solid var(--sc-border-focus); outline-offset: 1px; }
    }
    .item--pasado { opacity: 0.55; }
    .avatares { display: flex; }
    .avatar {
      display: grid; place-items: center; inline-size: 1.75rem; block-size: 1.75rem; margin-inline-start: -0.375rem;
      border-radius: var(--sc-radius-full); background: color-mix(in srgb, var(--sc-bg-violet) 22%, var(--sc-bg-surface));
      color: var(--sc-text-violet); box-shadow: 0 0 0 2px var(--sc-bg-surface);
    }
    .avatar--mas { background: var(--sc-bg-subtle); color: var(--sc-text-secondary); }
    .oficial { display: flex; flex-direction: column; gap: var(--sc-spacing-0-5); padding: var(--sc-spacing-0-75) var(--sc-spacing-0-5); border-radius: var(--sc-radius-md); transition: background-color 150ms ease-out; }
    .oficial:hover { background: color-mix(in srgb, var(--sc-text-heading) 4%, transparent); }
    .oficial__cabeza { display: flex; align-items: center; justify-content: space-between; gap: var(--sc-spacing-0-5); }
    .proximos { display: flex; flex-direction: column; gap: var(--sc-spacing-0-5); }
    .mini { display: flex; align-items: center; gap: var(--sc-spacing-0-5); color: var(--sc-text-primary); }
    @media (prefers-reduced-motion: reduce) { .item, .oficial { transition: none; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalEspecialesPaginaComponent {
  private readonly store = inject(CalStore);
  protected readonly anio = ANIO;
  protected readonly hoy = HOY;
  protected readonly iniciales = iniciales;
  protected readonly nuevo = signal(false);
  protected readonly editando = signal<DiaEspecial | null>(null);
  protected readonly resaltar = signal<string | null>(null);

  private readonly acciones = viewChild<TemplateRef<unknown>>('acciones');

  constructor() {
    useTopbarActions(this.acciones);
  }

  private readonly calendariosDe = (ids: readonly number[]): Calendario[] =>
    this.store.calendarios().filter((c) => ids.includes(c.id));

  protected readonly propios = computed<Propio[]>(() =>
    this.store
      .especiales()
      .map((e) => {
        const p = proxima(e);
        const n = e.fechas.length;
        const cuando = n === 1 ? DIAS[diaDeLaSemana(p.iso)]! : `${n} días`;
        return {
          e,
          clave: `e:${e.id}`,
          ficha: ficha(p.iso),
          cuando: e.cadaAnio ? `${cuando}, cada año` : cuando,
          horas: textoDeFranjas(e.franjas),
          cerrado: e.franjas.length === 0,
          calendarios: this.calendariosDe(e.calendarioIds),
          pasado: p.pasado,
          orden: p.iso,
        };
      })
      .sort((a, b) => Number(a.pasado) - Number(b.pasado) || a.orden.localeCompare(b.orden)),
  );

  protected readonly usanPropios = computed(() => new Set(this.store.especiales().flatMap((e) => e.calendarioIds)).size);

  /** Una entrada por ubicación de calendario (Barcelona, Cataluña), con los calendarios que la tienen. */
  protected readonly oficiales = computed<Oficial[]>(() => {
    const porUbicacion = new Map<string, Calendario[]>();
    for (const c of this.store.calendarios()) {
      if (!c.ubicacion) continue;
      porUbicacion.set(c.ubicacion, [...(porUbicacion.get(c.ubicacion) ?? []), c]);
    }
    return [...porUbicacion.entries()].map(([id, calendarios]) => {
      const lista = festivosDe(id, ANIO);
      return {
        id,
        clave: `u:${id}`,
        etiqueta: ubicacion(id)?.etiqueta ?? id,
        resumen: resumenDeFestivos(id, ANIO),
        proximos: lista
          .filter((x) => x.fecha >= HOY)
          .slice(0, 2)
    .map((x) => ({ ficha: ficha(x.fecha), nombre: x.nombre, fecha: x.fecha })),
        calendarios,
      };
    });
  });

  protected readonly totalOficiales = computed(
    () => new Set(this.oficiales().flatMap((o) => festivosDe(o.id, ANIO).map((x) => x.fecha))).size,
  );

  protected readonly siguiente = computed(() => {
    const p = this.propios().find((x) => !x.pasado);
    const o = this.oficiales()
      .flatMap((x) => x.proximos.slice(0, 1).map((y) => ({ ...y, calendarios: x.calendarios })))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
    const pIso = p ? proxima(p.e).iso : null;
    if (o && (!pIso || o.fecha <= pIso)) {
      const n = this.store.calendarios().filter((c) => cadenaDe(c.ubicacion).some((u) => u.festivos.some((f) => f.fecha === o.fecha))).length;
      return { tipo: 'oficial', ficha: o.ficha, nombre: o.nombre, detalle: `Festivo oficial, cierra ${n} ${n === 1 ? 'calendario' : 'calendarios'}` };
    }
    if (!p) return null;
    return { tipo: 'propio', ficha: p.ficha, nombre: p.e.nombre, detalle: `${p.horas} en ${p.calendarios.length} ${p.calendarios.length === 1 ? 'calendario' : 'calendarios'}` };
  });

  protected readonly dias = computed<ReadonlyMap<string, DiaVista>>(() => {
    const m = new Map<string, DiaVista>();
    /* El resto del año, en tenue: aquí solo cuentan los días especiales. */
    for (const iso of diasDelAnio(ANIO)) m.set(iso, { tono: 'cerrado', clave: '', etiqueta: iso });
    for (const o of this.oficiales()) {
      for (const x of festivosDe(o.id, ANIO)) {
        m.set(x.fecha, { tono: 't-danger', clave: o.clave, etiqueta: `${x.fecha}: ${x.nombre}, festivo oficial` });
      }
    }
    for (const e of this.store.especiales()) {
      for (const f of e.fechas) {
        const iso = enAnio(e, f);
        if (!iso.startsWith(String(ANIO))) continue;
        m.set(iso, { tono: 't-warning', clave: `e:${e.id}`, etiqueta: `${iso}: ${e.nombre}, ${textoDeFranjas(e.franjas)}` });
      }
    }
    return m;
  });
}

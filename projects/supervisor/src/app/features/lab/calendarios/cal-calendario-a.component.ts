import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import {
  ScButtonComponent,
  ScDatepickerComponent,
  ScInputTextComponent,
  ScSectionCardComponent,
  ScSelectComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';

import { CalAnioComponent, type Rango } from './cal-anio.component';
import { CalBorrador } from './cal-borrador';
import { CalFestivoDialogoComponent } from './cal-festivo-dialogo.component';
import {
  ANIO,
  type DiaEspecial,
  fechaCorta,
  festivosDe,
  HOY,
  isoDe,
  LOCUCIONES,
  type Periodo,
  resolver,
  resumenDeFestivos,
  textoDeFranjas,
  UBICACIONES,
  usosDe,
  ZONAS,
} from './cal-modelo';
import { CalSemanaComponent } from './cal-semana.component';
import { CalStore } from './cal-store';
import { etiquetaDe, type Lente, porQue, vistaDelAnio } from './cal-vista';

const NUEVO_HORARIO = -1;
const aFecha = (iso: string): Date => new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const aIso = (d: Date): string => isoDe(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

/**
 * PROTOTIPO DE DISCOVERY, CAMINO A (separado): el calendario se edita por piezas, en tarjetas como las de cualquier
 * ficha: datos, el horario de todo el año, los periodos, los festivos oficiales y los días especiales. El horario se
 * elige de los que ya hay; para crear o cambiar uno se va a su página y se vuelve. Al lado, el año para comprobar.
 */
@Component({
  selector: 'sc-cal-calendario-a',
  imports: [
    CalAnioComponent,
    CalFestivoDialogoComponent,
    CalSemanaComponent,
    ScButtonComponent,
    ScDatepickerComponent,
    ScInputTextComponent,
    ScSectionCardComponent,
    ScSelectComponent,
    ScToggleSwitchComponent,
    TooltipModule,
  ],
  template: `
    <div class="page">
      <div class="page__inner page__inner--resultado">
        <h1 class="page__heading sc-text-title-semibold">{{ cal().nombre.trim() || 'Nuevo calendario' }}</h1>

        <div class="a">
          <div class="a__reglas">
            <sc-section-card titleKey="Datos" surface="subtle" icon="tune">
              <div class="grid grid--2">
                <div class="field">
                  <sc-inputtext inputId="cal-nombre" fluid required label="Nombre" placeholder="Por ejemplo, Oficinas Madrid" [value]="cal().nombre" (valueChange)="b.cambiar({ nombre: $event })" />
                </div>
                <div class="field">
                  <sc-select inputId="cal-zona" label="Zona horaria" [options]="zonas" optionLabel="label" optionValue="value" [value]="cal().zona" (valueChange)="b.cambiar({ zona: $any($event) })" />
                </div>
              </div>
            </sc-section-card>

            <sc-section-card titleKey="Horario de todo el año" hintKey="El que vale cuando no manda un periodo, un festivo o un día especial." surface="subtle" icon="schedule">
              <div class="bloque">
                <div class="fila-horario">
                  <sc-select
                    class="fila-horario__select"
                    inputId="cal-horario"
                    label="Horario"
                    [options]="opcionesHorario()"
                    optionLabel="label"
                    optionValue="value"
                    [value]="cal().horarioId"
                    (valueChange)="elegirHorario($any($event), 'base')"
                  />
                  <sc-button variant="secondary" appearance="outlined" icon="edit" label="Editar este horario" (clicked)="b.irAlHorario(cal().horarioId, 'base')" />
                </div>
                @if (horarioBase(); as h) {
                  <sc-cal-semana [semana]="h.semana" />
                  <p class="pista sc-text-caption-regular">{{ usoTexto(h.id) }}</p>
                }
              </div>
            </sc-section-card>

            <sc-section-card titleKey="Periodos" hintKey="Fechas en las que se usa otro horario. Si dos se pisan, manda el más corto." surface="subtle" icon="date_range">
              <div class="bloque">
                @for (p of cal().periodos; track p.id) {
                  <div class="periodo" [attr.data-color]="p.color">
                    <div class="grid grid--2">
                      <div class="field">
                        <sc-inputtext [inputId]="'periodo-nombre-' + p.id" fluid label="Nombre" [value]="p.nombre" (valueChange)="b.cambiarPeriodo(p.id, { nombre: $event })" />
                      </div>
                      <div class="field">
                        <sc-datepicker
                          [inputId]="'periodo-fechas-' + p.id"
                          selectionMode="range"
                          label="Fechas"
                          dateFormat="dd/mm/yy"
                          [range]="rangos().get(p.id) ?? null"
                          (rangeChange)="ponerFechas(p, $event)"
                        />
                      </div>
                      <div class="field">
                        <sc-select
                          [inputId]="'periodo-horario-' + p.id"
                          label="Horario"
                          [options]="opcionesHorario()"
                          optionLabel="label"
                          optionValue="value"
                          [value]="p.horarioId"
                          (valueChange)="elegirHorario($any($event), 'periodo-' + p.id)"
                        />
                      </div>
                    </div>
                    <div class="periodo__pie">
                      <div class="switch-field">
                        <sc-toggleswitch [inputId]="'periodo-anual-' + p.id" ariaLabel="Se repite cada año" [checked]="p.anio === null" (checkedChange)="b.cambiarPeriodo(p.id, { anio: $event ? null : anio })" />
                        <div class="switch-field__copy">
                          <label class="switch-field__label sc-text-body-regular" [for]="'periodo-anual-' + p.id">Se repite cada año</label>
                        </div>
                      </div>
                      <sc-button variant="secondary" appearance="text" size="sm" icon="edit" label="Editar su horario" (clicked)="b.irAlHorario(p.horarioId, 'periodo-' + p.id)" />
                      <sc-button variant="danger" appearance="text" size="sm" icon="close" label="Quitar" (clicked)="b.quitarPeriodo(p.id)" />
                    </div>
                  </div>
                }
                <sc-button class="alinear-inicio" variant="secondary" appearance="outlined" icon="add" label="Añadir periodo" (clicked)="b.nuevoPeriodo()" />
              </div>
            </sc-section-card>

            <sc-section-card titleKey="Festivos oficiales" hintKey="Se cargan solos cada año para la ubicación que elijas." surface="subtle" icon="flag">
              <div class="bloque">
                <div class="field">
                  <sc-select inputId="cal-ubicacion" filter label="Festivos de" [options]="ubicaciones" optionLabel="label" optionValue="value" [value]="cal().ubicacion ?? ''" (valueChange)="b.cambiar({ ubicacion: $any($event) || null })" />
                </div>
                <p class="pista sc-text-body-regular">{{ resumenFestivos() }}</p>
                @if (festivos().length) {
                  <sc-button class="alinear-inicio" variant="secondary" appearance="text" size="sm" [icon]="verFestivos() ? 'expand_less' : 'expand_more'" [label]="verFestivos() ? 'Ocultar la lista' : 'Ver cuáles son'" (clicked)="verFestivos.set(!verFestivos())" />
                  @if (verFestivos()) {
                    <ul class="lista" role="list">
                      @for (f of festivos(); track f.fecha + f.de) {
                        <li class="lista__fila sc-text-body-regular"><span class="lista__fecha">{{ corta(f.fecha) }}</span> {{ f.nombre }} <span class="pista">({{ f.de }})</span></li>
                      }
                    </ul>
                  }
                }
              </div>
            </sc-section-card>

            <sc-section-card titleKey="Festivos y días especiales propios" hintKey="Los del cliente: cerrados todo el día o con otras horas. Uno puede valer para varios calendarios." surface="subtle" icon="event_busy">
              <div class="bloque">
                @for (e of especiales(); track e.id) {
                  <button type="button" class="especial" (click)="editar.set(e)">
                    <span class="especial__nombre sc-text-body-semibold">{{ e.nombre }}</span>
                    <span class="sc-text-body-regular">{{ fechasTexto(e) }}{{ e.cadaAnio ? ', cada año' : '' }}</span>
                    <span class="pista sc-text-caption-regular">{{ textoFranjas(e) }}{{ otrosTexto(e) }}</span>
                  </button>
                }
                <sc-button class="alinear-inicio" variant="secondary" appearance="outlined" icon="add" label="Añadir festivo o día especial" [disabled]="!!b.motivo()" [pTooltip]="b.motivo() ?? ''" tooltipPosition="top" tooltipEvent="both" (clicked)="anadirEspecial()" />
              </div>
            </sc-section-card>
          </div>

          <aside class="a__resultado">
            <sc-section-card [titleKey]="'Así queda ' + anio" surface="card" icon="calendar_month">
              <div class="bloque">

                <sc-cal-anio [anio]="anio" [dias]="vista().dias" [hoy]="hoy" [seleccion]="dia()" [resaltar]="resaltar()" (seleccionChange)="dia.set($event)" (encima)="encima.set($event)" />
                <ul class="leyenda" role="list">
                  @for (l of vista().leyenda; track l.clave) {
                    <li>
                      <button type="button" class="leyenda__item sc-text-caption-regular" [class.leyenda__item--on]="resaltar() === l.clave" [attr.aria-pressed]="resaltar() === l.clave" (click)="resaltar.set(resaltar() === l.clave ? null : l.clave)">
                        <i [attr.data-tono]="l.tono"></i>{{ l.texto }}<span class="leyenda__n">{{ l.cuenta }}</span>
                      </button>
                    </li>
                  }
                </ul>
                <p class="detalle sc-text-body-regular" aria-live="polite">{{ detalle() }}</p>
              </div>
            </sc-section-card>
          </aside>
        </div>
      </div>
    </div>

    @if (editar(); as e) {
      <sc-cal-festivo-dialogo [especial]="e" (cerrado)="editar.set(null)" />
    }
    @if (nuevoEspecial()) {
      <sc-cal-festivo-dialogo [calendariosIniciales]="[cal().id]" (cerrado)="nuevoEspecial.set(false)" />
    }
  `,
  styles: `
    :host { display: block; height: 100%; background: var(--sc-bg-canvas); overflow-y: auto; }
    .a { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; column-gap: var(--sc-spacing-2); }
    .a__reglas { min-inline-size: 0; }
    .a__resultado { position: sticky; inset-block-start: var(--sc-spacing-2); min-inline-size: 0; }
    @media (max-width: 1339px) { .a { grid-template-columns: minmax(0, 1fr); } .a__resultado { position: static; } }
    .bloque { display: flex; flex-direction: column; gap: var(--sc-spacing-1); }
    .alinear-inicio { align-self: flex-start; }
    .pista { margin: 0; color: var(--sc-text-secondary); }
    .fila-horario { display: flex; align-items: flex-end; gap: var(--sc-spacing-1); }
    .fila-horario__select { flex: 1; min-inline-size: 0; }
    .periodo {
      display: flex; flex-direction: column; gap: var(--sc-spacing-0-75);
      padding: var(--sc-spacing-1) var(--sc-spacing-1) var(--sc-spacing-0-5);
      border: 1px solid var(--sc-border-subtle); border-inline-start-width: 3px; border-radius: var(--sc-radius-md);
      background: var(--sc-bg-surface);
    }
    .periodo[data-color='info'] { border-inline-start-color: var(--sc-border-info); }
    .periodo[data-color='violet'] { border-inline-start-color: var(--sc-border-violet); }
    .periodo[data-color='success'] { border-inline-start-color: var(--sc-border-success); }
    .periodo[data-color='primary'] { border-inline-start-color: var(--sc-border-primary); }
    .periodo__pie { display: flex; align-items: center; gap: var(--sc-spacing-0-5); }
    .periodo__pie .switch-field { margin-inline-end: auto; }
    .lista { display: flex; flex-direction: column; gap: var(--sc-spacing-0-25); margin: 0; padding: 0; list-style: none; }
    .lista__fecha { display: inline-block; min-inline-size: 4rem; font-variant-numeric: tabular-nums; color: var(--sc-text-secondary); }
    .especial {
      display: flex; flex-direction: column; align-items: flex-start; gap: var(--sc-spacing-0-125);
      padding: var(--sc-spacing-0-75) var(--sc-spacing-1);
      border: 1px solid var(--sc-border-subtle); border-radius: var(--sc-radius-md);
      background: var(--sc-bg-surface); color: var(--sc-text-primary); text-align: start; cursor: pointer;
      transition-property: background-color; transition-duration: 150ms; transition-timing-function: ease-out;
      &:hover { background: var(--sc-bg-hover); }
      &:focus-visible { outline: 2px solid var(--sc-border-focus); outline-offset: 1px; }
    }
    .leyenda { display: flex; flex-wrap: wrap; gap: var(--sc-spacing-0-25); margin: 0; padding: 0; list-style: none; }
    .leyenda__item {
      display: inline-flex; align-items: center; gap: var(--sc-spacing-0-375);
      padding: var(--sc-spacing-0-25) var(--sc-spacing-0-5);
      border: 1px solid transparent; border-radius: var(--sc-radius-full);
      background: transparent; color: var(--sc-text-primary); cursor: pointer;
      transition-property: background-color, border-color, scale; transition-duration: 150ms; transition-timing-function: ease-out;
      &:hover { background: var(--sc-bg-hover); }
      &:active { scale: 0.96; }
      &:focus-visible { outline: 2px solid var(--sc-border-focus); outline-offset: 1px; }
    }
    .leyenda__item--on { border-color: var(--sc-border-primary); background: var(--sc-bg-primary-subtle); }
    .leyenda__item i { inline-size: var(--sc-spacing-0-75); block-size: var(--sc-spacing-0-75); border-radius: var(--sc-radius-xs); background: color-mix(in srgb, var(--sc-text-heading) 6%, var(--sc-bg-surface)); }
    .leyenda__item i[data-tono='cerrado'] { background: transparent; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--sc-text-heading) 14%, transparent); }
    .leyenda__item i[data-tono='t-info'] { background: color-mix(in srgb, var(--sc-bg-info) 34%, var(--sc-bg-surface)); }
    .leyenda__item i[data-tono='t-violet'] { background: color-mix(in srgb, var(--sc-bg-violet) 30%, var(--sc-bg-surface)); }
    .leyenda__item i[data-tono='t-success'] { background: color-mix(in srgb, var(--sc-bg-success) 30%, var(--sc-bg-surface)); }
    .leyenda__item i[data-tono='t-primary'] { background: color-mix(in srgb, var(--sc-bg-primary) 26%, var(--sc-bg-surface)); }
    .leyenda__item i[data-tono='t-warning'] { background: color-mix(in srgb, var(--sc-bg-warning) 55%, var(--sc-bg-surface)); }
    .leyenda__item i[data-tono='t-danger'] { background: color-mix(in srgb, var(--sc-bg-danger) 72%, var(--sc-bg-surface)); }
    .leyenda__n { color: var(--sc-text-secondary); font-variant-numeric: tabular-nums; }
    .detalle { margin: 0; min-block-size: 3em; color: var(--sc-text-secondary); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalCalendarioAComponent {
  protected readonly b = inject(CalBorrador);
  private readonly store = inject(CalStore);

  protected readonly anio = ANIO;
  protected readonly hoy = HOY;
  protected readonly cal = this.b.cal;
  protected readonly zonas = ZONAS;
  protected readonly locuciones = LOCUCIONES.map((l) => ({ value: l, label: l }));
  protected readonly locucionesPeriodo = [{ value: '', label: 'La del calendario' }, ...this.locuciones];
  protected readonly ubicaciones = [{ value: '', label: 'Sin festivos oficiales' }, ...UBICACIONES.map((u) => ({ value: u.id, label: u.etiqueta }))];
  protected readonly lentes = [
    { value: 'horas', label: 'Horas' },
    { value: 'locucion', label: 'Locución' },
  ];

  protected readonly lente = signal<Lente>('horas');
  protected readonly resaltar = signal<string | null>(null);
  protected readonly dia = signal<Rango | null>(null);
  protected readonly encima = signal<string | null>(null);
  protected readonly verFestivos = signal(false);
  protected readonly editar = signal<DiaEspecial | null>(null);
  protected readonly nuevoEspecial = signal(this.store.tomarAtajo() !== null);

  /** Lo que se pinta: el estado guardado con este calendario tal como está ahora (sin guardar). */
  private readonly estado = computed(() => {
    const e = this.store.estado();
    const c = this.cal();
    return { ...e, calendarios: [...e.calendarios.filter((x) => x.id !== c.id), c] };
  });

  protected readonly opcionesHorario = computed(() => [
    ...this.store.horarios().map((h) => ({ value: h.id, label: h.nombre })),
    { value: NUEVO_HORARIO, label: 'Crear un horario nuevo…' },
  ]);
  protected readonly horarioBase = computed(() => this.store.horario(this.cal().horarioId));
  protected readonly vista = computed(() => vistaDelAnio(this.estado(), this.cal(), ANIO, this.lente()));
  protected readonly festivos = computed(() => festivosDe(this.cal().ubicacion, ANIO));
  protected readonly resumenFestivos = computed(() => resumenDeFestivos(this.cal().ubicacion, ANIO));
  protected readonly especiales = computed(() => this.store.especiales().filter((e) => this.cal().id !== 0 && e.calendarioIds.includes(this.cal().id)));

  protected readonly detalle = computed(() => {
    const iso = this.encima() ?? this.dia()?.desde;
    if (!iso) return 'Pasa por un día para ver qué horas tiene y por qué.';
    return etiquetaDe(resolver(this.estado(), this.cal(), iso));
  });

  protected usoTexto(id: number): string {
    const otros = usosDe(this.store.estado(), id).filter((c) => c.id !== this.cal().id);
    return otros.length === 0 ? 'Solo lo usa este calendario.' : `También lo usan: ${otros.map((c) => c.nombre).join(', ')}.`;
  }

  protected elegirHorario(valor: number, para: string): void {
    if (valor === NUEVO_HORARIO) return this.b.irAlHorario(null, para);
    if (para === 'base') this.b.cambiar({ horarioId: valor });
    else this.b.cambiarPeriodo(Number(para.slice(8)), { horarioId: valor });
  }

  /** Las fechas de cada periodo para su selector. En un `computed`: un array nuevo en cada pasada lo repintaba sin fin. */
  protected readonly rangos = computed(
    () =>
      new Map(
        this.cal().periodos.map((p) => {
          const r = CalBorrador.rangoDe(p);
          return [p.id, [aFecha(r.desde), aFecha(r.hasta)] as const];
        }),
      ),
  );

  protected ponerFechas(p: Periodo, r: readonly (Date | null)[] | null): void {
    const [a, b] = r ?? [];
    if (!a || !b) return;
    const desde = aIso(a);
    const hasta = aIso(b);
    this.b.cambiarPeriodo(p.id, { desde: desde.slice(5), hasta: hasta.slice(5), anio: p.anio === null ? null : +desde.slice(0, 4) });
  }

  protected anadirEspecial(): void {
    if (this.b.esNuevo()) {
      this.store.dejarAtajo([]);
      if (!this.b.guardar(true)) this.store.tomarAtajo();
      return;
    }
    this.nuevoEspecial.set(true);
  }

  protected corta(iso: string): string {
    return fechaCorta(iso);
  }

  protected fechasTexto(e: DiaEspecial): string {
    return e.fechas.map(fechaCorta).join(', ');
  }

  protected textoFranjas(e: DiaEspecial): string {
    return e.franjas.length ? `Abre ${textoDeFranjas(e.franjas)}` : 'Cerrado todo el día';
  }

  protected otrosTexto(e: DiaEspecial): string {
    const otros = e.calendarioIds.filter((id) => id !== this.cal().id).map((id) => this.store.calendario(id)?.nombre).filter(Boolean);
    return otros.length ? `. También en: ${otros.join(', ')}` : '';
  }

  protected readonly porQue = porQue;
}

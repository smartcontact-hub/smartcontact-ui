import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import {
  ScButtonComponent,
  ScDatepickerComponent,
  ScInputTextComponent,
  ScSelectButtonComponent,
  ScSelectComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { ResultadoAccionService } from '@core/services/resultado-accion.service';
import { CalAnioComponent, type Rango } from './cal-anio.component';
import { CalBorrador } from './cal-borrador';
import { CalFestivoDialogoComponent } from './cal-festivo-dialogo.component';
import { CalImpactoDialogoComponent } from './cal-impacto-dialogo.component';
import {
  ANIO,
  type DiaEspecial,
  fechaCorta,
  fechasEntre,
  HOY,
  isoDe,
  LOCUCIONES,
  mesDiaCorto,
  type Periodo,
  resolver,
  resumenDeFestivos,
  resumenDeSemana,
  type Semana,
  textoDeFranjas,
  UBICACIONES,
  usosDe,
  ZONAS,
} from './cal-modelo';
import { CalSemanaComponent } from './cal-semana.component';
import { CalStore } from './cal-store';
import { type Lente, porQue, textoDeRango, vistaDelAnio } from './cal-vista';

const aFecha = (iso: string): Date => new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const aIso = (d: Date): string => isoDe(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

/** Lo que enseña el panel: las reglas, lo elegido en el año, un periodo o un horario abiertos. */
type Panel =
  | { readonly modo: 'reglas' }
  | { readonly modo: 'seleccion'; readonly rango: Rango }
  | { readonly modo: 'periodo'; readonly periodo: Periodo; readonly nuevo: boolean }
  | { readonly modo: 'horario'; readonly id: number; readonly nombre: string; readonly semana: Semana; readonly para: string; readonly vuelta: Panel };

/**
 * PROTOTIPO DE DISCOVERY, CAMINO B (junto): el año es donde se trabaja. Ocupa casi toda la pantalla y cada día es un
 * color; se pulsa un día o se arrastra sobre varios y el panel de al lado dice qué pasa y qué se puede hacer: usar
 * otro horario en esas fechas (un periodo) o cerrarlas o cambiarles las horas (el atajo). Los horarios se crean y se
 * cambian ahí mismo, sin salir del calendario.
 */
@Component({
  selector: 'sc-cal-calendario-b',
  imports: [
    CalAnioComponent,
    CalFestivoDialogoComponent,
    CalImpactoDialogoComponent,
    CalSemanaComponent,
    ScButtonComponent,
    ScDatepickerComponent,
    ScIconComponent,
    ScInputTextComponent,
    ScSelectButtonComponent,
    ScSelectComponent,
    ScToggleSwitchComponent,
    TooltipModule,
  ],
  template: `
    <div class="b">
      <section class="b__lienzo" aria-label="El año">
        <header class="b__barra">
          <h1 class="b__titulo sc-text-title-semibold">{{ cal().nombre.trim() || 'Nuevo calendario' }} <span class="b__anio">{{ anio }}</span></h1>
          <sc-selectbutton size="sm" ariaLabel="Colorear por" [options]="lentes" optionLabel="label" optionValue="value" [allowEmpty]="false" [value]="lente()" (valueChange)="lente.set($any($event))" />
        </header>
        <ul class="leyenda" role="list">
          @for (l of vista().leyenda; track l.clave) {
            <li>
              <button type="button" class="leyenda__item sc-text-caption-regular" [class.leyenda__item--on]="resaltar() === l.clave" [attr.aria-pressed]="resaltar() === l.clave" (click)="resaltar.set(resaltar() === l.clave ? null : l.clave)">
                <i [attr.data-tono]="l.tono" [class.rayado]="l.rayado"></i>{{ l.texto }}<span class="leyenda__n">{{ l.cuenta }}</span>
              </button>
            </li>
          }
        </ul>
        <sc-cal-anio
          class="b__anio-rejilla"
          tamano="grande"
          modo="elegir"
          [anio]="anio"
          [dias]="vista().dias"
          [hoy]="hoy"
          [seleccion]="seleccion()"
          [resaltar]="resaltar()"
          (seleccionChange)="elegir($event)"
          (encima)="encima.set($event)"
        />
        <p class="b__pie sc-text-caption-regular" aria-live="polite">{{ pie() }}</p>
      </section>

      <aside class="b__panel" aria-label="Panel">
        @switch (panel().modo) {
          @case ('reglas') {
            <div class="panel">
              <p class="consejo sc-text-body-regular"><sc-icon name="touch_app" size="sm" />Pulsa un día o arrastra sobre varios para cambiarlos.</p>

              <div class="grupo">
                <sc-inputtext inputId="b-nombre" fluid required size="sm" label="Nombre" placeholder="Por ejemplo, Oficinas Madrid" [value]="cal().nombre" (valueChange)="b.cambiar({ nombre: $event })" />
                <sc-select inputId="b-zona" size="sm" label="Zona horaria" [options]="zonas" optionLabel="label" optionValue="value" [value]="cal().zona" (valueChange)="b.cambiar({ zona: $any($event) })" />
              </div>

              <div class="grupo">
                <h2 class="grupo__titulo sc-text-body-semibold">Todo el año</h2>
                <div class="fila">
                  <sc-select class="fila__crece" inputId="b-horario" size="sm" ariaLabel="Horario de todo el año" [options]="opcionesHorario()" optionLabel="label" optionValue="value" [value]="cal().horarioId" (valueChange)="b.cambiar({ horarioId: $any($event) })" />
                  <sc-button variant="secondary" appearance="text" size="sm" icon="edit" ariaLabel="Editar este horario" (clicked)="abrirHorario(cal().horarioId, 'base')" />
                  <sc-button variant="secondary" appearance="text" size="sm" icon="add" ariaLabel="Crear un horario nuevo" (clicked)="abrirHorario(0, 'base')" />
                </div>
                @if (horarioBase(); as h) {
                  <sc-cal-semana [semana]="h.semana" />
                }
                <sc-select inputId="b-locucion" size="sm" label="Fuera de horario suena" [options]="locuciones" optionLabel="label" optionValue="value" [value]="cal().locucion" (valueChange)="b.cambiar({ locucion: $any($event) })" />
              </div>

              <div class="grupo">
                <h2 class="grupo__titulo sc-text-body-semibold">Periodos</h2>
                @for (p of cal().periodos; track p.id) {
                  <button type="button" class="item" (click)="abrirPeriodo(p)" (mouseenter)="resaltar.set('periodo:' + p.id)" (mouseleave)="resaltar.set(null)">
                    <i class="item__color" [attr.data-color]="p.color"></i>
                    <span class="item__texto">
                      <span class="sc-text-body-semibold">{{ p.nombre }}</span>
                      <span class="pista sc-text-caption-regular">{{ fechasDe(p) }}, {{ nombreHorario(p.horarioId) }}</span>
                    </span>
                    <sc-icon name="chevron_right" size="sm" />
                  </button>
                } @empty {
                  <p class="pista sc-text-caption-regular">Ninguno. Para añadir uno, arrastra sobre el año sus fechas.</p>
                }
              </div>

              <div class="grupo">
                <h2 class="grupo__titulo sc-text-body-semibold">Festivos oficiales</h2>
                <sc-select inputId="b-ubicacion" size="sm" filter ariaLabel="Festivos de" [options]="ubicaciones" optionLabel="label" optionValue="value" [value]="cal().ubicacion ?? ''" (valueChange)="b.cambiar({ ubicacion: $any($event) || null })" />
                <p class="pista sc-text-caption-regular">{{ resumenFestivos() }}</p>
              </div>

              <div class="grupo">
                <h2 class="grupo__titulo sc-text-body-semibold">Festivos y días especiales</h2>
                @for (e of especiales(); track e.id) {
                  <button type="button" class="item" (click)="editar.set(e)" (mouseenter)="resaltar.set('especial:' + e.id)" (mouseleave)="resaltar.set(null)">
                    <i class="item__color" [attr.data-color]="e.franjas.length ? 'warning' : 'danger'"></i>
                    <span class="item__texto">
                      <span class="sc-text-body-semibold">{{ e.nombre }}</span>
                      <span class="pista sc-text-caption-regular">{{ fechasTexto(e) }}</span>
                    </span>
                    <sc-icon name="chevron_right" size="sm" />
                  </button>
                }
                <sc-button class="alinear-inicio" variant="secondary" appearance="text" size="sm" icon="add" label="Añadir festivo o día especial" [disabled]="!!b.motivo()" [pTooltip]="b.motivo() ?? ''" tooltipPosition="top" tooltipEvent="both" (clicked)="abrirAtajo([])" />
              </div>
            </div>
          }

          @case ('seleccion') {
            @let r = $any(panel()).rango;
            <div class="panel">
              <div class="cabeza">
                <sc-button variant="secondary" appearance="text" size="sm" icon="arrow_back" ariaLabel="Volver a las reglas" (clicked)="volver()" />
                <h2 class="cabeza__titulo sc-text-body-semibold">{{ tituloRango(r) }}</h2>
              </div>
              @if (r.desde === r.hasta) {
                @let d = diaDe(r.desde);
                <div class="ficha">
                  <p class="ficha__horas sc-text-title-semibold">{{ horasTexto(d.franjas) }}</p>
                  <p class="sc-text-body-regular">{{ porQue(d) }}</p>
                  <p class="pista sc-text-caption-regular">Fuera de horario suena {{ d.locucion }}</p>
                </div>
              } @else {
                <p class="pista sc-text-body-regular">{{ resumenRango(r) }}</p>
              }
              <button type="button" class="accion" (click)="nuevoPeriodoDesde(r)">
                <sc-icon name="date_range" />
                <span class="item__texto">
                  <span class="sc-text-body-semibold">Usar otro horario en estas fechas</span>
                  <span class="pista sc-text-caption-regular">Crea un periodo, por ejemplo el horario de verano</span>
                </span>
              </button>
              <button type="button" class="accion" (click)="abrirAtajo(diasDe(r))">
                <sc-icon name="event_busy" />
                <span class="item__texto">
                  <span class="sc-text-body-semibold">{{ r.desde === r.hasta ? 'Cerrar este día o cambiar sus horas' : 'Cerrar estos días o cambiar sus horas' }}</span>
                  <span class="pista sc-text-caption-regular">Un festivo o un día especial; puede valer para otros calendarios</span>
                </span>
              </button>
              @if (r.desde === r.hasta && diaDe(r.desde).especial; as e) {
                <sc-button class="alinear-inicio" variant="secondary" appearance="outlined" size="sm" icon="edit" [label]="'Editar «' + e.nombre + '»'" (clicked)="editar.set(e)" />
              }
            </div>
          }

          @case ('periodo') {
            @let p = $any(panel()).periodo;
            <div class="panel">
              <div class="cabeza">
                <sc-button variant="secondary" appearance="text" size="sm" icon="arrow_back" ariaLabel="Volver a las reglas" (clicked)="volver()" />
                <h2 class="cabeza__titulo sc-text-body-semibold">{{ $any(panel()).nuevo ? 'Nuevo periodo' : p.nombre }}</h2>
              </div>
              <sc-inputtext inputId="b-periodo-nombre" fluid size="sm" label="Nombre" placeholder="Por ejemplo, Verano" [value]="p.nombre" (valueChange)="tocarPeriodo({ nombre: $event })" />
              <sc-datepicker inputId="b-periodo-fechas" size="sm" selectionMode="range" label="Fechas" [range]="rangoPanel()" (rangeChange)="ponerFechas($event)" />
              <div class="switch-field">
                <sc-toggleswitch inputId="b-periodo-anual" ariaLabel="Se repite cada año" [checked]="p.anio === null" (checkedChange)="tocarPeriodo({ anio: $event ? null : anio })" />
                <div class="switch-field__copy">
                  <label class="switch-field__label sc-text-body-regular" for="b-periodo-anual">Se repite cada año</label>
                </div>
              </div>
              <div class="fila">
                <sc-select class="fila__crece" inputId="b-periodo-horario" size="sm" label="Horario" [options]="opcionesHorario()" optionLabel="label" optionValue="value" [value]="p.horarioId" (valueChange)="tocarPeriodo({ horarioId: $any($event) })" />
                <sc-button variant="secondary" appearance="text" size="sm" icon="edit" ariaLabel="Editar este horario" (clicked)="abrirHorario(p.horarioId, 'periodo')" />
                <sc-button variant="secondary" appearance="text" size="sm" icon="add" ariaLabel="Crear un horario nuevo" (clicked)="abrirHorario(0, 'periodo')" />
              </div>
              @if (horario(p.horarioId); as h) {
                <sc-cal-semana [semana]="h.semana" />
              }
              <sc-select inputId="b-periodo-locucion" size="sm" label="Fuera de horario suena" [options]="locucionesPeriodo" optionLabel="label" optionValue="value" [value]="p.locucion ?? ''" (valueChange)="tocarPeriodo({ locucion: $any($event) || null })" />
              <div class="pie">
                @if (!$any(panel()).nuevo) {
                  <sc-button class="pie__izq" variant="danger" appearance="text" size="sm" icon="close" label="Quitar" (clicked)="quitarPeriodo(p)" />
                }
                <sc-button variant="secondary" appearance="outlined" size="sm" label="Cancelar" (clicked)="volver()" />
                <sc-button variant="primary" size="sm" [label]="$any(panel()).nuevo ? 'Crear periodo' : 'Aplicar'" (clicked)="aplicarPeriodo()" />
              </div>
            </div>
          }

          @case ('horario') {
            @let h = $any(panel());
            <div class="panel">
              <div class="cabeza">
                <sc-button variant="secondary" appearance="text" size="sm" icon="arrow_back" ariaLabel="Volver sin guardar el horario" (clicked)="panel.set(h.vuelta)" />
                <h2 class="cabeza__titulo sc-text-body-semibold">{{ h.id ? 'Editar horario' : 'Nuevo horario' }}</h2>
              </div>
              <sc-inputtext inputId="b-horario-nombre" fluid size="sm" label="Nombre" placeholder="Por ejemplo, Jornada completa" [value]="h.nombre" (valueChange)="panel.set({ ...h, nombre: $event })" />
              <sc-cal-semana editable [semana]="h.semana" (semanaChange)="panel.set({ ...h, semana: $event })" />
              @if (h.id) {
                <p class="pista sc-text-caption-regular">{{ usoTexto(h.id) }}</p>
              }
              <div class="pie">
                <sc-button variant="secondary" appearance="outlined" size="sm" label="Cancelar" (clicked)="panel.set(h.vuelta)" />
                <sc-button variant="primary" size="sm" [disabled]="!h.nombre.trim()" [label]="h.id ? 'Guardar horario' : 'Crear horario'" (clicked)="guardarHorario()" />
              </div>
            </div>
          }
        }
      </aside>
    </div>

    @if (editar(); as e) {
      <sc-cal-festivo-dialogo [especial]="e" (cerrado)="editar.set(null); volver()" />
    }
    @if (atajo(); as fechas) {
      <sc-cal-festivo-dialogo [calendariosIniciales]="[cal().id]" [fechasIniciales]="fechas" (cerrado)="atajo.set(null)" (guardado)="volver()" />
    }
    @if (impacto(); as i) {
      <sc-cal-impacto-dialogo [nombreHorario]="i.nombre" [usos]="i.usos" [desde]="b.esNuevo() ? null : cal()" (elegido)="confirmarHorario($event)" (cancelado)="impacto.set(null)" />
    }
  `,
  styles: `
    :host { display: block; height: 100%; background: var(--sc-bg-canvas); }
    .b {
      display: grid; grid-template-columns: minmax(0, 7fr) minmax(20rem, 3fr); gap: var(--sc-spacing-1-5);
      block-size: 100%; padding: var(--sc-spacing-1-5) var(--sc-spacing-2); box-sizing: border-box;
    }
    .b__lienzo, .b__panel {
      min-inline-size: 0; min-block-size: 0;
      border: 1px solid var(--sc-border-subtle); border-radius: var(--sc-radius-lg);
      background: var(--sc-bg-surface);
    }
    .b__lienzo { display: flex; flex-direction: column; gap: var(--sc-spacing-1); padding: var(--sc-spacing-1-25) var(--sc-spacing-1-5); overflow: auto; }
    .b__panel { overflow-y: auto; }
    .b__barra { display: flex; align-items: center; justify-content: space-between; gap: var(--sc-spacing-1); }
    .b__titulo { margin: 0; color: var(--sc-text-heading); }
    .b__anio { color: var(--sc-text-subtle); font-variant-numeric: tabular-nums; }
    .b__pie { margin: 0; min-block-size: 1.5em; color: var(--sc-text-secondary); }
    .panel { display: flex; flex-direction: column; gap: var(--sc-spacing-1); padding: var(--sc-spacing-1-25); }
    .consejo { display: flex; align-items: center; gap: var(--sc-spacing-0-5); margin: 0; padding: var(--sc-spacing-0-75) var(--sc-spacing-1); border-radius: var(--sc-radius-md); background: var(--sc-bg-primary-subtle); color: var(--sc-text-heading); }
    .grupo { display: flex; flex-direction: column; gap: var(--sc-spacing-0-75); padding-block-start: var(--sc-spacing-1); border-block-start: 1px solid var(--sc-border-subtle); }
    .grupo:first-of-type { padding-block-start: 0; border: 0; }
    .grupo__titulo { margin: 0; color: var(--sc-text-heading); }
    .fila { display: flex; align-items: flex-end; gap: var(--sc-spacing-0-25); }
    .fila__crece { flex: 1; min-inline-size: 0; }
    .pista { margin: 0; color: var(--sc-text-secondary); }
    .alinear-inicio { align-self: flex-start; }
    .item, .accion {
      display: flex; align-items: center; gap: var(--sc-spacing-0-75);
      padding: var(--sc-spacing-0-5) var(--sc-spacing-0-75);
      border: 1px solid var(--sc-border-subtle); border-radius: var(--sc-radius-md);
      background: var(--sc-bg-surface); color: var(--sc-text-primary); text-align: start; cursor: pointer;
      transition-property: background-color, scale; transition-duration: 150ms; transition-timing-function: ease-out;
      &:hover { background: var(--sc-bg-hover); }
      &:active { scale: 0.96; }
      &:focus-visible { outline: 2px solid var(--sc-border-focus); outline-offset: 1px; }
    }
    .accion { padding: var(--sc-spacing-0-75) var(--sc-spacing-1); color: var(--sc-text-link); }
    .accion .sc-text-body-semibold { color: var(--sc-text-heading); }
    .item__texto { display: flex; flex: 1; flex-direction: column; min-inline-size: 0; }
    .item__color { flex: none; inline-size: var(--sc-spacing-0-75); block-size: var(--sc-spacing-0-75); border-radius: var(--sc-radius-xs); }
    .item__color[data-color='info'] { background: var(--sc-bg-info); }
    .item__color[data-color='violet'] { background: var(--sc-bg-violet); }
    .item__color[data-color='success'] { background: var(--sc-bg-success); }
    .item__color[data-color='primary'] { background: var(--sc-bg-primary); }
    .item__color[data-color='warning'] { background: var(--sc-bg-warning); }
    .item__color[data-color='danger'] { background: var(--sc-bg-danger); }
    .cabeza { display: flex; align-items: center; gap: var(--sc-spacing-0-25); }
    .cabeza__titulo { margin: 0; color: var(--sc-text-heading); }
    .ficha { display: flex; flex-direction: column; gap: var(--sc-spacing-0-25); padding: var(--sc-spacing-1); border-radius: var(--sc-radius-md); background: var(--sc-bg-subtle); }
    .ficha p { margin: 0; }
    .ficha__horas { color: var(--sc-text-heading); font-variant-numeric: tabular-nums; }
    .pie { display: flex; gap: var(--sc-spacing-0-5); justify-content: flex-end; padding-block-start: var(--sc-spacing-0-5); }
    .pie__izq { margin-inline-end: auto; }
    .leyenda { display: flex; flex-wrap: wrap; gap: var(--sc-spacing-0-25); margin: 0; padding: 0; list-style: none; }
    .leyenda__item {
      display: inline-flex; align-items: center; gap: var(--sc-spacing-0-375);
      padding: var(--sc-spacing-0-25) var(--sc-spacing-0-5);
      border: 1px solid var(--sc-border-subtle); border-radius: var(--sc-radius-full);
      background: var(--sc-bg-surface); color: var(--sc-text-primary); cursor: pointer;
      transition-property: background-color, border-color, scale; transition-duration: 150ms; transition-timing-function: ease-out;
      &:hover { background: var(--sc-bg-hover); }
      &:active { scale: 0.96; }
      &:focus-visible { outline: 2px solid var(--sc-border-focus); outline-offset: 1px; }
    }
    .leyenda__item--on { border-color: var(--sc-border-primary); background: var(--sc-bg-primary-subtle); }
    .leyenda__item i { inline-size: var(--sc-spacing-0-75); block-size: var(--sc-spacing-0-75); border-radius: var(--sc-radius-xs); border: 1px solid var(--sc-border-subtle); background: var(--sc-bg-surface); }
    .leyenda__item i[data-tono='cerrado'] { background: var(--sc-bg-subtle); }
    .leyenda__item i[data-tono='t-info'] { background: var(--sc-bg-info-subtle); border-color: var(--sc-border-info); }
    .leyenda__item i[data-tono='t-violet'] { background: var(--sc-bg-violet-subtle); border-color: var(--sc-border-violet); }
    .leyenda__item i[data-tono='t-success'] { background: var(--sc-bg-success-subtle); border-color: var(--sc-border-success); }
    .leyenda__item i[data-tono='t-primary'] { background: var(--sc-bg-primary-subtle); border-color: var(--sc-border-primary); }
    .leyenda__item i[data-tono='t-warning'] { background: var(--sc-bg-warning-subtle); border-color: var(--sc-border-warning); }
    .leyenda__item i[data-tono='t-danger'] { background: var(--sc-bg-danger-subtle); border-color: var(--sc-border-danger); }
    .leyenda__n { color: var(--sc-text-secondary); font-variant-numeric: tabular-nums; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalCalendarioBComponent {
  protected readonly b = inject(CalBorrador);
  private readonly store = inject(CalStore);
  private readonly resultado = inject(ResultadoAccionService);

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
  protected readonly porQue = porQue;

  protected readonly panel = signal<Panel>({ modo: 'reglas' });
  protected readonly lente = signal<Lente>('horas');
  protected readonly resaltar = signal<string | null>(null);
  protected readonly encima = signal<string | null>(null);
  protected readonly editar = signal<DiaEspecial | null>(null);
  protected readonly atajo = signal<readonly string[] | null>(null);
  protected readonly impacto = signal<{ nombre: string; usos: ReturnType<typeof usosDe> } | null>(null);

  /** El estado con este calendario tal como está ahora y, si hay un periodo abierto, con él puesto. */
  private readonly estado = computed(() => {
    const e = this.store.estado();
    return { ...e, calendarios: [...e.calendarios.filter((x) => x.id !== this.cal().id), this.calPintado()] };
  });
  private readonly calPintado = computed(() => {
    const c = this.cal();
    const p = this.panel();
    if (p.modo !== 'periodo') return c;
    const otros = c.periodos.filter((x) => x.id !== p.periodo.id);
    return { ...c, periodos: [...otros, p.periodo] };
  });
  protected readonly vista = computed(() => vistaDelAnio(this.estado(), this.calPintado(), ANIO, this.lente()));
  protected readonly seleccion = computed<Rango | null>(() => {
    const p = this.panel();
    if (p.modo === 'seleccion') return p.rango;
    if (p.modo === 'periodo') return CalBorrador.rangoDe(p.periodo);
    return null;
  });

  protected readonly opcionesHorario = computed(() => this.store.horarios().map((h) => ({ value: h.id, label: h.nombre })));
  protected readonly horarioBase = computed(() => this.store.horario(this.cal().horarioId));
  protected readonly resumenFestivos = computed(() => resumenDeFestivos(this.cal().ubicacion, ANIO));
  protected readonly especiales = computed(() => this.store.especiales().filter((e) => this.cal().id !== 0 && e.calendarioIds.includes(this.cal().id)));
  protected readonly pie = computed(() => {
    const iso = this.encima();
    if (!iso) return 'Pasa por un día para ver qué horas tiene y por qué.';
    const d = resolver(this.estado(), this.calPintado(), iso);
    return `${textoDeRango(iso, iso)}: ${this.horasTexto(d.franjas)}. ${porQue(d)}. Fuera de horario suena ${d.locucion}.`;
  });

  protected horario(id: number) {
    return this.store.horario(id);
  }

  protected nombreHorario(id: number): string {
    return this.store.horario(id)?.nombre ?? 'Sin horario';
  }

  protected fechasDe(p: Periodo): string {
    return `${mesDiaCorto(p.desde)} a ${mesDiaCorto(p.hasta)}${p.anio === null ? '' : ` de ${p.anio}`}`;
  }

  protected fechasTexto(e: DiaEspecial): string {
    const otros = e.calendarioIds.filter((id) => id !== this.cal().id).length;
    return `${e.fechas.map(fechaCorta).join(', ')}${e.cadaAnio ? ', cada año' : ''}. ${e.franjas.length ? textoDeFranjas(e.franjas) : 'Cerrado'}${otros ? `. Y en ${otros} ${otros === 1 ? 'calendario más' : 'calendarios más'}` : ''}`;
  }

  protected horasTexto(franjas: readonly (readonly [number, number])[]): string {
    return textoDeFranjas(franjas);
  }

  protected usoTexto(id: number): string {
    const usos = usosDe(this.store.estado(), id);
    return usos.length === 0 ? 'Aún no lo usa ningún calendario.' : `Lo usan: ${usos.map((c) => c.nombre).join(', ')}.`;
  }

  protected diaDe(iso: string) {
    return resolver(this.estado(), this.calPintado(), iso);
  }

  protected tituloRango(r: Rango): string {
    return textoDeRango(r.desde, r.hasta);
  }

  protected resumenRango(r: Rango): string {
    const dias = fechasEntre(r.desde, r.hasta).map((iso) => this.diaDe(iso));
    const abiertos = dias.filter((d) => d.franjas.length).length;
    return `${abiertos} abiertos y ${dias.length - abiertos} cerrados con lo que hay ahora.`;
  }

  protected diasDe(r: Rango): string[] {
    const dias = fechasEntre(r.desde, r.hasta);
    return dias.length <= 62 ? dias : [];
  }

  protected elegir(r: Rango | null): void {
    this.panel.set(r ? { modo: 'seleccion', rango: r } : { modo: 'reglas' });
  }

  protected volver(): void {
    this.panel.set({ modo: 'reglas' });
  }

  protected abrirPeriodo(p: Periodo): void {
    this.panel.set({ modo: 'periodo', periodo: p, nuevo: false });
  }

  protected nuevoPeriodoDesde(r: Rango): void {
    const c = this.cal();
    const id = c.periodos.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    this.panel.set({
      modo: 'periodo',
      nuevo: true,
      periodo: { id, nombre: '', desde: r.desde.slice(5), hasta: r.hasta.slice(5), anio: null, horarioId: c.horarioId, locucion: null, color: this.store.colorLibre(c) },
    });
  }

  protected tocarPeriodo(parcial: Partial<Periodo>): void {
    const p = this.panel();
    if (p.modo === 'periodo') this.panel.set({ ...p, periodo: { ...p.periodo, ...parcial } });
  }

  /** Las fechas del periodo abierto para su selector. En un `computed`: un array nuevo en cada pasada lo repintaba sin fin. */
  protected readonly rangoPanel = computed(() => {
    const p = this.panel();
    if (p.modo !== 'periodo') return null;
    const r = CalBorrador.rangoDe(p.periodo);
    return [aFecha(r.desde), aFecha(r.hasta)] as const;
  });

  protected ponerFechas(r: readonly (Date | null)[] | null): void {
    const [a, z] = r ?? [];
    if (!a || !z) return;
    const p = this.panel();
    const desde = aIso(a);
    this.tocarPeriodo({ desde: desde.slice(5), hasta: aIso(z).slice(5), anio: p.modo === 'periodo' && p.periodo.anio === null ? null : +desde.slice(0, 4) });
  }

  protected aplicarPeriodo(): void {
    const p = this.panel();
    if (p.modo !== 'periodo') return;
    const periodo = { ...p.periodo, nombre: p.periodo.nombre.trim() || 'Periodo' };
    if (p.nuevo) this.b.cambiar({ periodos: [...this.cal().periodos, periodo] });
    else this.b.cambiarPeriodo(periodo.id, periodo);
    this.volver();
  }

  protected quitarPeriodo(p: Periodo): void {
    this.b.quitarPeriodo(p.id);
    this.volver();
  }

  /** Abre el editor de horario en el panel; `id` 0 es uno nuevo. Al guardarlo vuelve a donde estaba con él puesto. */
  protected abrirHorario(id: number, para: string): void {
    const h = id ? this.store.horario(id) : null;
    this.panel.set({
      modo: 'horario',
      id: h?.id ?? 0,
      nombre: h?.nombre ?? '',
      semana: h?.semana ?? [0, 1, 2, 3, 4].map(() => [[540, 1080] as const]).concat([[], []]),
      para,
      vuelta: this.panel(),
    });
  }

  protected guardarHorario(): void {
    const p = this.panel();
    if (p.modo !== 'horario') return;
    const usos = p.id ? usosDe(this.store.estado(), p.id) : [];
    if (usos.length > 1) {
      this.impacto.set({ nombre: p.nombre, usos });
      return;
    }
    this.confirmarHorario('todos');
  }

  protected confirmarHorario(donde: 'todos' | 'solo'): void {
    this.impacto.set(null);
    const p = this.panel();
    if (p.modo !== 'horario') return;
    const borrador = { id: p.id, nombre: p.nombre.trim(), semana: p.semana };
    let id: number;
    if (donde === 'solo' && p.id) {
      const copia = this.store.copiarHorario(borrador);
      this.store.cambiarHorarioEn(this.cal().id, p.id, copia.id);
      // El borrador del calendario también: lo que no se ha guardado aún debe usar la copia.
      this.b.cambiar({
        horarioId: this.cal().horarioId === p.id ? copia.id : this.cal().horarioId,
        periodos: this.cal().periodos.map((x) => (x.horarioId === p.id ? { ...x, horarioId: copia.id } : x)),
      });
      id = copia.id;
      this.resultado.contar(`Horario «${copia.nombre}» creado solo para este calendario`);
    } else {
      id = this.store.guardarHorario(borrador).id;
      this.resultado.contar(p.id ? `Horario «${borrador.nombre}» guardado` : `Horario «${borrador.nombre}» creado`);
    }
    const vuelta = p.vuelta;
    if (p.para === 'base') {
      this.b.cambiar({ horarioId: id });
      this.panel.set(vuelta);
    } else if (vuelta.modo === 'periodo') {
      this.panel.set({ ...vuelta, periodo: { ...vuelta.periodo, horarioId: id } });
    } else {
      this.panel.set(vuelta);
    }
  }

  protected abrirAtajo(fechas: readonly string[]): void {
    if (this.b.esNuevo() && !this.b.guardar(true)) return;
    this.atajo.set(fechas);
  }

  protected readonly resumenDeSemana = resumenDeSemana;
}

import { ChangeDetectionStrategy, Component, computed, inject, input, type OnInit, output, signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import {
  ScButtonComponent,
  ScCheckboxComponent,
  ScCustomModalComponent,
  ScCustomModalFooterDirective,
  ScDatepickerComponent,
  ScInputTextComponent,
  ScSelectButtonComponent,
  ScToggleSwitchComponent,
} from '@smartcontact-hub/components';

import { ResultadoAccionService } from '@core/services/resultado-accion.service';
import { HorarioFranjasComponent } from '@features/admin/repositories/components/horario/horario-franjas.component';
import { type DiaEspecial, fechaCorta, type Franja, HOY, isoDe, LOCUCIONES, ubicacion } from './cal-modelo';
import { CalStore } from './cal-store';

const aFecha = (iso: string): Date => new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const aIso = (d: Date): string => isoDe(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

/**
 * PROTOTIPO DE DISCOVERY: el atajo. Un festivo o día especial se da de alta una vez, con sus fechas, cómo queda el día
 * y en qué calendarios vale. Es el mismo en los dos prototipos: desde la lista de calendarios («Nuevo festivo»), desde
 * un calendario (lo trae marcado) y, en B, desde los días elegidos en el año (los trae puestos).
 */
@Component({
  selector: 'sc-cal-festivo-dialogo',
  imports: [
    HorarioFranjasComponent,
    ScButtonComponent,
    ScCheckboxComponent,
    ScCustomModalComponent,
    ScCustomModalFooterDirective,
    ScDatepickerComponent,
    ScInputTextComponent,
    ScSelectButtonComponent,
    ScToggleSwitchComponent,
    TooltipModule,
  ],
  template: `
    <sc-custom-modal [visible]="true" width="40rem" [title]="titulo()" (closed)="cerrado.emit()">
      <div class="dialogo">
        <div class="bloque">
          <div class="field">
            <sc-inputtext inputId="festivo-nombre" fluid label="Nombre" placeholder="Por ejemplo, Santo Tomás de Aquino" [value]="nombre()" (valueChange)="nombre.set($event)" />
          </div>
          <div class="field">
            <sc-datepicker
              inputId="festivo-fechas"
              selectionMode="multiple"
              label="Qué días"
              placeholder="Elige uno o varios días"
              [dates]="fechasComoDate()"
              [defaultDate]="hoyDate"
              [helperText]="textoFechas()"
              (datesChange)="ponerFechas($event)"
            />
          </div>
          <div class="switch-field">
            <sc-toggleswitch inputId="festivo-anual" ariaLabel="Se repite cada año en la misma fecha" [checked]="cadaAnio()" (checkedChange)="cadaAnio.set($event)" />
            <div class="switch-field__copy">
              <label class="switch-field__label sc-text-body-regular" for="festivo-anual">Se repite cada año en la misma fecha</label>
            </div>
          </div>
        </div>

        <div class="bloque">
          <span class="field__label sc-text-caption-semibold" id="festivo-como">Cómo queda el día</span>
          <sc-selectbutton ariaLabelledBy="festivo-como" [options]="opcionesComo" optionLabel="label" optionValue="value" [allowEmpty]="false" [value]="como()" (valueChange)="ponerComo($any($event))" />
          @if (como() === 'horas') {
            <sc-horario-franjas [franjas]="franjas()" etiqueta="este día" (franjasChange)="franjas.set($event)" />
          }
        </div>

        <div class="bloque">
          <span class="field__label sc-text-caption-semibold" id="festivo-donde">En qué calendarios</span>
          <ul class="calendarios" role="list" aria-labelledby="festivo-donde">
            @for (c of calendarios(); track c.id) {
              <li>
                <sc-checkbox [state]="elegidos().has(c.id) ? 'all' : 'none'" (cycle)="alternar(c.id)">
                  <span class="calendarios__texto">
                    <span class="calendarios__nombre">{{ c.nombre }}</span>
                    <span class="calendarios__pista sc-text-caption-regular">{{ c.pista }}</span>
                  </span>
                </sc-checkbox>
              </li>
            }
          </ul>
        </div>
      </div>

      <div scCustomModalFooter class="pie">
        @if (especial()) {
          <sc-button class="pie__borrar" size="sm" variant="danger" appearance="text" icon="delete" label="Eliminar" (clicked)="eliminar()" />
        }
        <sc-button size="sm" variant="secondary" appearance="outlined" label="Cancelar" (clicked)="cerrado.emit()" />
        <sc-button
          size="sm"
          variant="primary"
          [disabled]="!!motivo()"
          [pTooltip]="motivo() ?? ''"
          tooltipPosition="top"
          tooltipEvent="both"
          [label]="especial() ? 'Guardar' : 'Dar de alta'"
          (clicked)="guardar()"
        />
      </div>
    </sc-custom-modal>
  `,
  styles: `
    .dialogo { display: flex; flex-direction: column; gap: var(--sc-spacing-2); }
    .bloque { display: flex; flex-direction: column; gap: var(--sc-spacing-1); }
    .calendarios { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sc-spacing-0-75) var(--sc-spacing-1-5); margin: 0; padding: 0; list-style: none; }
    .calendarios__texto { display: flex; flex-direction: column; gap: var(--sc-spacing-0-125); }
    .calendarios__pista { display: block; color: var(--sc-text-secondary); }
    .pie { display: flex; gap: var(--sc-spacing-0-5); justify-content: flex-end; }
    .pie__borrar { margin-inline-end: auto; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalFestivoDialogoComponent implements OnInit {
  private readonly store = inject(CalStore);
  private readonly resultado = inject(ResultadoAccionService);

  /** Uno que ya existe, para editarlo. */
  readonly especial = input<DiaEspecial | null>(null);
  /** Los calendarios que vienen marcados (el que se está editando). */
  readonly calendariosIniciales = input<readonly number[]>([]);
  /** Los días que vienen puestos (los elegidos en el año). */
  readonly fechasIniciales = input<readonly string[]>([]);
  readonly cerrado = output<void>();
  readonly guardado = output<DiaEspecial>();

  /** El reloj del prototipo (8 de enero de 2025): el selector abre en ese mes, no en el de hoy de verdad. */
  protected readonly hoyDate = aFecha(HOY);
  protected readonly nombre = signal('');
  protected readonly fechas = signal<readonly string[]>([]);
  protected readonly cadaAnio = signal(false);
  protected readonly como = signal<'cerrado' | 'horas'>('cerrado');
  protected readonly franjas = signal<readonly Franja[]>([[480, 900]]);
  protected readonly locucion = signal<string | null>(null);
  protected readonly elegidos = signal<ReadonlySet<number>>(new Set());

  protected readonly opcionesComo = [
    { value: 'cerrado', label: 'Cerrado todo el día' },
    { value: 'horas', label: 'Abre con otras horas' },
  ];
  protected readonly opcionesLocucion = [{ value: '', label: 'La del periodo en que cae' }, ...LOCUCIONES.map((l) => ({ value: l, label: l }))];

  protected readonly calendarios = computed(() =>
    this.store.calendarios().map((c) => ({ id: c.id, nombre: c.nombre, pista: ubicacion(c.ubicacion)?.etiqueta ?? 'Sin festivos oficiales' })),
  );

  protected readonly titulo = computed(() => (this.especial() ? 'Editar festivo o día especial' : 'Nuevo festivo o día especial'));
  protected readonly fechasComoDate = computed(() => this.fechas().map(aFecha));
  protected readonly textoFechas = computed(() => {
    const f = [...this.fechas()].sort();
    return f.length === 0 ? 'Puedes elegir varios días a la vez' : f.map(fechaCorta).join(', ');
  });

  protected readonly motivo = computed(() => {
    if (this.fechas().length === 0) return 'Elige al menos un día';
    if (this.elegidos().size === 0) return 'Marca al menos un calendario';
    if (this.como() === 'horas' && this.franjas().length === 0) return 'Añade las horas en las que se atiende';
    return null;
  });

  ngOnInit(): void {
    const e = this.especial();
    if (e) {
      this.nombre.set(e.nombre);
      this.fechas.set(e.fechas);
      this.cadaAnio.set(e.cadaAnio);
      this.como.set(e.franjas.length ? 'horas' : 'cerrado');
      if (e.franjas.length) this.franjas.set(e.franjas);
      this.locucion.set(e.locucion);
      this.elegidos.set(new Set(e.calendarioIds));
    } else {
      this.fechas.set(this.fechasIniciales());
      this.elegidos.set(new Set(this.calendariosIniciales()));
    }
  }

  protected ponerFechas(d: readonly Date[] | null): void {
    this.fechas.set((d ?? []).map(aIso));
  }

  protected ponerComo(v: 'cerrado' | 'horas' | null): void {
    if (v) this.como.set(v);
  }

  protected alternar(id: number): void {
    this.elegidos.update((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  protected guardar(): void {
    if (this.motivo()) return;
    const nombre = this.nombre().trim() || (this.como() === 'cerrado' ? 'Festivo' : 'Día especial');
    const hecho = this.store.guardarEspecial({
      id: this.especial()?.id ?? 0,
      nombre,
      fechas: [...this.fechas()].sort(),
      cadaAnio: this.cadaAnio(),
      franjas: this.como() === 'horas' ? this.franjas() : [],
      locucion: this.locucion(),
      calendarioIds: [...this.elegidos()],
    });
    const n = hecho.calendarioIds.length;
    this.resultado.contar(`«${nombre}» guardado en ${n} ${n === 1 ? 'calendario' : 'calendarios'}`);
    this.guardado.emit(hecho);
    this.cerrado.emit();
  }

  protected eliminar(): void {
    const e = this.especial();
    if (!e) return;
    this.store.borrarEspecial(e.id);
    this.resultado.contar(`«${e.nombre}» eliminado`);
    this.cerrado.emit();
  }
}

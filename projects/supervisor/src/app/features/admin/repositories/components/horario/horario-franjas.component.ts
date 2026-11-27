import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { ScBadgeComponent, ScButtonComponent, ScDatepickerComponent } from '@smartcontact-hub/components';

import { cruzaMedianoche, type Franja, MINUTOS_DEL_DIA } from '../../state/horarios.core.mjs';

interface Fila {
  readonly inicio: Date | null;
  readonly fin: Date | null;
  readonly noche: boolean;
  /** Una fila a medio rellenar (todavía no es una franja). */
  readonly borrador: boolean;
  /** Se puede quitar: las franjas y los borradores que sobran; el único campo vacío de un día no. */
  readonly quitable: boolean;
}

const aHora = (minutos: number): Date => new Date(2000, 0, 1, Math.floor((minutos % MINUTOS_DEL_DIA) / 60), minutos % 60);
const aMinutos = (hora: Date): number => hora.getHours() * 60 + hora.getMinutes();

/**
 * Las franjas de un día: cada una con su hora de inicio y de fin, y «Añadir franja». Un fin a las 00:00 es el final del
 * día; uno anterior al inicio acaba al día siguiente y lo dice. Lo usan la semana (habitual y de un periodo) y la fecha
 * especial.
 */
@Component({
  selector: 'sc-horario-franjas',
  imports: [NgTemplateOutlet, PopoverModule, TooltipModule, ScBadgeComponent, ScButtonComponent, ScDatepickerComponent, TranslateModule],
  template: `
    <ng-template #filaTpl let-fila let-i="i">
      <div class="franjas__fila">
        <!-- pieza nueva: DD-252, la hora de una franja es un sc-datepicker timeOnly (catálogo §6: una hora → sc-datepicker), repetido por franja como los controles de una condición de regla. -->
        <sc-datepicker
          class="franjas__hora"
          timeOnly
          size="sm"
          [placeholder]="'repositories.horarios.time_placeholder' | translate"
          [showIcon]="false"
          [ariaLabel]="('repositories.horarios.slot_start_aria' | translate: { day: etiqueta() })"
          [value]="fila.inicio"
          (valueChange)="cambiar(i, 0, $event)"
        />
        <span class="franjas__guion" aria-hidden="true">–</span>
        <sc-datepicker
          class="franjas__hora"
          timeOnly
          size="sm"
          [placeholder]="'repositories.horarios.time_placeholder' | translate"
          [showIcon]="false"
          [ariaLabel]="('repositories.horarios.slot_end_aria' | translate: { day: etiqueta() })"
          [value]="fila.fin"
          (valueChange)="cambiar(i, 1, $event)"
        />
        <!-- Quitar una franja: la papelera, que elimina algo que existe. -->
        @if (fila.quitable) {
          <sc-button
            variant="secondary"
            appearance="text"
            size="sm"
            icon="delete"
            [ariaLabel]="'repositories.horarios.slot_remove_aria' | translate: { day: etiqueta() }"
            (clicked)="quitar(i)"
          />
        }
      </div>
    </ng-template>

    @for (fila of visibles(); track $index) {
      <ng-container *ngTemplateOutlet="filaTpl; context: { $implicit: fila, i: $index }" />
    }
    <!-- Una franja no puede pasar de las 00:00 (no acaba al día siguiente): el aviso sale bajo ella y la hora no se aplica. -->
    @if (aviso()) {
      <p class="franjas__aviso sc-text-caption-regular" role="alert">{{ 'repositories.horarios.slot_midnight' | translate }}</p>
    }
    <!-- Las que pasan de las visibles, tras un badge con su número; al pulsarlo se abren para editarlas. -->
    @if (extras().length > 0) {
      <button type="button" class="franjas__extra" [attr.aria-label]="'+' + extras().length" (click)="masFranjas.toggle($event)">
        <sc-badge [label]="'+' + extras().length" variant="secondary" size="lg" />
      </button>
      <p-popover #masFranjas>
        <div class="franjas__resto">
          @for (fila of extras(); track $index) {
            <ng-container *ngTemplateOutlet="filaTpl; context: { $implicit: fila, i: visibles().length + $index }" />
          }
        </div>
      </p-popover>
    }
    <sc-button
      class="franjas__mas"
      variant="secondary"
      appearance="text"
      size="sm"
      icon="add"
      [ariaLabel]="'repositories.horarios.slot_add' | translate"
      [pTooltip]="'repositories.horarios.slot_add' | translate"
      tooltipPosition="top"
      (clicked)="anadir()"
    />
  `,
  styleUrl: './horario-franjas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioFranjasComponent {
  readonly franjas = input.required<readonly Franja[]>();
  /** A qué día pertenecen, para el nombre accesible de cada hora («Inicio, lunes»). */
  readonly etiqueta = input('');
  /** Sin franjas, enseña una fila con las dos horas vacías para empezar a rellenar (la franja existe al poner las dos). */
  readonly conVacia = input(false);
  /** Cuántas filas se ven; las demás, tras un badge «+N». `0` = todas. */
  readonly maxVisibles = input(0);
  readonly franjasChange = output<readonly Franja[]>();

  /** Se intentó una franja que pasa de las 00:00. */
  protected readonly aviso = signal(false);

  /** Filas a medio rellenar: sin franjas hay siempre una; un «+» añade otra. Con las dos horas puestas, la fila pasa a ser una franja. */
  private readonly borradores = signal<readonly (readonly [Date | null, Date | null])[]>([]);

  protected readonly filas = computed<readonly Fila[]>(() => {
    const f = this.franjas();
    const reales = f.map((x) => ({
      inicio: aHora(x[0]),
      fin: aHora(x[1]),
      noche: cruzaMedianoche(x) && x[1] !== 0,
      borrador: false,
      quitable: true,
    }));
    if (!this.conVacia()) return reales;
    const bs = this.borradores();
    const extra = bs.length > 0 ? bs : f.length === 0 ? [[null, null] as const] : [];
    return [
      ...reales,
      ...extra.map((b) => ({ inicio: b[0], fin: b[1], noche: false, borrador: true, quitable: f.length > 0 || extra.length > 1 })),
    ];
  });

  protected readonly visibles = computed(() => {
    const max = this.maxVisibles();
    return max > 0 ? this.filas().slice(0, max) : this.filas();
  });
  protected readonly extras = computed(() => {
    const max = this.maxVisibles();
    return max > 0 ? this.filas().slice(max) : [];
  });

  private borradoresActuales(): (readonly [Date | null, Date | null])[] {
    const bs = this.borradores();
    return bs.length > 0 ? [...bs] : [[null, null]];
  }

  protected cambiar(indice: number, extremo: 0 | 1, hora: Date | null): void {
    // Un campo vaciado no cambia la franja: se quita con su papelera.
    if (!hora) return;
    const n = this.franjas().length;
    if (indice >= n) return this.rellenarBorrador(indice - n, extremo, hora);
    const minutos = aMinutos(hora);
    const actual = this.franjas()[indice];
    // El fin a las 00:00 es el final del día, no su principio.
    const nueva: Franja = extremo === 0 ? [minutos, actual[1]] : [actual[0], minutos === 0 ? MINUTOS_DEL_DIA : minutos];
    // Una franja no pasa de las 00:00: si el fin no es posterior al inicio, no se aplica y se avisa.
    if (nueva[1] <= nueva[0]) {
      this.aviso.set(true);
      return;
    }
    this.aviso.set(false);
    this.franjasChange.emit(this.franjas().map((f, i): Franja => (i === indice ? nueva : f)));
  }

  /** Una fila vacía guarda lo que se va poniendo; con las dos horas, pasa a ser una franja. */
  private rellenarBorrador(k: number, extremo: 0 | 1, hora: Date): void {
    const bs = this.borradoresActuales();
    const [a, b] = bs[k] ?? [null, null];
    const nuevo: readonly [Date | null, Date | null] = extremo === 0 ? [hora, b] : [a, hora];
    if (nuevo[0] && nuevo[1] && aMinutos(nuevo[1]) !== 0 && aMinutos(nuevo[1]) <= aMinutos(nuevo[0])) {
      // Acabaría al día siguiente: no se crea, se avisa y se deja la fila para corregirla.
      this.aviso.set(true);
      bs[k] = nuevo;
      this.borradores.set(bs);
    } else if (nuevo[0] && nuevo[1]) {
      this.aviso.set(false);
      bs.splice(k, 1);
      this.borradores.set(bs);
      const fin = aMinutos(nuevo[1]);
      const franja: Franja = [aMinutos(nuevo[0]), fin === 0 ? MINUTOS_DEL_DIA : fin];
      this.franjasChange.emit([...this.franjas(), franja].sort((x, y) => x[0] - y[0]));
    } else {
      bs[k] = nuevo;
      this.borradores.set(bs);
    }
  }

  protected quitar(indice: number): void {
    const n = this.franjas().length;
    if (indice >= n) {
      const bs = this.borradoresActuales();
      bs.splice(indice - n, 1);
      this.borradores.set(bs);
      return;
    }
    this.franjasChange.emit(this.franjas().filter((_, i) => i !== indice));
  }

  /** La nueva empieza una hora después de la última y dura dos, sin pasar del día; la primera, de 09:00 a 18:00. */
  protected anadir(): void {
    const actuales = this.franjas();
    const ultima = actuales[actuales.length - 1];
    // Sin franjas todavía: otra fila vacía junto a la que ya hay.
    if (!ultima) {
      this.borradores.set([...this.borradoresActuales(), [null, null]]);
      return;
    }
    const tope = cruzaMedianoche(ultima) ? MINUTOS_DEL_DIA : ultima[1];
    const inicio = Math.min(tope + 60, MINUTOS_DEL_DIA - 60);
    this.franjasChange.emit([...actuales, [inicio, Math.min(inicio + 120, MINUTOS_DEL_DIA)]]);
  }
}


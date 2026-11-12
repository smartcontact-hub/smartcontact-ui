import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScButtonComponent, ScDatepickerComponent, ScTagComponent } from '@smartcontact-hub/components';

import { cruzaMedianoche, type Franja, MINUTOS_DEL_DIA } from '../../state/horarios.core.mjs';

interface Fila {
  readonly inicio: Date;
  readonly fin: Date;
  readonly noche: boolean;
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
  imports: [ScButtonComponent, ScDatepickerComponent, ScTagComponent, TranslateModule],
  template: `
    @for (fila of filas(); track $index) {
      <div class="franjas__fila">
        <sc-datepicker
          class="franjas__hora"
          timeOnly
          placeholder="hh:mm"
          [showIcon]="false"
          [ariaLabel]="('repositories.horarios.slot_start_aria' | translate: { day: etiqueta() })"
          [value]="fila.inicio"
          (valueChange)="cambiar($index, 0, $event)"
        />
        <span class="franjas__guion" aria-hidden="true">–</span>
        <sc-datepicker
          class="franjas__hora"
          timeOnly
          placeholder="hh:mm"
          [showIcon]="false"
          [ariaLabel]="('repositories.horarios.slot_end_aria' | translate: { day: etiqueta() })"
          [value]="fila.fin"
          (valueChange)="cambiar($index, 1, $event)"
        />
        @if (fila.noche) {
          <sc-tag severity="secondary" [value]="'repositories.horarios.next_day' | translate" />
        }
        <sc-button
          variant="secondary"
          appearance="text"
          size="sm"
          icon="close"
          iconOnly
          [ariaLabel]="'repositories.horarios.slot_remove_aria' | translate: { day: etiqueta() }"
          (clicked)="quitar($index)"
        />
      </div>
    }
    <sc-button
      class="franjas__mas"
      variant="secondary"
      appearance="text"
      size="sm"
      icon="add"
      [label]="'repositories.horarios.slot_add' | translate"
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
  readonly franjasChange = output<readonly Franja[]>();

  protected readonly filas = computed<readonly Fila[]>(() =>
    this.franjas().map((f) => ({ inicio: aHora(f[0]), fin: aHora(f[1]), noche: cruzaMedianoche(f) && f[1] !== 0 })),
  );

  protected cambiar(indice: number, extremo: 0 | 1, hora: Date | null): void {
    // Un campo vaciado no cambia la franja: se quita con su ×.
    if (!hora) return;
    const minutos = aMinutos(hora);
    this.franjasChange.emit(
      this.franjas().map((f, i): Franja => {
        if (i !== indice) return f;
        // El fin a las 00:00 es el final del día, no su principio.
        return extremo === 0 ? [minutos, f[1]] : [f[0], minutos === 0 ? MINUTOS_DEL_DIA : minutos];
      }),
    );
  }

  protected quitar(indice: number): void {
    this.franjasChange.emit(this.franjas().filter((_, i) => i !== indice));
  }

  /** La nueva empieza una hora después de la última y dura dos, sin pasar del día; la primera, de 09:00 a 18:00. */
  protected anadir(): void {
    const actuales = this.franjas();
    const ultima = actuales[actuales.length - 1];
    if (!ultima) return this.franjasChange.emit([[540, 1080]]);
    const tope = cruzaMedianoche(ultima) ? MINUTOS_DEL_DIA : ultima[1];
    const inicio = Math.min(tope + 60, MINUTOS_DEL_DIA - 60);
    this.franjasChange.emit([...actuales, [inicio, Math.min(inicio + 120, MINUTOS_DEL_DIA)]]);
  }
}

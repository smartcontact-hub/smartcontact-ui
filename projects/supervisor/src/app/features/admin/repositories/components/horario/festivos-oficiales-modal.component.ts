import { ChangeDetectionStrategy, Component, computed, inject, input, type OnInit, output, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScButtonComponent, ScCheckboxComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScSelectComponent } from '@smartcontact-hub/components';

import { CALENDARIOS_OFICIALES } from '../../state/festivos-oficiales.mjs';
import type { CalendarioDeFestivos, Festivo } from '../../state/horarios.core.mjs';

/** Un festivo listo para añadir al calendario de festivos que se edita (sin `id`: lo pone el editor). */
export interface FestivoNuevo {
  readonly name: string;
  readonly date: string;
  readonly yearly: boolean;
}

interface Fila {
  readonly clave: string;
  readonly nuevo: FestivoNuevo;
  readonly fecha: string;
  readonly yaEsta: boolean;
}

const dosCifras = (n: string): string => n.padStart(2, '0');

/**
 * Añadir festivos ya definidos: de otra lista de festivos que ya existe, o de un calendario oficial por país o región. Los que
 * caen siempre el mismo día (Navidad, el 25 de diciembre) se añaden repitiéndose cada año; los que cambian (Semana Santa),
 * con su fecha de cada año. Cada uno se puede quitar antes de añadir, y los que ya están salen marcados.
 */
@Component({
  selector: 'sc-festivos-oficiales-modal',
  imports: [ScButtonComponent, ScCheckboxComponent, ScCustomModalComponent, ScCustomModalFooterDirective, ScSelectComponent, TranslateModule],
  templateUrl: './festivos-oficiales-modal.component.html',
  styleUrl: './festivos-oficiales-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FestivosOficialesModalComponent implements OnInit {
  private readonly translate = inject(TranslateService);

  /** Las otras listas de festivos que ya existen, para aplicarlas enteras. */
  readonly listas = input<readonly CalendarioDeFestivos[]>([]);
  /** Los días que la lista ya tiene: no se vuelven a añadir. */
  readonly existentes = input<readonly Festivo[]>([]);

  readonly anadir = output<readonly FestivoNuevo[]>();
  readonly cerrado = output<void>();

  protected readonly regiones = CALENDARIOS_OFICIALES.map((c) => ({ value: c.id, label: c.nombre }));
  protected readonly region = signal<string>(CALENDARIOS_OFICIALES[0].id);
  /** Los que se desmarcan: por defecto entran todos los del calendario elegido. */
  private readonly quitados = signal<ReadonlySet<string>>(new Set());

  ngOnInit(): void {
    // Con una región elegida de entrada, la que más probable resulta para este equipo: la primera.
  }

  private yaEsta(f: FestivoNuevo): boolean {
    return this.existentes().some((d) => !!d.yearly === f.yearly && (f.yearly ? d.date.slice(5) === f.date.slice(5) : d.date === f.date));
  }

  protected readonly filas = computed<readonly Fila[]>(() => {
    const cal = CALENDARIOS_OFICIALES.find((c) => c.id === this.region());
    return (cal?.dias ?? []).map((d) => {
      const nuevo: FestivoNuevo = { name: d.nombre, date: d.fecha, yearly: d.anual };
      const [anio, mes, dia] = d.fecha.split('-');
      return {
        clave: `${d.fecha}|${d.nombre}`,
        nuevo,
        fecha: d.anual ? `${dosCifras(dia)}/${dosCifras(mes)}` : `${dosCifras(dia)}/${dosCifras(mes)}/${anio}`,
        yaEsta: this.yaEsta(nuevo),
      };
    });
  });

  protected marcada(f: Fila): boolean {
    return !f.yaEsta && !this.quitados().has(f.clave);
  }

  protected alternar(f: Fila): void {
    if (f.yaEsta) return;
    this.quitados.update((s) => {
      const n = new Set(s);
      if (!n.delete(f.clave)) n.add(f.clave);
      return n;
    });
  }

  protected cambiarRegion(id: unknown): void {
    this.region.set(String(id));
    this.quitados.set(new Set());
  }

  private readonly elegidas = computed(() => this.filas().filter((f) => this.marcada(f)));
  protected readonly cuantas = computed(() => this.elegidas().length);
  protected readonly textoDeAnadir = computed(() =>
    this.translate.instant(this.cuantas() === 1 ? 'repositories.festivos.x.official.add_one' : 'repositories.festivos.x.official.add', { count: this.cuantas() }) as string,
  );

  protected confirmar(): void {
    if (this.cuantas() === 0) return;
    this.anadir.emit(this.elegidas().map((f) => f.nuevo));
  }

  /** Aplicar una lista ya creada: sus días, tal cual, los que aún no estén. */
  protected aplicar(lista: CalendarioDeFestivos): void {
    const nuevos = lista.days.map((d): FestivoNuevo => ({ name: d.name, date: d.date, yearly: !!d.yearly })).filter((f) => !this.yaEsta(f));
    if (nuevos.length > 0) this.anadir.emit(nuevos);
  }
}

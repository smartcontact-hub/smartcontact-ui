import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SC_GROUP_POPOVER_TRANSLATIONS } from './i18n/sc-group-popover.translations';
import { TooltipModule } from 'primeng/tooltip';

import type { GroupRef, ScGroupPopoverDisplay } from './group-popover.types';

let groupPopoverIdCounter = 0;

/** Cuántos nombres cabe enseñar en el tooltip: un tooltip no se desplaza, así que de aquí en adelante se dice «y N más». */
const MAX_NAMES = 15;

/**
 * Celda en línea que enseña cuántos grupos (o agentes) hay y, al pasar por encima o al enfocarla con el teclado, un
 * tooltip con sus nombres, uno por línea.
 *
 * Es el `tooltip` del DS (`pTooltip` de PrimeNG), no un globo propio: antes se montaba sobre `<p-popover>` y enseñaba
 * todos los nombres con scroll; el diseño pasó a tooltip en todos los listados (revisión de diseño, 2026-10-22). Un
 * tooltip no se desplaza ni se puede enfocar, así que pasados `MAX_NAMES` nombres acaba en «y N más»; el lector no
 * pierde nada, porque oye todos los nombres en la descripción del botón.
 */
@Component({
  selector: 'sc-group-popover',
  imports: [TooltipModule, TranslateModule],
  templateUrl: './sc-group-popover.component.html',
  styleUrl: './sc-group-popover.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.group-popover--single]': 'single()',
  },
})
export class ScGroupPopoverComponent {
  protected readonly namesId = `sc-group-popover-names-${++groupPopoverIdCounter}`;
  /** Los grupos que se listan en el tooltip. */
  readonly groups = input.required<readonly GroupRef[]>();
  /**
   * Nombre accesible del botón, ya traducido (p. ej. «12 agentes»). Opcional: sin él dice
   * «N grupos», que es lo que cuenta en la lista de agentes. Nace el 2026-09-14 para que la
   * lista de grupos use el MISMO desplegable con sus agentes: la relación es la misma vista
   * desde el otro lado, y el lector de pantalla no puede decir «grupos» ahí.
   */
  readonly countAriaLabel = input<string | null>(null);
  /**
   * Qué pinta la celda (`ScGroupPopoverDisplay`). Con `adaptive`, ninguno es «—» y uno es su nombre: la cifra con su
   * tooltip solo cuando hay varios que enseñar.
   */
  readonly display = input<ScGroupPopoverDisplay>('count');
  /** Lo que oye el lector cuando no hay ninguno, con `adaptive`. Sin él, «Sin grupos». */
  readonly emptyAriaLabel = input<string | null>(null);
  /**
   * Se pulsó la cifra (clic, Intro o Espacio): lo que se hace con esa relación, si quien la pinta lo quiere (abrir
   * la asignación de un grupo). Al pasar por encima o con el foco, la cifra sigue enseñando los nombres. Sin nadie
   * que la escuche, pulsar no hace nada.
   */
  readonly activated = output<void>();

  private readonly translate = inject(TranslateService);
  /** El idioma, para que el «y N más» del tooltip siga al cambio sin recargar. */
  private readonly lang = toSignal(this.translate.onLangChange, { initialValue: null });

  protected readonly count = computed(() => this.groups().length);
  protected readonly adaptive = computed(() => this.display() === 'adaptive');
  /** El único grupo, con `adaptive`: se escribe su nombre en vez de la cifra. */
  protected readonly single = computed(() => (this.adaptive() && this.count() === 1 ? this.groups()[0]! : null));

  /** Si el nombre no cabe en su columna: entonces, y solo entonces, lleva su tooltip con el nombre entero. */
  protected readonly truncated = signal(false);
  private readonly singleName = viewChild<ElementRef<HTMLElement>>('singleName');
  private readonly medirNombre = effect((onCleanup) => {
    const el = this.singleName()?.nativeElement;
    this.single(); // otro nombre en la misma celda (la tabla recicla filas al desplazarse): se vuelve a medir
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => this.truncated.set(el.scrollWidth > el.clientWidth));
    observer.observe(el);
    onCleanup(() => observer.disconnect());
  });
  /** Los nombres en una frase, para la descripción del botón. */
  protected readonly names = computed(() => this.groups().map((group) => group.name).join(', '));

  /** Lo que dice el tooltip: un nombre por línea (el texto del tooltip respeta los saltos) y, si sobran, «y N más». */
  protected readonly tooltipText = computed(() => {
    this.lang();
    const names = this.groups().map((group) => group.name);
    const shown = names.slice(0, MAX_NAMES).join('\n');
    const rest = names.length - MAX_NAMES;
    return rest > 0 ? `${shown}\n${this.translate.instant('sc.groupPopover.more', { count: rest })}` : shown;
  });

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    for (const [language, dict] of Object.entries(SC_GROUP_POPOVER_TRANSLATIONS)) {
      this.translate.setTranslation(language, dict, true);
    }
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SC_GROUP_POPOVER_TRANSLATIONS } from './i18n/sc-group-popover.translations';
import { Popover, PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';

import type { GroupRef, ScGroupPopoverDisplay } from './group-popover.types';

const HOVER_LEAVE_DELAY_MS = 150;
let groupPopoverIdCounter = 0;

/**
 * Inline cell that shows the group count and reveals a small floating list
 * on hover or keyboard focus. The list shows EVERY name: past half the
 * viewport it scrolls inside the panel instead of cutting to «+N más»
 * (2026-09-24): un agente puede estar en 12 grupos y hay que verlos todos.
 *
 * Built on PrimeNG `<p-popover>` (Figma `Smart Contact Prime → ❖ Popover`)
 * since S34 — overlay rendered into `body`, anchor-positioned to the
 * trigger button by PrimeNG. The hover-or-focus open behaviour is
 * preserved by driving `show()` / `hide()` on the popover ref from
 * trigger/panel pointer events. A short leave delay lets the user cross
 * trigger→panel without the popover flickering closed.
 */
@Component({
  selector: 'sc-group-popover',
  imports: [PopoverModule, TooltipModule, TranslateModule],
  templateUrl: './sc-group-popover.component.html',
  styleUrl: './sc-group-popover.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.group-popover--single]': 'single()',
  },
})
export class ScGroupPopoverComponent {
  protected readonly namesId = `sc-group-popover-names-${++groupPopoverIdCounter}`;
  protected readonly popoverPt = { root: { 'aria-hidden': 'true' } };
  /** Los grupos que se listan en el globo. */
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
   * desplegable solo cuando hay varios que enseñar.
   */
  readonly display = input<ScGroupPopoverDisplay>('count');
  /** Lo que oye el lector cuando no hay ninguno, con `adaptive`. Sin él, «Sin grupos». */
  readonly emptyAriaLabel = input<string | null>(null);
  /**
   * Se pulsó la cifra (clic, Intro o Espacio): lo que se hace con esa relación, si quien la pinta lo quiere (abrir
   * la asignación de un grupo). Al pasar por encima o con el foco, la cifra sigue enseñando los nombres; al
   * pulsarla, el globo se cierra. Sin nadie que la escuche, pulsar solo cierra el globo.
   */
  readonly activated = output<void>();

  protected readonly pop = viewChild.required<Popover>('pop');
  protected readonly open = signal(false);
  private leaveTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly count = computed(() => this.groups().length);
  protected readonly adaptive = computed(() => this.display() === 'adaptive');
  /** El único grupo, con `adaptive`: se escribe su nombre en vez de la cifra. */
  protected readonly single = computed(() => (this.adaptive() && this.count() === 1 ? this.groups()[0]! : null));

  /** Si el nombre no cabe en su columna: entonces, y solo entonces, lleva su globo con el nombre entero. */
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

  constructor() {
    // Copy fijo colocado: registra solo el diccionario del componente.
    const translate = inject(TranslateService);
    for (const [language, dict] of Object.entries(SC_GROUP_POPOVER_TRANSLATIONS)) {
      translate.setTranslation(language, dict, true);
    }
    // Cancel any pending hover-leave timer if the row is removed mid-delay
    // (filter/search/sort re-render) — avoids hide() on a destroyed Popover.
    inject(DestroyRef).onDestroy(() => this.cancelLeave());
  }

  protected onTriggerEnter(event: MouseEvent): void {
    if (this.count() === 0) return;
    this.cancelLeave();
    this.pop().show(event);
    this.open.set(true);
  }

  protected onTriggerFocus(event: FocusEvent): void {
    if (this.count() === 0) return;
    this.cancelLeave();
    this.pop().show(event);
    this.open.set(true);
  }

  protected onPanelEnter(): void {
    this.cancelLeave();
  }

  protected onPointerLeave(): void {
    this.leaveTimer = setTimeout(() => {
      this.pop().hide();
      this.open.set(false);
    }, HOVER_LEAVE_DELAY_MS);
  }

  protected onClick(): void {
    this.cancelLeave();
    this.pop().hide();
    this.open.set(false);
    this.activated.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.pop().hide();
      this.open.set(false);
    }
  }

  private cancelLeave(): void {
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = null;
    }
  }
}

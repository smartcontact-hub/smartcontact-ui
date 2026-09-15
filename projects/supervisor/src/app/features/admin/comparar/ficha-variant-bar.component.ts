import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  type ElementRef,
  HostListener,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ScButtonComponent } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { CompareGuideComponent } from './compare-guide.component';
import { FICHA_VARIANTS, FichaVariantService } from './ficha-variant.service';

/**
 * RAMA DE COMPARACIÓN (`comparar/fichas`). La barra flotante con la que se cambia de variante
 * dentro de una ficha y se abre la guía. Solo sale mientras se compara (ver el servicio).
 *
 * Se arrastra por su asa para que no tape lo que se está mirando, y recuerda dónde la dejaste.
 * Con el asa enfocada, las flechas la mueven (Mayús, a saltos grandes) y un doble clic la
 * devuelve abajo al centro. Nunca sale de la pantalla ni se mete debajo de la guía.
 */
interface Point {
  readonly x: number;
  readonly y: number;
}

const POSITION_KEY = 'sc-comparar-barra';
/** Lo mínimo que la barra deja libre hasta el borde de la ventana. */
const EDGE = 16;
/** El ancho del `sc-drawer` a la derecha (el de PrimeNG, 20rem). */
const GUIDE_WIDTH_REM = 20;

function readPosition(): Point | null {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    const p = raw ? (JSON.parse(raw) as Point) : null;
    return p && Number.isFinite(p.x) && Number.isFinite(p.y) ? p : null;
  } catch {
    return null;
  }
}

function writePosition(p: Point | null): void {
  try {
    if (p) localStorage.setItem(POSITION_KEY, JSON.stringify(p));
    else localStorage.removeItem(POSITION_KEY);
  } catch {
    /* Sin almacenamiento, la posición dura lo que la página. */
  }
}

@Component({
  selector: 'sc-ficha-variant-bar',
  imports: [CompareGuideComponent, ScButtonComponent, ScIconComponent, TranslateModule],
  templateUrl: './ficha-variant-bar.component.html',
  styleUrl: './ficha-variant-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FichaVariantBarComponent {
  protected readonly variants = inject(FichaVariantService);
  protected readonly options = FICHA_VARIANTS;

  private readonly bar = viewChild<ElementRef<HTMLElement>>('bar');
  /** `null` = su sitio de siempre, abajo al centro. */
  protected readonly position = signal<Point | null>(readPosition());
  protected readonly dragging = signal(false);
  private grab: Point = { x: 0, y: 0 };

  constructor() {
    effect(() => {
      if (this.variants.comparing()) untracked(() => this.variants.openGuideFirstTime());
    });
    // La posición guardada puede venir de una ventana más grande: se recoloca dentro.
    afterNextRender(() => this.clampStored());
    // Al abrir la guía, la barra no puede quedarse debajo de ella.
    effect(() => {
      this.variants.guideOpen();
      untracked(() => this.clampStored());
    });
  }

  protected toggleGuide(): void {
    this.variants.guideOpen.update((open) => !open);
  }

  protected startDrag(event: PointerEvent): void {
    if (event.button !== 0) return;
    const el = this.bar()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    this.grab = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dragging.set(true);
    event.preventDefault();
  }

  protected drag(event: PointerEvent): void {
    if (!this.dragging()) return;
    this.place(event.clientX - this.grab.x, event.clientY - this.grab.y);
  }

  protected endDrag(event: PointerEvent): void {
    if (!this.dragging()) return;
    this.dragging.set(false);
    const handle = event.currentTarget as HTMLElement;
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    writePosition(this.position());
  }

  protected nudge(event: KeyboardEvent): void {
    const step = event.shiftKey ? EDGE * 4 : EDGE;
    const moves: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const move = moves[event.key];
    const el = this.bar()?.nativeElement;
    if (!move || !el) return;
    event.preventDefault();
    const rect = el.getBoundingClientRect();
    this.place(rect.left + move.x, rect.top + move.y);
    writePosition(this.position());
  }

  protected resetPosition(): void {
    this.position.set(null);
    writePosition(null);
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.clampStored();
  }

  private clampStored(): void {
    const p = this.position();
    if (p) this.place(p.x, p.y);
  }

  private place(x: number, y: number): void {
    const el = this.bar()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const right = window.innerWidth - (this.variants.guideOpen() ? GUIDE_WIDTH_REM * rem : 0);
    const clamp = (v: number, min: number, max: number): number => Math.min(Math.max(v, min), Math.max(min, max));
    this.position.set({
      x: Math.round(clamp(x, EDGE, right - rect.width - EDGE)),
      y: Math.round(clamp(y, EDGE, window.innerHeight - rect.height - EDGE)),
    });
  }
}

import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { ScClipboardService } from '@smartcontact-hub/components';
import { ScIconComponent } from '@smartcontact-hub/icons';

import { A11yService } from './a11y.service';
import { IMPACTO_ES, agruparNodos, contarFallos, type NodoA11y, type ViolacionA11y } from './a11y.core.mjs';
import { StoryMedidorComponent } from './story-medidor.component';
import { anclarTokensEnLienzo } from './tokens-en-lienzo';
import { ScArgs, StoryContext } from './story.types';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';

type CanvasTheme = 'light' | 'dark' | 'split';
/** Cómo se escribe el tema en la URL de una story suelta. */
export type TemaUrl = 'claro' | 'oscuro' | 'comparar';
type Ancho = 'libre' | 375 | 768 | 1280 | 1440;

const TEMA_DE_URL: Record<TemaUrl, CanvasTheme> = { claro: 'light', oscuro: 'dark', comparar: 'split' };
const URL_DE_TEMA: Record<CanvasTheme, TemaUrl> = { light: 'claro', dark: 'oscuro', split: 'comparar' };

/** Los anchos del lienzo: los de las pantallas en que se usa la app, más el libre (el de la columna). */
const ANCHOS: readonly { readonly label: string; readonly value: Ancho }[] = [
  { label: 'Libre', value: 'libre' },
  { label: 'Móvil 375', value: 375 },
  { label: 'Tablet 768', value: 768 },
  { label: 'Portátil 1280', value: 1280 },
  { label: 'Escritorio 1440', value: 1440 },
];

/** Alto mínimo de un iframe de ancho fijo: lo justo para que abra un desplegable sin recortarlo. */
const ALTO_MIN_IFRAME = 240;

/**
 * Lienzo aislado de una story: pinta el `<ng-template>` con su contexto de `args` y, en su barra, las herramientas
 * para ESTRESARLA:
 *
 * - **Ancho**: libre (el de la columna) o el de una pantalla de verdad. Con un ancho fijo la story se pinta en un
 *   `iframe` de ese ancho, cargando la story suelta (`?solo=1`): así cambia el VIEWPORT, que es lo que leen las media
 *   queries del DS y de PrimeNG. Estrechar una caja no las dispara, y enseñaría un móvil que no existe.
 * - **Medir** (`StoryMedidorComponent`) y **Contornos** (un borde a cada elemento): cotejar con Figma sin DevTools.
 * - **Accesibilidad**: axe pasa solo por el lienzo al verlo y cada vez que cambian los controles o el tema; el número
 *   de fallos va en la barra y el detalle debajo. Las reglas son las de la prueba del CI (`a11y.core.mjs`).
 * - **Tema** claro/oscuro/comparar, LOCAL: `.sc-dark` va a un wrapper, no a `documentElement`, así que el toggle
 *   global de la demo no se ve afectado (`.sc-dark` vuelca los `--sc-*` de la capa 07 y el `darkModeSelector`).
 * - **Enlace** a esta story con sus controles, y **abrirla suelta**, sin el marco de la web.
 *
 * Con `desnudo` no hay barra ni borde: es como se pinta una story suelta (capturas, el iframe de un ancho fijo), y
 * entonces las herramientas llegan por la URL.
 */
@Component({
  selector: 'app-story-canvas',
  imports: [NgTemplateOutlet, ScIconComponent, StoryMedidorComponent, ThemeToggleComponent],
  styleUrl: './storybook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-canvas" [class.sb-canvas--desnudo]="desnudo()">
      @if (!desnudo()) {
        <div class="sb-canvas__bar">
          <div class="sb-canvas__tools" role="group" aria-label="Herramientas del lienzo">
            @if (enlaceSolo()) {
              <!-- Nativo y no sc-select: va en la barra junto a los otros botones .sb-seg y tiene que medir lo
                   mismo que ellos. Los controles del Playground, que son contenido, sí usan los del DS. -->
              <label class="sb-seg sb-seg--select" data-testid="sb-ancho">
                <sc-icon name="devices" [size]="14" />
                <select aria-label="Ancho del lienzo" [value]="'' + ancho()" (change)="elegirAncho($any($event.target).value)">
                  @for (a of anchos; track a.value) {
                    <option [value]="'' + a.value">{{ a.label }}</option>
                  }
                </select>
              </label>
            }
            <button
              type="button"
              class="sb-seg"
              data-testid="sb-medir"
              [class.is-active]="medir()"
              [attr.aria-pressed]="medir()"
              title="Medir: pasa el ratón por un elemento para ver su tamaño, relleno, margen y huecos en px"
              (click)="medir.set(!medir())"
            >
              <sc-icon name="straighten" [size]="14" />
              <span class="sb-seg__texto">Medir</span>
            </button>
            <button
              type="button"
              class="sb-seg"
              data-testid="sb-contornos"
              [class.is-active]="contornos()"
              [attr.aria-pressed]="contornos()"
              title="Contornos: un borde discontinuo a cada elemento, para ver cómo se reparte el espacio"
              (click)="contornos.set(!contornos())"
            >
              <sc-icon name="border_outer" [size]="14" />
              <span class="sb-seg__texto">Contornos</span>
            </button>
            @if (revisarA11y()) {
              <button
                type="button"
                class="sb-seg sb-a11y-boton"
                data-testid="sb-a11y"
                [class.sb-a11y-boton--fallos]="totalFallos() > 0"
                [class.sb-a11y-boton--ok]="totalFallos() === 0"
                [attr.aria-expanded]="verA11y()"
                [disabled]="ancho() !== 'libre'"
                [attr.title]="ancho() !== 'libre' ? 'La accesibilidad se revisa en el ancho libre' : 'Accesibilidad (WCAG 2.2 A y AA, con axe): ' + textoA11y()"
                [attr.aria-label]="'Accesibilidad: ' + textoA11y()"
                (click)="verA11y.set(!verA11y())"
              >
                <sc-icon name="accessibility_new" [size]="14" />
                {{ textoA11y() }}
              </button>
            }
          </div>
          <div class="sb-canvas__themes" role="group" aria-label="Tema del lienzo">
            <app-theme-toggle [dark]="theme() === 'dark'" (toggled)="toggleTheme()" />
            <button
              type="button"
              class="sb-seg sb-seg--compare"
              [class.is-active]="theme() === 'split'"
              [attr.aria-pressed]="theme() === 'split'"
              title="Comparar claro y oscuro, uno al lado del otro"
              (click)="toggleSplit()"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="4.5" width="18" height="15" rx="2" />
                <line x1="12" y1="4.5" x2="12" y2="19.5" />
              </svg>
              <span class="sb-seg__texto">Comparar</span>
            </button>
            @if (enlace()) {
              <button
                type="button"
                class="sb-seg sb-seg--icono"
                data-testid="sb-enlace"
                [attr.aria-label]="copiado() ? 'Enlace copiado' : 'Copiar el enlace a esta story'"
                [attr.title]="copiado() ? 'Enlace copiado' : 'Copiar el enlace a esta story, con sus controles'"
                (click)="copiarEnlace()"
              >
                <sc-icon [name]="copiado() ? 'check' : 'link'" [size]="14" />
              </button>
            }
            @if (enlaceSolo(); as solo) {
              <a
                class="sb-seg sb-seg--icono"
                data-testid="sb-abrir-suelta"
                [href]="solo"
                target="_blank"
                rel="noopener"
                aria-label="Abrir esta story suelta, en otra pestaña"
                title="Abrir esta story suelta, sin el marco de la web"
              >
                <sc-icon name="open_in_new" [size]="14" />
              </a>
            }
          </div>
        </div>
      }

      <div
        #stage
        class="sb-canvas__stage"
        [class.sb-canvas__stage--split]="theme() === 'split' && ancho() === 'libre'"
        [class.sb-canvas__stage--marco]="ancho() !== 'libre'"
        [class.sb-contornos]="contornos()"
      >
        @if (ancho() === 'libre') {
          @if (theme() === 'split') {
            <div class="sb-canvas__pane">
              <ng-container [ngTemplateOutlet]="template()" [ngTemplateOutletContext]="ctx()" />
            </div>
            <div class="sb-canvas__pane sc-dark">
              <ng-container [ngTemplateOutlet]="template()" [ngTemplateOutletContext]="ctx()" />
            </div>
          } @else {
            <div class="sb-canvas__pane" [class.sc-dark]="theme() === 'dark'">
              <ng-container [ngTemplateOutlet]="template()" [ngTemplateOutletContext]="ctx()" />
            </div>
          }
          <app-story-medidor [raiz]="stage" [activo]="medir()" />
        } @else {
          @for (src of iframes(); track $index) {
            <div class="sb-canvas__marco">
              <p class="sb-canvas__marco-ancho sc-text-caption-regular">{{ ancho() }} px</p>
              <iframe
                data-testid="sb-iframe"
                [src]="src"
                [attr.width]="ancho()"
                [attr.height]="altoIframe()"
                [attr.title]="'La story a ' + ancho() + ' px'"
                (load)="alCargarIframe($event)"
              ></iframe>
            </div>
          }
        }
      </div>

      @if (verA11y() && revisarA11y() && ancho() === 'libre') {
        <div class="sb-a11y" data-testid="sb-a11y-panel">
          @if (fallos(); as lista) {
            @if (!lista.length) {
              <p class="sb-a11y__vacio sc-text-body-regular">
                axe no encuentra fallos de WCAG 2.2 A ni AA en esta story, con este tema y estos controles. No lo revisa
                todo: el orden del foco, lo que anuncia un lector de pantalla y el uso con teclado se prueban a mano.
              </p>
            } @else {
              @for (v of lista; track v.regla) {
                <div class="sb-a11y__regla">
                  <p class="sb-a11y__titulo sc-text-body-regular">
                    <span class="sb-a11y__impacto sc-text-caption-semibold" [attr.data-impacto]="v.impacto">{{ impactoEs[v.impacto] }}</span>
                    {{ v.ayuda }}
                    <a [href]="v.url" target="_blank" rel="noopener">Más</a>
                  </p>
                  <ul class="sb-a11y__nodos">
                    @for (g of agrupar(v.nodos); track $index) {
                      <li class="sc-text-caption-regular" (mouseenter)="senalar(g.nodos)" (mouseleave)="senalar(null)">
                        <code>{{ g.elementos }}</code>
                        <span>{{ g.resumen }}</span>
                      </li>
                    }
                  </ul>
                </div>
              }
            }
          } @else {
            <p class="sb-a11y__vacio sc-text-body-regular">Revisando…</p>
          }
        </div>
      }
    </div>
  `,
})
export class StoryCanvasComponent {
  readonly template = input.required<TemplateRef<StoryContext>>();
  readonly args = input<ScArgs>({});
  /** Sin barra ni borde: la story suelta. Las herramientas llegan por los inputs de abajo. */
  readonly desnudo = input(false);
  /** Tema con que abre (el de la URL de una story suelta). */
  readonly tema = input<TemaUrl>('claro');
  readonly medirInicial = input(false);
  readonly contornosInicial = input(false);
  /** Enlace a esta story en su página (`#/components/…`), con los controles puestos. Sin él, no hay botón. */
  readonly enlace = input<string | null>(null);
  /** Lo mismo, suelta (`&solo=1`). Lo usan «abrir suelta» y el iframe de los anchos fijos. */
  readonly enlaceSolo = input<string | null>(null);
  readonly revisarA11y = input(true);

  private readonly a11y = inject(A11yService);
  private readonly clipboard = inject(ScClipboardService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');

  protected readonly anchos = ANCHOS;
  protected readonly impactoEs = IMPACTO_ES;

  protected readonly theme = linkedSignal<CanvasTheme>(() => TEMA_DE_URL[this.tema()] ?? 'light');
  protected readonly medir = linkedSignal(() => this.medirInicial());
  protected readonly contornos = linkedSignal(() => this.contornosInicial());
  protected readonly ancho = signal<Ancho>('libre');
  protected readonly copiado = signal(false);
  protected readonly verA11y = signal(false);
  /** `null` mientras axe no ha pasado. */
  protected readonly fallos = signal<readonly ViolacionA11y[] | null>(null);
  protected readonly altoIframe = signal(ALTO_MIN_IFRAME);

  protected readonly totalFallos = computed(() => {
    const f = this.fallos();
    return f === null ? -1 : contarFallos(f);
  });

  protected readonly textoA11y = computed(() => {
    if (this.ancho() !== 'libre') return 'Accesibilidad';
    const n = this.totalFallos();
    if (n < 0) return 'Revisando…';
    return n === 0 ? 'Sin fallos' : `${n} ${n === 1 ? 'fallo' : 'fallos'}`;
  });

  /** Uno por tema: con «comparar», claro y oscuro uno al lado del otro, cada uno a su ancho. */
  protected readonly iframes = computed(() => {
    const solo = this.enlaceSolo();
    if (!solo || this.ancho() === 'libre') return [];
    const temas: TemaUrl[] = this.theme() === 'split' ? ['claro', 'oscuro'] : [URL_DE_TEMA[this.theme()]];
    const base = `${document.location.href.split('#')[0]}${solo}`;
    const herramientas = `${this.medir() ? '&medir=1' : ''}${this.contornos() ? '&contornos=1' : ''}`;
    return temas.map((t) => this.sanitizer.bypassSecurityTrustResourceUrl(`${base}&tema=${t}${herramientas}`));
  });

  protected readonly ctx = computed<StoryContext>(() => {
    const a = this.args();
    return { $implicit: a, args: a };
  });

  private visible = false;
  private pendiente: ReturnType<typeof setTimeout> | undefined;
  private observadoresIframe: (() => void)[] = [];
  private readonly alturas = new Map<Document, number>();

  constructor() {
    // El oscuro local necesita que las variables encadenadas se resuelvan dentro del lienzo (ver `tokens-en-lienzo.ts`).
    anclarTokensEnLienzo();
    // axe pasa al VER el lienzo (no al cargar la página entera: hay diez por ficha) y otra vez cuando cambia lo que
    // pinta. Con retraso, para que el DOM ya esté puesto y una ráfaga de teclas en un control cuente como una.
    effect((onCleanup) => {
      if (!this.revisarA11y() || this.desnudo()) return;
      const stage = this.stage().nativeElement;
      const io = new IntersectionObserver(([e]) => {
        const antes = this.visible;
        this.visible = !!e?.isIntersecting;
        if (this.visible && !antes && this.fallos() === null) this.programarRevision();
      });
      io.observe(stage);
      onCleanup(() => io.disconnect());
    });

    effect(() => {
      // Lo que cambia el resultado: los controles, el tema y volver al ancho libre.
      this.args();
      this.theme();
      if (this.ancho() !== 'libre') return;
      this.soltarIframe();
      if (!this.revisarA11y() || this.desnudo()) return;
      if (this.visible) this.programarRevision();
    });

    this.destroyRef.onDestroy(() => {
      clearTimeout(this.pendiente);
      this.soltarIframe();
      this.senalar(null);
    });
  }

  /** Sol/luna: alterna claro <-> oscuro (saliendo de comparar si estaba). */
  protected toggleTheme(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  /** Comparar: enciende/apaga la vista lado a lado (claro + oscuro). */
  protected toggleSplit(): void {
    this.theme.set(this.theme() === 'split' ? 'light' : 'split');
  }

  protected elegirAncho(valor: string): void {
    this.ancho.set(valor === 'libre' ? 'libre' : (Number(valor) as Ancho));
  }

  protected async copiarEnlace(): Promise<void> {
    const enlace = this.enlace();
    if (!enlace) return;
    const ok = await this.clipboard.copy(`${document.location.href.split('#')[0]}${enlace}`);
    if (!ok) return;
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 1600);
  }

  protected readonly agrupar = agruparNodos;

  /** Señala en el lienzo los elementos de un fallo mientras el ratón está sobre su línea. */
  protected senalar(nodos: readonly NodoA11y[] | null): void {
    document.querySelectorAll('.sb-a11y-senal').forEach((el) => el.classList.remove('sb-a11y-senal'));
    for (const n of nodos ?? []) {
      try {
        this.stage().nativeElement.querySelector(n.selector)?.classList.add('sb-a11y-senal');
      } catch {
        // un selector de axe que este navegador no parsea: ese no se señala, sin más
      }
    }
  }

  /**
   * El iframe de un ancho fijo crece con lo que pinta (y con un desplegable que se abra dentro). Es del mismo origen,
   * así que se mide su documento por dentro: lo más bajo de lo que cuelga de `<body>`.
   */
  protected alCargarIframe(ev: Event): void {
    const doc = (ev.target as HTMLIFrameElement).contentDocument;
    if (!doc?.body) return;
    let frame = 0;
    const medir = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const fondo = Math.max(0, ...[...doc.body.children].map((c) => c.getBoundingClientRect().bottom));
        // Con «comparar» hay dos iframes: los dos van al alto del más alto, para que se lean lado a lado.
        this.alturas.set(doc, Math.ceil(fondo));
        this.altoIframe.set(Math.max(ALTO_MIN_IFRAME, ...this.alturas.values()));
      });
    };
    const ro = new ResizeObserver(medir);
    ro.observe(doc.body);
    const mo = new MutationObserver(medir);
    mo.observe(doc.body, { childList: true, subtree: true });
    medir();
    this.observadoresIframe.push(() => {
      ro.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
    });
  }

  private soltarIframe(): void {
    this.observadoresIframe.forEach((f) => f());
    this.observadoresIframe = [];
    this.alturas.clear();
    this.altoIframe.set(ALTO_MIN_IFRAME);
  }

  private programarRevision(): void {
    clearTimeout(this.pendiente);
    this.pendiente = setTimeout(() => {
      const stage = this.stage().nativeElement;
      this.a11y
        .revisar(stage)
        .then((f) => this.fallos.set(f))
        .catch(() => this.fallos.set(null));
    }, 400);
  }
}

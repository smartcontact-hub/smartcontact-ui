import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, linkedSignal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import { ScIconComponent } from '@smartcontact-hub/icons';

/** Lo que enseña: una story de una ficha (`?historia=`), con sus controles si el enlace los traía (`&args=`). */
export interface VistaStory {
  readonly ficha: string;
  readonly historia: string;
  readonly args: string;
}

/** Alto mínimo mientras carga y máximo dentro del panel: una story larga se recorre dentro de su marco. */
const ALTO_MIN = 72;
const ALTO_MAX = 360;

/**
 * El componente DE VERDAD dentro de la respuesta: la story que la IA ha elegido, suelta (`&solo=1`), en un iframe de
 * la propia doc. No pasa por la IA: es la misma página que «abrir suelta», así que no gasta cupo y nunca se inventa
 * cómo se ve. Mismo origen: se mide su documento por dentro para que el marco crezca con lo que pinta, como el iframe
 * de los anchos fijos del lienzo (`story-canvas.component.ts`). Si la story no existe (la IA se inventó el nombre), la
 * página suelta lo dice y el marco se quita.
 */
@Component({
  selector: 'app-ask-ai-vista',
  imports: [RouterLink, TranslatePipe, ScIconComponent],
  template: `
    @if (!noExiste()) {
      <figure class="vista">
        <figcaption class="vista__barra sc-text-caption-regular">
          <span class="vista__nombre">{{ titulo() }}</span>
          <a class="vista__abrir" [routerLink]="'/components/' + story().ficha" [queryParams]="queryParams()">
            {{ 'chrome.ask.abrirEjemplo' | translate }}
            <sc-icon name="arrow_forward" [size]="14" />
          </a>
        </figcaption>
        <iframe
          class="vista__marco"
          loading="lazy"
          [src]="src()"
          [attr.width]="'100%'"
          [attr.height]="alto()"
          [attr.title]="titulo()"
          (load)="alCargar($event)"
        ></iframe>
      </figure>
    }
  `,
  styles: `
    .vista {
      margin: 0;
      overflow: hidden;
      border-radius: var(--sc-radius-xl);
      background: var(--sc-bg-default);
      box-shadow: 0 0 0 1px var(--sc-border-subtle);
    }

    .vista__barra {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--sc-spacing-0-5);
      padding: var(--sc-spacing-0-375) var(--sc-spacing-0-75);
      border-bottom: 1px solid var(--sc-border-subtle);
      color: var(--sc-text-subtle);
    }

    .vista__nombre {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .vista__abrir {
      display: inline-flex;
      flex: none;
      align-items: center;
      gap: var(--sc-spacing-0-25);
      color: var(--sc-text-secondary);
      text-decoration: none;
      transition-property: color;
      transition-duration: 150ms;
      transition-timing-function: ease-out;

      &:hover {
        color: var(--sc-text-primary);
      }
    }

    .vista__marco {
      display: block;
      border: 0;
      transition-property: height;
      transition-duration: 150ms;
      transition-timing-function: ease-out;
    }

    @media (prefers-reduced-motion: reduce) {
      .vista__marco {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskAiVistaComponent {
  readonly vista = input.required<VistaStory>();

  /**
   * La misma story por CONTENIDO. La respuesta se parte en cada repintado y llega un objeto nuevo cada vez: sin esto, el
   * `src` cambiaría de identidad y el iframe se recargaría (y perdería su alto) con cada palabra de otra respuesta.
   */
  protected readonly story = computed(() => this.vista(), {
    equal: (a, b) => a.ficha === b.ficha && a.historia === b.historia && a.args === b.args,
  });

  private readonly sanitizer = inject(DomSanitizer);
  // Vuelven a su valor de partida cuando cambia la story: el mismo marco puede recibir otra (la lista de mensajes se
  // recorre por posición) y no debe heredar el «no existe» ni el alto de la anterior.
  protected readonly alto = linkedSignal({ source: this.story, computation: () => ALTO_MIN });
  protected readonly noExiste = linkedSignal({ source: this.story, computation: () => false });
  private soltar: (() => void) | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.soltar?.());
  }

  /** «solo-icono» → «Solo icono»: el nombre de la story tal como sale en su ficha. */
  protected readonly titulo = computed(() => {
    const h = this.story().historia.replace(/-/g, ' ');
    return h.charAt(0).toUpperCase() + h.slice(1);
  });

  protected readonly queryParams = computed(() => {
    const v = this.story();
    return v.args ? { historia: v.historia, args: v.args } : { historia: v.historia };
  });

  /** En el tema que tenga la doc al pintarla, para que no salga un recuadro blanco dentro del modo oscuro. */
  protected readonly src = computed(() => {
    const v = this.story();
    const tema = document.documentElement.classList.contains('sc-dark') ? 'oscuro' : 'claro';
    const args = v.args ? `&args=${v.args}` : '';
    const base = document.location.href.split('#')[0];
    // Seguro: `ficha`, `historia` y `args` llegan validados por `vistaDeRespuesta` (letras, cifras y signos de args).
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `${base}#/components/${v.ficha}?historia=${v.historia}${args}&solo=1&tema=${tema}`,
    );
  });

  protected alCargar(evento: Event): void {
    this.soltar?.();
    const doc = (evento.target as HTMLIFrameElement).contentDocument;
    if (!doc?.body) return;
    let frame = 0;
    const medir = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // La página suelta dice «Esta ficha no tiene ninguna story que se llame…»: entonces no hay nada que enseñar.
        if (doc.querySelector('.sb-solo__vacio')) {
          this.noExiste.set(true);
          return;
        }
        const fondo = Math.max(0, ...[...doc.body.children].map((c) => c.getBoundingClientRect().bottom));
        this.alto.set(Math.min(ALTO_MAX, Math.max(ALTO_MIN, Math.ceil(fondo))));
      });
    };
    const ro = new ResizeObserver(medir);
    ro.observe(doc.body);
    const mo = new MutationObserver(medir);
    mo.observe(doc.body, { childList: true, subtree: true });
    medir();
    this.soltar = () => {
      ro.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }
}

/**
 * La story que enseñar, sacada del texto de la respuesta: el primer enlace a una (`#/components/<ficha>?historia=<story>`,
 * con o sin la dirección de la doc delante). Devuelve también el texto sin la línea que solo era ese enlace: el marco
 * ya lo enseña y lo abre.
 */
export function vistaDeRespuesta(texto: string): { vista: VistaStory | null; texto: string } {
  const m = /(?:https:\/\/sc-doc\.pages\.dev\/?)?#\/components\/([a-z0-9-]+)\?historia=([a-z0-9-]+)(?:&args=([\w%;:!.~-]*))?/.exec(
    texto,
  );
  if (!m) return { vista: null, texto };
  const [, ficha, historia, args = ''] = m;
  // Una línea que es poco más que el enlace («Ver ejemplo: [Solo icono](…)», o la dirección pelada) sobra; una frase
  // que lo lleva dentro, no.
  const soloEnlace = (l: string): boolean =>
    l.includes(`historia=${historia}`) &&
    l
      .replace(/\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\S*#\/components\/\S*/g, '')
      .replace(/[-*:.()<>\s]/g, '').length <= 20;
  const sinLinea = texto
    .split('\n')
    .filter((l) => !soloEnlace(l))
    .join('\n');
  return { vista: { ficha, historia, args }, texto: sinLinea };
}

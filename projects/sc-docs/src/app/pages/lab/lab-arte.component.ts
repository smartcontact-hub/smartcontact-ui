import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Las ilustraciones de las tarjetas del Lab: un esquema de lo que prueba cada una (el menú lateral, la ficha, la
 * tabla…) dibujado sobre las formas con degradado de la portada. Los degradados (`#lab-grad-*`) los define una vez la
 * página; aquí solo se usan. Los colores salen de los tokens, así que el oscuro sale solo.
 *
 * Decorado: oculto al lector y sin foco. Al pasar por su tarjeta, las formas del fondo se acercan y la ventana sube un
 * poco, como en las tarjetas pequeñas de la portada.
 */
@Component({
  selector: 'app-lab-arte',
  template: `
    <svg
      class="arte"
      [class.arte--apagada]="apagada()"
      viewBox="0 0 440 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect class="arte__fondo" width="440" height="200" />
      @switch (tema()) {
        @case ('sidebar') {
          <g class="arte__formas">
            <circle cx="70" cy="170" r="110" fill="url(#lab-grad-esfera)" />
            <circle cx="40" cy="200" r="56" fill="url(#lab-grad-lima)" />
          </g>
          <g class="arte__capa">
            <rect class="arte__ventana" x="150" y="30" width="320" height="200" rx="14" />
            <rect class="arte__panel" x="150.5" y="30.5" width="96" height="199" rx="14" />
            @for (y of [56, 78, 100, 166, 188]; track y) {
              <rect class="arte__raya arte__raya--fuerte" x="166" [attr.y]="y" width="56" height="6" rx="3" />
            }
            <rect class="arte__acento" x="160" y="118" width="78" height="18" rx="9" />
            <rect class="arte__raya" x="178" y="144" width="44" height="5" rx="2.5" />
            <rect class="arte__raya" x="178" y="154" width="36" height="5" rx="2.5" />
            @for (y of [60, 80, 100, 120]; track y) {
              <rect class="arte__raya" x="266" [attr.y]="y" [attr.width]="y === 60 ? 120 : 170" height="7" rx="3.5" />
            }
          </g>
        }
        @case ('fichas') {
          <g class="arte__formas">
            <rect x="10" y="80" width="150" height="140" rx="18" transform="rotate(-14 85 150)" fill="url(#lab-grad-cristal)" />
            <circle cx="70" cy="70" r="44" fill="url(#lab-grad-esfera)" />
          </g>
          <g class="arte__capa">
            <rect class="arte__ventana" x="120" y="28" width="350" height="200" rx="14" />
            @for (y of [54, 72, 90, 108]; track y; let i = $index) {
              <circle [class]="i === 1 ? 'arte__acento' : 'arte__punto'" cx="140" [attr.cy]="y + 3" r="4" />
              <rect class="arte__raya" x="152" [attr.y]="y" width="40" height="6" rx="3" />
            }
            <rect class="arte__raya arte__raya--fuerte" x="214" y="52" width="90" height="8" rx="4" />
            @for (y of [74, 112, 150]; track y) {
              <rect class="arte__raya" x="214" [attr.y]="y" width="50" height="5" rx="2.5" />
              <rect class="arte__campo" x="214" [attr.y]="y + 10" width="120" height="18" rx="5" />
            }
            @for (y of [50, 104, 158]; track y) {
              <rect class="arte__panel arte__panel--borde" x="352" [attr.y]="y" width="104" height="44" rx="8" />
              <circle class="arte__acento-suave" cx="370" [attr.cy]="y + 22" r="9" />
              <rect class="arte__raya" x="386" [attr.y]="y + 15" width="54" height="5" rx="2.5" />
              <rect class="arte__raya" x="386" [attr.y]="y + 25" width="36" height="5" rx="2.5" />
            }
          </g>
        }
        @case ('tablas') {
          <g class="arte__formas">
            <circle cx="60" cy="150" r="96" fill="url(#lab-grad-esfera)" />
            <circle cx="110" cy="190" r="46" fill="url(#lab-grad-lima)" />
          </g>
          <g class="arte__capa">
            <rect class="arte__ventana" x="110" y="26" width="360" height="200" rx="14" />
            <path class="arte__panel" d="M110.5 40a14 14 0 0 1 14-14h331a14 14 0 0 1 14 14v14h-359z" />
            @for (x of [130, 210, 290, 370]; track x) {
              <rect class="arte__raya arte__raya--fuerte" [attr.x]="x" y="37" width="48" height="6" rx="3" />
            }
            @for (y of [68, 92, 116, 140, 164, 188]; track y; let i = $index) {
              @if (i === 2) {
                <rect class="arte__acento-suave" x="118" [attr.y]="y - 8" width="326" height="22" rx="6" />
              }
              <rect class="arte__raya" x="130" [attr.y]="y" width="62" height="6" rx="3" />
              <rect class="arte__raya" x="210" [attr.y]="y" width="44" height="6" rx="3" />
              <rect class="arte__raya" x="290" [attr.y]="y" width="56" height="6" rx="3" />
              <rect class="arte__raya" x="370" [attr.y]="y" width="30" height="6" rx="3" />
            }
            <rect class="arte__acento" x="454" y="66" width="6" height="58" rx="3" />
          </g>
        }
        @case ('lab-admin') {
          <g class="arte__formas">
            <circle cx="380" cy="40" r="80" fill="url(#lab-grad-esfera)" />
          </g>
          <g class="arte__capa">
            @for (c of [[40, 34], [150, 34], [40, 112], [150, 112]]; track $index) {
              <rect class="arte__ventana" [attr.x]="c[0]" [attr.y]="c[1]" width="98" height="66" rx="10" />
              <circle class="arte__acento-suave" [attr.cx]="c[0] + 20" [attr.cy]="c[1] + 22" r="9" />
              <rect class="arte__raya arte__raya--fuerte" [attr.x]="c[0] + 36" [attr.y]="c[1] + 18" width="46" height="6" rx="3" />
              <rect class="arte__raya" [attr.x]="c[0] + 14" [attr.y]="c[1] + 42" width="70" height="5" rx="2.5" />
            }
            <rect class="arte__ventana" x="268" y="34" width="150" height="144" rx="12" />
            @for (y of [58, 80, 102, 124]; track y) {
              <rect class="arte__raya" x="286" [attr.y]="y" width="112" height="6" rx="3" />
            }
            <rect class="arte__acento" x="286" y="148" width="64" height="16" rx="8" />
          </g>
        }
        @case ('lab-color-atencion') {
          <g class="arte__formas">
            <circle cx="400" cy="180" r="90" fill="url(#lab-grad-lima)" />
          </g>
          <g class="arte__capa">
            @for (c of muestras; track c; let i = $index) {
              <circle class="arte__muestra" [attr.cx]="58 + i * 46" cy="62" r="17" [style.fill]="'var(--sc-color-' + c + '-500)'" />
            }
            <circle class="arte__elegida" cx="58" cy="62" r="23" />
            <rect class="arte__ventana" x="40" y="108" width="360" height="72" rx="14" />
            <rect class="arte__boton" x="60" y="128" width="112" height="32" rx="8" />
            <rect class="arte__raya arte__raya--claro" x="84" y="141" width="64" height="6" rx="3" />
            <rect class="arte__campo" x="186" y="128" width="96" height="32" rx="8" />
            <rect class="arte__raya" x="204" y="141" width="60" height="6" rx="3" />
            <rect class="arte__raya" x="300" y="135" width="80" height="6" rx="3" />
            <rect class="arte__raya" x="300" y="148" width="54" height="6" rx="3" />
          </g>
        }
        @case ('lab-sidebar') {
          <g class="arte__formas">
            <rect x="300" y="-30" width="170" height="150" rx="24" transform="rotate(-16 385 45)" fill="url(#lab-grad-cristal)" />
          </g>
          <g class="arte__capa">
            <rect class="arte__ventana" x="40" y="30" width="170" height="200" rx="14" />
            <rect class="arte__panel" x="40.5" y="30.5" width="120" height="199" rx="14" />
            @for (y of [56, 78, 100, 122, 144]; track y; let i = $index) {
              <circle [class]="i === 2 ? 'arte__acento' : 'arte__punto'" cx="58" [attr.cy]="y + 3" r="5" />
              <rect class="arte__raya arte__raya--fuerte" x="70" [attr.y]="y" [attr.width]="i === 2 ? 66 : 54" height="6" rx="3" />
            }
            <rect class="arte__ventana" x="236" y="30" width="170" height="200" rx="14" />
            <rect class="arte__panel" x="236.5" y="30.5" width="40" height="199" rx="14" />
            @for (y of [56, 78, 100, 122, 144]; track y; let i = $index) {
              <circle [class]="i === 2 ? 'arte__acento' : 'arte__punto'" cx="256" [attr.cy]="y + 3" r="5" />
            }
            <rect class="arte__raya" x="292" y="56" width="96" height="7" rx="3.5" />
            <rect class="arte__raya" x="292" y="74" width="72" height="7" rx="3.5" />
          </g>
        }
        @case ('lab-tabla') {
          <g class="arte__formas">
            <circle cx="40" cy="40" r="80" fill="url(#lab-grad-esfera)" />
          </g>
          <g class="arte__capa">
            <rect class="arte__ventana" x="60" y="28" width="380" height="200" rx="14" />
            <path class="arte__panel" d="M60.5 42a14 14 0 0 1 14-14h20v200h-20a14 14 0 0 1-14-14z" />
            @for (y of [48, 68, 88, 108]; track y) {
              <circle class="arte__punto" cx="78" [attr.cy]="y" r="4" />
            }
            <rect class="arte__raya arte__raya--fuerte" x="112" y="46" width="86" height="8" rx="4" />
            @for (y of [74, 96, 118, 140, 162]; track y) {
              <rect class="arte__raya" x="112" [attr.y]="y" width="70" height="6" rx="3" />
              <rect class="arte__raya" x="200" [attr.y]="y" width="90" height="6" rx="3" />
              <rect class="arte__raya" x="308" [attr.y]="y" width="50" height="6" rx="3" />
            }
            <circle class="arte__flotante" cx="396" cy="168" r="20" />
            <circle class="arte__raya--claro" cx="396" cy="168" r="6" />
          </g>
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }

    /* Con tope de alto: en las tarjetas de dos columnas la proporción la dejaba en 214 px y la ilustración se comía
       media tarjeta. Con el tope recorta arriba y abajo (\`slice\`), y el dibujo está centrado. */
    .arte {
      display: block;
      inline-size: 100%;
      block-size: auto;
      max-block-size: 10rem;
      aspect-ratio: 440 / 200;
    }

    /* Archivada: la misma ilustración, sin color. Dice «esto ya pasó» antes de leer la etiqueta. */
    .arte--apagada {
      filter: grayscale(1);
      opacity: 0.7;
    }

    .arte__fondo {
      fill: var(--sc-bg-default);
    }

    .arte__ventana {
      fill: var(--sc-bg-surface);
      stroke: var(--sc-border-default);
      stroke-width: 1;
    }

    .arte__panel {
      fill: var(--sc-bg-subtle);
    }

    .arte__panel--borde {
      stroke: var(--sc-border-subtle);
      stroke-width: 1;
    }

    .arte__campo {
      fill: var(--sc-bg-surface);
      stroke: var(--sc-border-strong);
      stroke-width: 1;
    }

    .arte__raya {
      fill: var(--sc-border-default);
    }

    .arte__raya--fuerte {
      fill: var(--sc-border-strong);
    }

    .arte__raya--claro {
      fill: var(--sc-bg-surface);
    }

    .arte__punto {
      fill: var(--sc-border-strong);
    }

    .arte__acento,
    .arte__boton,
    .arte__flotante {
      fill: url(#lab-grad-mar);
    }

    .arte__flotante {
      filter: drop-shadow(0 6px 10px rgb(var(--sc-shadow-color-rgb) / 0.22));
    }

    .arte__acento-suave {
      fill: var(--sc-bg-primary-subtle);
    }

    .arte__elegida {
      fill: none;
      stroke: var(--sc-border-focus);
      stroke-width: 2;
    }

    /* Al pasar por la tarjeta: el fondo se acerca y la ventana sube, como hojas a distinta profundidad. */
    .arte__formas,
    .arte__capa {
      transform-box: fill-box;
      transform-origin: center;
      transition: transform 900ms var(--demo-ease-salida);
    }

    :host-context(.lab-tarjeta:hover) .arte__formas {
      transform: scale(1.08) rotate(-3deg);
    }

    :host-context(.lab-tarjeta:hover) .arte__capa {
      transform: translateY(-4px);
    }

    @media (prefers-reduced-motion: reduce) {
      .arte__formas,
      .arte__capa {
        transition: none;
        transform: none !important;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabArteComponent {
  /** Qué se dibuja: el `id` de la exploración o del laboratorio. */
  readonly tema = input.required<string>();
  /** Sin color, para lo archivado. */
  readonly apagada = input(false);

  /** Los ocho colores del laboratorio de color de atención, de la paleta del DS. */
  protected readonly muestras = ['sky', 'blue', 'violet', 'purple', 'emerald', 'teal', 'amber', 'orange'] as const;
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Iconos REALES del Agent: SVGs de /assets/icons/* del sitio en vivo, descargados
 * e inlineados con 'currentColor' (heredan el color CSS → recoloreo/tema). NO Material.
 * Generado por scratchpad/gen-icons.mjs a partir de los .svg reales.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    @switch (name()) { @case ('phone') {
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24.973 25.007"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M831.04,937.8a4.347,4.347,0,0,0-1.852-2.239,17.914,17.914,0,0,0-3.348-1.73,3.786,3.786,0,0,0-.95-.27A3.3,3.3,0,0,0,822,935.273a11.89,11.89,0,0,0-.773,1.288,24.226,24.226,0,0,1-4.733-3.78,25.016,25.016,0,0,1-3.726-4.863c.2-.132.482-.321.875-.581l.7-.461a.5.5,0,0,0,.092-.055c.758-.569,2.028-1.52,1.176-3.522a19.99,19.99,0,0,0-2.118-3.9,2.779,2.779,0,0,0-1.976-1.189,3.473,3.473,0,0,0-2.379.793,7.3,7.3,0,0,0-2.919,7.255,21.314,21.314,0,0,0,6.075,10.571,22.407,22.407,0,0,0,8.846,5.739,11.1,11.1,0,0,0,2.556.6c.318.026.629.046.952.046a6.973,6.973,0,0,0,5.572-2.774,3.468,3.468,0,0,0,.839-2.543A.44.44,0,0,0,831.04,937.8Z"
        transform="translate(-806.097 -918.211)"
        fill="currentColor"
      />
    </svg>
    } @case ('chat') {
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 28.412 25.006"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M895.218,922.857a4.444,4.444,0,0,0-4.247-4.643l-19.824,0a4.5,4.5,0,0,0-4.333,4.621v10.335a4.5,4.5,0,0,0,4.351,4.638h6.2l2.369,4.611a1.418,1.418,0,0,0,.825.724,1.438,1.438,0,0,0,.461.077,1.441,1.441,0,0,0,1.281-.793l2.373-4.619H890.9a4.506,4.506,0,0,0,4.32-4.621Zm-4.3-4.145Z"
        transform="translate(-866.811 -918.212)"
        fill="currentColor"
      />
    </svg>
    } @case ('mail') {
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 15 13.326"
      fill="none"
      aria-hidden="true"
    >
      <g transform="translate(-1189 -2839)">
        <path
          d="M1155.512,644.49a1.3,1.3,0,0,0,1.532.006l6.14-4.342a1.209,1.209,0,0,0-.72-.247h-12.331a1.193,1.193,0,0,0-.683.223Z"
          transform="translate(40.201 2199.092)"
          fill="currentColor"
        />
        <path
          d="M1156.751,645.466a1.79,1.79,0,0,1-2.094-.009l-6.19-4.426a1.428,1.428,0,0,0-.24.788v10.554a1.346,1.346,0,0,0,1.3,1.386h12.4a1.346,1.346,0,0,0,1.3-1.386V641.819a1.434,1.434,0,0,0-.214-.755Z"
          transform="translate(40.772 2198.567)"
          fill="currentColor"
        />
      </g>
    </svg>
    } @case ('search') {
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 14.215 14.216"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1682.434,1755.624l-3.583-3.483a5.8,5.8,0,0,0,1.258-3.578c0-.012,0-.023,0-.035h0a5.828,5.828,0,0,0-11.648-.314c-.006.1-.016.208-.016.314,0,.13.011.257.02.384a5.817,5.817,0,0,0,9.31,4.275l3.614,3.512a.74.74,0,0,0,.522.213.749.749,0,0,0,.522-1.288Zm-8.156-2.812a4.284,4.284,0,1,1,4.284-4.284A4.284,4.284,0,0,1,1674.278,1752.812Z"
        transform="translate(-1668.446 -1742.696)"
        fill="currentColor"
      />
    </svg>
    } @case ('help') {
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 15 15.001"
      fill="none"
      aria-hidden="true"
    >
      <g transform="translate(-1802 -380.597)">
        <g transform="translate(1802 380.597)">
          <g>
            <path
              d="M132.2,582.916a7.5,7.5,0,1,0,7.5,7.5A7.5,7.5,0,0,0,132.2,582.916Zm0,13.948a6.448,6.448,0,1,1,6.447-6.448A6.455,6.455,0,0,1,132.2,596.864Z"
              transform="translate(-124.701 -582.916)"
              fill="currentColor"
            />
            <path
              d="M160.1,603.518a3.293,3.293,0,0,0-3.289,3.29.526.526,0,1,0,1.053,0,2.237,2.237,0,1,1,2.237,2.237.526.526,0,0,0-.526.526v1.238a.526.526,0,1,0,1.053,0v-.753a3.29,3.29,0,0,0-.526-6.537Z"
              transform="translate(-152.584 -600.807)"
              fill="currentColor"
            />
            <ellipse
              cx="0.796"
              cy="0.796"
              rx="0.796"
              ry="0.796"
              transform="translate(6.718 11.2)"
              fill="currentColor"
            />
          </g>
        </g>
      </g>
    </svg>
    } @case ('power') {
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 12.888 13.284"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M634.329,588.444a.469.469,0,0,0,.469-.469v-6.414a.469.469,0,1,0-.939,0v6.414A.469.469,0,0,0,634.329,588.444Z"
        transform="translate(-627.877 -581.091)"
        fill="currentColor"
      />
      <g transform="translate(0 1.422)">
        <path
          d="M592.941,597.758a.469.469,0,0,0-.526.778,5.505,5.505,0,1,1-6.163,0,.469.469,0,1,0-.526-.778,6.444,6.444,0,1,0,7.216,0Z"
          transform="translate(-582.889 -597.677)"
          fill="currentColor"
        />
      </g>
    </svg>
    } @case ('clock') {
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 17 17.001"
      fill="none"
      aria-hidden="true"
    >
      <g transform="translate(-248 -399)">
        <g transform="translate(-739.322 -239.778)">
          <g>
            <g>
              <circle
                cx="8.5"
                cy="8.5"
                r="8.5"
                transform="translate(987.322 638.779)"
                fill="none"
              />
            </g>
            <g>
              <path
                d="M995.822,655.778a8.5,8.5,0,1,1,8.5-8.5A8.51,8.51,0,0,1,995.822,655.778Zm0-16a7.5,7.5,0,1,0,7.5,7.5A7.509,7.509,0,0,0,995.822,639.778Z"
                fill="currentColor"
              />
            </g>
          </g>
          <g>
            <path
              d="M1000,648.018h-4.333v-4.69a.5.5,0,0,1,1,0v3.69H1000a.5.5,0,1,1,0,1Z"
              fill="currentColor"
            />
          </g>
        </g>
      </g>
    </svg>
    } @case ('arrow-out') {
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 10.667 13.439"
      fill="none"
      aria-hidden="true"
    >
      <g transform="translate(-1321.467 -877)">
        <g transform="translate(1321.467 877)">
          <g transform="translate(0 0)">
            <path
              d="M15.667,5l-1-1L6.422,12.242V7.556H5v7.111h7.111V13.244H7.425Z"
              transform="translate(15.667 14.667) rotate(180)"
              fill="currentColor"
            />
            <rect
              width="10.415"
              height="1.344"
              transform="translate(0 12.095)"
              fill="currentColor"
            />
          </g>
        </g>
      </g>
    </svg>
    } }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      line-height: 0;
    }
    svg {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgIconComponent {
  readonly name = input.required<string>();
  readonly size = input(16);
}

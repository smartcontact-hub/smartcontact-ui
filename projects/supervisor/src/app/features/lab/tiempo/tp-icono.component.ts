import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Un círculo como trazo de ruta, para no mezclar elementos SVG distintos. */
const c = (cx: number, cy: number, r: number): string => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
/** Un rectángulo redondeado como trazo de ruta. */
const rr = (x: number, y: number, w: number, h: number, r: number): string =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;

const CAL = [rr(3, 4, 18, 18, 2), 'M16 2v4', 'M8 2v4', 'M3 10h18'];

/**
 * Los iconos del laboratorio, de línea a 1,75 (una sola familia en toda la superficie). Trazos propios en una rejilla
 * de 24, con `currentColor`: el estado se pinta con color y opacidad, nunca con otro dibujo.
 */
const ICONOS = {
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  'chevron-down': ['m6 9 6 6 6-6'],
  'arrow-left': ['m12 19-7-7 7-7', 'M19 12H5'],
  'arrow-up-right': ['M7 17 17 7', 'M8 7h9v9'],
  plus: ['M5 12h14', 'M12 5v14'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  check: ['M20 6 9 17l-5-5'],
  clock: [c(12, 12, 10), 'M12 6v6l4 2'],
  calendar: CAL,
  'calendar-x': [...CAL, 'm14 14-4 4', 'm10 14 4 4'],
  'calendar-range': [...CAL, 'M17 14h-6', 'M13 18H7'],
  globe: [c(12, 12, 10), 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20', 'M2 12h20'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', c(9, 7, 4), 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  search: [c(11, 11, 7), 'm21 21-4.3-4.3'],
  more: [c(12, 12, 1), c(19, 12, 1), c(5, 12, 1)],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
  trash: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'],
  copy: [rr(8, 8, 14, 14, 2), 'M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2'],
  star: ['M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9z'],
  sun: [c(12, 12, 4), 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  repeat: ['m17 2 4 4-4 4', 'M3 11v-1a4 4 0 0 1 4-4h14', 'm7 22-4-4 4-4', 'M21 13v1a4 4 0 0 1-4 4H3'],
  layers: ['m12 2 10 5-10 5L2 7z', 'm2 17 10 5 10-5', 'm2 12 10 5 10-5'],
  undo: ['M3 7v6h6', 'M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13'],
  sparkle: ['M12 3l1.8 5.4a2 2 0 0 0 1.3 1.3L20.5 11.5l-5.4 1.8a2 2 0 0 0-1.3 1.3L12 20l-1.8-5.4a2 2 0 0 0-1.3-1.3L3.5 11.5l5.4-1.8a2 2 0 0 0 1.3-1.3z'],
  info: [c(12, 12, 10), 'M12 16v-4', 'M12 8h.01'],
  alert: [c(12, 12, 10), 'M12 8v4', 'M12 16h.01'],
  lock: [rr(3, 11, 18, 11, 2), 'M7 11V7a5 5 0 0 1 10 0v4'],
  pencil: ['M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z'],
  zap: ['M13 2 3 14h9l-1 8 10-12h-9z'],
} as const;

export type NombreDeIcono = keyof typeof ICONOS;

@Component({
  selector: 'sc-tp-icono',
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="tam()"
      [attr.height]="tam()"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="trazo()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @for (d of trazos(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: `
    :host { display: inline-flex; flex: none; line-height: 0; }
    svg { display: block; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TpIconoComponent {
  readonly nombre = input.required<NombreDeIcono>();
  /** Lado en px: 14 junto a texto pequeño, 16 por defecto. */
  readonly tam = input(16);
  /** 1,75 junto a texto normal; 2 junto a seminegrita. */
  readonly trazo = input(1.75);
  protected readonly trazos = computed<readonly string[]>(() => ICONOS[this.nombre()]);
}

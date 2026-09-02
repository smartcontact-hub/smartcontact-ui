import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ScIconComponent } from '@smartcontact-hub/icons';

/** Una fila de la escala tipográfica: un step y su valor. */
interface TypeRow {
  step: string; // '300'
  token: string; // --sc-font-size-300
  px: number; // 16
  rem: string; // '1'
  sample: string; // texto de muestra
}

/** Un peso de la rampa: el sufijo del token, su nombre y su valor numérico. */
interface WeightRow {
  key: string; // 'semibold'
  name: string; // 'Semibold'
  value: number; // 600
}

interface LineHeightRow {
  step: string;
  token: string;
  px: number;
  rem: string;
}

const rem = (px: number): string => `${+(px / 16).toFixed(4)}`;

/**
 * Foundations → Tipografía.
 *
 * Escala tipográfica de SCDS: 8 tamaños redondos + 7 line-heights + 4 pesos, step-named
 * (mismo idioma que el Kit Pro de Figma y el repo de los devs), en rem sobre root 16 y
 * desacoplada de la escala de espaciado (`--sc-scale`). Las muestras se renderizan con los
 * tokens reales (`var(--sc-font-size-*)`), así que reflejan producción.
 *
 * ⚠️ El root ES 16, no 14 (medido 2026-09-02 en el build: `html` computa 16px porque
 * `styles.scss` lo deja en `100%`, y `--sc-font-size-300` resuelve a 16px = 1rem exacto).
 * El 14 que aparece por todo el sistema es OTRO eje: la base de la escala de espaciado
 * (`--sc-scale-1` = 0.875rem = 14px) y el cuerpo por defecto (`--sc-font-size-200`). Confundirlos
 * y "corregir" el root a 14 encogería tipografía y espaciado a la vez. Por eso la página lo
 * dice explícito: es la pregunta que se repite. Origen del modelo: DD-13.
 */
@Component({
  selector: 'app-foundations-type',
  standalone: true,
  imports: [ScIconComponent, RouterLink],
  templateUrl: './foundations-type.component.html',
  styleUrl: './foundations-type.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationsTypeComponent {
  protected readonly typeIcon = 'text_fields';

  /** Font-size: 8 tamaños redondos, step-named, en rem. */
  protected readonly sizes: TypeRow[] = [
    { step: '100', px: 12, sample: 'Micro-labels, captions, metadatos de tabla' },
    { step: '200', px: 14, sample: 'Cuerpo denso y ayudas de formulario' },
    { step: '300', px: 16, sample: 'Cuerpo base y etiquetas' },
    { step: '400', px: 18, sample: 'Cuerpo destacado' },
    { step: '450', px: 20, sample: 'Subtítulos' },
    { step: '500', px: 24, sample: 'Títulos de sección' },
    { step: '650', px: 32, sample: 'Encabezados de página' },
    { step: '800', px: 48, sample: 'Display' },
  ].map((s) => ({ ...s, token: `--sc-font-size-${s.step}`, rem: rem(s.px) }));

  /** Line-height: 7 valores, step-named, en rem. */
  protected readonly lineHeights: LineHeightRow[] = [
    { step: '100', px: 18 },
    { step: '200', px: 20 },
    { step: '300', px: 24 },
    { step: '450', px: 28 },
    { step: '500', px: 36 },
    { step: '650', px: 40 },
    { step: '800', px: 58 },
  ].map((l) => ({ ...l, token: `--sc-line-height-${l.step}`, rem: rem(l.px) }));

  /**
   * Pesos: CUATRO, no dos. DD-13 decidió "2 pesos (Regular + Semibold), no 4" como intención,
   * pero el export del Kit declara los cuatro y los estilos del DS los usan todos (medido
   * 2026-09-02: regular 16 usos · medium 119 · semibold 120 · bold 28 en `var(--sc-font-weight-*)`
   * de `ui-smartcontact` + `sc-docs` + `supervisor`). La página dice lo que el sistema HACE.
   */
  protected readonly weights: WeightRow[] = [
    { key: 'regular', name: 'Regular', value: 400 },
    { key: 'medium', name: 'Medium', value: 500 },
    { key: 'semibold', name: 'Semibold', value: 600 },
    { key: 'bold', name: 'Bold', value: 700 },
  ];
}

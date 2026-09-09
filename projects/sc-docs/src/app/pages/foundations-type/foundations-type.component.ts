import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ScIconComponent } from '@smartcontact-hub/icons';

/** Una fila de la escala tipográfica: un step y su valor. */
interface TypeRow {
  step: string; // '300'
  token: string; // --sc-font-size-300
  px: number; // 16
  rem: string; // '1'
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

/** Un estilo de texto compuesto del Figma del DS: rol + peso, con su clase lista para usar. */
interface TextStyle {
  cls: string; // 'sc-text-h2-semibold'
  role: string; // 'Heading 2'
  weight: string; // 'Semibold'
  px: number; // 24
  line: number; // 36
  use: string; // uso (del Figma)
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
  imports: [ScIconComponent, TranslatePipe],
  templateUrl: './foundations-type.component.html',
  styleUrl: './foundations-type.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationsTypeComponent {
  protected readonly typeIcon = 'text_fields';

  /** Font-size: 8 tamaños redondos, step-named, en rem. */
  protected readonly sizes: TypeRow[] = [
    { step: '100', px: 12 },
    { step: '200', px: 14 },
    { step: '300', px: 16 },
    { step: '400', px: 18 },
    { step: '450', px: 20 },
    { step: '500', px: 24 },
    { step: '650', px: 32 },
    { step: '800', px: 48 },
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

  /**
   * Los 12 ESTILOS DE TEXTO del Figma del DS "Smart-Contact Design System" (leídos en vivo
   * 2026-09-07): 6 roles × 2 pesos. Cada uno se renderiza con su clase real
   * (`.sc-text-<rol>-<peso>`, en `base/typography.css`), que bebe de los tokens `--sc-*`.
   */
  /**
   * Dónde se pone `.sc-text-*` y dónde no. Las claves se resuelven contra
   * `fundamentos.type.applies.{yes,no}_<clave>` en los locales.
   *
   * La regla sale de la maqueta del Supervisor (393:12562), medida el
   * 2026-09-09: de sus 43 textos, los 25 de página llevan text style anclado y
   * los 18 que viven dentro de un componente (breadcrumb, botones, checkbox,
   * badge) no llevan ninguno. No es descuido, es lo que mantiene al componente
   * leyendo el tema.
   */
  protected readonly appliesYes = ['headings', 'body', 'labels', 'tables'] as const;
  protected readonly appliesNo = ['ds', 'primeng', 'icons'] as const;

  protected readonly textStyles: TextStyle[] = [
    { cls: 'sc-text-display-semibold', role: 'Display', weight: 'Semibold', px: 64, line: 78, use: 'Título principal de pantalla. Solo uno.' },
    { cls: 'sc-text-display-regular', role: 'Display', weight: 'Regular', px: 64, line: 78, use: 'Subtítulo dentro de una sección.' },
    { cls: 'sc-text-h1-semibold', role: 'Heading 1', weight: 'Semibold', px: 48, line: 58, use: 'Portadas y hero. Uno por pantalla.' },
    { cls: 'sc-text-h1-regular', role: 'Heading 1', weight: 'Regular', px: 48, line: 58, use: 'Variante ligera de H1.' },
    { cls: 'sc-text-h2-semibold', role: 'Heading 2', weight: 'Semibold', px: 24, line: 36, use: 'Título de sección.' },
    { cls: 'sc-text-h2-regular', role: 'Heading 2', weight: 'Regular', px: 24, line: 36, use: 'El texto de leer. Párrafos y contenido por defecto.' },
    { cls: 'sc-text-h3-semibold', role: 'Heading 3', weight: 'Semibold', px: 18, line: 24, use: 'Encabezado pequeño: bloques, tarjetas, formularios.' },
    { cls: 'sc-text-h3-regular', role: 'Heading 3', weight: 'Regular', px: 18, line: 24, use: 'Variante ligera de H3.' },
    { cls: 'sc-text-body-semibold', role: 'Body', weight: 'Semibold', px: 14, line: 20, use: 'Texto secundario en negrita. Labels y datos que destacan.' },
    { cls: 'sc-text-body-regular', role: 'Body', weight: 'Regular', px: 14, line: 20, use: 'Texto secundario normal. Descripciones y ayudas.' },
    { cls: 'sc-text-caption-semibold', role: 'Caption', weight: 'Semibold', px: 12, line: 18, use: 'Caption en negrita. Para resaltar: estados, badges.' },
    { cls: 'sc-text-caption-regular', role: 'Caption', weight: 'Regular', px: 12, line: 18, use: 'Texto pequeño: pies, metadatos, fechas.' },
  ];
}

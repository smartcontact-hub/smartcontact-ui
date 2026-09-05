import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { VALIDAR_KEY, desbloquear, estaDesbloqueado } from './validar-gate';

/** Una de las siete comprobaciones del recorrido. */
interface Check {
  readonly n: string;
  readonly title: string;
  readonly note: string;
  readonly css: string;
}

/** Fila de la tabla de equivalencias Figma ↔ navegador. */
interface Mapping {
  readonly figma: string;
  readonly css: string;
  readonly example: string;
}

/** Fila de la tabla de tamaño: qué es en Figma, qué es en el navegador y cómo distinguirlo. */
interface Sizing {
  readonly figma: string;
  readonly css: string;
  readonly how: string;
}

/** Componente del catálogo, con lo que mide hoy en producción. */
interface Piece {
  readonly name: string;
  readonly selector: string;
  readonly today: string;
  readonly ok: boolean | null;
}

/**
 * Guía de validación visual, pensada para perfiles que no leen código: cómo comprobar
 * en el navegador las siete dimensiones de un componente y si bebe de las variables
 * del sistema. Sin enlazar desde la navegación (se llega por URL); la clave solo evita
 * que se encuentre navegando, NO es una medida de seguridad: esto es una app estática
 * y el bundle viaja al cliente. Todas las cifras se midieron en ui.smart-contact.com
 * el 2026-09-01.
 */
@Component({
  selector: 'app-validar',
  imports: [FormsModule, RouterLink],
  templateUrl: './validar.component.html',
  styleUrl: './validar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidarComponent {
  protected readonly unlocked = signal(estaDesbloqueado());
  protected readonly attempt = signal('');
  protected readonly failed = signal(false);

  protected readonly checks: readonly Check[] = [
    { n: '1', title: 'Tamaño', note: 'Cuánto ocupa la caja: ancho y alto.', css: 'el dibujo de cajas' },
    { n: '2', title: 'Tipografía', note: 'Fuente, tamaño, alto de línea, grosor y color.', css: 'font-* · line-height' },
    { n: '3', title: 'Fondo', note: 'El color de relleno de la caja.', css: 'background-color' },
    { n: '4', title: 'Borde', note: 'Grosor y color del contorno.', css: 'border' },
    { n: '5', title: 'Esquinas', note: 'Cuánto se redondean.', css: 'border-radius' },
    { n: '6', title: 'Espaciados', note: 'El aire de dentro y la separación entre piezas.', css: 'padding · gap' },
    { n: '7', title: 'Sombra', note: 'Si la lleva y de qué intensidad.', css: 'box-shadow' },
  ];

  protected readonly mappings: readonly Mapping[] = [
    { figma: 'Fill', css: 'background-color', example: '#ECEFF3' },
    { figma: 'Stroke', css: 'border', example: '1px solid #C6CCD6' },
    { figma: 'Corner radius', css: 'border-radius', example: '6px' },
    { figma: 'Auto layout · padding', css: 'padding', example: '7px 10.5px' },
    { figma: 'Auto layout · gap', css: 'gap', example: '7px' },
    { figma: 'Auto layout · dirección', css: 'flex-direction', example: 'row = horizontal' },
    { figma: 'Effects · drop shadow', css: 'box-shadow', example: '0 1px 2px rgba(…)' },
    { figma: 'Text · size', css: 'font-size', example: '14px' },
    { figma: 'Text · line height', css: 'line-height', example: '20px' },
    { figma: 'Text · weight', css: 'font-weight', example: '400 = Regular' },
    { figma: 'Una variable', css: 'var(--p-…)', example: '--p-chip-background' },
  ];

  protected readonly sizing: readonly Sizing[] = [
    {
      figma: 'W · H con un número',
      css: 'width · height',
      how: 'El valor sale en píxeles y no cambia aunque cambie el contenido.',
    },
    {
      figma: 'Hug contents',
      css: 'width: auto · fit-content',
      how: 'La caja mide lo que mide su contenido. Si alargas el texto, crece.',
    },
    {
      figma: 'Fill container',
      css: 'flex: 1 · width: 100%',
      how: 'La caja ocupa todo el hueco del padre. Si estrechas la ventana, encoge con ella.',
    },
    {
      figma: 'Min width / Min height',
      css: 'min-width · min-height',
      how: 'Suelo: por debajo de ese valor ya no encoge, aunque quepa.',
    },
    {
      figma: 'Max width / Max height',
      css: 'max-width · max-height',
      how: 'Techo: por encima de ese valor ya no crece, y el contenido se parte o se recorta.',
    },
    {
      figma: 'Auto layout horizontal',
      css: 'display: flex · flex-direction: row',
      how: 'Las piezas se ponen en fila.',
    },
    {
      figma: 'Auto layout vertical',
      css: 'display: flex · flex-direction: column',
      how: 'Las piezas se apilan.',
    },
    {
      figma: 'Espacio entre elementos',
      css: 'justify-content: space-between',
      how: 'El hueco se reparte entre las piezas, no lo fija un gap.',
    },
    {
      figma: 'Alineación vertical al centro',
      css: 'align-items: center',
      how: 'Las piezas quedan centradas respecto a la más alta.',
    },
  ];

  /** El auto-layout de Figma frente a CSS, con el truco que evita la confusión de cada fila. */
  protected readonly autolayout: readonly Sizing[] = [
    { figma: 'Hug contents', css: '(no escribas nada) · fit-content', how: 'Abrazar el contenido es el estado natural. Si no dices nada, hace Hug.' },
    { figma: 'Fill container', css: '1fr (en rejilla) · flex: 1 (en fila)', how: '«Llévate lo que sobre». fr es fracción: 1fr 2fr reparte en un tercio y dos tercios.' },
    { figma: 'Fixed (W con un número)', css: 'width: 881px', how: 'Si ves un número en px, es fixed. Da igual lo que haya alrededor.' },
    { figma: 'Min width', css: 'min-width · el primer valor de minmax(a, b)', how: 'Un suelo. Va en el ELEMENTO, no en el contenedor.' },
    { figma: 'Max width', css: 'max-width · el segundo valor de minmax(a, b)', how: 'Un techo. Si a = b, es un Fixed disfrazado.' },
    { figma: 'Gap', css: 'gap', how: 'Mismo nombre, mismo concepto. La etiqueta «grid» lo pinta a rayas.' },
    { figma: 'Wrap', css: 'flex-wrap: wrap', how: 'Si no lo pones, la fila no salta de línea nunca.' },
    { figma: 'Alineación vertical (arriba / centro / abajo)', css: 'align-items: start · center · end', how: 'Vertical mientras la fila sea horizontal. Puede estirar (stretch = Fill).' },
    { figma: 'Alineación horizontal (izq / centro / der)', css: 'justify-content: start · center · end', how: 'Viene de «justificar» un texto. Nunca estira, solo empuja.' },
    { figma: 'Space between', css: 'justify-content: space-between', how: 'Separa las piezas a los extremos. Sin tope de ancho, a 1920 las aleja 900px.' },
    { figma: 'Centrar el bloque en su hueco', css: 'margin-inline: auto (con max-width)', how: 'Lo que reparte el sobrante a los dos lados en vez de dejarlo todo a la derecha.' },
  ];

  protected readonly pieces: readonly Piece[] = [
    { name: 'Chip', selector: '.p-chip', today: '14 / 20', ok: true },
    { name: 'Tag', selector: '.p-tag', today: '12 / 18', ok: true },
    { name: 'Botón', selector: '.p-button', today: '14 / 20', ok: true },
    { name: 'Input', selector: '.p-inputtext', today: '14 / 20', ok: true },
    { name: 'Select · texto', selector: '.p-select-label', today: '14 / 20', ok: true },
    { name: 'MultiSelect · texto', selector: '.p-multiselect-label', today: '14 / 20', ok: true },
    { name: 'Breadcrumb · texto', selector: '.p-breadcrumb-item-label', today: '14 / 20', ok: true },
    { name: 'Toast · título', selector: '.p-toast-summary', today: '14 / 20', ok: true },
    { name: 'Toast · detalle', selector: '.p-toast-detail', today: '12 / 18', ok: true },
    { name: 'Avatar', selector: '.p-avatar', today: '28 × 28', ok: null },
    { name: 'Badge', selector: '.p-badge', today: '8.75 / 24', ok: null },
    { name: 'Tabla · cabecera', selector: '.p-datatable-sortable-column', today: '16 / 20', ok: true },
    { name: 'Card · título', selector: '.p-card-title', today: '18 / 24', ok: true },
  ];

  protected readonly chipExample: readonly { readonly label: string; readonly value: string }[] = [
    { label: '1 · Tamaño', value: '112 × 34' },
    { label: '2 · Tipografía', value: 'Inter · 14px · 20px · 400 · #2F3642' },
    { label: '3 · Fondo', value: '#ECEFF3' },
    { label: '4 · Borde', value: 'sin borde' },
    { label: '5 · Esquinas', value: '16px' },
    { label: '6 · Espaciados', value: 'padding 7px 10.5px · gap 7px' },
    { label: '7 · Sombra', value: 'sin sombra' },
    { label: '¿Usa variables?', value: 'fondo, color, esquinas y gap → sí' },
  ];

  protected readonly snippet = [
    'const s = getComputedStyle($0), r = $0.getBoundingClientRect();',
    'console.table({',
    "  tamano: Math.round(r.width) + ' x ' + Math.round(r.height),",
    '  letra: s.fontSize, altoLinea: s.lineHeight, grosor: s.fontWeight,',
    '  colorTexto: s.color, fondo: s.backgroundColor,',
    '  borde: s.border, esquinas: s.borderRadius,',
    '  padding: s.padding, gap: s.gap, sombra: s.boxShadow,',
    '  ancho: s.width, alto: s.height,',
    '  anchoMin: s.minWidth, anchoMax: s.maxWidth,',
    '  altoMin: s.minHeight, altoMax: s.maxHeight,',
    "  autolayout: s.display + ' ' + s.flexDirection + ' ' + s.alignItems",
    '})',
  ].join('\n');

  protected submit(): void {
    if (this.attempt() === VALIDAR_KEY) {
      this.unlocked.set(true);
      this.failed.set(false);
      desbloquear();
      return;
    }
    this.failed.set(true);
  }
}

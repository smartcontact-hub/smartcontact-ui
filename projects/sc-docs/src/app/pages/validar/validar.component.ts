import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  imports: [FormsModule],
  templateUrl: './validar.component.html',
  styleUrl: './validar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidarComponent {
  private static readonly KEY = 'HalaMadrid123!';
  private static readonly STORAGE = 'sc-validar-ok';

  protected readonly unlocked = signal(this.wasUnlocked());
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
    { figma: 'Una variable', css: 'var(--p-…)', example: 'var(--p-chip-background)' },
  ];

  protected readonly pieces: readonly Piece[] = [
    { name: 'Chip', selector: '.p-chip', today: '14 / 20', ok: true },
    { name: 'Tag', selector: '.p-tag', today: '12 / 24', ok: false },
    { name: 'Botón', selector: '.p-button', today: '14 / 20', ok: true },
    { name: 'Input', selector: '.p-inputtext', today: '14 / 20', ok: true },
    { name: 'Select · texto', selector: '.p-select-label', today: '14 / 20', ok: true },
    { name: 'MultiSelect · texto', selector: '.p-multiselect-label', today: '14 / 20', ok: true },
    { name: 'Breadcrumb · texto', selector: '.p-breadcrumb-item-link', today: '14 / 14', ok: true },
    { name: 'Toast · título', selector: '.p-toast-summary', today: '14 / 20', ok: true },
    { name: 'Toast · detalle', selector: '.p-toast-detail', today: '12 / 20', ok: false },
    { name: 'Avatar', selector: '.p-avatar', today: '28 × 28', ok: null },
    { name: 'Badge', selector: '.p-badge', today: '8.75 / 24', ok: null },
    { name: 'Tabla', selector: '.p-datatable', today: '16 / 24', ok: null },
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
    '  padding: s.padding, gap: s.gap, sombra: s.boxShadow',
    '})',
  ].join('\n');

  protected submit(): void {
    if (this.attempt() === ValidarComponent.KEY) {
      this.unlocked.set(true);
      this.failed.set(false);
      try {
        sessionStorage.setItem(ValidarComponent.STORAGE, '1');
      } catch {
        /* modo privado o almacenamiento bloqueado: se pedirá otra vez, sin más */
      }
      return;
    }
    this.failed.set(true);
  }

  private wasUnlocked(): boolean {
    try {
      return sessionStorage.getItem(ValidarComponent.STORAGE) === '1';
    } catch {
      return false;
    }
  }
}

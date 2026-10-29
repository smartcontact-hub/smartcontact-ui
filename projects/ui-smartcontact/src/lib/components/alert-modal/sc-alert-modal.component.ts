import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { ScButtonComponent } from '../button/sc-button.component';
import type { ScButtonVariant } from '../../core/types/button.types';
import {
  SC_CUSTOM_MODAL_DYNAMIC_DIALOG_DEFAULTS,
  ScCustomModalBodyDirective,
  ScCustomModalComponent,
  ScCustomModalFooterDirective,
} from '../custom-modal/sc-custom-modal.component';
import type { ScDynamicDialogConfig } from '../dynamic-dialog/sc-dynamic-dialog.service';

export type ScAlertModalVariant = 'default' | 'info' | 'warning' | 'error';

/** El icono de cada variante si no se pasa `icon`. El de error es `cancel`, el glifo del Kit (ellos usan `x_circle`). */
export const SC_ALERT_MODAL_ICONS: Record<ScAlertModalVariant, string> = {
  default: 'exclamation-triangle',
  info: 'info',
  warning: 'exclamation-triangle',
  error: 'cancel',
};

const ACTION_VARIANT: Record<ScAlertModalVariant, ScButtonVariant> = {
  default: 'primary',
  info: 'info',
  warning: 'warn',
  error: 'danger',
};

let alertModalIdCounter = 0;

/**
 * Aviso o confirmación en un modal (Kit «❖ Alert modal», 15876:601; DD-240). Es el `sc-alert-modal` de
 * ui.smart-contact.com con su misma API: un `sc-custom-modal` con variante, icono, título, mensaje y acciones. Se abre
 * como lo abren ellos:
 *
 * ```ts
 * const ref = this.dynamicDialog.open(ScAlertModalComponent, {
 *   inputValues: {
 *     variant: 'error',
 *     title: '¿Eliminar el agente «Ana»?',
 *     message: 'Esta acción no se puede deshacer.',
 *     actionLabel: 'Eliminar',
 *     secondaryActionLabel: 'Cancelar',
 *     closeRequested: () => ref.close('closed'),
 *     actionRequested: () => ref.close('action'),
 *   },
 * });
 * ref.onClose.subscribe((result) => { if (result === 'action') … });
 * ```
 *
 * Variantes: `default` confirma algo neutro, `info` informa o enseña progreso, `warning` pide atención (descartar
 * cambios) y `error` destruye o bloquea (borrar, sesión caducada, sin micrófono).
 *
 * Diferencias con la suya, sin cambiar su API:
 *   - Lo que corrige `sc-custom-modal` (un solo rol, nombre y descripción reales, Escape emite `closed`).
 *   - El mensaje es la descripción del diálogo para el lector.
 *   - El foco abre en la salida segura con `warning` y `error` (el botón secundario), y en la acción con `default`
 *     e `info`: un Intro de más no borra nada (WAI-ARIA APG, «Dialog (Modal) Pattern»). El suyo abre en la X.
 *   - Mide de 320 a 480 de ancho y hasta 400 de alto; el título ocupa hasta 2 líneas y el mensaje hasta 4.
 *   - Extensión nuestra: un tercer botón a la izquierda (`tertiaryActionLabel`, «No guardar»).
 */
@Component({
  selector: 'sc-alert-modal',
  standalone: true,
  imports: [ScCustomModalComponent, ScCustomModalBodyDirective, ScCustomModalFooterDirective, ScButtonComponent],
  templateUrl: './sc-alert-modal.component.html',
  styleUrl: './sc-alert-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScAlertModalComponent {
  /** Lo que `ScDynamicDialogService` toma al abrirlo: la carcasa sin cabecera de PrimeNG y el foco lo pone el aviso. */
  static readonly scDynamicDialogDefaults: ScDynamicDialogConfig = {
    ...SC_CUSTOM_MODAL_DYNAMIC_DIALOG_DEFAULTS,
    focusOnShow: false,
  };

  /** Intención: decide el icono, el tono de la superficie y el del botón principal. */
  readonly variant = input<ScAlertModalVariant>('default');
  /** Título del aviso: su nombre para el lector. Hasta 2 líneas. */
  readonly title = input<string | null>(null);
  /** Texto del cuerpo. Admite HTML sencillo (`<p>`, `<ul>`, `<strong>`, enlaces), que Angular sanea. */
  readonly message = input<string | null>(null);
  /** Botón principal. Sin él no se pinta. */
  readonly actionLabel = input<string | null>(null);
  /** Botón secundario, en texto: cierra el modal. */
  readonly secondaryActionLabel = input<string | null>(null);
  /** Extensión nuestra: un tercer botón en texto, a la izquierda (`tertiaryAction`). */
  readonly tertiaryActionLabel = input<string | null>(null);
  /** Sustituye al icono de la variante. */
  readonly icon = input<string | null>(null);
  /** El icono de la variante (o el de `icon`). */
  readonly showIcon = input(true, { transform: booleanAttribute });
  /** Nombre de la X. Sin él, «Cerrar» en el idioma de la app. */
  readonly closeAriaLabel = input<string | null>(null);
  /** La X de la cabecera. */
  readonly showCloseButton = input(true, { transform: booleanAttribute });
  /** Clases extra en la superficie. */
  readonly styleClass = input('');
  /** Cómo cerrar desde fuera (X, botón secundario, Escape); con DynamicDialog, `() => ref.close('closed')`. */
  readonly closeRequested = input<(() => void) | null>(null);
  /** Qué hacer con la acción principal; con DynamicDialog, `() => ref.close('action')`. */
  readonly actionRequested = input<(() => void) | null>(null);
  /** Qué hacer con el tercer botón; con DynamicDialog, `() => ref.close('tertiary')`. */
  readonly tertiaryActionRequested = input<(() => void) | null>(null);

  /** Se descarta: X, botón secundario o Escape. No se emite tras una acción. */
  readonly closed = output<void>();
  /** Se pulsa la acción principal. */
  readonly action = output<void>();
  /** Se pulsa el tercer botón. */
  readonly tertiaryAction = output<void>();

  private readonly modal = viewChild.required(ScCustomModalComponent);
  private readonly primaryBtn = viewChild('primaryBtn', { read: ElementRef });
  private readonly secondaryBtn = viewChild('secondaryBtn', { read: ElementRef });
  private readonly tertiaryBtn = viewChild('tertiaryBtn', { read: ElementRef });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly inDialog = !!inject(DynamicDialogRef, { optional: true });
  private decided = false;

  /** Un aviso interrumpe: el diálogo se anuncia como `alertdialog`. */
  protected readonly dialogRole = 'alertdialog' as const;
  protected readonly messageId = `sc-alert-modal-message-${++alertModalIdCounter}`;
  protected readonly resolvedIcon = computed(() =>
    this.showIcon() ? (this.icon() ?? SC_ALERT_MODAL_ICONS[this.variant()]) : null,
  );
  protected readonly actionVariant = computed(() => ACTION_VARIANT[this.variant()]);
  /** La X lleva el tono de la variante; en `default`, el gris de siempre. */
  protected readonly closeVariant = computed<ScButtonVariant>(() =>
    this.variant() === 'default' ? 'secondary' : ACTION_VARIANT[this.variant()],
  );
  protected readonly surfaceClass = computed(() =>
    ['sc-alert-modal__surface', `sc-alert-modal__surface--${this.variant()}`, this.styleClass()]
      .filter(Boolean)
      .join(' '),
  );

  constructor() {
    afterNextRender(() => {
      if (this.inDialog) this.focusInitial();
    });
  }

  protected onClosed(): void {
    if (this.decided) return;
    this.closed.emit();
  }

  protected onSecondary(): void {
    this.modal().close();
  }

  protected onAction(): void {
    this.decided = true;
    this.action.emit();
    this.actionRequested()?.();
  }

  protected onTertiary(): void {
    this.decided = true;
    this.tertiaryAction.emit();
    this.tertiaryActionRequested()?.();
  }

  /** Con `warning` y `error`, la salida segura primero; con `default` e `info`, la acción. */
  private focusInitial(): void {
    const safeFirst = this.variant() === 'warning' || this.variant() === 'error';
    const order = safeFirst
      ? [this.secondaryBtn(), this.tertiaryBtn(), this.primaryBtn()]
      : [this.primaryBtn(), this.secondaryBtn(), this.tertiaryBtn()];
    const target =
      order.map((ref) => ref?.nativeElement.querySelector('button') as HTMLElement | null).find(Boolean) ??
      this.host.nativeElement.querySelector<HTMLElement>('.sc-custom-modal__close button');
    target?.focus();
  }
}

import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import type { DialogPassThrough } from 'primeng/types/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ScIconComponent,
  SC_ICON_SIZE_DEFAULT,
  SC_ICON_SIZE_LG,
  SC_ICON_SIZE_XL,
  type ScIconTalla,
} from '@smartcontact-hub/icons';

import { ScButtonComponent } from '../button/sc-button.component';
import type { ScButtonVariant } from '../../core/types/button.types';
import type { ScDynamicDialogConfig } from '../dynamic-dialog/sc-dynamic-dialog.service';
import { SC_CUSTOM_MODAL_TRANSLATIONS } from './i18n/sc-custom-modal.translations';

export type ScCustomModalIconSize = 'sm' | 'md' | 'lg';
export type ScCustomModalRole = 'dialog' | 'alertdialog';

/**
 * Lo que `ScDynamicDialogService` necesita para que el modal sea solo esta carcasa: sin la cabecera de PrimeNG y con
 * el diálogo transparente y sin relleno. El servicio lo toma solo del `scDynamicDialogDefaults` estático del
 * componente que se abre, como en ui.smart-contact.com. `focusOnShow: false` es nuestro: el foco inicial lo pone la
 * carcasa, que no lo deja en la X (ver `focusFirst`).
 */
export const SC_CUSTOM_MODAL_DYNAMIC_DIALOG_DEFAULTS: ScDynamicDialogConfig = {
  showHeader: false,
  focusOnShow: false,
  styleClass: 'sc-custom-modal-dialog',
  style: { overflow: 'hidden', border: '0', background: 'transparent' },
  contentStyle: { padding: '0', overflow: 'hidden', background: 'transparent' },
};

const ICON_SIZES: Record<ScCustomModalIconSize, ScIconTalla> = {
  sm: SC_ICON_SIZE_DEFAULT,
  md: SC_ICON_SIZE_LG,
  lg: SC_ICON_SIZE_XL,
};

let customModalIdCounter = 0;

/**
 * Carcasa de modal del DS (Kit «❖ Custom modal», 13644:1039; DD-241). Es el `sc-custom-modal` de
 * ui.smart-contact.com con su misma API: cabecera con icono, título, subtítulo y X; cuerpo y pie proyectados con
 * `scCustomModalBody` y `scCustomModalFooter`. Se abre por `ScDynamicDialogService` desde un componente de
 * contenido que la pinta.
 *
 * Diferencias con la suya (las corrige sin cambiar la API):
 *   - Un solo diálogo para el lector (DD-140): el rol, el nombre y la descripción van al diálogo de PrimeNG que la
 *     envuelve, que es el que atrapa el foco; la carcasa no repite el rol.
 *   - `aria-labelledby` y `aria-describedby` apuntan al título y al subtítulo de verdad.
 *   - Escape también emite `closed`, y la X cierra el diálogo aunque no se pase `closeRequested`.
 *   - El título largo ocupa hasta dos líneas en vez de cortarse en una.
 *   - El nombre de la X sale traducido si no se pasa `closeAriaLabel`.
 *   - El foco abre en el primer control, o en la carcasa, nunca en la X (su tooltip se quedaba el primer Escape).
 *
 * ```html
 * <!-- conversation-modal.html -->
 * <sc-custom-modal icon="format_align_left" title="Conversación" subtitle="12 mensajes" [closeRequested]="close">
 *   <div scCustomModalBody>…</div>
 *   <sc-button scCustomModalFooter label="Cancelar" appearance="text" (clicked)="close()" />
 *   <sc-button scCustomModalFooter label="Guardar" (clicked)="save()" />
 * </sc-custom-modal>
 * ```
 *
 * ```ts
 * @Component({ templateUrl: './conversation-modal.html' })
 * class ConversationModal { static scDynamicDialogDefaults = SC_CUSTOM_MODAL_DYNAMIC_DIALOG_DEFAULTS; … }
 *
 * this.dynamicDialog.open(ConversationModal, { inputValues: { … } });
 * ```
 */
@Component({
  selector: 'sc-custom-modal',
  standalone: true,
  imports: [NgTemplateOutlet, DialogModule, ScIconComponent, ScButtonComponent, TranslateModule],
  templateUrl: './sc-custom-modal.component.html',
  styleUrl: './sc-custom-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sc-custom-modal-host',
    '[class]': 'surfaceClass()',
    // `role` es una entrada: escrito como atributo en la plantilla, el navegador también lo leería en el host.
    '[attr.role]': 'null',
    '[style.--sc-custom-modal-width]': 'width()',
  },
})
export class ScCustomModalComponent {
  // ─── Extensión nuestra: abrirlo desde la plantilla ───────────────────────────────────────────────────────
  /**
   * Con `[(visible)]` la carcasa se abre en su propio diálogo de PrimeNG, sin servicio: para un modal cuyo
   * formulario se ata al estado de la pantalla. Sin él, la carcasa se pinta tal cual (dentro de DynamicDialog).
   */
  readonly visible = model<boolean | undefined>(undefined);
  /** Ancho de la carcasa (cualquier medida CSS). Sin él, `--sc-custom-modal-width` (480). */
  readonly width = input<string | null>(null);
  /** Con `[(visible)]`: un clic fuera del modal lo cierra. */
  readonly dismissableMask = input(false, { transform: booleanAttribute });
  /** Tono de la X; `sc-alert-modal` le pasa el de su variante, como la Severity del Kit. */
  readonly closeVariant = input<ScButtonVariant>('secondary');
  /** Con `[(visible)]`: el modal ha terminado de abrirse. */
  readonly shown = output<void>();

  /** Título de la cabecera. Es el nombre del diálogo para el lector. */
  readonly title = input<string | null>(null);
  /** Línea bajo el título. Es la descripción del diálogo para el lector. */
  readonly subtitle = input<string | null>(null);
  /** Icono junto al título (nombre del DS o de Material Symbols). Decorativo. */
  readonly icon = input<string | null>(null);
  /** Tamaño del icono: `sm` 14, `md` 16 y `lg` 18, el del Kit. */
  readonly iconSize = input<ScCustomModalIconSize>('lg');
  /** `alertdialog` para avisos que interrumpen (lo usa `sc-alert-modal`). */
  readonly role = input<ScCustomModalRole>('dialog');
  /** Nombre del diálogo cuando no hay título visible. */
  readonly ariaLabel = input<string | null>(null);
  /** Id de otro elemento que nombra el diálogo. Gana al título. */
  readonly ariaLabelledBy = input<string | null>(null);
  /** Id de otro elemento que describe el diálogo. Gana al subtítulo. */
  readonly ariaDescribedBy = input<string | null>(null);
  /** Nombre de la X. Sin él, «Cerrar» en el idioma de la app. */
  readonly closeAriaLabel = input<string | null>(null);
  /** La X de la cabecera. Sin ella, el modal se cierra con un botón del pie (o Escape, si se abrió por servicio). */
  readonly showCloseButton = input(true, { transform: booleanAttribute });
  /** Clases en la superficie (el host): para cambiar fondo, borde o color con las variables `--sc-custom-modal-*`. */
  readonly surfaceClass = input('');
  /** Clases en la raíz interna (`section.sc-custom-modal`). */
  readonly styleClass = input('');
  /** Clases en el cuerpo; `sc-custom-modal__body--flush` lo deja a ras, sin padding. */
  readonly bodyClass = input('');
  /** Clases en el pie. */
  readonly footerClass = input('');
  /** Cómo cerrar desde fuera; con `ScDynamicDialogService`, `() => ref.close()`. */
  readonly closeRequested = input<(() => void) | null>(null);

  /** Se cierra el modal: X, Escape o `closeRequested`. Una vez por modal. */
  readonly closed = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialogRef = inject(DynamicDialogRef, { optional: true });
  /** El `role="dialog"` de PrimeNG que envuelve la carcasa, si lo hay. */
  private readonly dialogEl = signal<HTMLElement | null>(null);
  private closedEmitted = false;

  protected readonly id = ++customModalIdCounter;
  protected readonly titleId = `sc-custom-modal-title-${this.id}`;
  protected readonly subtitleId = `sc-custom-modal-subtitle-${this.id}`;
  protected readonly iconPx = computed(() => ICON_SIZES[this.iconSize()]);
  protected readonly hasHeader = computed(
    () => !!(this.icon() || this.title() || this.subtitle() || this.showCloseButton()),
  );
  protected readonly declarative = computed(() => this.visible() !== undefined);
  /** El diálogo de `[(visible)]` va transparente: la carcasa es lo único que se ve. */
  protected readonly dialogStyle = SC_CUSTOM_MODAL_DYNAMIC_DIALOG_DEFAULTS.style;
  protected readonly contentStyle = SC_CUSTOM_MODAL_DYNAMIC_DIALOG_DEFAULTS.contentStyle;
  /** Rol, nombre y descripción del `p-dialog` de `[(visible)]` (DD-140): por `pt.root`, que pisa los suyos. */
  protected readonly dialogPt = computed<DialogPassThrough>(() => ({
    root: {
      role: this.role(),
      'aria-labelledby': this.labelledBy(),
      'aria-label': this.labelledBy() ? null : this.ariaLabel(),
      'aria-describedby': this.describedBy(),
    },
  }));
  protected readonly labelledBy = computed(
    () => this.ariaLabelledBy() ?? (this.title() ? this.titleId : null),
  );
  protected readonly describedBy = computed(
    () => this.ariaDescribedBy() ?? (this.subtitle() ? this.subtitleId : null),
  );

  constructor() {
    const translate = inject(TranslateService);
    for (const [language, dict] of Object.entries(SC_CUSTOM_MODAL_TRANSLATIONS)) {
      translate.setTranslation(language, dict, true);
    }

    afterNextRender(() => {
      const dialog = this.host.nativeElement.parentElement?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]');
      this.dialogEl.set(dialog ?? null);
      // Tras el render de quien la pinta: si ese contenido ya eligió dónde va el foco (sc-alert-modal), se respeta.
      if (dialog && this.dialogRef) queueMicrotask(() => this.focusFirst());
    });

    // El nombre y la descripción del diálogo de PrimeNG: su `aria-labelledby` apunta a una cabecera que con
    // `showHeader: false` no existe, y DynamicDialog no deja cambiarlo por configuración.
    effect(() => {
      const dialog = this.dialogEl();
      if (!dialog) return;
      dialog.setAttribute('role', this.role());
      setOrRemove(dialog, 'aria-labelledby', this.labelledBy());
      setOrRemove(dialog, 'aria-label', this.labelledBy() ? null : this.ariaLabel());
      setOrRemove(dialog, 'aria-describedby', this.describedBy());
    });

    // Escape lo cierra PrimeNG sin pasar por la carcasa: se avisa igual.
    const sub = this.dialogRef?.onClose.subscribe(() => this.emitClosed());
    inject(DestroyRef).onDestroy(() => sub?.unsubscribe());

    // Con `[(visible)]`, al abrir se apunta quién tenía el foco (el que lo abrió) para devolvérselo al cerrar.
    let wasOpen = false;
    effect(() => {
      const open = !!this.visible();
      if (open && !wasOpen) {
        this.closedEmitted = false;
        this.trigger = (document.activeElement as HTMLElement | null) ?? null;
      }
      wasOpen = open;
    });
  }

  /** Cierra como la X: emite `closed` y llama a `closeRequested` (o cierra el diálogo que la envuelve). */
  close(): void {
    this.emitClosed();
    const close = this.closeRequested();
    if (close) close();
    else if (this.declarative()) this.visible.set(false);
    else this.dialogRef?.close();
  }

  private trigger: HTMLElement | null = null;

  /** Escape o la máscara cierran el `p-dialog` de `[(visible)]`. */
  protected onVisibleChange(open: boolean): void {
    this.visible.set(open);
    if (!open) this.emitClosed();
  }

  private readonly surface = viewChild<ElementRef<HTMLElement>>('surface');

  protected onShow(): void {
    this.focusFirst();
    this.shown.emit();
  }

  /**
   * El foco abre en el primer control del cuerpo (el primer campo de un formulario), y si no hay, en el pie o, sin
   * controles, en la propia carcasa. Nunca en la X: su tooltip automático (DD-200) salía al abrir y, como capa de
   * encima, se quedaba el primer Escape (hacían falta dos para cerrar). Si el foco ya está dentro, no se mueve.
   */
  private focusFirst(): void {
    const root = this.surface()?.nativeElement;
    if (!root || root.contains(document.activeElement)) return;
    const focusable = 'input:not([disabled]):not([type=hidden]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
    const target =
      root.querySelector<HTMLElement>(`.sc-custom-modal__body :is(${focusable})`) ??
      root.querySelector<HTMLElement>(`.sc-custom-modal__footer :is(${focusable})`) ??
      root;
    target.focus();
  }

  protected onHide(): void {
    this.emitClosed();
    const el = this.trigger;
    this.trigger = null;
    // queueMicrotask deja que PrimeNG termine de desmontar antes de devolver el foco.
    if (el && typeof el.focus === 'function') queueMicrotask(() => el.focus());
  }

  private emitClosed(): void {
    if (this.closedEmitted) return;
    this.closedEmitted = true;
    this.closed.emit();
  }
}

function setOrRemove(el: HTMLElement, name: string, value: string | null): void {
  if (value) el.setAttribute(name, value);
  else el.removeAttribute(name);
}

/** Marca el contenido que va al cuerpo del modal: `<div scCustomModalBody>…</div>`. */
@Directive({ selector: '[scCustomModalBody]', standalone: true })
export class ScCustomModalBodyDirective {}

/** Marca lo que va al pie (los botones): `<sc-button scCustomModalFooter … />`. Sin nada en el pie, no se pinta. */
@Directive({ selector: '[scCustomModalFooter]', standalone: true })
export class ScCustomModalFooterDirective {}

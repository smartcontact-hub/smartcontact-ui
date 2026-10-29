import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ScIconComponent,
  SC_ICON_SIZE_DEFAULT,
  SC_ICON_SIZE_LG,
  SC_ICON_SIZE_XL,
  type ScIconTalla,
} from '@smartcontact-hub/icons';

import { ScButtonComponent } from '../button/sc-button.component';
import type { ScDynamicDialogConfig } from '../dynamic-dialog/sc-dynamic-dialog.service';
import { SC_CUSTOM_MODAL_TRANSLATIONS } from './i18n/sc-custom-modal.translations';

export type ScCustomModalIconSize = 'sm' | 'md' | 'lg';
export type ScCustomModalRole = 'dialog' | 'alertdialog';

/** Marca el contenido que va al cuerpo del modal: `<div scCustomModalBody>…</div>`. */
@Directive({ selector: '[scCustomModalBody]', standalone: true })
export class ScCustomModalBodyDirective {}

/** Marca lo que va al pie (los botones): `<sc-button scCustomModalFooter … />`. Sin nada marcado, no hay pie. */
@Directive({ selector: '[scCustomModalFooter]', standalone: true })
export class ScCustomModalFooterDirective {}

/**
 * Lo que `ScDynamicDialogService` necesita para que el modal sea solo esta carcasa: sin la cabecera de PrimeNG y con
 * el diálogo transparente y sin relleno. El servicio lo toma solo del `scDynamicDialogDefaults` estático del
 * componente que se abre, como en ui.smart-contact.com.
 */
export const SC_CUSTOM_MODAL_DYNAMIC_DIALOG_DEFAULTS: ScDynamicDialogConfig = {
  showHeader: false,
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
 * Carcasa de modal del DS (Kit «❖ Custom modal», 13644:1039; DD-239). Es el `sc-custom-modal` de
 * ui.smart-contact.com con su misma API: cabecera con icono, título, subtítulo y X; cuerpo y pie proyectados con
 * `scCustomModalBody` y `scCustomModalFooter`. Se abre por `ScDynamicDialogService` desde un componente de
 * contenido que la pinta.
 *
 * Diferencias con la suya (las corrige sin cambiar la API):
 *   - Un solo diálogo para el lector (DD-140): dentro de un diálogo de PrimeNG, el rol, el nombre y la descripción
 *     van a ese diálogo, que es el que atrapa el foco; la carcasa no repite el rol. Fuera de él, lo lleva la carcasa.
 *   - `aria-labelledby` y `aria-describedby` apuntan al título y al subtítulo de verdad.
 *   - Escape también emite `closed`, y la X cierra el diálogo aunque no se pase `closeRequested`.
 *   - El título largo ocupa hasta dos líneas en vez de cortarse en una.
 *   - El nombre de la X sale traducido si no se pasa `closeAriaLabel`.
 *
 * ```ts
 * @Component({ template: `
 *   <sc-custom-modal icon="format_align_left" title="Conversación" subtitle="12 mensajes" [closeRequested]="close">
 *     <div scCustomModalBody>…</div>
 *     <sc-button scCustomModalFooter label="Cancelar" appearance="text" (clicked)="close()" />
 *     <sc-button scCustomModalFooter label="Guardar" (clicked)="save()" />
 *   </sc-custom-modal>` })
 * class ConversationModal { static scDynamicDialogDefaults = SC_CUSTOM_MODAL_DYNAMIC_DIALOG_DEFAULTS; … }
 *
 * this.dynamicDialog.open(ConversationModal, { inputValues: { … } });
 * ```
 */
@Component({
  selector: 'sc-custom-modal',
  standalone: true,
  imports: [ScIconComponent, ScButtonComponent, TranslateModule],
  templateUrl: './sc-custom-modal.component.html',
  styleUrl: './sc-custom-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sc-custom-modal-host',
    '[class]': 'surfaceClass()',
  },
})
export class ScCustomModalComponent {
  /** Título de la cabecera. Es el nombre del diálogo para el lector. */
  readonly title = input<string | null>(null);
  /** Línea bajo el título. Es la descripción del diálogo para el lector. */
  readonly subtitle = input<string | null>(null);
  /** Icono junto al título (nombre del DS o de Material Symbols). Decorativo. */
  readonly icon = input<string | null>(null);
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
  readonly showCloseButton = input(true, { transform: booleanAttribute });
  /** Clases en la superficie (el host): para cambiar fondo, borde o color con las variables `--sc-custom-modal-*`. */
  readonly surfaceClass = input('');
  /** Clases en la raíz interna (`section.sc-custom-modal`). */
  readonly styleClass = input('');
  readonly bodyClass = input('');
  readonly footerClass = input('');
  /** Cómo cerrar desde fuera; con `ScDynamicDialogService`, `() => ref.close()`. */
  readonly closeRequested = input<(() => void) | null>(null);

  /** Se cierra el modal: X, Escape o `closeRequested`. Una vez por modal. */
  readonly closed = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialogRef = inject(DynamicDialogRef, { optional: true });
  private readonly footer = contentChild(ScCustomModalFooterDirective);
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
  protected readonly hasFooter = computed(() => !!this.footer());
  /** Fuera de un diálogo de PrimeNG, el rol lo lleva la carcasa. */
  protected readonly ownRole = computed(() => (this.dialogEl() ? null : this.role()));
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
  }

  /** Cierra como la X: emite `closed` y llama a `closeRequested` (o cierra el diálogo que la envuelve). */
  close(): void {
    this.emitClosed();
    const close = this.closeRequested();
    if (close) close();
    else this.dialogRef?.close();
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

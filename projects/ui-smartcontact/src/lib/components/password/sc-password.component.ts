import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  output,
  ViewEncapsulation,
} from '@angular/core';
// `FormsModule` es el puente `[ngModel]` hacia `p-password`, igual que en `sc-datepicker`:
// `p-password` no tiene un input `value`, solo su `ControlValueAccessor`.
import { FormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import type { PasswordPassThrough } from 'primeng/types/password';

import { ScIconComponent } from '@smartcontact-hub/icons';
import { ScFieldLabelComponent } from '../field/sc-field-label.component';
import { ScFieldMsgComponent } from '../field/sc-field-msg.component';
import { createScFieldState, type ScFieldSize } from '../field/sc-field';

/**
 * Smart Contact password input. Envuelve `p-password` (el que usan el Kit y PrimeBlocks en
 * los formularios de acceso, con `toggleMask`) con la chrome del field-pattern: label +
 * requerido + helper/error, igual que `sc-inputtext`.
 *
 * Diferencias con PrimeNG, y su porqué:
 *   - `feedback` va a `false` por defecto: un formulario de acceso no quiere medidor de fuerza.
 *   - El botón de mostrar/ocultar es un `<button>` real. El de PrimeNG 22 es un `<svg>` (o un
 *     `<span>` si hay plantilla) con solo `(click)`: sin foco, sin rol y sin nombre, así que
 *     con teclado no se alcanza. Se pinta por las plantillas `#showicon`/`#hideicon`, dentro
 *     del `<span (click)>` de PrimeNG: el clic del botón (también el que genera Enter/Espacio)
 *     burbujea hasta ese `span` y PrimeNG alterna su propio estado, sin tocar su lógica.
 *   - Los `aria-*` del campo van al `<input>` real por passthrough (`pt.pcInputText.root`);
 *     puestos en el host `<p-password>` no los leería ningún lector de pantalla.
 *
 * ⚠️ `p-password` está marcado `@deprecated` en PrimeNG 22 (sustituto: la directiva
 * `pInputPassword`, sin botón propio). La API de `sc-password` no depende de eso: si se migra
 * por dentro, los consumidores no cambian.
 */
@Component({
  selector: 'sc-password',
  standalone: true,
  imports: [
    PasswordModule,
    FormsModule,
    ScIconComponent,
    ScFieldLabelComponent,
    ScFieldMsgComponent,
  ],
  templateUrl: './sc-password.component.html',
  styleUrl: './sc-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'sc-password',
    '[class.sc-password--sm]': "size() === 'sm'",
    '[class.sc-password--lg]': "size() === 'lg'",
    '[class.sc-password--invalid]': 'isInvalid()',
    '[class.sc-password--disabled]': 'disabled()',
  },
})
export class ScPasswordComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  // ─── Inputs (los mismos que sc-inputtext donde aplican) ────────────
  readonly size = input<ScFieldSize>('md');
  readonly label = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  /** Texto de ayuda bajo el campo. Lo tapa `error` cuando lo hay: nunca se ven los dos a la vez. */
  readonly helperText = input<string>();
  /**
   * Mensaje de error. Su sola presencia pone el campo en estado inválido, así que no hace falta
   * tocar `invalid` además.
   */
  readonly error = input<string>();
  /** Estado inválido explícito. Se combina con `error`. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Ancho completo: el campo ocupa el 100 % de su contenedor. */
  readonly fluid = input(false, { transform: booleanAttribute });
  /** Nombre accesible cuando no hay `<label>` visible. */
  readonly ariaLabel = input<string>();
  readonly placeholder = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input<string>();
  readonly name = input<string>();
  /** `current-password` en un acceso, `new-password` al crearla (lo leen los gestores de contraseñas). */
  readonly autocomplete = input<string>();
  readonly maxlength = input<number>();

  // ─── Específicos de contraseña ─────────────────────────────────────
  /** Medidor de fuerza de PrimeNG. Apagado por defecto: un acceso no lo quiere. */
  readonly feedback = input(false, { transform: booleanAttribute });
  /** Botón para mostrar u ocultar la contraseña. */
  readonly toggleMask = input(true, { transform: booleanAttribute });
  /** Nombre accesible del botón cuando la contraseña está oculta (i18n lo resuelve el consumidor). */
  readonly showAriaLabel = input<string>('Mostrar contraseña');
  /** Nombre accesible del botón cuando la contraseña está visible. */
  readonly hideAriaLabel = input<string>('Ocultar contraseña');

  // ─── Two-way value binding (signal-friendly) ───────────────────────
  /** Current value. Use `[(value)]="signalName"` from consumers. */
  readonly value = model<string>('');

  // ─── Outputs ───────────────────────────────────────────────────────
  /** El campo ha recibido el foco. */
  readonly focused = output<FocusEvent>();
  /** El campo ha perdido el foco. Es el momento en el que suele validarse. */
  readonly blurred = output<FocusEvent>();

  // ─── Estado del field-pattern (compartido) ─────────────────────────
  private readonly field = createScFieldState('sc-password', {
    inputId: this.inputId,
    error: this.error,
    helperText: this.helperText,
    invalid: this.invalid,
  });
  protected readonly resolvedId = this.field.resolvedId;
  protected readonly msgId = this.field.msgId;
  protected readonly isInvalid = this.field.isInvalid;
  protected readonly footerText = this.field.footerText;

  /** La talla llega al `pInputText` interno como `p-inputtext-sm/lg`: el tema le da letra,
   * interlineado y relleno, igual que a `sc-inputtext` (DD-91). */
  protected readonly pSize = computed(() => {
    const s = this.size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });

  /** PrimeNG tipa `name` como `string`, pero lo pinta con `[attr.name]`: `undefined` deja el
   * `<input>` sin atributo, que es lo que hace `sc-inputtext` cuando no hay `name`. */
  protected readonly pName = computed(() => this.name() as string);

  /** Atributos que `p-password` no expone como input y tienen que caer en el `<input>` real.
   * `null` los QUITA (la directiva `Bind` de PrimeNG llama a `removeAttribute`). */
  protected readonly pt = computed<PasswordPassThrough>(() => ({
    pcInputText: {
      root: {
        'aria-invalid': this.isInvalid() ? 'true' : null,
        'aria-describedby': this.footerText() ? this.msgId() : null,
        'aria-required': this.required() ? 'true' : null,
      },
    },
  }));

  protected onModelChange(v: string | null): void {
    this.value.set(v ?? '');
  }

  protected onFocus(event: Event): void {
    this.focused.emit(event as FocusEvent);
  }

  protected onBlur(event: Event): void {
    this.blurred.emit(event as FocusEvent);
  }

  /**
   * El clic sigue su camino hasta el `<span (click)>` de PrimeNG, que alterna el estado.
   * Ese cambio DESTRUYE este botón y monta el de la otra plantilla: si tenía el foco
   * (teclado), se lo devolvemos al nuevo para no dejarlo caer en `<body>`.
   */
  protected onToggle(event: MouseEvent): void {
    const hadFocus = this.host.nativeElement.ownerDocument.activeElement === event.currentTarget;
    if (!hadFocus) return;
    afterNextRender(
      {
        write: () =>
          this.host.nativeElement.querySelector<HTMLButtonElement>('.sc-password__toggle')?.focus(),
      },
      { injector: this.injector },
    );
  }
}

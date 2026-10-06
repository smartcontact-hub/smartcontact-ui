import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslationKeys } from 'primeng/api';
import { PrimeNG } from 'primeng/config';
import { InputPassword } from 'primeng/inputpassword';

import { ScIconComponent } from '@smartcontact-hub/icons';
import { ScFieldLabelComponent } from '../field/sc-field-label.component';
import { ScFieldMsgComponent } from '../field/sc-field-msg.component';
import { createScFieldState, type ScFieldSize } from '../field/sc-field';

/** Los patrones de PrimeNG para medir la fuerza: media y fuerte (débil es cualquier otra cosa que no esté vacía). */
const MEDIA = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})/;
const FUERTE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;

/** Nivel de una contraseña: 0 vacía, 1 débil, 2 media, 3 fuerte. */
function fuerzaDe(valor: string): 0 | 1 | 2 | 3 {
  if (FUERTE.test(valor)) return 3;
  if (MEDIA.test(valor)) return 2;
  return valor.length ? 1 : 0;
}

/**
 * Smart Contact password input, sobre la directiva `pInputPassword` de PrimeNG con la chrome del field-pattern: label +
 * requerido + helper/error, igual que `sc-inputtext`.
 *
 * Hasta el 2026-10-05 envolvía `p-password`, que PrimeNG 22 marca obsoleto («use pInputPassword directive instead»).
 * La directiva solo da el campo (tipo `password`/`text` y la piel de `pInputText`); lo demás es nuestro y la API no
 * cambia:
 *   - el botón de mostrar/ocultar es un `<button>` real, con foco, rol y nombre (el de PrimeNG era un `<svg>` sin
 *     teclado). Como ya no se destruye al alternar, conserva el foco solo;
 *   - el medidor de fuerza (`feedback`, apagado por defecto: un acceso no lo quiere) sale bajo el campo mientras tiene
 *     el foco, con los tres niveles, los patrones y los textos de PrimeNG (su traducción configurada), y se oye al
 *     cambiar (`aria-live`). Escape lo cierra, como en `p-password`;
 *   - los `aria-*` del campo van al `<input>`, que ahora es nuestro.
 */
@Component({
  selector: 'sc-password',
  standalone: true,
  imports: [InputPassword, ScIconComponent, ScFieldLabelComponent, ScFieldMsgComponent],
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
  private readonly primeng = inject(PrimeNG);

  // ─── Inputs (los mismos que sc-inputtext donde aplican) ────────────
  /**
   * Talla del campo: `sm`, `md` o `lg`. Mueve alto, tipografía y espaciado a la rampa del Kit; no
   * cambia el comportamiento.
   */
  readonly size = input<ScFieldSize>('md');
  /**
   * Etiqueta del campo. Se pinta con `sc-field-label` y es la que ata su `for` al `id` del control,
   * así que **sin ella el campo no tiene nombre accesible** (o se le da uno por `ariaLabel`).
   */
  readonly label = input<string>();
  /**
   * Marca el campo como obligatorio: pinta la marca en la etiqueta y lo anuncia con `aria-
   * required`. No valida por sí solo — de eso se encarga el formulario.
   */
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
  /** Texto dentro del campo mientras está vacío. No sustituye a `label`: desaparece al escribir. */
  readonly placeholder = input<string>();
  /**
   * Deshabilita el campo y su botón de mostrar. No se puede enfocar ni editar, y no viaja en el envío
   * del formulario.
   */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Id del control interno. Si no se pasa se genera uno, así que solo hace falta para atar una
   * etiqueta externa o un `aria-describedby` de fuera.
   */
  readonly inputId = input<string>();
  /**
   * Atributo `name` del control, para el envío nativo del formulario y para que el navegador sepa
   * qué autocompletar.
   */
  readonly name = input<string>();
  /** `current-password` en un acceso, `new-password` al crearla (lo leen los gestores de contraseñas). */
  readonly autocomplete = input<string>();
  /**
   * Máximo de caracteres que deja teclear el navegador. Es un tope duro, no un aviso: no avisa,
   * simplemente no deja escribir más.
   */
  readonly maxlength = input<number>();

  // ─── Específicos de contraseña ─────────────────────────────────────
  /** Medidor de fuerza, el de PrimeNG. Apagado por defecto: un acceso no lo quiere. */
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
  protected readonly meterId = computed(() => `${this.resolvedId()}-meter`);

  /** La talla llega a `pInputText` como `p-inputtext-sm/lg`: el tema le da letra, interlineado y relleno, igual que a
   * `sc-inputtext` (DD-91). */
  protected readonly pSize = computed(() => {
    const s = this.size();
    return s === 'sm' ? 'small' : s === 'lg' ? 'large' : undefined;
  });

  /** Visible la contraseña: el botón la ha mostrado. */
  protected readonly unmasked = signal(false);

  /** El medidor, abierto: con el foco en el campo y `feedback`. Escape lo cierra hasta la próxima tecla. */
  protected readonly meterOpen = signal(false);

  /** Los textos del medidor, los de PrimeNG en su traducción configurada; siguen al idioma. */
  private readonly translation = toSignal(this.primeng.translationObserver, { initialValue: this.primeng.translation });

  protected readonly strength = computed(() => fuerzaDe(this.value()));

  protected readonly meterText = computed(() => {
    const t = this.translation();
    const key = [TranslationKeys.PASSWORD_PROMPT, TranslationKeys.WEAK, TranslationKeys.MEDIUM, TranslationKeys.STRONG][
      this.strength()
    ];
    return (t as unknown as Record<string, string | undefined>)[key] ?? '';
  });

  protected readonly meterLevel = computed(() => (['', 'weak', 'medium', 'strong'] as const)[this.strength()]);

  /** El campo lo describe su ayuda o su error y, con el medidor abierto, el medidor. */
  protected readonly describedBy = computed(() => {
    const ids = [this.footerText() ? this.msgId() : null, this.meterOpen() ? this.meterId() : null].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
    if (this.feedback()) this.meterOpen.set(true);
  }

  protected onFocus(event: FocusEvent): void {
    if (this.feedback()) this.meterOpen.set(true);
    this.focused.emit(event);
  }

  protected onBlur(event: FocusEvent): void {
    this.meterOpen.set(false);
    this.blurred.emit(event);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.meterOpen()) this.meterOpen.set(false);
  }

  protected toggle(): void {
    this.unmasked.update((v) => !v);
  }
}

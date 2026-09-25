import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AutoFocusModule } from 'primeng/autofocus';
import { InplaceModule } from 'primeng/inplace';
import { InputTextModule } from 'primeng/inputtext';
import { ScButtonComponent } from '@smartcontact-hub/components';

/**
 * El nombre de una ficha, editable en su sitio: el `p-inplace` NATIVO de primeng.dev/inplace (DD-113), con el
 * contenido de su ejemplo «input» (campo con foco + botón de cerrar que llama a `closeCallback`).
 *
 * Escribe en el MISMO campo nombre que la pestaña Identidad (`nameChange` en cada tecla, como allí), así que la
 * ficha queda cambiada y se guarda con su Guardar de siempre; los avisos del campo (`error`) se ven también aquí.
 *
 * Dos teclas que el ejemplo no tiene, porque un campo de una línea las pide: Enter cierra con lo escrito y Escape
 * cierra devolviendo el nombre de antes. Y cerrar con el nombre vacío también devuelve el de antes: el título de
 * la página no puede quedarse en blanco (Guardar ya lo impide; aquí no se ve el porqué).
 */
@Component({
  selector: 'sc-name-inplace',
  imports: [AutoFocusModule, InplaceModule, InputTextModule, ScButtonComponent, TranslateModule],
  template: `
    <p-inplace class="name-inplace" (onActivate)="remember()">
      <ng-template #display>
        <span class="name-inplace__text">{{ name() }}</span>
      </ng-template>
      <ng-template #content let-closeCallback="closeCallback">
        <span class="name-inplace__edit">
          <input
            type="text"
            pInputText
            [pAutoFocus]="true"
            class="name-inplace__input sc-text-h3-semibold"
            autocomplete="off"
            [value]="name()"
            [attr.aria-label]="label()"
            [invalid]="!!error()"
            [attr.aria-invalid]="error() ? true : null"
            (input)="nameChange.emit($any($event.target).value)"
            (keydown.enter)="close(closeCallback, $event)"
            (keydown.escape)="cancel(closeCallback, $event)"
          />
          <sc-button
            variant="danger"
            appearance="text"
            icon="close"
            [ariaLabel]="'common.close' | translate"
            (clicked)="close(closeCallback, $event)"
          />
        </span>
        @if (error(); as message) {
          <span class="name-inplace__error sc-text-caption-regular" role="alert">{{ message }}</span>
        }
      </ng-template>
    </p-inplace>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    /* El relleno nativo del display (el de los campos) y su borde transparente de 1px se compensan con el mismo
       token, en los dos ejes: el nombre sigue en la vertical del resto de la ficha, la cabecera no crece, y el
       fondo de «se puede editar» sobresale alrededor. Medido: sin esto, el texto caía 1px a la derecha y las
       pestañas bajaban 12,5px. */
    /* En bloque ajustado al texto, no en línea: en línea sumaba el hueco de la línea de base (29,5 de alto en vez de
       los 24 del título). */
    .name-inplace .p-inplace-display {
      display: block;
      width: fit-content;
      max-width: 100%;
      margin-inline-start: calc(-1 * (var(--sc-cmp-form-field-padding-x) + 1px));
      margin-block: calc(-1 * (var(--sc-cmp-form-field-padding-y) + 1px));
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Editando, lo mismo: el campo ocupa el sitio del título sin empujar nada. */
    .name-inplace__edit {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-0-5);
      margin-block: calc(-1 * (var(--sc-cmp-form-field-padding-y) + 1px));
    }

    .name-inplace__input {
      flex: 1 1 auto;
      min-width: 0;
      margin-inline-start: calc(-1 * (var(--sc-cmp-form-field-padding-x) + 1px));
    }

    .name-inplace__error {
      display: block;
      margin-top: var(--sc-spacing-0-25);
      color: var(--sc-text-danger);
    }
  `,
  // Sin encapsular: el display y el campo los pinta `p-inplace` dentro de su propia vista.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NameInplaceComponent {
  /** El nombre actual (el del formulario). */
  readonly name = input.required<string>();
  /** Cómo se llama el campo, para el lector de pantalla («Nombre»). */
  readonly label = input.required<string>();
  /** El aviso del campo, ya traducido (p. ej. nombre repetido). */
  readonly error = input<string | null>(null);

  /** Cada tecla, como el campo de Identidad. */
  readonly nameChange = output<string>();

  private before = '';

  protected remember(): void {
    this.before = this.name();
  }

  protected close(closeCallback: (event: Event) => void, event: Event): void {
    event.preventDefault();
    if (this.name().trim().length === 0) this.nameChange.emit(this.before);
    closeCallback(event);
  }

  protected cancel(closeCallback: (event: Event) => void, event: Event): void {
    event.preventDefault();
    this.nameChange.emit(this.before);
    closeCallback(event);
  }
}

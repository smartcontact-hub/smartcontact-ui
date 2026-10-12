import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { ScIconComponent } from '@smartcontact-hub/icons';

type PrimeButtonSize = 'small' | 'large' | undefined;

/**
 * Un botón de solo icono que NAVEGA (DD-172 no reabierto: `sc-button` renderiza sobre `<p-button>`,
 * que no deja elegir `<a>` como raíz; esto es un componente nuevo y acotado, no una migración de
 * `sc-button`). Sobre `<a [pButton] [routerLink]>` — la directiva de PrimeNG, no el componente — porque
 * es la única vía que admite un `<a>` real con `routerLink` y las clases/tokens de botón del preset.
 *
 * Pensado solo para un candado que cruza a la ficha de OTRA entidad (si el destino es interno a la
 * misma ficha, usa `sc-button` con un `(clicked)` que navegue por dentro, como ya hace
 * `group-assignment-table`).
 */
@Component({
  selector: 'sc-link-button',
  standalone: true,
  imports: [ButtonModule, RouterLink, ScIconComponent],
  template: `
    <a
      pButton
      iconOnly
      variant="text"
      severity="secondary"
      [size]="buttonSize()"
      [routerLink]="routerLink()"
      [queryParams]="queryParams()"
      [attr.aria-label]="ariaLabel()"
    >
      <sc-icon [name]="icon()" pButtonIcon />
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScLinkButtonComponent {
  readonly icon = input.required<string>();
  readonly ariaLabel = input<string | null>(null);
  readonly routerLink = input.required<readonly (string | number)[] | string>();
  readonly queryParams = input<Record<string, string> | null>(null);
  readonly size = input<'sm' | 'md' | 'lg'>('sm');

  protected readonly buttonSize = computed<PrimeButtonSize>(() => {
    const size = this.size();
    if (size === 'sm') return 'small';
    if (size === 'lg') return 'large';
    return undefined;
  });
}

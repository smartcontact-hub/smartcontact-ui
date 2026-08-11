import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Glifos del sidebar.
 *
 * ⚠️ PLACEHOLDER ANOTADO — el sitio real usa `<svg-icon>` con SVGs propios
 * (medidos: ~20×24, viewBox propio por icono, 4 paths cada uno) que viven INLINE
 * en su bundle: no hay petición de red que descargar, y extraerlos por
 * `getComputedStyle` los trunca. Estos de aquí igualan la SILUETA y la caja
 * (20×24, `currentColor`) para que el layout mida bien; el trazo exacto se
 * sustituye en la pasada de afinado, antes del checkpoint.
 */
@Component({
  selector: 'app-nav-icon',
  standalone: true,
  template: `
    @switch (name()) {
      @case ('dashboard') {
        <svg viewBox="0 0 20 24" width="20" height="24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
          <rect x="1" y="3" width="7" height="8" rx="1.6" />
          <rect x="1" y="13" width="7" height="8" rx="1.6" />
          <rect x="11" y="3" width="7" height="12" rx="1.6" />
          <rect x="11" y="17" width="7" height="4" rx="1.6" />
        </svg>
      }
      @case ('tickets') {
        <svg viewBox="0 0 20 24" width="20" height="24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
          <rect x="2" y="4" width="16" height="16" rx="3.4" />
          <path d="M6 9h8M6 12.5h8M6 16h5" stroke-linecap="round" />
        </svg>
      }
      @case ('search') {
        <svg viewBox="0 0 20 24" width="20" height="24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
          <circle cx="9" cy="11" r="6" />
          <path d="M13.4 15.4 18 20" stroke-linecap="round" />
        </svg>
      }
      @case ('mo') {
        <svg viewBox="0 0 20 24" width="20" height="24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
          <circle cx="10" cy="8.5" r="4" />
          <path d="M3 20c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke-linecap="round" />
        </svg>
      }
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavIconComponent {
  readonly name = input.required<'dashboard' | 'tickets' | 'search' | 'mo'>();
}

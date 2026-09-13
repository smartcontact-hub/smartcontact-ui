/*
 * La unidad de un campo numérico tiene que llegar al lector de pantalla.
 *
 * Hasta el 2026-09-13 el sufijo («segundos») era `aria-hidden` y nada lo nombraba: se veía,
 * pero no se oía. Estas pruebas fijan que el campo lo lleva en `aria-describedby`, que
 * convive con el mensaje de ayuda o de error, y que sin sufijo ni mensaje no queda un
 * `aria-describedby` vacío apuntando a nada.
 */
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ScInputNumberComponent } from './sc-inputnumber.component';

@Component({
  standalone: true,
  imports: [ScInputNumberComponent],
  template: `<sc-inputnumber inputId="espera" [suffix]="suffix()" [helperText]="ayuda()" />`,
})
class Host {
  readonly suffix = signal<string | undefined>('segundos');
  readonly ayuda = signal<string | undefined>(undefined);
}

function montar(suffix: string | undefined, ayuda: string | undefined) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.suffix.set(suffix);
  fixture.componentInstance.ayuda.set(ayuda);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const descritoPor = (input.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map((id) => fixture.nativeElement.querySelector(`#${id}`)?.textContent?.trim());
  const sufijo = fixture.nativeElement.querySelector('.sc-inputnumber__suffix') as HTMLElement | null;
  return { input, descritoPor, sufijo };
}

describe('sc-inputnumber · la unidad se oye', () => {
  it('el sufijo describe al campo y no está oculto', () => {
    const { descritoPor, sufijo } = montar('segundos', undefined);
    expect(descritoPor).toEqual(['segundos']);
    expect(sufijo?.getAttribute('aria-hidden')).toBeNull();
  });

  it('con mensaje de ayuda, se oyen los dos: primero la unidad', () => {
    const { descritoPor } = montar('segundos', 'Tras este tiempo se desborda');
    expect(descritoPor).toEqual(['segundos', 'Tras este tiempo se desborda']);
  });

  it('sin sufijo ni mensaje no deja un aria-describedby vacío', () => {
    const { input } = montar(undefined, undefined);
    expect(input.hasAttribute('aria-describedby')).toBe(false);
  });
});

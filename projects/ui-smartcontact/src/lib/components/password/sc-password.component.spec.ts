/*
 * El medidor de fuerza y el botón de mostrar de `sc-password` son nuestros desde que el campo pasó de `p-password`
 * (jubilado en PrimeNG 22) a la directiva `pInputPassword` (DD-172). Estas pruebas fijan lo que antes ponía PrimeNG:
 * los tres niveles con sus patrones y sus textos, que el medidor solo sale con `feedback` y con el foco, que Escape y
 * salir del campo lo cierran, y que mientras está abierto describe al campo. Y lo que ya era nuestro: el botón alterna
 * el tipo y su nombre sin desmontarse, que es lo que le deja conservar el foco.
 */
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ScPasswordComponent } from './sc-password.component';

@Component({
  standalone: true,
  imports: [ScPasswordComponent],
  template: `<sc-password inputId="clave" label="Contraseña" [feedback]="feedback()" [helperText]="ayuda()" [(value)]="valor" />`,
})
class Host {
  readonly feedback = signal(true);
  readonly ayuda = signal<string | undefined>(undefined);
  readonly valor = signal('');
}

function montar(opciones: { feedback?: boolean; ayuda?: string } = {}) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.feedback.set(opciones.feedback ?? true);
  fixture.componentInstance.ayuda.set(opciones.ayuda);
  fixture.detectChanges();
  const raiz = fixture.nativeElement as HTMLElement;
  const input = raiz.querySelector('input') as HTMLInputElement;
  const disparar = (evento: Event) => {
    input.dispatchEvent(evento);
    fixture.detectChanges();
  };
  const escribir = (texto: string) => {
    input.value = texto;
    disparar(new Event('input'));
  };
  const medidor = () => {
    const caja = raiz.querySelector<HTMLElement>('.sc-password__meter');
    if (!caja) return null;
    return {
      id: caja.id,
      nivel: caja.querySelector('.sc-password__meter-bar')?.getAttribute('data-level'),
      texto: caja.querySelector('.sc-password__meter-text')?.textContent?.trim(),
    };
  };
  const descritoPor = () =>
    (input.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter(Boolean)
      .map((id) => raiz.querySelector(`#${id}`)?.textContent?.trim());
  return { fixture, raiz, input, disparar, escribir, medidor, descritoPor };
}

describe('sc-password · el medidor de fuerza', () => {
  it('sale con el foco y mide los tres niveles con los patrones y los textos de PrimeNG', () => {
    const { disparar, escribir, medidor, fixture } = montar();
    expect(medidor()).toBeNull();

    disparar(new FocusEvent('focus'));
    expect(medidor()).toMatchObject({ nivel: '', texto: 'Enter a password' });

    escribir('abc');
    expect(medidor()).toMatchObject({ nivel: 'weak', texto: 'Weak' });
    escribir('abcdef1');
    expect(medidor()).toMatchObject({ nivel: 'medium', texto: 'Medium' });
    escribir('abcDEF12');
    expect(medidor()).toMatchObject({ nivel: 'strong', texto: 'Strong' });
    expect(fixture.componentInstance.valor()).toBe('abcDEF12');
  });

  it('sin `feedback` no sale, ni con el foco ni al escribir', () => {
    const { disparar, escribir, medidor } = montar({ feedback: false });
    disparar(new FocusEvent('focus'));
    escribir('abcDEF12');
    expect(medidor()).toBeNull();
  });

  it('Escape lo cierra hasta la próxima tecla, y salir del campo también', () => {
    const { disparar, escribir, medidor } = montar();
    disparar(new FocusEvent('focus'));
    disparar(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(medidor()).toBeNull();

    escribir('a');
    expect(medidor()).not.toBeNull();
    disparar(new FocusEvent('blur'));
    expect(medidor()).toBeNull();
  });

  it('abierto, describe al campo después de la ayuda; cerrado, solo queda la ayuda', () => {
    const { disparar, escribir, descritoPor } = montar({ ayuda: 'Mínimo 8 caracteres' });
    expect(descritoPor()).toEqual(['Mínimo 8 caracteres']);

    disparar(new FocusEvent('focus'));
    escribir('abc');
    expect(descritoPor()).toEqual(['Mínimo 8 caracteres', 'Weak']);

    disparar(new FocusEvent('blur'));
    expect(descritoPor()).toEqual(['Mínimo 8 caracteres']);
  });
});

describe('sc-password · el botón de mostrar', () => {
  it('alterna el tipo del campo y su nombre, y sigue siendo el mismo botón', () => {
    const { raiz, input, fixture } = montar({ feedback: false });
    const boton = raiz.querySelector<HTMLButtonElement>('button.sc-password__toggle')!;
    expect(input.type).toBe('password');
    expect(boton.getAttribute('aria-label')).toBe('Mostrar contraseña');

    boton.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    expect(boton.getAttribute('aria-label')).toBe('Ocultar contraseña');
    expect(raiz.querySelector('button.sc-password__toggle')).toBe(boton);

    boton.click();
    fixture.detectChanges();
    expect(input.type).toBe('password');
  });
});

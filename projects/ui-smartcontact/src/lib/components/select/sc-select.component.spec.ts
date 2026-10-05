/*
 * UN DESPLEGABLE SE NOMBRA POR LO QUE PIDE, NO POR LO QUE VALE (DD-133).
 *
 * PrimeNG pinta el select como `<span role="combobox">` y, si nadie le da nombre, le pone de
 * `aria-label` el texto de la opción elegida: el lector oía «Automático, combobox» en vez de
 * «Descuelgue de llamadas». Un `<label for>` no lo arregla, porque un span no es etiquetable. Estas
 * pruebas fijan las salidas del componente:
 *   · sin rótulo, `ariaLabel` nombra el combobox (por el `ariaLabel` nativo de `p-select`);
 *   · una opción que no se puede elegir lo dice con `aria-disabled`, no solo con su color.
 *
 * Que ningún desplegable de las pantallas se quede sin nombre lo vigila `audit:screen-hygiene`.
 */
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { ScSelectComponent } from './sc-select.component';

const PRIORIDADES = [
  { label: 'Alta', value: 'alta' },
  { label: 'Media', value: 'media', apagada: true },
  { label: 'Baja', value: 'baja' },
];

/** Monta el select y espera a que `ngModel` le escriba el valor, que llega en el siguiente ciclo. */
async function montar(entradas: Record<string, unknown>) {
  const fixture = TestBed.createComponent(ScSelectComponent);
  for (const [nombre, valor] of Object.entries({ options: PRIORIDADES, optionValue: 'value', ...entradas })) {
    fixture.componentRef.setInput(nombre, valor);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const combobox = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLElement;
  return { fixture, combobox };
}

describe('sc-select · el nombre del desplegable', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideTranslateService()] }));

  it('sin nombre, PrimeNG lo nombra con la opción elegida: por eso cada pantalla le da uno', async () => {
    const { combobox } = await montar({ value: 'alta' });
    expect(combobox.getAttribute('aria-label')).toBe('Alta');
  });

  it('sin rótulo visible, `ariaLabel` nombra el combobox, no el host', async () => {
    const { fixture, combobox } = await montar({ value: 'alta', ariaLabel: 'Prioridad' });
    expect(combobox.getAttribute('aria-label')).toBe('Prioridad');
    expect((fixture.nativeElement as HTMLElement).getAttribute('aria-label')).toBeNull();
  });
});

describe('sc-select · la descripción', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideTranslateService()] }));

  it('la ayuda de fuera (`ariaDescribedBy`) se oye en el combobox, después de la propia (DD-133)', async () => {
    const { fixture, combobox } = await montar({ ariaLabel: 'Prioridad', helperText: 'Ordena la cola', ariaDescribedBy: 'fila-ayuda' });
    const [propia, deFuera] = (combobox.getAttribute('aria-describedby') ?? '').split(' ');
    expect((fixture.nativeElement as HTMLElement).querySelector(`#${propia}`)?.textContent?.trim()).toBe('Ordena la cola');
    expect(deFuera).toBe('fila-ayuda');
  });

  it('sin ninguna ayuda no deja un aria-describedby vacío', async () => {
    const { combobox } = await montar({ ariaLabel: 'Prioridad' });
    expect(combobox.hasAttribute('aria-describedby')).toBe(false);
  });
});

describe('sc-select · las opciones apagadas', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    // El panel de PrimeNG pregunta por `matchMedia` al abrirse, y jsdom no lo trae.
    window.matchMedia ??= (query: string) =>
      ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList;
  });

  it('una opción que no se puede elegir lo dice con `aria-disabled`; las demás no lo llevan', async () => {
    const { fixture, combobox } = await montar({ optionDisabled: 'apagada', appendTo: 'self' });
    combobox.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const opciones = [...(fixture.nativeElement as HTMLElement).querySelectorAll('[role="option"]')];
    expect(opciones.map((o) => [o.textContent?.trim(), o.getAttribute('aria-disabled')])).toEqual([
      ['Alta', null],
      ['Media', 'true'],
      ['Baja', null],
    ]);
  });
});

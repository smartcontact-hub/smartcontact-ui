/*
 * La ayuda, el error y lo obligatorio de `sc-datepicker` tienen que llegar al `<input>` que recibe el foco, no a la
 * envoltura `<p-datepicker>`: un lector de pantalla anuncia los `aria-*` del elemento enfocado. Hasta que esto se
 * midió, iban en la envoltura (lo mismo que `sc-select` arregló con `pt.label`, DD-133).
 */
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { ScDatepickerComponent } from './sc-datepicker.component';

@Component({
  standalone: true,
  imports: [ScDatepickerComponent],
  template: `<sc-datepicker inputId="fecha" label="Fecha" [required]="true" [helperText]="ayuda()" [error]="error()" />`,
})
class Host {
  readonly ayuda = signal<string | undefined>('Día del cierre');
  readonly error = signal<string | undefined>(undefined);
}

beforeEach(() => TestBed.configureTestingModule({ providers: [provideTranslateService({ lang: 'es' })] }));

function montar(ajustes: { error?: string } = {}) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.error.set(ajustes.error);
  fixture.detectChanges();
  const raiz = fixture.nativeElement as HTMLElement;
  const input = raiz.querySelector<HTMLInputElement>('input#fecha')!;
  return { fixture, raiz, input };
}

describe('sc-datepicker · los aria del campo', () => {
  it('la ayuda describe al <input> enfocable y lo obligatorio se anuncia en él', () => {
    const { raiz, input } = montar();
    expect(input).not.toBeNull();
    const describedby = input.getAttribute('aria-describedby');
    expect(describedby, 'el input enfocable lleva aria-describedby').toBeTruthy();
    expect(raiz.querySelector(`[id="${describedby!}"]`)?.textContent).toContain('Día del cierre');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('con un error, el <input> se marca inválido y el error es lo que lo describe', () => {
    const { raiz, input } = montar({ error: 'Falta la fecha' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const describedby = input.getAttribute('aria-describedby');
    expect(raiz.querySelector(`[id="${describedby!}"]`)?.textContent).toContain('Falta la fecha');
  });
});

/* Los dos modos que pasan tal cual al nativo: días sueltos (su valor va en `dates`) y solo la hora. */
@Component({
  standalone: true,
  imports: [ScDatepickerComponent],
  template: `
    <sc-datepicker inline selectionMode="multiple" ariaLabel="Festivos" [(dates)]="dias" />
    <sc-datepicker inputId="hora" timeOnly ariaLabel="Apertura" [(value)]="hora" />
  `,
})
class HostDeModos {
  readonly dias = signal<readonly Date[] | null>(null);
  readonly hora = signal<Date | null>(new Date(2026, 0, 1, 9, 30));
}

describe('sc-datepicker · días sueltos y solo la hora', () => {
  it('en `multiple`, cada día pulsado entra en `dates` y volver a pulsarlo lo quita', () => {
    const fixture = TestBed.createComponent(HostDeModos);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    const dias = () => [...raiz.querySelectorAll<HTMLElement>('td:not(.p-datepicker-other-month) .p-datepicker-day')];
    dias()[2].click();
    fixture.detectChanges();
    dias()[4].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.dias()?.map((d) => d.getDate())).toEqual([3, 5]);
    dias()[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.dias()?.map((d) => d.getDate())).toEqual([5]);
  });

  it('con `timeOnly`, el campo enseña la hora y lleva su nombre accesible', async () => {
    const fixture = TestBed.createComponent(HostDeModos);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input#hora')!;
    expect(input.value).toBe('09:30');
    expect(input.getAttribute('aria-label')).toBe('Apertura');
  });
});

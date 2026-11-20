/*
 * La celda se monta para renombrar un borrador recién duplicado: el usuario ya está en modo «renombrar», así que
 * el campo tiene que llegar con el foco y el nombre entero seleccionado, y lo primero que teclee lo sustituye.
 * Si la selección se pierde, el texto nuevo se pega al final del nombre copiado («Horario 1 (copia)Mañanas»).
 */
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { ScInlineRenameCellComponent } from './sc-inline-rename-cell.component';

const NOMBRE = 'Horario de oficina (copia)';

@Component({
  standalone: true,
  imports: [ScInlineRenameCellComponent],
  template: `
    @if (editando()) {
      <sc-inline-rename-cell [initialValue]="nombre" (commit)="confirmado = $event" />
    }
  `,
})
class Host {
  readonly editando = signal(false);
  readonly nombre = NOMBRE;
  confirmado = '';
}

beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideTranslateService({ lang: 'es' })] });
});

/** Monta la celda como lo hace una lista tras duplicar: la fila pasa a modo edición y aparece el campo. */
async function montar() {
  const fixture = TestBed.createComponent(Host);
  const raiz = fixture.nativeElement as HTMLElement;
  document.body.appendChild(raiz);
  fixture.detectChanges();
  fixture.componentInstance.editando.set(true);
  fixture.detectChanges();
  await fixture.whenStable();
  // Deja correr cualquier escritura diferida en microtareas antes de medir.
  await new Promise((resolve) => setTimeout(resolve));
  const input = raiz.querySelector<HTMLInputElement>('sc-inline-rename-cell input')!;
  return { fixture, raiz, input };
}

describe('sc-inline-rename-cell · al montar', () => {
  it('llega con el nombre, el foco y todo el texto seleccionado', async () => {
    const { input } = await montar();
    expect(input.value).toBe(NOMBRE);
    expect(document.activeElement, 'el foco está en el campo').toBe(input);
    expect(
      [input.selectionStart, input.selectionEnd],
      'el nombre entero seleccionado, para que lo que se teclee lo sustituya',
    ).toEqual([0, NOMBRE.length]);
  });

  it('lo que se teclea sustituye al nombre y Enter lo confirma', async () => {
    const { fixture, input } = await montar();
    // jsdom no edita el campo al recibir teclas: se reproduce lo que hace el navegador con una selección
    // activa, que es reemplazarla por lo tecleado.
    input.setRangeText('Mañanas', input.selectionStart ?? 0, input.selectionEnd ?? 0, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.confirmado).toBe('Mañanas');
  });
});

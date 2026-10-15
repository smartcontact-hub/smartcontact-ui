/*
 * La paleta se anuncia como diálogo modal, así que tiene que comportarse como uno para el teclado y el lector:
 * Tab no se sale a un fondo que el lector cree inerte, al cerrar el foco vuelve a quien la abrió y el comando
 * resaltado por las flechas se anuncia (`aria-activedescendant`, con el foco fijo en el campo de búsqueda).
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { ScCommandPaletteComponent } from './sc-command-palette.component';
import { ScCommandPaletteService } from './sc-command-palette.service';

@Component({
  standalone: true,
  imports: [ScCommandPaletteComponent],
  template: `<button id="abre" type="button">Abrir</button><sc-command-palette />`,
})
class Host {}

beforeEach(() => {
  // jsdom no implementa `scrollIntoView`, que las flechas usan para arrastrar la vista.
  Element.prototype.scrollIntoView = () => undefined;
  TestBed.configureTestingModule({ providers: [provideTranslateService({ lang: 'es' })] });
});

async function abrir() {
  const fixture = TestBed.createComponent(Host);
  const servicio = TestBed.inject(ScCommandPaletteService);
  servicio.setCommands([
    { id: 'a', label: 'Agentes', category: 'Admin', action: () => undefined },
    { id: 'b', label: 'Horarios', category: 'Admin', action: () => undefined },
  ]);
  fixture.detectChanges();
  const raiz = fixture.nativeElement as HTMLElement;
  document.body.appendChild(raiz);
  const opener = raiz.querySelector<HTMLButtonElement>('#abre')!;
  opener.focus();
  servicio.open();
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
  return { fixture, raiz, servicio, opener };
}

function tecla(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  document.dispatchEvent(ev);
  return ev;
}

describe('sc-command-palette · teclado y lector de pantalla', () => {
  it('Tab no saca el foco de la paleta', async () => {
    const { raiz } = await abrir();
    const input = raiz.querySelector<HTMLInputElement>('.palette__input')!;
    expect(document.activeElement).toBe(input);
    expect(tecla('Tab').defaultPrevented, 'Tab queda dentro de la paleta').toBe(true);
    expect(tecla('Tab', { shiftKey: true }).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  it('al cerrar, el foco vuelve a quien la abrió', async () => {
    const { fixture, servicio, opener } = await abrir();
    servicio.close();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(opener);
  });

  it('el comando resaltado por las flechas se anuncia en una región aria-live', async () => {
    const { fixture, raiz } = await abrir();
    const anuncio = raiz.querySelector('[aria-live]')!;
    expect(anuncio.textContent).toContain('Agentes');
    tecla('ArrowDown');
    fixture.detectChanges();
    expect(anuncio.textContent).toContain('Horarios');
  });
});

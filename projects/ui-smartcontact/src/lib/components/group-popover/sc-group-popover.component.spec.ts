/*
 * LA CIFRA ENSEÑA SUS NOMBRES EN UN TOOLTIP, NO EN UN GLOBO PROPIO.
 *
 * El diseño pasó de `<p-popover>` al tooltip del DS en todos los listados (revisión de diseño, 2026-10-22): un nombre por
 * línea al pasar o al enfocar, y, como un tooltip no se desplaza, «y N más» pasados quince. Estas pruebas fijan que no
 * queda ningún popover en la celda, que el tooltip lista los nombres tal cual y que el lector sigue oyéndolos todos.
 */
import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { ScGroupPopoverComponent } from './sc-group-popover.component';

const grupos = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Grupo ${i + 1}`, active: true }));

async function montar(groups: readonly { id: number; name: string; active: boolean }[], entradas: Record<string, unknown> = {}) {
  TestBed.inject(TranslateService).use('es');
  const fixture = TestBed.createComponent(ScGroupPopoverComponent);
  fixture.componentRef.setInput('groups', groups);
  for (const [nombre, valor] of Object.entries(entradas)) fixture.componentRef.setInput(nombre, valor);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  return { fixture, host, boton: host.querySelector('button') as HTMLButtonElement | null };
}

/** El texto del tooltip abierto: pasa el ratón por la cifra y lee lo que PrimeNG pinta en el documento. */
async function textoDelTooltip(boton: HTMLButtonElement): Promise<string> {
  boton.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 50));
  return document.querySelector('.p-tooltip .p-tooltip-text')?.textContent ?? '';
}

describe('sc-group-popover · tooltip con los nombres', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TranslateModule.forRoot()] }));

  it('con varios, la cifra enseña sus nombres, uno por línea, en un tooltip y no en un popover', async () => {
    const { host, boton } = await montar(grupos(3));
    expect(boton?.textContent?.trim()).toBe('3');
    expect(host.querySelector('p-popover')).toBeNull();
    expect(await textoDelTooltip(boton!)).toBe('Grupo 1\nGrupo 2\nGrupo 3');
  });

  it('pasados quince nombres, el tooltip enseña quince y dice «y N más»', async () => {
    const { boton } = await montar(grupos(20));
    const lineas = (await textoDelTooltip(boton!)).split('\n');
    expect(lineas).toHaveLength(16);
    expect(lineas[14]).toBe('Grupo 15');
    expect(lineas[15]).toBe('y 5 más');
  });

  it('el lector oye todos los nombres, también los que el tooltip recorta', async () => {
    const { host, boton } = await montar(grupos(20));
    const descripcion = host.querySelector(`#${boton!.getAttribute('aria-describedby')}`);
    expect(descripcion?.textContent).toContain('Grupo 20');
  });

  it('pulsar la cifra emite `activated`', async () => {
    const { fixture, boton } = await montar(grupos(2));
    let veces = 0;
    fixture.componentInstance.activated.subscribe(() => veces++);
    boton!.click();
    expect(veces).toBe(1);
  });

  it('con `adaptive`: ninguno es «—» sin botón, y uno es su nombre sin tooltip de lista', async () => {
    const ninguno = await montar([], { display: 'adaptive' });
    expect(ninguno.boton).toBeNull();
    expect(ninguno.host.querySelector('.group-popover__empty')?.textContent).toBe('—');
    const uno = await montar(grupos(1), { display: 'adaptive' });
    expect(uno.boton).toBeNull();
    expect(uno.host.querySelector('.group-popover__name')?.textContent?.trim()).toBe('Grupo 1');
  });
});

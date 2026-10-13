/*
 * UN BOTÓN QUE ABRE UN POPUP LO DICE DESDE EL FOCO, NO DESDE EL HOST.
 *
 * `sc-button` envuelve `<p-button>`, que a su vez envuelve un `<button>` real: el foco y lo que
 * anuncia el lector de pantalla van ahí. Quien ponía `[attr.aria-haspopup]`/`[attr.aria-expanded]`
 * en `<sc-button>` (la lista de «Columnas», el ⋮ del widget) escribía esos atributos en un elemento
 * que nunca recibe el foco: el lector no decía que el botón abre nada, ni si ya está abierto. Estas
 * pruebas fijan que `ariaHasPopup`, `ariaExpanded` y `ariaControls` llegan al `<button>` interno y
 * que ninguno dejan un atributo vacío cuando no se fijan.
 */
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ScButtonComponent } from './sc-button.component';

async function montar(entradas: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(ScButtonComponent);
  for (const [nombre, valor] of Object.entries(entradas)) {
    fixture.componentRef.setInput(nombre, valor);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const boton = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
  return { fixture, boton };
}

describe('sc-button · aria-haspopup, aria-expanded y aria-controls en el botón real', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('las tres llegan al <button> interno, no al host <sc-button>', async () => {
    const { fixture, boton } = await montar({
      label: 'Columnas',
      ariaHasPopup: 'dialog',
      ariaExpanded: true,
      ariaControls: 'columnas-panel',
    });
    expect(boton.getAttribute('aria-haspopup')).toBe('dialog');
    expect(boton.getAttribute('aria-expanded')).toBe('true');
    expect(boton.getAttribute('aria-controls')).toBe('columnas-panel');
    expect((fixture.nativeElement as HTMLElement).hasAttribute('aria-haspopup')).toBe(false);
  });

  it('ariaExpanded en false se anuncia como cerrado, no se omite', async () => {
    const { boton } = await montar({ label: 'Columnas', ariaHasPopup: 'menu', ariaExpanded: false });
    expect(boton.getAttribute('aria-expanded')).toBe('false');
  });

  it('sin fijar ninguna, el botón no lleva ninguno de los tres atributos', async () => {
    const { boton } = await montar({ label: 'Guardar' });
    expect(boton.hasAttribute('aria-haspopup')).toBe(false);
    expect(boton.hasAttribute('aria-expanded')).toBe(false);
    expect(boton.hasAttribute('aria-controls')).toBe(false);
  });
});

describe('sc-button · iconOnly, la propiedad «Icon Only» del Kit', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('no pinta el rótulo y lo da como nombre accesible', async () => {
    const { boton } = await montar({ label: 'Nueva agenda', icon: 'add', iconOnly: true });
    expect(boton.classList.contains('p-button-icon-only')).toBe(true);
    expect(boton.querySelector('.p-button-label')?.textContent?.trim() ?? '').toBe('');
    expect(boton.getAttribute('aria-label')).toBe('Nueva agenda');
  });

  it('sin iconOnly, el rótulo se pinta y no hace falta nombre aparte', async () => {
    const { boton } = await montar({ label: 'Nueva agenda', icon: 'add' });
    expect(boton.classList.contains('p-button-icon-only')).toBe(false);
    expect(boton.textContent).toContain('Nueva agenda');
  });
});

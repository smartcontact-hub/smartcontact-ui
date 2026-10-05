/*
 * UN SOLO ÍNDICE, Y QUE FUNCIONE DE UNA SOLA FORMA (DD-122).
 *
 * Cada fila es un ENLACE a su sitio: una ruta (Contact Center) o la misma página con `?seccion=`
 * (fichas y constructor de reglas). Hasta el 2026-09-27 cada fila era `<a href="#" role="tab">`, el
 * clic se tragaba siempre y la fila no llevaba a ninguna parte: Cmd+clic abría la misma página con
 * `#`, Atrás no volvía a la sección anterior y el lector de pantalla oía «pestaña» sin lista de
 * pestañas. Estas pruebas fijan el contrato que comparten las cinco pantallas:
 *   · la fila lleva la URL que le da quien la pinta, y la actual se anuncia como la página actual;
 *   · un clic principal sin teclas lo resuelve la página (que decide si puede irse, como el alta de
 *     grupo con General), y cualquier otro gesto de enlace —otra pestaña, otra ventana— lo hace el
 *     navegador, la misma regla que `routerLink`;
 *   · el rótulo visible de encima, si lo hay, es el nombre del índice;
 *   · una sección con cambios sin guardar se marca, distinto del punto rojo de lo que falta, y los
 *     dos estados se oyen;
 *   · en un alta, la sección que se deja completa lleva ✓, que se oye y entra con movimiento solo si
 *     llega después de pintar el índice (DD-143);
 *   · el icono de cada fila pesa lo que su rótulo (DD-130 §6, figma-pendiente §29).
 */
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { FormNavSection, ScFormSectionNavComponent } from './sc-form-section-nav.component';

const SECCIONES: readonly FormNavSection[] = [
  { id: 'general', labelKey: 'General', icon: 'tune', href: '/ficha/1' },
  { id: 'distribucion', labelKey: 'Distribución', icon: 'alt_route', href: '/ficha/1?seccion=distribucion' },
  { id: 'agentes', labelKey: 'Agentes', href: '/ficha/1?seccion=agentes' },
];

@Component({
  standalone: true,
  imports: [ScFormSectionNavComponent],
  template: `<sc-form-section-nav
    [sections]="secciones()"
    [activeId]="activa()"
    [titleKey]="titulo()"
    [sectionsWithErrors]="errores()"
    [sectionsWithChanges]="cambios()"
    [sectionsDone]="hechas()"
    [flush]="plana()"
    (activeChange)="elegidas.push($event)"
  />`,
})
class Host {
  readonly secciones = signal<readonly FormNavSection[]>(SECCIONES);
  readonly activa = signal<string | null>('general');
  readonly titulo = signal<string | null>(null);
  readonly errores = signal<ReadonlySet<string>>(new Set());
  readonly cambios = signal<ReadonlySet<string>>(new Set());
  readonly hechas = signal<ReadonlySet<string>>(new Set());
  readonly plana = signal(true);
  readonly elegidas: string[] = [];
}

function montar(ajustes: (host: Host) => void = () => undefined) {
  const fixture = TestBed.createComponent(Host);
  ajustes(fixture.componentInstance);
  fixture.detectChanges();
  const raiz = fixture.nativeElement as HTMLElement;
  const filas = [...raiz.querySelectorAll<HTMLAnchorElement>('a.form-nav__item')];
  return { fixture, raiz, filas, host: fixture.componentInstance };
}

/** Un clic como el del navegador: cancelable, para leer si alguien lo detuvo. */
function clicar(fila: HTMLElement, gesto: MouseEventInit = {}): MouseEvent {
  const evento = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...gesto });
  fila.dispatchEvent(evento);
  return evento;
}

describe('sc-form-section-nav · cada fila es un enlace a su sitio', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
  });

  it('la fila lleva la URL que le da la página', () => {
    const { filas } = montar();
    expect(filas.map((a) => a.getAttribute('href'))).toEqual([
      '/ficha/1',
      '/ficha/1?seccion=distribucion',
      '/ficha/1?seccion=agentes',
    ]);
  });

  it('sin URL, la fila sigue siendo un enlace de la misma página (compatibilidad)', () => {
    const { filas } = montar((h) => h.secciones.set([{ id: 'a', labelKey: 'A' }]));
    expect(filas[0]?.getAttribute('href')).toBe('#');
  });

  it('no es una lista de pestañas: ninguna fila dice ser pestaña', () => {
    const { raiz } = montar();
    expect(raiz.querySelectorAll('[role="tab"], [role="tablist"]').length).toBe(0);
  });

  it('la sección a la vista se anuncia como la página actual, y solo ella', () => {
    const { filas } = montar((h) => h.activa.set('distribucion'));
    expect(filas.map((a) => a.getAttribute('aria-current'))).toEqual([null, 'page', null]);
  });
});

describe('sc-form-section-nav · el clic lo decide la página; los gestos de enlace, el navegador', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
  });

  it('un clic principal sin teclas no navega solo: avisa a la página con el id', () => {
    const { filas, host } = montar();
    const evento = clicar(filas[1]!);
    expect(evento.defaultPrevented).toBe(true);
    expect(host.elegidas).toEqual(['distribucion']);
  });

  for (const [gesto, init] of [
    ['Cmd+clic', { metaKey: true }],
    ['Ctrl+clic', { ctrlKey: true }],
    ['Mayús+clic', { shiftKey: true }],
    ['Alt+clic', { altKey: true }],
    ['clic central', { button: 1 }],
  ] as const) {
    it(`${gesto} lo hace el navegador (otra pestaña, otra ventana): ni se detiene ni se avisa`, () => {
      const { filas, host } = montar();
      const evento = clicar(filas[2]!, init);
      expect(evento.defaultPrevented).toBe(false);
      expect(host.elegidas).toEqual([]);
    });
  }

  it('sin URL, un Cmd+clic tampoco abre la misma página en otra pestaña', () => {
    const { filas, host } = montar((h) => h.secciones.set([{ id: 'a', labelKey: 'A' }]));
    const evento = clicar(filas[0]!, { metaKey: true });
    expect(evento.defaultPrevented).toBe(true);
    expect(host.elegidas).toEqual(['a']);
  });
});

describe('sc-form-section-nav · el rótulo de encima nombra el índice', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
  });

  it('con `titleKey`, el rótulo se ve y es el nombre del índice', () => {
    const { raiz } = montar((h) => h.titulo.set('Contact Center'));
    const nav = raiz.querySelector('nav')!;
    const idRotulo = nav.getAttribute('aria-labelledby');
    expect(idRotulo).toBeTruthy();
    expect(raiz.querySelector(`#${idRotulo}`)?.textContent?.trim()).toBe('Contact Center');
    expect(nav.hasAttribute('aria-label')).toBe(false);
    // Un rótulo, no un título: la página tiene un solo h1 y el índice no le disputa la jerarquía.
    expect(raiz.querySelectorAll('h1, h2, h3, h4, h5, h6').length).toBe(0);
  });

  it('sin `titleKey`, no pinta rótulo y el nombre sale de `labelKey`', () => {
    const { raiz } = montar();
    const nav = raiz.querySelector('nav')!;
    expect(raiz.querySelector('.form-nav__title')).toBeNull();
    expect(nav.hasAttribute('aria-labelledby')).toBe(false);
    expect(nav.getAttribute('aria-label')).toBeTruthy();
  });
});

describe('sc-form-section-nav · lo que está sin guardar y lo que falta se ven y se oyen', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
  });

  it('una sección con cambios sin guardar lleva su marca, que no es la de error', () => {
    const { filas } = montar((h) => h.cambios.set(new Set(['distribucion'])));
    expect(filas.map((a) => a.classList.contains('form-nav__item--has-changes'))).toEqual([false, true, false]);
    expect(filas[1]!.querySelector('.form-nav__dot--changes')).not.toBeNull();
    expect(filas[1]!.querySelector('.form-nav__dot:not(.form-nav__dot--changes)')).toBeNull();
  });

  it('las dos marcas se oyen como texto del enlace, no como un aria-label en un span sin rol', () => {
    const { filas } = montar((h) => {
      h.errores.set(new Set(['general']));
      h.cambios.set(new Set(['distribucion']));
    });
    const oculto = (a: HTMLElement) => a.querySelector('.form-nav__sr')?.textContent?.trim() ?? '';
    expect(oculto(filas[0]!)).toBe('sc.formSectionNav.sectionHasErrors');
    expect(oculto(filas[1]!)).toBe('sc.formSectionNav.sectionHasChanges');
    expect(oculto(filas[2]!)).toBe('');
    expect(filas.some((a) => a.querySelector('span[aria-label]'))).toBe(false);
  });

  it('con las dos a la vez se ve el punto de lo que falta, que es lo que no deja guardar, y se oyen las dos', () => {
    const { filas } = montar((h) => {
      h.errores.set(new Set(['general']));
      h.cambios.set(new Set(['general']));
    });
    const puntos = [...filas[0]!.querySelectorAll('.form-nav__dot')];
    expect(puntos.map((p) => p.classList.contains('form-nav__dot--changes'))).toEqual([false]);
    expect(filas[0]!.querySelectorAll('.form-nav__sr').length).toBe(2);
  });
});

describe('sc-form-section-nav · la sección que se deja completa lleva ✓ (DD-143)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
  });

  const oculto = (a: HTMLElement) => [...a.querySelectorAll('.form-nav__sr')].map((s) => s.textContent?.trim());

  it('lleva ✓ y se oye como texto del enlace; las demás, no', () => {
    const { filas } = montar((h) => h.hechas.set(new Set(['general'])));
    expect(filas.map((a) => a.querySelector('.form-nav__done') !== null)).toEqual([true, false, false]);
    expect(oculto(filas[0]!)).toEqual(['sc.formSectionNav.sectionDone']);
    expect(oculto(filas[1]!)).toEqual([]);
    // El ✓ es un dibujo: lo que dice, lo dice el texto oculto.
    expect(filas[0]!.querySelector('.form-nav__done')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('lo que falta y los cambios ganan al ✓: se ve un solo marcador, y se oyen todos', () => {
    const { filas } = montar((h) => {
      h.hechas.set(new Set(['general', 'distribucion']));
      h.errores.set(new Set(['general']));
      h.cambios.set(new Set(['distribucion']));
    });
    expect(filas[0]!.querySelector('.form-nav__done')).toBeNull();
    expect(filas[0]!.querySelector('.form-nav__dot:not(.form-nav__dot--changes)')).not.toBeNull();
    expect(filas[1]!.querySelector('.form-nav__done')).toBeNull();
    expect(filas[1]!.querySelector('.form-nav__dot--changes')).not.toBeNull();
    expect(oculto(filas[0]!)).toEqual(['sc.formSectionNav.sectionHasErrors', 'sc.formSectionNav.sectionDone']);
  });

  it('el ✓ que ya estaba al pintar el índice no entra con movimiento; el que llega después, sí', () => {
    const { fixture, raiz, host } = montar((h) => h.hechas.set(new Set(['general'])));
    host.hechas.set(new Set(['general', 'distribucion']));
    fixture.detectChanges();
    const filas = [...raiz.querySelectorAll<HTMLAnchorElement>('a.form-nav__item')];
    expect(filas[0]!.querySelector('.form-nav__done')?.classList.contains('form-nav__done--entra')).toBe(false);
    expect(filas[1]!.querySelector('.form-nav__done')?.classList.contains('form-nav__done--entra')).toBe(true);
  });
});

describe('sc-form-section-nav · el icono de cada fila pesa lo que su rótulo (DD-130 §6)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
  });

  /** El peso del glifo de cada fila, de la clase que pone `sc-icon` (`sc-icon--weight-N`); `null` sin icono. */
  const pesos = (filas: HTMLElement[]) =>
    filas.map((a) => {
      const clase = [...(a.querySelector('.form-nav__icon .sc-icon')?.classList ?? [])].find((c) => c.startsWith('sc-icon--weight-'));
      return clase ? Number(clase.slice('sc-icon--weight-'.length)) : null;
    });

  it('en el índice plano, el de todo el Supervisor, la fila activa a 600 y las demás a 400, como su rótulo y su ✓', () => {
    const { filas } = montar();
    expect(pesos(filas)).toEqual([600, 400, null]);
  });

  it('en el de por defecto, todas a 500: su rótulo va en medium, activa o no', () => {
    const { filas } = montar((h) => h.plana.set(false));
    expect(pesos(filas)).toEqual([500, 500, null]);
  });

  it('el ✓ de la sección hecha pesa lo mismo que el icono de su fila, en las dos variantes', () => {
    const delCheck = (filas: HTMLElement[]) =>
      filas.map((a) => {
        const clase = [...(a.querySelector('.form-nav__done .sc-icon')?.classList ?? [])].find((c) => c.startsWith('sc-icon--weight-'));
        return clase ? Number(clase.slice('sc-icon--weight-'.length)) : null;
      });
    const plano = montar((h) => h.hechas.set(new Set(['general', 'distribucion'])));
    expect(delCheck(plano.filas)).toEqual([600, 400, null]);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    const porDefecto = montar((h) => {
      h.plana.set(false);
      h.hechas.set(new Set(['general', 'distribucion']));
    });
    expect(delCheck(porDefecto.filas)).toEqual([500, 500, null]);
  });
});

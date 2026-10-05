/*
 * EL ICONO DEL TÍTULO PESA LO QUE EL TÍTULO (DD-130 §6, figma-pendiente §29). El título de una subsección va en
 * semibold, así que su icono va a 600, como el de `sc-section-card`. En las dos cabeceras: la fija y la plegable. El
 * chevron de la plegable no acompaña al título: es el mando de plegar, y sigue a 400.
 */
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { ScSubsectionComponent } from './sc-subsection.component';

@Component({
  standalone: true,
  imports: [ScSubsectionComponent],
  template: `<sc-subsection titleKey="Horarios" icon="schedule" [collapsible]="plegable()">Contenido</sc-subsection>`,
})
class Host {
  readonly plegable = signal(false);
}

/** El peso de un glifo, de la clase que pone `sc-icon` (`sc-icon--weight-N`). */
const peso = (glifo: Element | null): number | null => {
  const clase = [...(glifo?.classList ?? [])].find((c) => c.startsWith('sc-icon--weight-'));
  return clase ? Number(clase.slice('sc-icon--weight-'.length)) : null;
};

describe('sc-subsection · el icono del título pesa lo que el título', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
  });

  for (const plegable of [false, true]) {
    it(`cabecera ${plegable ? 'plegable' : 'fija'}: el icono del título a 600, como su texto en semibold`, () => {
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.plegable.set(plegable);
      fixture.detectChanges();
      const raiz = fixture.nativeElement as HTMLElement;
      expect(peso(raiz.querySelector('.sc-subsection__icon .sc-icon'))).toBe(600);
      if (plegable) expect(peso(raiz.querySelector('.sc-subsection__chevron .sc-icon'))).toBe(400);
    });
  }
});

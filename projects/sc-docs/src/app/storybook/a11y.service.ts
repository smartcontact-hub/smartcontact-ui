import { Injectable } from '@angular/core';

import { OPCIONES_AXE, localeEs, resumirViolaciones, type ViolacionA11y } from './a11y.core.mjs';

type Axe = typeof import('axe-core');
type OpcionesAxe = import('axe-core').RunOptions;
type LocaleAxe = import('axe-core').Locale;

/**
 * El elemento de un fallo como se lee en la anatomía (`button.p-button.p-button-danger`): el selector de axe es único
 * pero ilegible (`button[pc1116=""]`). Se sigue guardando, porque es el que encuentra el nodo para señalarlo.
 */
function describir(raiz: Element, selector: string): string {
  let el: Element | null = null;
  try {
    el = raiz.ownerDocument.querySelector(selector);
  } catch {
    return selector;
  }
  if (!el) return selector;
  const clases = [...el.classList].filter((c) => /^(p-|sc-)/.test(c)).slice(0, 3);
  return el.tagName.toLowerCase() + clases.map((c) => `.${c}`).join('');
}

/**
 * Pasa axe por el lienzo de una story y devuelve sus fallos de accesibilidad, en castellano.
 *
 * axe pesa (~550 kB): se pide la PRIMERA vez que un lienzo lo necesita, en su propio trozo del build, así que quien
 * abre sc-docs sin bajar a una ficha no lo descarga. Y axe no admite dos pasadas a la vez («Axe is already running»):
 * con diez lienzos por página, las pasadas van en COLA, una detrás de otra.
 */
@Injectable({ providedIn: 'root' })
export class A11yService {
  private axe: Promise<Axe> | null = null;
  private cola: Promise<unknown> = Promise.resolve();

  /** Revisa `raiz` y lo que tiene dentro. Rechaza solo si axe no carga; un fallo de una pasada da lista vacía. */
  revisar(raiz: Element): Promise<readonly ViolacionA11y[]> {
    const pasada = this.cola.then(async () => {
      const axe = await this.cargar();
      if (!raiz.isConnected) return [];
      const res = await axe.run(raiz, OPCIONES_AXE as unknown as OpcionesAxe);
      return resumirViolaciones(res.violations).map((v) => ({
        ...v,
        nodos: v.nodos.map((n) => ({ ...n, elemento: describir(raiz, n.selector) })),
      }));
    });
    // La cola sigue aunque una pasada falle: un lienzo que se destruye a mitad no bloquea a los demás.
    this.cola = pasada.catch(() => undefined);
    return pasada;
  }

  private cargar(): Promise<Axe> {
    this.axe ??= Promise.all([import('axe-core'), import('axe-core/locales/es.json')]).then(([m, es]) => {
      const axe = ((m as { default?: Axe }).default ?? m) as Axe;
      // El JSON de la traducción no cuadra al milímetro con el tipo `Locale` (un check sin `fail`): es el de axe, vale.
      axe.configure({ locale: localeEs(es.default ?? es) as unknown as LocaleAxe });
      return axe;
    });
    return this.axe;
  }
}

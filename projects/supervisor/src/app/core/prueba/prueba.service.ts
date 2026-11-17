import { computed, DestroyRef, DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import {
  guardarSesion,
  type PasoEnCurso,
  type ResultadoDePaso,
  sesionGuardada,
  type SesionDePrueba,
} from './prueba-arranque';
import { ganchosDePrueba } from './prueba-ganchos';
import { codificar } from './prueba-enlace.core.mjs';

/** Lo que es un control: si el clic cae dentro de uno de estos (o de algo con cursor de mano), no es «en vacío». */
const INTERACTIVO =
  'a[href], button, input, select, textarea, label, summary, [contenteditable="true"], [tabindex]:not([tabindex="-1"]), ' +
  '[role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], [role="checkbox"], [role="radio"], ' +
  '[role="switch"], [role="gridcell"], [role="row"], [role="treeitem"], [role="slider"], [role="combobox"]';

/** Cuántos clics en vacío se guardan como mucho: para ver dónde, no para contarlos todos. */
const MAX_EN_VACIO = 20;

/**
 * El control que recibe el clic: un control de verdad entre el elemento y sus cinco padres; si no, el más alto de los que
 * llevan cursor de mano seguidos (el cursor se hereda: la cifra de una tarjeta pulsable lo tiene, pero la que lo pone y
 * se pulsa es la tarjeta).
 */
function controlDe(el: Element): Element | null {
  for (let n: Element | null = el, i = 0; n && i < 6; n = n.parentElement, i++) if (n.matches(INTERACTIVO)) return n;
  let mano: Element | null = null;
  for (let n: Element | null = el, i = 0; n && i < 6; n = n.parentElement, i++) {
    if (getComputedStyle(n).cursor === 'pointer') mano = n;
    else if (mano) break;
  }
  return mano;
}

/**
 * Lo que se pulsó, corto. Un control, por el nombre que oiría un lector de pantalla o su texto. Fuera de un control, por
 * el texto que tiene el propio elemento (un título o una descripción que parecían pulsables), no el de todo lo que
 * cuelga de él: un clic en el hueco de una rejilla no es «todas sus tarjetas». Si no tiene texto, es espacio vacío.
 */
function describir(el: Element, control: Element | null): string {
  const texto = control
    ? (control.getAttribute('aria-label') ?? control.getAttribute('title') ?? (control as HTMLElement).innerText ?? '')
    : Array.from(el.childNodes, (n) => (n.nodeType === Node.TEXT_NODE ? (n.textContent ?? '') : '')).join(' ');
  const corto = texto.replace(/\s+/g, ' ').trim().slice(0, 48);
  return corto || (control ? control.tagName.toLowerCase() : 'espacio vacío');
}

const rutaDe = (url: string): string => url.split(/[?#]/)[0] || '/';

const PASO_NUEVO: PasoEnCurso = {
  fase: 'leer',
  inicio: 0,
  ms: 0,
  clics: 0,
  primerClic: null,
  enVacio: [],
  pantallas: [],
  ayudas: [],
  comprobacion: null,
};

/**
 * EL MODO PRUEBA EN MARCHA (DD-256). Lee la sesión de la pestaña, mide el paso en curso y, al acabarlo, salta al
 * siguiente (otra versión, que puede ser otra rama) o vuelve a sc-docs con el resultado.
 *
 * Mide sin que la persona lo vea: ni reloj ni contadores en pantalla, porque verlos mete prisa y cambia cómo trabaja.
 * Los clics sobre la propia capa (`data-prueba`) no cuentan.
 */
@Injectable({ providedIn: 'root' })
export class PruebaService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  readonly sesion = signal<SesionDePrueba | null>(sesionGuardada());
  readonly paso = computed(() => {
    const s = this.sesion();
    return s ? (s.pasos[s.paso] ?? null) : null;
  });
  readonly actual = computed<PasoEnCurso>(() => this.sesion()?.actual ?? PASO_NUEVO);
  readonly numero = computed(() => (this.sesion()?.paso ?? 0) + 1);
  readonly total = computed(() => this.sesion()?.pasos.length ?? 0);
  readonly ultimo = computed(() => this.numero() === this.total());
  /** ¿Corrige sola la rama? Si no, quien modera marca si salió bien. */
  readonly corrigeSola = computed(() => this.actual().comprobacion !== null);

  constructor() {
    effect(() => {
      const s = this.sesion();
      if (s) guardarSesion(s);
    });

    const alPulsar = (ev: MouseEvent): void => {
      if (this.actual().fase !== 'trabajando') return;
      const t = ev.target instanceof Element ? ev.target : null;
      if (!t || t.closest('[data-prueba]')) return;
      const control = controlDe(t);
      const donde = `${describir(t, control)}, en ${rutaDe(this.router.url)}`;
      this.cambiar((a) => ({
        ...a,
        clics: a.clics + 1,
        primerClic: a.primerClic ?? donde,
        enVacio: control || a.enVacio.length >= MAX_EN_VACIO ? a.enVacio : [...a.enVacio, donde],
      }));
    };
    this.document.addEventListener('click', alPulsar, true);

    const nav = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      if (this.actual().fase !== 'trabajando') return;
      const ruta = rutaDe(e.urlAfterRedirects);
      this.cambiar((a) => (a.pantallas.at(-1) === ruta ? a : { ...a, pantallas: [...a.pantallas, ruta] }));
    });

    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('click', alPulsar, true);
      nav.unsubscribe();
    });
  }

  /** La persona ha leído la tarea: los datos vuelven a como empieza la misión y empieza a contar. */
  empezar(): void {
    const paso = this.paso();
    if (!paso) return;
    ganchosDePrueba().reiniciar?.(paso.mision);
    this.cambiar(() => ({ ...PASO_NUEVO, fase: 'trabajando', inicio: Date.now(), pantallas: [rutaDe(this.router.url)] }));
  }

  pedirAyuda(): void {
    this.cambiar((a) => ({ ...a, ayudas: [...a.ayudas, { ms: Date.now() - a.inicio, pantalla: rutaDe(this.router.url) }] }));
  }

  /** Para el tiempo y corrige, si la rama sabe corregir. Luego, la pregunta de facilidad. */
  terminar(): void {
    const paso = this.paso();
    if (!paso) return;
    const comprobacion = ganchosDePrueba().comprobar?.(paso.mision) ?? null;
    this.cambiar((a) => ({ ...a, fase: 'valorar', ms: Date.now() - a.inicio, comprobacion }));
  }

  /** «He terminado» pulsado antes de tiempo: vuelve a la tarea y el tiempo sigue desde donde iba. */
  volverATrabajar(): void {
    this.cambiar((a) => ({ ...a, fase: 'trabajando', ms: 0, comprobacion: null }));
  }

  /** Cierra el paso con su valoración y pasa al siguiente, o vuelve a sc-docs con todo. */
  siguiente(facilidad: number, moderador: ResultadoDePaso['moderador']): void {
    const s = this.sesion();
    const paso = this.paso();
    if (!s || !paso) return;
    const a = this.actual();
    const hecho: ResultadoDePaso = {
      version: paso.version,
      mision: paso.mision,
      ms: a.ms,
      clics: a.clics,
      primerClic: a.primerClic,
      enVacio: a.enVacio,
      pantallas: a.pantallas,
      ayudas: a.ayudas,
      comprobacion: a.comprobacion,
      moderador: a.comprobacion ? null : moderador,
      facilidad,
    };
    const despues: SesionDePrueba = { ...s, paso: s.paso + 1, resultados: [...s.resultados, hecho], actual: null };
    const proximo = despues.pasos[despues.paso];

    if (!proximo) {
      const resultado = {
        v: 1,
        prueba: s.prueba,
        participante: s.participante,
        orden: s.orden,
        pasos: despues.resultados,
      };
      this.salir(`${s.fin}?r=${codificar(resultado)}`);
      return;
    }

    const destino = new URL(proximo.url, window.location.href);
    if (destino.origin === window.location.origin) {
      // La misma rama: la sesión sigue en la pestaña y se recarga para empezar limpio.
      this.sesion.set(despues);
      guardarSesion(despues);
      window.location.assign(destino.toString());
    } else {
      // Otra rama: la sesión viaja en el enlace, que es lo único que cruza de un sitio a otro.
      this.salir(`${destino.toString()}#prueba=${codificar(despues)}`);
    }
  }

  /** Deja la prueba sin guardar nada: para quien modera, si algo se torció. */
  abandonar(): void {
    this.salir(window.location.pathname);
  }

  private salir(url: string): void {
    this.sesion.set(null);
    guardarSesion(null);
    window.location.assign(url);
  }

  private cambiar(f: (a: PasoEnCurso) => PasoEnCurso): void {
    this.sesion.update((s) => (s ? { ...s, actual: f(s.actual ?? PASO_NUEVO) } : s));
  }
}

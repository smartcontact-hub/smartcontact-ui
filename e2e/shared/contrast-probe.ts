/**
 * Sonda de contraste COMPARTIDA por las dos redes que miden color.
 *
 * Vivía dentro de `e2e/supervisor/theme-contrast.spec.ts` y se sacó aquí el
 * 2026-08-24 al montar la red de severidades, por un motivo concreto: cada
 * comentario de `medir()` es una trampa que ya mordió una vez —el canvas en vez
 * de un regex, la raíz en `body` y no en `main`, la opacidad heredada, las
 * ligaduras de Material Symbols como gráficos a 3:1—. Duplicar la función
 * habría duplicado también el momento en que una copia se afila y la otra no.
 *
 * Se ejecuta DENTRO del navegador vía `page.evaluate`, así que su cuerpo tiene
 * que ser autosuficiente: nada de cerrar sobre imports del módulo. El color (el
 * canvas, la composición de capas, la luminancia y el ratio) le llega en `kit`,
 * desde `./color`, el mismo que usa cualquier otra medición de color.
 */

import { enNavegador } from './color';

/** Umbral de luminancia por encima del cual una superficie es "clara". El
 *  lienzo oscuro más claro del tema (`--sc-bg-surface`, slate-900) mide 0.02,
 *  así que 0.5 deja muchísimo margen: solo salta lo que de verdad es claro. */
export const L_CLARO = 0.5;

/** Recorre `body` en el navegador y devuelve las superficies problemáticas.
 *  (Decía `main`: era el alcance viejo, y ampliarlo a `body` fue el arreglo de
 *  un agujero — ver el comentario del bucle.) */
export const medir = enNavegador((kit, { umbral, raiz = 'body' }: { umbral: number; raiz?: string }) => {
  const { rgba, sobre, fondo, luminancia, ratioContraste } = kit;
  /** ¿Lo ve el usuario? Mira TODA la cadena, no solo el elemento (ver el
   *  comentario del bucle). `display:none` ya lo filtra el rect a cero. */
  const invisiblePorCadena = (el: Element): boolean => {
    for (let n: Element | null = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || cs.opacity === '0') return true;
    }
    return false;
  };

  const claras: string[] = [];
  const ilegibles: string[] = [];

  /* LA RAÍZ ES `body`, Y ESO ES EL ARREGLO DE UN AGUJERO, no una ampliación
   * cosmética. Durante meses fue `main#main-content`, que es SOLO la vista
   * enrutada: en `app-shell.component.html` el skip-link, la `sc-sidebar` y la
   * `sc-top-bar` son HERMANOS de `<main>`, así que el marco de la aplicación no
   * lo miraba nadie, en ningún tema. Por ahí pasaron tres defectos a la vez —
   * el CTA primario del top-bar y el skip-link (3,01:1) y los chevrones de la
   * sidebar (2,57:1) — con la lista de perdonados de oscuro VACÍA y la suite en
   * verde, que es la peor combinación posible: parecía comprobado. */
  /* `raiz` acota el barrido, y por defecto es `body` — que es lo correcto para
   * una PANTALLA de aplicación (ver el comentario de arriba: reducirlo a
   * `main` fue un agujero, no una optimización).
   *
   * Se parametrizó el 2026-08-24 para la red de severidades, donde la pregunta
   * es otra: allí se mide una GALERÍA de componentes, y el chrome de sc-docs
   * que la rodea no es el sujeto. Sin acotar, la medición devolvía 84 hallazgos
   * de los que casi ninguno era del DS — y una red que reporta ruido se acaba
   * silenciando, que es justo el fallo que viene a tapar. */
  const ambito = [...document.querySelectorAll(raiz)].flatMap((r) => [
    ...r.querySelectorAll('*'),
  ]);
  for (const el of ambito) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue; // no pinta nada
    const cs = getComputedStyle(el);
    /* `opacity` NO se hereda como valor computado: se aplica al componer. Un
     * `span` dentro de un ancestro a `opacity: 0` computa `1` y, mirando solo al
     * elemento, se cuela como visible. Pasa de verdad: la sidebar colapsada pone
     * `--sidebar-label-opacity: 0` en `sc-icon.nav-item__chevron`, y su `span`
     * interior se medía como si se viera. Ese era el fallo del signo CONTRARIO
     * al de la raíz — falsos positivos — y los dos juntos son cómo una red pasa
     * de herramienta a ruido. Hay que subir por la cadena. */
    if (invisiblePorCadena(el)) continue;
    const id = `${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 44)}`;

    // --- Pregunta 1: superficies. Solo elementos con fondo PROPIO y tamaño.
    const tieneFondo = rgba(cs.backgroundColor)[3] > 0;
    if (tieneFondo && r.width >= 30 && r.height >= 14) {
      const bgSup = fondo(el);
      if (luminancia(bgSup) > umbral) {
        claras.push(`${id} bg=rgb(${bgSup.slice(0, 3)}) L=${luminancia(bgSup).toFixed(2)}`);
        continue; // ya reportado; su texto se juzgará cuando se arregle el fondo
      }
    }

    // --- Pregunta 2: legibilidad. Cualquier elemento con texto PROPIO, TENGA
    // O NO fondo propio. La primera versión exigía fondo propio y por eso se
    // saltaba el caso más común de todos: el texto vive en un `<span>` sin
    // fondo dentro de un contenedor que sí lo tiene. Con ese filtro,
    // `.memory-failed-chip` (rojo oscuro sobre fondo oscuro) pasaba en verde.
    const propio = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim());
    if (!propio) continue;

    // Los controles INACTIVOS están exentos de 1.4.3 por la propia norma. No es
    // una excusa: un botón deshabilitado tiene que parecer deshabilitado.
    if (el.closest('[disabled],[aria-disabled="true"],.is-disabled')) continue;

    // Los iconos de Material Symbols son LIGATURAS: llegan aquí como nodos de
    // texto y el DOM no los distingue de una palabra. Pero son gráficos, así
    // que su umbral es el de 1.4.11 (3:1 no-textual), no el de texto. Medirlos
    // con 4.5 llenaría esto de falsos positivos y la red acabaría silenciada.
    const esIcono =
      el.classList.contains('sc-icon') || /material symbols/i.test(cs.fontFamily);

    const bg = fondo(el);
    const fg = sobre(rgba(cs.color), bg);
    const fs = parseFloat(cs.fontSize);
    const grande = fs >= 24 || (fs >= 18.66 && Number(cs.fontWeight) >= 700);
    const umbralAA = esIcono || grande ? 3 : 4.5;
    const c = ratioContraste(bg, fg);
    if (c < umbralAA) {
      ilegibles.push(
        `${id}${esIcono ? ' [icono 3:1]' : ''} bg=rgb(${bg.slice(0, 3)}) fg=rgb(${fg.slice(0, 3)}) ${c.toFixed(2)}:1 (${fs}px)`,
      );
    }
  }
  return { claras, ilegibles };
});

#!/usr/bin/env node
/**
 * AUDIT · higiene de pantalla — dos reglas de la página «Fundamentos → Patrones»
 * que hasta ahora SOLO vivían en la doc (AGENTS.md §UX de pantalla). Un principio
 * que no tiene gate se pudre: esto lo convierte en un chequeo.
 *
 * Gatea NUEVE cosas. La primera, la segunda, la cuarta, la octava y la novena, como TRINQUETE por conteo (el mismo patrón
 * que `audit:api-era`: la lista solo puede MENGUAR, y muerde en las dos direcciones):
 *
 * 1. EMOJIS EN LA INTERFAZ. Los iconos salen de `<sc-icon>` (Material Symbols); un
 *    emoji suelto rompe ese único idioma visual. Se marcan solo los del PLANO ASTRAL
 *    pictográfico (U+1F000–U+1FAFF) y el selector de presentación emoji (U+FE0F):
 *    ahí viven las caras, banderas, objetos y símbolos "de emoji". Se EXCLUYEN a
 *    propósito las flechas (→ ← ↑ ↓, U+2190–21FF) y los signos BMP (✓ ⚠ ★ ☑…): son
 *    tipografía/estructura, este repo los usa a mansalva en comentarios y logs, y
 *    meterlos daría cientos de falsos positivos. Los comentarios se quitan antes de
 *    mirar (un `🎭 DEMO-ONLY` en una cabecera no es interfaz).
 *
 * 2. IMÁGENES SIN DIMENSIONES. `<img>` / `<iframe>` sin `width`+`height` ni
 *    `aspect-ratio` dejan que el navegador calcule el hueco AL cargar → salto de
 *    layout (CLS). La regla pide reservar el hueco antes: dimensiones explícitas o
 *    `aspect-ratio` (bindings incluidos). CSS/SCSS no cuenta: no reserva alto antes
 *    de que cargue la imagen, que es justo lo que causa el salto.
 *
 * 3. DESPLEGABLES SIN NOMBRE (DD-133), sin trinquete: ninguno. PrimeNG pinta el select
 *    como `<span role="combobox">`, y a uno sin nombre le pone de `aria-label` la opción
 *    elegida: el lector oía «Automático» donde la pantalla dice «Descuelgue de llamadas».
 *    Todo `sc-select` y `sc-multiselect` lleva `label`, `ariaLabelledBy` o `ariaLabel`.
 *    Un `<label for>` vale solo para `sc-multiselect`, cuyo combobox es un `<input>`
 *    (medido el 2026-10-05); el span de `sc-select` no es etiquetable. Un `aria-label`
 *    en el host tampoco vale: no llega al combobox.
 *
 * 4. TOASTS SUELTOS (DD-211 §5, que sustituye a DD-191). El resultado de una acción del usuario
 *    es un toast, pero UNO: lo lanza `ResultadoAccionService.contar`, igual en toda la app. Una
 *    página no llama a `messages.add` por su cuenta; lo que es de un control (copiar, probar una
 *    conexión) va en un mensaje junto a él. Solo en el Supervisor (las réplicas copian su app, DD-35).
 *
 * 5. GUIONES SUELTOS EN UNA PLANTILLA (DD-197), sin trinquete: ninguno. Una celda sin dato es
 *    `<sc-celda-vacia>`: «—» a la vista, oculto al lector, que oye «Sin dato» (o su `texto`). Un «—»
 *    escrito a mano el lector lo lee «guion», que es el motivo de Primer para dejarlas en blanco.
 *    Solo plantillas `.html` del Supervisor; un «—» dentro de un texto del `.ts` no es una celda.
 *
 * 6. AYUDA ENTRE EL RÓTULO Y SU CONTROL (DD-198), sin trinquete: ninguna. La ayuda de un campo va debajo de su
 *    control (`helperText`): rótulo y control son una pieza que se lee de un vistazo, y en una rejilla los controles
 *    quedan a la misma altura. Se marca un `.field__help` escrito justo antes de un control suelto del DS. La única
 *    excepción, una lista que crece, no lleva un control suelto detrás (su ayuda va bajo el título del grupo).
 *
 * 7. UN OBLIGATORIO QUE ACUSA DE PRIMERAS (DD-199), sin trinquete: ninguno. Lo que falta se dice cuando la persona ya
 *    tuvo ocasión de rellenarlo, y eso lo decide `ocasionDeAvisar` (`shared/utils/alta-secciones.ts`). Se marca la
 *    ficha que lo decide por su cuenta: un aviso que se enciende por el MODO (`mode() === 'edit' || …`, que en la
 *    edición acusaba nada más encender «Tipificar llamadas») o que lee `.dejadas()` del alta sin pasar por ella. Solo
 *    `.ts` del Supervisor; `canSave` y el resumen también miran el modo, pero no acusan, y no se marcan.
 *
 * 8. PIEZAS HECHAS A MANO QUE IMITAN A UN NATIVO (sección 6 de `docs/AUDIT-PRIMENG-CATALOGO.md`). Un `role="slider"`,
 *    `role="menuitem"` o `role="radio"` puesto a mano promete el teclado del nativo (flechas, Inicio y Fin, el foco
 *    dentro y de vuelta), y casi nunca lo trae: fue lo que más pesó en el barrido de la sección 7. Se marca cada
 *    elemento que se pone uno de esos roles o `aria-modal`, y el aviso dice qué nativo usar. Un `<p-*>` no: ahí el rol
 *    nombra al nativo. Un `radiogroup` tampoco: alrededor de radios nativos es lo correcto. Mira el Supervisor,
 *    cuscare-ds y la librería del DS (plantillas y `template:` en línea); no las réplicas (DD-35) ni sc-docs.
 *
 * 9. `title` NATIVO (DD-212), sin trinquete: ninguno (desde el 2026-10-19, con Monitor y Conversaciones). Lo que sale al
 *    pasar el ratón va en el tooltip del Kit, el `pTooltip` de PrimeNG, no en el globo del navegador: `showOnEllipsis` si
 *    solo repite un texto cortado y `tooltipEvent="both"` si va en algo que se enfoca. La entrada `title` de un componente
 *    nuestro (`sc-dialog`) no cuenta. Mira el Supervisor y la librería del DS.
 *
 * QUÉ HACER SI SE PONE ROJO:
 *   · «nuevo incumplimiento» → arréglalo (usa `<sc-icon>` en vez del emoji; añade
 *     `width`/`height` o `aspect-ratio` a la imagen). NO lo añadas al trinquete.
 *   · «bajó a N» → enhorabuena, arreglaste uno: actualiza el número en la lista de
 *     abajo (el trinquete avanza).
 *   · «ya está a 0» → quita la entrada del trinquete.
 *   · «desplegable sin nombre» → dale el rótulo que tiene a la vista (`ariaLabelledBy`
 *     con el id de ese rótulo) o, si no tiene, `ariaLabel`.
 *   · «pieza a mano» → el nativo que nombra el aviso, leída antes su documentación entera
 *     (`node tools/primeng-doc.mjs <x>`). Si de verdad no sirve, es una decisión de producto: se anota aquí con su porqué.
 *
 * ES ESTÁTICO y PURO respecto al texto (funciones exportadas → testeable).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { sinComentarios } from './audit-api-era.mjs';

const log = (s = '') => process.stdout.write(s + '\n');
const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

/**
 * Emoji pictográfico: plano astral + selector de presentación emoji. NO flechas ni signos BMP.
 * FE0F va en una alternación (no dentro de `[...]`): es un carácter combinante y meterlo en una
 * clase es ambiguo (regla `no-misleading-character-class`); suelto cuenta la secuencia de emoji.
 */
export const EMOJI_RE = /[\u{1F000}-\u{1FAFF}]|\u{FE0F}/gu;

const sinComentariosHtml = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

/** Cuenta emojis (astral) en el TEXTO RENDERIZABLE de un fichero (sin comentarios). */
export function contarEmojis(texto, esHtml) {
  const limpio = esHtml ? sinComentariosHtml(texto) : sinComentarios(texto);
  const m = limpio.match(EMOJI_RE);
  return m ? m.length : 0;
}

/** Cuenta `<img>`/`<iframe>` sin dimensiones explícitas ni aspect-ratio. */
export function contarImgSinDims(texto) {
  let malas = 0;
  for (const tag of ['img', 'iframe']) {
    const re = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
    let m;
    while ((m = re.exec(texto))) {
      const t = m[0];
      const hasWH = /\bwidth\s*=/.test(t) && /\bheight\s*=/.test(t);
      const hasBind = /\[(?:style\.|attr\.)?width\]/.test(t) && /\[(?:style\.|attr\.)?height\]/.test(t);
      const hasAR = /aspect-ratio/.test(t);
      if (!(hasWH || hasBind || hasAR)) malas++;
    }
  }
  return malas;
}

/**
 * TRINQUETE de emojis (fichero → nº de emojis astral que renderiza HOY). Solo mengua.
 * Todo lo que hay son BANDERAS de idioma; la solución definitiva es un flag SVG
 * (el propio seed de cuscare ya trae `src: 'icons/flags/*.svg'` al lado).
 */
export const EMOJI_PENDIENTES = {
  // Banderas de idioma (regional indicators: cada 🇪🇸 son 2 codepoints). Deuda real:
  // sustituir por flag SVG (el seed de cuscare ya trae `src: 'icons/flags/*.svg'`).
  'projects/cuscare/src/app/data/seed.ts': 20,
  // (Los 2 emoji decorativos que había —⚠️ en un demo y ⏸️ en un modal— ya se
  //  sustituyeron por <sc-icon> / se quitaron; por eso el trinquete bajó a 2 ficheros.
  //  Las 4 banderas de Sistema se fueron el 2026-09-15 al pasar el idioma a `sc-selectbutton`
  //  sin ellas (DD-113): una bandera no es un idioma. Queda 1 fichero.)
};

/** TRINQUETE de imágenes sin dimensiones (fichero → nº). Solo mengua. */
export const IMG_PENDIENTES = {
  'projects/agent/src/app/components/agent-header/agent-header.component.ts': 1,
  'projects/agent/src/app/components/profile-card/profile-card.component.ts': 1,
  'projects/cuscare/src/app/core/layout/app-shell/nav-icon.component.ts': 1,
  'projects/sc-docs/src/app/pages/lab/lab.component.html': 2,
  'projects/sc-docs/src/app/pages/reglas/rules-walkthrough.component.html': 7,
  'projects/sc-docs/src/app/pages/uso/usage-gallery.component.html': 2,
  'projects/supervisor/src/app/core/layout/sidebar/sidebar.component.html': 1,
  'projects/supervisor/src/app/shared/components/illustrated-avatar/illustrated-avatar.component.html': 2,
  'projects/ui-smartcontact/src/lib/components/avatar/sc-avatar.component.ts': 1,
  'projects/ui-smartcontact/src/lib/components/photo-upload/sc-photo-upload.component.html': 2,
};

/** Cambia cada carácter de lo que casa por un espacio, salvo los saltos de línea: las líneas no se mueven. */
const enBlanco = (texto, re) => texto.replace(re, (m) => m.replace(/[^\n]/g, ' '));

/** Fin de una etiqueta: el primer `>` fuera de comillas (un `=>` o un `a > b` dentro de un atributo no la cierran). */
function finDeEtiqueta(texto, desde) {
  let comilla = null;
  for (let i = desde; i < texto.length; i++) {
    const c = texto[i];
    if (comilla) {
      if (c === comilla) comilla = null;
    } else if (c === '"' || c === "'") comilla = c;
    else if (c === '>') return i;
  }
  return texto.length;
}

/** Un atributo que nombra el combobox, con o sin binding. `optionLabel` e `iftaLabel` no lo son. */
const NOMBRA = /(?:^|\s)\[?(?:label|ariaLabel|ariaLabelledBy)\]?\s*=/;
/** El id del control: `inputId="x"` o `[inputId]="'x'"`. */
const ID_DEL_CONTROL = /(?:^|\s)(?:inputId="([^"]+)"|\[inputId\]="'([^']+)'")/;

/**
 * El texto sin sus comentarios y con cada línea en su sitio: en HTML, `<!-- -->`; en TS, además, `//` y `/* *\/`, que
 * es donde la doc cita un `<sc-select>` sin que sea uno.
 */
export function sinComentariosEnSuSitio(texto, esHtml) {
  const limpio = enBlanco(texto, /<!--[\s\S]*?-->/g);
  return esHtml ? limpio : enBlanco(enBlanco(limpio, /\/\*[\s\S]*?\*\//g), /(?<=^|\s)\/\/.*$/gm);
}

/**
 * Los ficheros que pueden lanzar toasts, y cuántos (DD-191, DD-211 §5). La lista solo MENGUA.
 * - `resultado-accion`: el resultado de una acción del usuario, el mismo toast en toda la app (DD-211 §5).
 * - `undo-stack`: el aviso con «Deshacer» de lo que se quita del inicio (un monitor, un widget), que desaparece sin dejar
 *   sitio donde contarlo; el «Deshacer» de un cambio en lote va en su barra (DD-196).
 * - `conversations-page`: transcripciones y análisis en segundo plano, con su progreso y su resultado.
 */
export const TOAST_DEL_SISTEMA = {
  'projects/supervisor/src/app/core/services/resultado-accion.service.ts': 1,
  'projects/supervisor/src/app/core/services/undo-stack.service.ts': 2,
  'projects/supervisor/src/app/features/memory/pages/conversations/conversations-page.component.ts': 7,
};

/** Cuántos toasts lanza un fichero (`messages.add(`), sin contar los comentarios. */
export function contarToasts(texto) {
  return (sinComentarios(texto).match(/\bmessages\.add\(/g) ?? []).length;
}

/** Líneas de una plantilla con un «—» suelto de contenido: `>—<` o un `'—'` de respaldo (`|| '—'`, `?? '—'`, `: '—'`). */
export function guionesSueltos(html) {
  const limpio = sinComentariosEnSuSitio(html, true);
  const lineas = [];
  for (const m of limpio.matchAll(/>\s*—\s*<|(?:\|\||\?\?|:)\s*'—'/g)) {
    lineas.push(limpio.slice(0, m.index).split('\n').length);
  }
  return lineas;
}

/** Los controles sueltos del DS: una fila, con su ayuda debajo. */
const CONTROL_SUELTO = 'sc-(?:selectbutton|select|multiselect|inputtext|inputnumber|textarea|datepicker|password|inputtags)';

/** Líneas de una plantilla con una ayuda (`.field__help`) escrita justo antes de un control suelto (DD-198). */
export function ayudasEncima(html) {
  const limpio = sinComentariosEnSuSitio(html, true);
  // Dentro de la ayuda, nada que cierre su etiqueta: si no, la búsqueda saltaría de una ayuda a la siguiente.
  const re = new RegExp(`<(\\w+)\\b[^>]*class="[^"]*\\bfield__help\\b[^"]*"[^>]*>(?:(?!</\\1>)[\\s\\S])*</\\1>\\s*<${CONTROL_SUELTO}\\b`, 'g');
  return [...limpio.matchAll(re)].map((m) => limpio.slice(0, m.index).split('\n').length);
}

/** El modo de una ficha en una disyunción: `mode() === 'edit' ||`, `|| this.mode() !== 'create'`… */
const MODO_O = /mode\(\)\s*[!=]==\s*'(?:edit|create|duplicate)'\s*\|\||\|\|\s*(?:this\.)?mode\(\)\s*[!=]==/;
/** Lo que delata un aviso: quién acusa, el error, el intento de salir, las secciones dejadas. */
const AVISO = /\bacusa|[eE]rrors?\b|Error\(|attempted|dejadas/;

/** Líneas de un `.ts` que deciden por su cuenta cuándo se dice que falta algo, sin `ocasionDeAvisar` (DD-199). */
export function acusaDePrimeras(texto) {
  const lineas = [];
  sinComentariosEnSuSitio(texto, false)
    .split('\n')
    .forEach((linea, i) => {
      if ((MODO_O.test(linea) && AVISO.test(linea)) || /\.dejadas\(\)/.test(linea)) lineas.push(i + 1);
    });
  return lineas;
}

/** Las etiquetas `<sc-select` y `<sc-multiselect` de un texto ya sin comentarios. */
const DESPLEGABLE = /<sc-(select|multiselect)\b/g;

/** Líneas de los `sc-select` y `sc-multiselect` que no llevan un nombre que llegue a su combobox (DD-133). */
export function desplegablesSinNombre(texto, esHtml) {
  const limpio = sinComentariosEnSuSitio(texto, esHtml);
  const rotulados = new Set();
  for (const m of limpio.matchAll(/<label\b[^>]*?\s(?:for="([^"]+)"|\[(?:attr\.)?for\]="'([^']+)'")/g)) {
    rotulados.add(m[1] ?? m[2]);
  }
  const lineas = [];
  for (const m of limpio.matchAll(DESPLEGABLE)) {
    const etiqueta = limpio.slice(m.index + m[0].length, finDeEtiqueta(limpio, m.index));
    if (NOMBRA.test(etiqueta)) continue;
    const id = etiqueta.match(ID_DEL_CONTROL);
    if (m[1] === 'multiselect' && id && rotulados.has(id[1] ?? id[2])) continue;
    lineas.push(limpio.slice(0, m.index).split('\n').length);
  }
  return lineas;
}

/**
 * Los roles que prometen un teclado que PrimeNG ya trae hecho, y su nativo con la familia de la sección 6 del catálogo.
 * Sin `radiogroup`: alrededor de radios nativos (`sc-radiobutton`, `input type="radio"`) es lo correcto.
 */
export const NATIVO_DEL_ROL = {
  slider: '`p-slider` (6.6)',
  spinbutton: '`sc-inputnumber` (6.6)',
  menu: '`p-menu` o `p-tieredmenu` (6.9)',
  menubar: '`p-menubar` (6.9)',
  menuitem: '`p-menu` o `p-tieredmenu` (6.9)',
  menuitemcheckbox: '`p-menu` o `p-tieredmenu` (6.9)',
  menuitemradio: '`p-menu` o `p-tieredmenu` (6.9)',
  radio: '`sc-selectbutton`, `sc-radiobutton` o `sc-option-cards` (6.1)',
  listbox: '`p-listbox` o `sc-select` (6.1)',
  option: '`p-listbox` o `sc-select` (6.1)',
  combobox: '`sc-select` o `p-autocomplete` (6.1)',
  checkbox: '`sc-checkbox` (6.2)',
  switch: '`sc-toggleswitch` (6.2)',
  tree: '`p-tree` o `p-treeselect` (6.3)',
  treeitem: '`p-tree` o `p-treeselect` (6.3)',
  tablist: '`p-tabs` (6.10)',
  tab: '`p-tabs` (6.10)',
  dialog: '`sc-dialog` o `p-popover` (6.11)',
  alertdialog: '`p-confirmdialog` o `p-confirmpopup` (6.12)',
};

/** Un `.ts` con solo sus `template:` en línea a la vista; lo demás, en blanco y con las líneas en su sitio. */
export function soloPlantillas(ts) {
  let salida = ts.replace(/[^\n]/g, ' ');
  for (const m of ts.matchAll(/\btemplate:\s*`([^`]*)`/g)) {
    const desde = m.index + m[0].indexOf('`') + 1;
    salida = salida.slice(0, desde) + m[1] + salida.slice(desde + m[1].length);
  }
  return salida;
}

/**
 * Las piezas de una plantilla que se ponen a mano un rol de `NATIVO_DEL_ROL` o `aria-modal`: `{ linea, rol }`, una por
 * elemento. Vale el rol escrito (`role="slider"`) y el que se enlaza con un literal (`[attr.role]="x ? 'radio' : null"`).
 * Un `<p-*>` no cuenta: ahí el rol nombra al nativo.
 */
export function rolesAMano(texto, esHtml) {
  const limpio = sinComentariosEnSuSitio(esHtml ? texto : soloPlantillas(texto), true);
  const piezas = [];
  for (const m of limpio.matchAll(/<([a-zA-Z][\w-]*)\b/g)) {
    if (m[1].startsWith('p-')) continue;
    const etiqueta = limpio.slice(m.index, finDeEtiqueta(limpio, m.index));
    const escrito = etiqueta.match(/\srole="([\w-]+)"/)?.[1];
    const enlazado = [...(etiqueta.match(/\s\[attr\.role\]="([^"]*)"/)?.[1] ?? '').matchAll(/'([\w-]+)'/g)].map((r) => r[1]);
    const rol = [escrito, ...enlazado].find((r) => r && r in NATIVO_DEL_ROL);
    const modal = /\s(?:aria-modal|\[attr\.aria-modal\])=/.test(etiqueta);
    if (rol || modal) piezas.push({ linea: limpio.slice(0, m.index).split('\n').length, rol: rol ?? 'dialog' });
  }
  return piezas;
}

/**
 * Las líneas de una plantilla con un `title` NATIVO: el atributo de HTML (`title="…"`, `[title]`, `[attr.title]`) en
 * una etiqueta de HTML o de PrimeNG, que el navegador enseña con su globo del sistema. La entrada `title` de un
 * componente nuestro (`<sc-dialog [title]>`, `<app-…>`) no cuenta: es su título, no un tooltip.
 */
export function titlesNativos(texto, esHtml) {
  const limpio = sinComentariosEnSuSitio(esHtml ? texto : soloPlantillas(texto), true);
  const lineas = [];
  for (const m of limpio.matchAll(/<([a-zA-Z][\w-]*)\b/g)) {
    if (/^(?:sc|app)-/.test(m[1])) continue;
    const etiqueta = limpio.slice(m.index, finDeEtiqueta(limpio, m.index));
    const at = etiqueta.search(/\s(?:title|\[title\]|\[attr\.title\])=/);
    if (at >= 0) lineas.push(limpio.slice(0, m.index + at + 1).split('\n').length);
  }
  return lineas;
}

/**
 * TRINQUETE de piezas a mano (fichero → nº de elementos). Solo mengua. Cada entrada dice por qué sigue: el número del
 * candidato en la sección 7 del catálogo, que la arregla, o lo que la deja como está.
 */
export const ROLES_A_MANO = {
  // Los radios de las grabaciones del reproductor de varias, con su propio teclado (`onLabelKeydown`). Su barra ya es
  // un `p-slider` en el tramo activo (candidato 1, 2026-10-16).
  'projects/supervisor/src/app/features/memory/components/multi-recording-player/multi-recording-player.component.html': 1,
  // Candidato 29: los paneles de alta en línea, un diálogo no modal (el patrón de WAI-ARIA, no una imitación): meten el
  // foco, cierran con Escape y, desde el 2026-10-15, devuelven el foco a quien los abrió (`focoDeVueltaAlCerrar`).
  'projects/supervisor/src/app/features/admin/labels/components/label-form-panel/label-form-panel.component.html': 1,
  'projects/supervisor/src/app/features/admin/repositories/components/repo-form-panel.component.html': 1,
  'projects/supervisor/src/app/features/admin/templates/components/template-form-panel/template-form-panel.component.html': 1,
  // Se queda: frente a CommandMenu se decidió mantenerla (sección 2 del catálogo, revisado el 2026-10-12).
  'projects/ui-smartcontact/src/lib/components/command-palette/sc-command-palette.component.html': 1,
  // Se queda hasta rehacer el port: solo lo usa la demo de sc-docs y su cabecera explica por qué no se adopta.
  'projects/ui-smartcontact/src/lib/components/bulk-transcription-modal/sc-bulk-transcription-modal.component.html': 1,
};

/** Compara el estado medido contra un trinquete. Devuelve la lista de problemas. */
export function chequearTrinquete(actual, congelado, etiqueta, comoArreglar) {
  const problemas = [];
  for (const [file, n] of Object.entries(actual)) {
    const base = congelado[file] ?? 0;
    if (n > base) {
      problemas.push([
        `${file}: ${n} ${etiqueta} (congelado ${base}). Nuevo(s) incumplimiento(s).`,
        `      → ${comoArreglar} La lista NO crece.`,
      ]);
    } else if (n < base) {
      problemas.push([
        `${file}: bajó a ${n} ${etiqueta} (congelado ${base}).`,
        `      → actualiza el número en el trinquete (avanza).`,
      ]);
    }
  }
  for (const [file, base] of Object.entries(congelado)) {
    if (!(file in actual) && base > 0) {
      problemas.push([
        `${file}: el trinquete cita ${base} ${etiqueta}, pero ya no hay ninguno.`,
        `      → quita su entrada del trinquete.`,
      ]);
    }
  }
  return problemas;
}

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('audit-screen-hygiene.mjs')) {
  const ficheros = sh(
    "find projects -path '*/src/*' \\( -name '*.html' -o -name '*.ts' \\) -not -path '*/node_modules/*'",
  )
    .split('\n')
    .filter(Boolean)
    .sort();

  if (!ficheros.length) {
    log('✗ audit:screen-hygiene: no encuentro plantillas — ¿estás en la raíz del repo?');
    process.exit(1);
  }

  const emojis = {};
  const imgs = {};
  const toasts = {};
  const sinNombre = [];
  const guiones = [];
  const encima = [];
  const dePrimeras = [];
  const roles = {};
  const piezasDe = {};
  const titles = [];
  let desplegables = 0;
  for (const f of ficheros) {
    const src = readFileSync(f, 'utf8');
    const e = contarEmojis(src, f.endsWith('.html'));
    if (e > 0) emojis[f] = e;
    const i = contarImgSinDims(src);
    if (i > 0) imgs[f] = i;
    if (f.startsWith('projects/supervisor/') && f.endsWith('.ts')) {
      const t = contarToasts(src);
      if (t > 0) toasts[f] = t;
      if (!f.endsWith('.spec.ts') && !f.endsWith('/shared/utils/alta-secciones.ts')) {
        for (const linea of acusaDePrimeras(src)) dePrimeras.push(`${f}:${linea}`);
      }
    }
    desplegables += (sinComentariosEnSuSitio(src, f.endsWith('.html')).match(DESPLEGABLE) ?? []).length;
    for (const linea of desplegablesSinNombre(src, f.endsWith('.html'))) sinNombre.push(`${f}:${linea}`);
    if (/^projects\/(?:supervisor|cuscare-ds|ui-smartcontact\/src)\//.test(f) && !f.endsWith('.spec.ts')) {
      const piezas = rolesAMano(src, f.endsWith('.html'));
      if (piezas.length) {
        roles[f] = piezas.length;
        piezasDe[f] = piezas;
      }
    }
    if (/^projects\/(?:supervisor|ui-smartcontact\/src)\//.test(f) && !f.endsWith('.spec.ts')) {
      for (const linea of titlesNativos(src, f.endsWith('.html'))) titles.push(`${f}:${linea}`);
    }
    if (f.startsWith('projects/supervisor/') && f.endsWith('.html')) {
      for (const linea of guionesSueltos(src)) guiones.push(`${f}:${linea}`);
      for (const linea of ayudasEncima(src)) encima.push(`${f}:${linea}`);
    }
  }

  const problemas = [
    ...chequearTrinquete(emojis, EMOJI_PENDIENTES, 'emoji', 'usa <sc-icon> (o un flag SVG) en vez del emoji.'),
    ...chequearTrinquete(imgs, IMG_PENDIENTES, 'img/iframe sin dims', 'añade width+height o aspect-ratio.'),
    ...chequearTrinquete(
      toasts,
      TOAST_DEL_SISTEMA,
      'toast(s)',
      'cuenta el resultado con `ResultadoAccionService.contar`, el mismo toast en toda la app, o junto a su control (DD-211 §5).',
    ),
    ...chequearTrinquete(
      roles,
      ROLES_A_MANO,
      'pieza(s) hecha(s) a mano',
      'usa el nativo que dice cada línea de abajo (sección 6 de `docs/AUDIT-PRIMENG-CATALOGO.md`).',
    ),
    ...Object.entries(roles)
      .filter(([f, n]) => n > (ROLES_A_MANO[f] ?? 0))
      .flatMap(([f]) =>
        piezasDe[f].map(({ linea, rol }) => [
          `${f}:${linea}: role="${rol}" a mano, sin el teclado del nativo.`,
          `      → ${NATIVO_DEL_ROL[rol]}; su documentación entera con \`node tools/primeng-doc.mjs <x>\`.`,
        ]),
      ),
    ...titles.map((donde) => [
      `${donde}: \`title\` nativo (DD-212): el navegador lo enseña con su globo, no con el del Kit.`,
      '      → `pTooltip`, con `showOnEllipsis` si solo repite un texto cortado y `tooltipEvent="both"` si va en algo que se enfoca.',
    ]),
    ...sinNombre.map((donde) => [
      `${donde}: desplegable sin nombre (DD-133). PrimeNG lo nombraría con la opción elegida.`,
      '      → `ariaLabelledBy` con el id del rótulo que tiene a la vista o, sin rótulo, `ariaLabel`. Un `<label for>` solo nombra un sc-multiselect.',
    ]),
    ...guiones.map((donde) => [
      `${donde}: «—» suelto (DD-197). El lector de pantalla lo lee «guion».`,
      '      → `<sc-celda-vacia />` (con `[texto]` si el vacío tiene su porqué); si el vacío significa algo o es una cifra, escríbelo.',
    ]),
    ...encima.map((donde) => [
      `${donde}: ayuda entre el rótulo y su control (DD-198).`,
      '      → pásala al `helperText` del control, que la pinta debajo y la anuncia; si es una lista que crece, bajo su título.',
    ]),
    ...dePrimeras.map((donde) => [
      `${donde}: decide por su cuenta cuándo acusa lo que falta (DD-199). Por el modo, acusa antes de que se pueda rellenar.`,
      '      → `this.ocasion.acusa(seccion, falta)` con `ocasionDeAvisar` (shared/utils/alta-secciones.ts): al dejar la sección, o si lo guardado ya venía sin ello.',
    ]),
  ];

  const totEmoji = Object.values(emojis).reduce((a, b) => a + b, 0);
  const totImg = Object.values(imgs).reduce((a, b) => a + b, 0);
  log(
    `audit:screen-hygiene — ${ficheros.length} plantilla(s): ${totEmoji} emoji astral en ` +
      `${Object.keys(emojis).length} fichero(s), ${totImg} img/iframe sin dims en ${Object.keys(imgs).length} ` +
      `(trinquetes: emoji ${Object.keys(EMOJI_PENDIENTES).length}, img ${Object.keys(IMG_PENDIENTES).length}), ` +
      `${sinNombre.length} de ${desplegables} desplegables sin nombre, ${guiones.length} guion(es) suelto(s), ${encima.length} ayuda(s) encima, ${dePrimeras.length} aviso(s) de primeras, ${titles.length} \`title\` nativo(s), ` +
      `${Object.values(roles).reduce((a, b) => a + b, 0)} pieza(s) a mano en ${Object.keys(roles).length} fichero(s), ` +
      `${Object.values(toasts).reduce((a, b) => a + b, 0)} toast(s) del sistema en ${Object.keys(toasts).length} fichero(s)\n`,
  );

  if (!problemas.length) {
    log(
      '✓ audit:screen-hygiene OK — sin emojis nuevos en la interfaz, ninguna imagen nueva sin reservar su hueco, ' +
        'cada desplegable con nombre, ningún toast nuevo fuera de los del sistema, ningún «—» suelto, ninguna ayuda encima de su control, ' +
        'ningún obligatorio que acuse de primeras, ninguna pieza nueva hecha a mano que imite a un nativo y ningún `title` nativo.',
    );
    process.exit(0);
  }

  log('✗ audit:screen-hygiene — higiene de pantalla:');
  for (const [linea, fix] of problemas) {
    log(`  · ${linea}`);
    log(fix);
  }
  process.exit(1);
}

#!/usr/bin/env node
/**
 * PARA QUÉ SIRVE CADA TOKEN DE FONDO — un mapa, dos consumidores.
 *
 * El sistema sabe QUÉ VALE cada `--sc-bg-*` (lo generan los pipelines del Kit) y no sabe
 * CUÁNDO se usa. Esa mitad estaba escrita a trozos —comentarios de `02-semantic.css`, DD-34,
 * DD-45, el catálogo de superficies— y en 2026-07-22 se escribieron 201 descripciones DENTRO
 * de Figma a mano, cuyo texto no quedó en el repo: si aquel fichero se resetea, la copia
 * desaparece. DD-22 pidió un script que cerrara ese hueco y nunca se escribió. Esto lo cierra.
 *
 * Dos consumidores, una fuente (mismo patrón que `color-map.mjs` y `sizing-map.mjs`):
 *   - `sc-docs` → `projects/sc-docs/public/tokens/_semantic-docs.json`, que la página de
 *     fundamentos pinta junto al swatch. Va por JSON generado y no por import directo porque
 *     la app compila solo desde `src/`, igual que hace la página de conexión de variables.
 *   - Figma → `--figma` IMPRIME el lote que habría que escribir. No escribe: eso necesita el
 *     puente de escritorio, y toda escritura en Figma deja fila en el change-log de
 *     `docs/guia-tokens.md`. Ojo al acantilado: solo un puñado de estos tokens tiene
 *     contrapartida en el export del Kit; el resto son de marca y habrá que resolverlos con el
 *     puente delante.
 *
 * NO va en `verify`: lo que hay que impedir es que el JSON y las filas se desfasen, y de eso
 * se encarga su test, que ya corre en `test:unit`.
 *
 * Uso:  node scripts/token-docs-map.mjs            (comprueba)
 *       node scripts/token-docs-map.mjs --write    (regenera el JSON)
 *       node scripts/token-docs-map.mjs --figma    (imprime el lote, no escribe)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

import { COLOR } from './color-map.mjs';

const root = resolve(import.meta.dirname, '..');
const CSS = 'projects/design-tokens/src/lib/styles/tokens/layers/02-semantic.css';
const JSON_SALIDA = 'projects/sc-docs/public/tokens/_semantic-docs.json';

/**
 * Una fila por cada `--sc-bg-*` de la capa semántica.
 *   `uso`  — cuándo se usa, en una frase.
 *   `no`   — el error concreto que se comete con él, o null si no hay uno conocido.
 *   `dd`   — dónde vive la decisión, si la hay.
 * El texto sale de lo YA medido y escrito (comentarios de la capa 2, DD-34, DD-45, el catálogo
 * de superficies); esto es compresión, no invención.
 */
export const TOKEN_DOCS = [
  /* ── Superficie y lienzo ────────────────────────────────────────────────── */
  {
    token: 'sc-bg-canvas',
    familia: 'superficie',
    uso: 'El lienzo de la página: el suelo sobre el que se apoya todo. Blanco en claro y slate-950 en oscuro, que es el cruce que ningún otro token da.',
    no: 'No lo uses para una tarjeta: eso es surface, y sobre canvas se lee por su borde.',
    dd: 'DD-45',
  },
  {
    token: 'sc-bg-surface',
    familia: 'superficie',
    uso: 'La superficie de contenido: tarjetas, modales, popovers y el relleno de un campo de formulario.',
    no: 'No lo uses como suelo del shell en oscuro: ahí es la tarjeta, no el fondo.',
    dd: null,
  },
  {
    token: 'sc-bg-default',
    familia: 'superficie',
    uso: 'Hace dos trabajos: el suelo del shell detrás de la barra y la sidebar, y el relleno gris de los campos de formulario.',
    no: 'Nunca una superficie de contenido dentro de main: ahí una región es lienzo o es un bloque que se lee por su borde.',
    dd: 'DD-34',
  },
  {
    token: 'sc-bg-elevated',
    familia: 'superficie',
    uso: 'Alias para lo que quiere decir elevado (popovers, desplegables). Hoy vale lo mismo que surface porque el tema claro es plano.',
    no: 'Existe para que nadie escriba un blanco a pelo cuando lo que quiere decir es elevado.',
    dd: null,
  },

  /* ── Estados genéricos de fila ──────────────────────────────────────────── */
  {
    token: 'sc-bg-hover',
    familia: 'estado',
    uso: 'Hover genérico de componentes de fila (tablas, listas, ítems de menú), donde el matiz semántico da igual.',
    no: null,
    dd: null,
  },
  {
    token: 'sc-bg-selected',
    familia: 'estado',
    uso: 'Fila o ítem seleccionado, en la capa suave de marca.',
    no: null,
    dd: null,
  },
  {
    token: 'sc-bg-disabled',
    familia: 'estado',
    uso: 'Fondo de un control deshabilitado. Sale 1:1 del Kit.',
    no: 'Deshabilitado no es lo mismo que solo lectura ni que oculto: elige el estado antes que el color.',
    dd: null,
  },

  /* ── Utilidad ───────────────────────────────────────────────────────────── */
  {
    token: 'sc-bg-overlay-transparent',
    familia: 'utilidad',
    uso: 'Blanco con alfa cero, para overlays que necesitan un fondo declarado sin pintar nada.',
    no: 'No es transparent: es blanco transparente, y se nota al fundir con otro color.',
    dd: null,
  },

  /* ── Marca (navy) ───────────────────────────────────────────────────────── */
  {
    token: 'sc-bg-primary',
    familia: 'marca',
    uso: 'La acción primaria de la pantalla: el botón que la persona ha venido a pulsar.',
    no: 'Una sola por pantalla, y nunca dos primarios seguidos.',
    dd: null,
  },
  {
    token: 'sc-bg-primary-hover',
    familia: 'marca',
    uso: 'Hover del primario. ACLARA el navy en vez de oscurecerlo: es intención de marca del Kit, no un descuido.',
    no: null,
    dd: null,
  },
  {
    token: 'sc-bg-primary-active',
    familia: 'marca',
    uso: 'Primario pulsado.',
    no: null,
    dd: null,
  },
  {
    token: 'sc-bg-primary-subtle',
    familia: 'marca',
    uso: 'La capa suave de marca: fondo de un ítem seleccionado, de un chip de marca o de un aviso informativo de la casa.',
    no: 'No lleva texto oscuro encima sin medir el contraste: es un tinte, no una superficie neutra.',
    dd: null,
  },
  { token: 'sc-bg-primary-subtle-hover', familia: 'marca', uso: 'Hover de la capa suave de marca.', no: null, dd: null },
  { token: 'sc-bg-primary-subtle-active', familia: 'marca', uso: 'Pulsado de la capa suave de marca.', no: null, dd: null },

  /* ── subtle sin familia ─────────────────────────────────────────────────── */
  {
    token: 'sc-bg-subtle',
    familia: 'marca',
    uso: 'Capa suave sin familia declarada. Hoy vale lo mismo que la suave de marca.',
    no: 'Si lo que quieres decir es marca, di primary-subtle: este nombre no dice de qué familia es.',
    dd: null,
  },
  { token: 'sc-bg-subtle-hover', familia: 'marca', uso: 'Hover de la capa suave sin familia.', no: null, dd: null },
  { token: 'sc-bg-subtle-active', familia: 'marca', uso: 'Pulsado de la capa suave sin familia.', no: null, dd: null },

  /* ── Secundario (gris) ──────────────────────────────────────────────────── */
  {
    token: 'sc-bg-secondary',
    familia: 'secundario',
    uso: 'Gris sólido para una acción secundaria de peso, con texto claro encima.',
    no: null,
    dd: null,
  },
  {
    token: 'sc-bg-secondary-hover',
    familia: 'secundario',
    uso: 'Hover de superficie neutra: fila de tabla, opción de lista, ítem de navegación activo. Sale 1:1 del Kit.',
    no: null,
    dd: null,
  },
  { token: 'sc-bg-secondary-active', familia: 'secundario', uso: 'Pulsado de la superficie neutra.', no: null, dd: null },
  {
    token: 'sc-bg-secondary-subtle',
    familia: 'secundario',
    uso: 'Panel gris recogido sobre el lienzo blanco: la ficha de identidad del rail y el índice de configuración.',
    no: 'Sobre el lienzo blanco se lee; sobre un lienzo gris se funde. Míralo en los dos temas.',
    dd: null,
  },

  /* ── Acento ─────────────────────────────────────────────────────────────── */
  {
    token: 'sc-bg-accent',
    familia: 'acento',
    uso: 'El acento de marca (sky). Unificado con info: hoy valen lo mismo.',
    no: 'Acento no es decoración: si el color no dice nada, no lo pongas.',
    dd: 'DD-32',
  },
  { token: 'sc-bg-accent-hover', familia: 'acento', uso: 'Hover del acento.', no: null, dd: null },
  { token: 'sc-bg-accent-active', familia: 'acento', uso: 'Pulsado del acento.', no: null, dd: null },

  /* ── Info ───────────────────────────────────────────────────────────────── */
  {
    token: 'sc-bg-info',
    familia: 'info',
    uso: 'Informativo sólido: la barra o el indicador que comunica un dato neutro, no un problema.',
    no: null,
    dd: null,
  },
  { token: 'sc-bg-info-hover', familia: 'info', uso: 'Hover del informativo.', no: null, dd: null },
  { token: 'sc-bg-info-active', familia: 'info', uso: 'Pulsado del informativo.', no: null, dd: null },
  {
    token: 'sc-bg-info-subtle',
    familia: 'info',
    uso: 'Fondo de un aviso informativo. Es de los pocos suaves que SÍ voltea en oscuro.',
    no: null,
    dd: null,
  },

  /* ── Éxito ──────────────────────────────────────────────────────────────── */
  {
    token: 'sc-bg-success',
    familia: 'éxito',
    uso: 'Confirmación sólida: la operación terminó bien.',
    no: 'No lo uses para estado activo: activo no es lo mismo que correcto.',
    dd: null,
  },
  { token: 'sc-bg-success-subtle', familia: 'éxito', uso: 'Fondo de un aviso de confirmación.', no: null, dd: null },

  /* ── Aviso ──────────────────────────────────────────────────────────────── */
  {
    token: 'sc-bg-warning',
    familia: 'aviso',
    uso: 'Advertencia sólida: algo que conviene mirar antes de seguir.',
    no: 'La familia amarilla vuelve a ser la del Kit, con una corrección de contraste: no la ajustes a ojo.',
    dd: 'DD-41',
  },
  { token: 'sc-bg-warning-subtle', familia: 'aviso', uso: 'Fondo de un aviso de advertencia.', no: null, dd: null },

  /* ── Peligro ────────────────────────────────────────────────────────────── */
  {
    token: 'sc-bg-danger',
    familia: 'peligro',
    uso: 'Acción destructiva o error bloqueante.',
    no: 'No todo borrado lleva la misma puerta: confirmar todo igual entrena la ceguera de confirmación.',
    dd: 'DD-36',
  },
  { token: 'sc-bg-danger-hover', familia: 'peligro', uso: 'Hover de la acción destructiva.', no: null, dd: null },
  { token: 'sc-bg-danger-active', familia: 'peligro', uso: 'Pulsado de la acción destructiva.', no: null, dd: null },
  {
    token: 'sc-bg-danger-subtle',
    familia: 'peligro',
    uso: 'Fondo de un aviso de error o de una zona de peligro.',
    no: null,
    dd: null,
  },
  { token: 'sc-bg-danger-subtle-hover', familia: 'peligro', uso: 'Hover de la capa suave de peligro.', no: null, dd: null },
  { token: 'sc-bg-danger-subtle-active', familia: 'peligro', uso: 'Pulsado de la capa suave de peligro.', no: null, dd: null },

  /* ── Violeta ────────────────────────────────────────────────────────────── */
  {
    token: 'sc-bg-violet',
    familia: 'violeta',
    uso: 'Familia auxiliar para categorías y etiquetas que necesitan un color propio fuera del semáforo.',
    no: 'No es un estado: no significa ni bien ni mal.',
    dd: null,
  },
  { token: 'sc-bg-violet-hover', familia: 'violeta', uso: 'Hover del violeta.', no: null, dd: null },
  { token: 'sc-bg-violet-active', familia: 'violeta', uso: 'Pulsado del violeta.', no: null, dd: null },
  { token: 'sc-bg-violet-subtle', familia: 'violeta', uso: 'Capa suave del violeta, para chips y fondos de categoría.', no: null, dd: null },
  { token: 'sc-bg-violet-subtle-hover', familia: 'violeta', uso: 'Hover de la capa suave del violeta.', no: null, dd: null },
  { token: 'sc-bg-violet-subtle-active', familia: 'violeta', uso: 'Pulsado de la capa suave del violeta.', no: null, dd: null },
];

/** Los `--sc-bg-*` que define la capa semántica, en orden de fichero. */
export function tokensDefinidos(css) {
  return [...css.matchAll(/^\s*--(sc-bg-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]);
}

/** Tokens definidos que NO tienen fila. */
export function faltantes(css) {
  const conFila = new Set(TOKEN_DOCS.map((r) => r.token));
  return tokensDefinidos(css).filter((t) => !conFila.has(t));
}

/** Filas cuyo token ya no existe. */
export function huerfanas(css) {
  const definidos = new Set(tokensDefinidos(css));
  return TOKEN_DOCS.map((r) => r.token).filter((t) => !definidos.has(t));
}

/** La forma que consume sc-docs. */
export function aJson(filas = TOKEN_DOCS) {
  return { generado: 'token-docs-map.mjs', total: filas.length, tokens: filas };
}

/**
 * Lote para Figma: qué filas tienen una variable del Kit donde colgar la descripción, y
 * cuáles no. El acantilado es real y se informa en vez de esconderse.
 */
export function batchFigma(filas = TOKEN_DOCS, color = COLOR) {
  const porToken = new Map();
  for (const fila of color) {
    if (fila.kind !== 'enforce' || !fila.token || !fila.token.startsWith('sc-bg-')) continue;
    if (!porToken.has(fila.token)) porToken.set(fila.token, fila.exp);
  }
  const con = [];
  const sin = [];
  for (const r of filas) {
    const variable = porToken.get(r.token);
    const description = r.no ? `${r.uso} · Evita: ${r.no}` : r.uso;
    if (variable) con.push({ token: r.token, variable, description });
    else sin.push(r.token);
  }
  return { con, sin };
}

/* ── main ──────────────────────────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('token-docs-map.mjs')) {
  const log = (s = '') => process.stdout.write(s + '\n');
  const css = readFileSync(resolve(root, CSS), 'utf8');
  const modo = process.argv[2] ?? '';

  if (modo === '--figma') {
    const { con, sin } = batchFigma();
    log(`token-docs-map --figma — LOTE EN SECO, no se escribe nada en Figma.\n`);
    for (const x of con) log(`  ${x.variable}\n    ← --${x.token}\n    "${x.description}"\n`);
    log(`  ${con.length} con contrapartida en el export del Kit.`);
    log(`  ${sin.length} SIN contrapartida conocida: son de marca, y a qué variable van se`);
    log(`  resuelve con el puente de Figma delante, no adivinando desde aquí.`);
    log(`\n  Al escribirlas de verdad: deja fila en el change-log de docs/guia-tokens.md.`);
    process.exit(0);
  }

  const falta = faltantes(css);
  const huerfana = huerfanas(css);

  if (modo === '--write') {
    const destino = resolve(root, JSON_SALIDA);
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, JSON.stringify(aJson(), null, 2) + '\n');
    log(`✓ escrito ${JSON_SALIDA} — ${TOKEN_DOCS.length} tokens documentados.`);
    process.exit(0);
  }

  log(`token-docs-map — ${TOKEN_DOCS.length} filas contra ${tokensDefinidos(css).length} tokens definidos\n`);
  if (!falta.length && !huerfana.length) {
    log('✓ token-docs-map OK — todo `--sc-bg-*` de la capa semántica tiene su "para qué sirve".');
    process.exit(0);
  }
  for (const t of falta) log(`  · --${t}: definido y SIN fila. → escríbele su uso en TOKEN_DOCS.`);
  for (const t of huerfana) log(`  · --${t}: tiene fila y ya NO existe. → quita su fila.`);
  process.exit(1);
}

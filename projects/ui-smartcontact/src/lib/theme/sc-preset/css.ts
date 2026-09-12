import type { StyleOptions } from "@primeuix/styled";
import { fromDesignPx } from "./rem-scale";

const token = (dt: StyleOptions["dt"], key: string, fallback: string) => `${dt(key, fallback) ?? fallback}`;

/*
 * DOS FAMILIAS, Y LA DIFERENCIA LA ARBITRA FIGMA.
 *
 * Todo lo de aquí abajo recibe el MISMO `font-size` (el del Kit: 12/14/16). Lo que
 * cambia es el `line-height`, y no por gusto: medido maestro a maestro en el Kit el
 * 2026-09-05 con el Desktop Bridge.
 *
 *   CONTROLES  → el texto va en `AUTO` en Figma, o sea la métrica de la fuente.
 *                Inter da 17px a 14, 15px a 12 y 19px a 16. Aquí eso es `normal`.
 *   ETIQUETAS  → el texto lleva line-height ATADO en Figma, y vale exactamente lo
 *                que la rampa: chip 20, tag 18, toast 20/18.
 *
 * Antes TODO llevaba la rampa, y por eso los controles salían más altos que el
 * diseño: botón md 36 contra 33, sm 30.5 contra 27.5, lg 43.5 contra 38.5, campo 36
 * contra 34. El padding, la letra y el borde siempre casaron; el sobrante era este.
 *
 * ⚠️ La regla NO desaparece para los controles, cambia de valor. Quitarla los dejaría
 * heredando el `line-height` del body de cada app (1.5 en el supervisor = 21px), que
 * es lo que DD-39 vino a arreglar y sería PEOR que la rampa. `normal` desacopla igual.
 */
/* ⚠️ AQUÍ HABÍA un `.p-inputchips .p-inputchips-input-item input`, y apuntaba al
 * VACÍO: PrimeNG no tiene ningún `inputchips` (ni fichero, ni clase — comprobado
 * contra `node_modules/primeng/fesm2022` el 2026-09-10). Nadie lo había visto
 * porque el guardián de huérfanos solo miraba el SCSS, y el preset es TS; desde
 * hoy también lo mira, y lo cazó en la primera pasada. El caso que ese selector
 * quería cubrir —un campo de chips— lo cubre `.p-autocomplete-input-chip input`,
 * que sí existe y ya estaba en esta lista. */
const mdControlSelectors = [
    ".p-component.p-button",
    ".p-component.p-inputtext",
    ".p-component.p-textarea",
    ".p-datepicker-day-view",
    ".p-datepicker-time-picker span",
    ".p-editor .ql-container",
    ".p-editor .ql-snow .ql-editor h4",
    ".p-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value='4']::before",
    ".p-select .p-select-label",
    ".p-multiselect .p-multiselect-label",
    ".p-treeselect .p-treeselect-label",
    ".p-cascadeselect .p-cascadeselect-label",
    ".p-autocomplete .p-autocomplete-input-multiple",
    ".p-autocomplete .p-autocomplete-input-chip input",
    ".p-terminal .p-terminal-prompt-value",
    ".p-component.p-togglebutton",
    ".p-select-option",
    ".p-multiselect-option",
    ".p-listbox-option"
] as const;

/* Estos tres SÍ atan line-height en Figma, y coincide con la rampa. No se tocan. */
const mdRampSelectors = [
    ".p-chip",
    ".p-toast-summary",
    ".p-breadcrumb-item-label",
    ".p-contextmenu-item-label"
] as const;

const smControlSelectors = [
    ".p-component.p-button-sm",
    ".p-component.p-inputtext-sm",
    ".p-component.p-textarea-sm",
    ".p-select.p-select-sm .p-select-label",
    ".p-multiselect.p-multiselect-sm .p-multiselect-label",
    ".p-treeselect.p-treeselect-sm .p-treeselect-label",
    ".p-cascadeselect.p-cascadeselect-sm .p-cascadeselect-label",
    ".p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-input-multiple",
    ".p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-input-chip input",
    ".p-component.p-togglebutton-sm"
] as const;

const smRampSelectors = [".p-tag", ".p-toast-detail"] as const;

const lgControlSelectors = [
    ".p-component.p-button-lg",
    ".p-component.p-inputtext-lg",
    ".p-component.p-textarea-lg",
    ".p-select.p-select-lg .p-select-label",
    ".p-multiselect.p-multiselect-lg .p-multiselect-label",
    ".p-treeselect.p-treeselect-lg .p-treeselect-label",
    ".p-cascadeselect.p-cascadeselect-lg .p-cascadeselect-label",
    ".p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-input-multiple",
    ".p-autocomplete:has(.p-inputtext-lg) .p-autocomplete-input-chip input",
    ".p-component.p-togglebutton-lg"
] as const;

/** Familia CONTROL: la letra del Kit y el interlineado de la fuente (el `AUTO` de Figma). */
const controlRule = (
    selectors: readonly string[],
    dt: StyleOptions["dt"],
    fontSizeToken: string,
    fontSizeFallback: string
) => `${selectors.join(",\n")} {
    font-size: ${token(dt, fontSizeToken, fontSizeFallback)};
    line-height: normal;
}`;

/** Familia ETIQUETA: letra e interlineado del Kit, los dos atados en Figma. */
const rampRule = (
    selectors: readonly string[],
    dt: StyleOptions["dt"],
    fontSizeToken: string,
    lineHeightToken: string,
    fontSizeFallback: string,
    lineHeightFallback: string
) => `${selectors.join(",\n")} {
    font-size: ${token(dt, fontSizeToken, fontSizeFallback)};
    line-height: ${token(dt, lineHeightToken, lineHeightFallback)};
}`;

/* ══════════════════════════════════════════════════════════════════════════
 * LA GRAMÁTICA DE TABLA-LISTA (`<sc-datatable variant="list">`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * QUÉ ES. La piel de las tablas de ADMINISTRACIÓN: cabecera silenciosa (gris,
 * medium, sentence-case, sin fondo propio), fila alta con hairline
 * `border-default`, reparto de columnas `fixed` y hover SOLO si la fila hace
 * algo. Nueve tablas del Supervisor la llevan.
 *
 * POR QUÉ ESTÁ AQUÍ, EN EL TEMA (2026-09-10). Hasta hoy vivía en
 * `projects/supervisor/src/styles/_sc-datatable-list.scss`: diez bloques de CSS
 * de app, SIN CAPA, sobre selectores internos de PrimeNG. Eso tenía dos
 * consecuencias, y la segunda es la que lo mueve:
 *
 *   1. Sin capa gana SIEMPRE a `@layer primeng`, sin mirar especificidad, así
 *      que ningún token del preset podía alcanzar esas medidas.
 *   2. **No viajaba.** Exportabas el tema, lo montabas en otra app y la tabla
 *      revertía al preset —filas de 42px, cabecera oscura— sin que fallara un
 *      solo test, porque el COMPORTAMIENTO seguía intacto.
 *
 * La objeción que la mantuvo fuera del preset («tocar el preset cambiaría
 * también la tabla de llamadas de `agent`, que no es una lista de
 * administración») la responde la VARIANTE: esto no aplica a ninguna tabla que
 * no pida `variant="list"`. El DS aporta el componente Y su gramática; la app
 * elige cuál de las dos pieles quiere.
 *
 * LA MEDIDA, para que no se pierda el porqué de cada número:
 *
 *              preset sc-datatable   gramática `list`
 *   alto fila       42px                  53px (agentes/grupos 63: manda el avatar)
 *   cabecera        14px / 600            12px / 500
 *   color cab.      #4f5663               #8f97a3  (`--sc-text-secondary`)
 *   borde fila      border-default        border-default
 *
 * `border-default` y NO `subtle`: las filas van sobre `bg-surface`, y ahí en
 * oscuro `subtle` (slate-900) es EL MISMO COLOR que el fondo (1.00:1) — el
 * separador no existía. Con `default`, 1.39:1. Lo fija
 * `e2e/supervisor/list-table-grammar.spec.ts`, que también fija el resto de
 * números de esta tabla; si tocas algo de aquí, ese spec te lo dice.
 *
 * ⚠️ `.sc-row--clickable` es una clase del DS, no de una app. La emite el
 * consumidor por `[rowStyleClass]` en las filas que de verdad abren algo, y es
 * lo que separa un hover honesto de una afordancia mentirosa: una tabla
 * genuinamente INERTE (sin click, sin kebab, sin selección) no debe iluminarse
 * al pasar el ratón. Y hay que APAGAR el hover explícitamente, no basta con no
 * encenderlo: `sc-datatable` fuerza `[rowHover]="true"`, así que el preset de
 * PrimeNG pinta el suyo por debajo.
 *
 * ⚠️ Lo que NO está aquí: `.sc-datatable__check { width: 40px }`. Ese nodo lo
 * pinta la plantilla del componente, cuyo SCSS va SIN CAPA y le ganaría a
 * cualquier cosa que dijéramos desde `@layer primeng`. Vive en
 * `sc-datatable.component.scss`, con su motivo escrito.
 */
/* ══════════════════════════════════════════════════════════════════════════
 * EL SUELO TIPOGRÁFICO DE **CUALQUIER** sc-datatable
 * ══════════════════════════════════════════════════════════════════════════
 *
 * La piel `list` ancló su tipografía el 2026-09-12 (DD-72). La de por defecto
 * NO, y arrastraba el mismo defecto: la celda no declaraba `font-size`, así que
 * heredaba el del documento de cada app.
 *
 * MEDIDO, no deducido (2026-09-12, en la página del DS): con el `body` a 14px
 * la celda por defecto rendía 14; subiendo el `body` a 20px **se fue a 20**,
 * mientras la `list` se quedó clavada en 14. Ese es exactamente el fallo que
 * hacía que la MISMA tabla midiera 16 en el Supervisor (que no fija `body`) y
 * 14 en sc-docs (que sí). En sc-docs salía bien por casualidad.
 *
 * QUÉ VALOR SE FIJA: el que la piel por defecto ya RENDÍA en sc-docs —celda
 * `Body/body-regular`, cabecera `Body/body-semibold`— para no rediseñarla de
 * paso. Esto tapa el agujero; si algún día se quiere que las dos pieles digan
 * lo mismo, eso es otra decisión y se toma mirándolas.
 *
 * POR QUÉ AQUÍ Y NO EN `datatable.ts`: el preset de PrimeNG solo acepta los
 * tokens que su Table declara, y `bodyCell` no tiene `fontSize`. El hook `css`
 * existe justo para lo que el juego de tokens no cubre.
 *
 * La `list` sigue mandando sobre esto por especificidad (lleva su clase). */
const baseTableCss = () => `
sc-datatable .p-datatable-thead > tr > th {
    font-size: var(--sc-font-size-body-2);
    line-height: var(--sc-line-height-body-2);
    font-weight: var(--sc-font-weight-semibold);
}

sc-datatable .p-datatable-tbody > tr > td {
    font-size: var(--sc-font-size-body-2);
    line-height: var(--sc-line-height-body-2);
    font-weight: var(--sc-font-weight-regular);
}
`;

const LIST = "sc-datatable.sc-datatable--list";

const listTableCss = () => `
${LIST} .p-datatable-table {
    /* "fixed", no "auto": con "auto" el reparto pasa a ser por CONTENIDO y las
       columnas se recolocan al aparecer el indicador de orden. */
    table-layout: fixed;
}

${LIST} .p-datatable-header:empty {
    /* PrimeNG pinta SIEMPRE la banda de "caption", aunque no se proyecte nada
       en "[scTableCaption]": deja una franja vacía sobre la cabecera. Estas
       listas llevan su toolbar fuera de la tarjeta. */
    display: none;
}

${LIST} .p-datatable-thead > tr > th {
    /* TIPOGRAFIA POR ROL, no por numero suelto. Antes: 12px con peso 500, y el
       500 NO es el peso de ninguno de los 12 text styles (solo hay 400 y 600),
       asi que la cabecera no era ningun estilo: era un valor a mano que
       coincidia en tamano con caption. Ahora ES Caption/caption-semibold, o
       sea que si Figma remapea ese estilo, esto lo sigue solo.
       El padding horizontal sube a spacing-1 y DEBE coincidir con el de la
       celda, o las columnas dejan de alinearse. */
    padding: var(--sc-spacing-0-875) var(--sc-spacing-1);
    background: var(--sc-bg-surface);
    border-bottom: 1px solid var(--sc-border-default);
    font-size: var(--sc-font-size-caption);
    line-height: var(--sc-line-height-caption);
    font-weight: var(--sc-font-weight-semibold);
    letter-spacing: 0;
    color: var(--sc-text-secondary);
    text-align: left;
}

${LIST} .p-datatable-tbody > tr > td {
    /* LA CELDA NO TENIA ESTILO DE TEXTO. Medido el 2026-09-11 en
       /admin/usuarios: el td rendia 16px/24 (el tamano por defecto del
       navegador, heredado porque el body del supervisor solo fija
       line-height 1.5) y cada pagina lo corregia DENTRO de la celda pegando
       una clase (104 repartidas por las listas). Donde faltaba la clase, el
       texto salia a 16. Ahora la celda ES Body/body-regular (14/20) y la clase
       de dentro solo hace falta cuando el texto quiere SALIRSE del cuerpo
       (caption, o semibold).
       El padding vertical sube a spacing-1-25 a proposito: con letra de 14 en
       vez de 16 la fila encogia de 53 a 44.5 y quedaba apretada; asi queda en
       55, que respira mas que antes y con el tipo ya correcto. */
    padding: var(--sc-spacing-1-25) var(--sc-spacing-1);
    font-size: var(--sc-font-size-body-2);
    line-height: var(--sc-line-height-body-2);
    font-weight: var(--sc-font-weight-regular);
    border-bottom: 1px solid var(--sc-border-default);
    /* Bloque contenedor para los paneles anclados a una fila (el editor inline
       cuelga de su celda). Sin esto el panel se ancla al viewport. */
    position: relative;
}

${LIST} .p-datatable-tbody > tr {
    transition: background var(--sc-transition-fast) var(--sc-easing-default);
}

${LIST} .p-datatable-tbody > tr.sc-row--clickable:hover,
${LIST} .p-datatable-tbody > tr.p-selectable-row:hover {
    background: var(--sc-bg-default);
}

${LIST} .p-datatable-tbody > tr:not(.sc-row--clickable):not(.p-selectable-row):hover {
    background: transparent;
}

${LIST} .p-datatable-tbody > tr.p-datatable-row-selected {
    /* Gris neutro, no el resaltado azul de PrimeNG: aquí la selección es para
       actuar EN LOTE, no para marcar «la fila activa». */
    background: var(--sc-color-slate-100);
}

${LIST} .p-datatable-tbody > tr.sc-row--clickable {
    cursor: pointer;
}

${LIST} .p-datatable-tbody > tr:has(> td[colspan]) {
    /* La fila vacía (búsqueda sin resultados) se proyecta vía "[scTableEmpty]"
       y no lleva hairline: no es una fila de datos. */
    background: none;
}

${LIST} .p-datatable-tbody > tr:has(> td[colspan]) > td {
    border-bottom: 0;
}
`;

/* ══════════════════════════════════════════════════════════════════════════
 * MICRO-INTERACCIÓN DE BOTÓN · cómo responde al dedo
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Hover y focus con una transición corta —vivo, no pastoso—; la pulsación
 * (`:active`) chasca con `scale(0.98)` y transición CERO: el click tiene que
 * producir respuesta táctil instantánea, no el desvanecido del hover anterior.
 * Y un botón deshabilitado NO anima: es inerte, y decirlo con el cursor.
 *
 * POR QUÉ AQUÍ (2026-09-10). Vivía en `projects/supervisor/src/styles/main.scss`
 * como CSS de app SIN CAPA sobre `.p-button`, con la nota «esta app decide cómo
 * RESPONDE al dedo». Es media verdad: la app puede decidirlo, pero entonces
 * exportas el tema, lo montas en otro sitio y **los botones dejan de chascar**
 * sin que falle nada. Cómo responde un control al dedo es del SISTEMA, igual
 * que su padding o su radio; que el Kit no publique un token de micro-
 * interacción no lo convierte en propiedad de una app.
 *
 * Las tres clases de app que acompañaban al selector (`.empty-state__cta`,
 * `.rename__btn`, `.profile-tabs__tab`) se quedan en el Supervisor: son suyas,
 * y ya no arrastran ningún `.p-*` con ellas.
 *
 * ⚠️ `.p-component.p-button` y no `.p-button` a secas, y no es cosmética: el
 * blob global del preset se inyecta ANTES que el CSS del componente, así que a
 * igual capa e igual especificidad ganaría PrimeNG. Es el mismo (0,2,0) que
 * usan los selectores de tipografía de más arriba, por el mismo motivo.
 */
const buttonMotionCss = () => `
.p-component.p-button {
    transition:
        background-color 100ms ease,
        border-color 100ms ease,
        color 100ms ease,
        box-shadow 100ms ease;
}

.p-component.p-button:active {
    transform: scale(0.98);
    transition-duration: 0ms;
}

.p-component.p-button:disabled,
.p-component.p-button[aria-disabled="true"] {
    transform: none;
    cursor: not-allowed;
}

.p-component.p-button:disabled:active,
.p-component.p-button[aria-disabled="true"]:active {
    transform: none;
}

@media (prefers-reduced-motion: reduce) {
    .p-component.p-button {
        transition: none;
    }

    .p-component.p-button:active {
        transform: none;
    }
}
`;

/* ══════════════════════════════════════════════════════════════════════════
 * ITEM DE MENÚ DESTRUCTIVO (`styleClass="sc-menu-item--danger"`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * «Eliminar» no puede verse igual que «Editar». El tema pinta el menú neutro;
 * esta clase marca la acción IRREVERSIBLE, y en hover el tinte refuerza la
 * advertencia — el rojo del texto por sí solo se lee como un estado, no como la
 * consecuencia de pulsar.
 *
 * POR QUÉ AQUÍ (2026-09-10). Vivía en el Supervisor como
 * `.rules-menu-item--danger`, sin capa, sobre `.p-menu-item-*`. Pero «acción
 * destructiva en un kebab» no es semántica de una app: la tiene cualquier
 * consumidor con una tabla, y los tres valores salen de tokens
 * (`--sc-text-danger`, `--sc-bg-danger-subtle`), o sea que no hay ninguna
 * medida inventada que justificara tenerlo fuera del tema.
 *
 * El nombre pasa a `sc-menu-item--danger`: `rules-` era el rastro de la
 * pantalla donde nació, y ya se usaba en nueve. Se pasa por `styleClass` en el
 * `MenuItem`; PrimeNG la deja en el `<li>`, así que baja al enlace y a su icono.
 */
const dangerMenuItemCss = () => `
.sc-menu-item--danger .p-menu-item-link,
.sc-menu-item--danger .p-menu-item-icon {
    color: var(--sc-text-danger);
}

.sc-menu-item--danger .p-menu-item-content:hover {
    background: var(--sc-bg-danger-subtle);
}

.sc-menu-item--danger .p-menu-item-content:hover .p-menu-item-link,
.sc-menu-item--danger .p-menu-item-content:hover .p-menu-item-icon {
    color: var(--sc-text-danger);
}
`;

/* `@primeuix/themes` 3 cambió `ExtendedCSS` a `(options?: StyleOptions) => string`:
 * el argumento pasó a ser OPCIONAL. La firma se relaja igual para casar con el tipo;
 * en la práctica PrimeUIX siempre lo pasa, y si no lo hiciera reventaría al usar `dt`,
 * que es lo correcto — mejor un fallo ruidoso que un CSS silenciosamente vacío. */
const presetCss = ({ dt }: StyleOptions = {} as StyleOptions) => `
${controlRule(mdControlSelectors, dt, "app.typography.md.font.size", fromDesignPx(14))}

${rampRule(
    mdRampSelectors,
    dt,
    "app.typography.md.font.size",
    "app.typography.md.line.height",
    fromDesignPx(14),
    /* 20, no 21: DD-39 unificó el line-height md. El fallback solo entra si la variable
     * no resuelve, y hasta ahora contradecía al token — habría reintroducido justo el
     * 21 que costó semanas cazar. */
    fromDesignPx(20)
)}

${controlRule(smControlSelectors, dt, "app.typography.sm.font.size", fromDesignPx(12))}

${rampRule(
    smRampSelectors,
    dt,
    "app.typography.sm.font.size",
    "app.typography.sm.line.height",
    fromDesignPx(12),
    fromDesignPx(18)
)}

${controlRule(lgControlSelectors, dt, "app.typography.lg.font.size", fromDesignPx(16))}

.p-button .p-button-icon {
    line-height: 1;
}

${baseTableCss()}
${listTableCss()}

${buttonMotionCss()}

${dangerMenuItemCss()}
`;

export default presetCss;

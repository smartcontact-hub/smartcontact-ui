import type { StyleOptions } from "@primeuix/styled";
import { fromDesignPx } from "./rem-scale";

const token = (dt: StyleOptions["dt"], key: string, fallback: string) => `${dt(key, fallback) ?? fallback}`;

/*
 * UNA FAMILIA POR TALLA: letra e interlineado del Kit, los dos atados en Figma (DD-91).
 *
 * Todo lo de aquí abajo recibe la letra y el interlineado de `app.typography.{sm,md,lg}`
 * (12/18, 14/20, 16/24). En Figma, los maestros de controles (botón, campo, select,
 * multiselect, treeselect, cascadeselect, autocomplete, textarea, togglebutton y
 * opciones de lista) y de etiquetas (chip, tag, toast) llevan su interlineado ATADO a
 * esa rampa, así que cambiar la variable mueve Figma y código a la vez.
 *
 * Historia: DD-51 (2026-09-05) partió esto en dos familias porque entonces los
 * controles iban en `AUTO` en Figma (la métrica de la fuente, `normal` aquí) y medían
 * 29,5; las etiquetas ya leían la rampa. DD-91 (2026-09-14) ata también los controles
 * a la rampa, primero en Figma y luego aquí: campo y botón md 32,5, sm 27, lg 40.
 *
 * ⚠️ Quitar la regla no es una opción: los controles heredarían el `line-height` del
 * body de cada app (1.5 en el supervisor = 21px), que es lo que DD-39 vino a arreglar.
 */
/* ⚠️ AQUÍ HABÍA un `.p-inputchips .p-inputchips-input-item input`, y apuntaba al
 * VACÍO: PrimeNG no tiene ningún `inputchips` (ni fichero, ni clase — comprobado
 * contra `node_modules/primeng/fesm2022` el 2026-09-10). Nadie lo había visto
 * porque el guardián de huérfanos solo miraba el SCSS, y el preset es TS; desde
 * hoy también lo mira, y lo cazó en la primera pasada. El caso que ese selector
 * quería cubrir —un campo de chips— lo cubre `.p-autocomplete-input-chip input`,
 * que sí existe y ya estaba en esta lista. */
const mdTypographySelectors = [
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
    ".p-listbox-option",
    /* Etiquetas: ya leían la rampa antes de DD-91. */
    ".p-chip",
    ".p-toast-summary",
    ".p-breadcrumb-item-label",
    ".p-contextmenu-item-label"
] as const;

const smTypographySelectors = [
    ".p-component.p-button-sm",
    ".p-component.p-inputtext-sm",
    ".p-component.p-textarea-sm",
    ".p-select.p-select-sm .p-select-label",
    ".p-multiselect.p-multiselect-sm .p-multiselect-label",
    ".p-treeselect.p-treeselect-sm .p-treeselect-label",
    ".p-cascadeselect.p-cascadeselect-sm .p-cascadeselect-label",
    ".p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-input-multiple",
    ".p-autocomplete:has(.p-inputtext-sm) .p-autocomplete-input-chip input",
    ".p-component.p-togglebutton-sm",
    /* Etiquetas: ya leían la rampa antes de DD-91. */
    ".p-tag",
    ".p-toast-detail"
] as const;

const lgTypographySelectors = [
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

/** Letra e interlineado de la talla, los dos del Kit (`app.typography.<talla>`). */
const typographyRule = (
    selectors: readonly string[],
    dt: StyleOptions["dt"],
    size: "sm" | "md" | "lg",
    fontSizeFallback: string,
    lineHeightFallback: string
) => `${selectors.join(",\n")} {
    font-size: ${token(dt, `app.typography.${size}.font.size`, fontSizeFallback)};
    line-height: ${token(dt, `app.typography.${size}.line.height`, lineHeightFallback)};
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

/* La banda de «caption» VACÍA no es diseño, es un arreglo: PrimeNG la pinta siempre,
 * aunque no se proyecte nada, y deja una franja en blanco sobre la cabecera. Vive fuera de
 * la piel de listado para que el experimento «Aura de base» —que aparta esa piel— no la
 * resucite (medido el 2026-09-13 en `/admin/usuarios`: la franja reapareció al quitarla). */
const emptyCaptionCss = () => `
sc-datatable .p-datatable-header:empty {
    display: none;
}
`;

const LIST = "sc-datatable.sc-datatable--list";

/*
 * TABLAS DE LISTADO SOBRE AURA (2026-09-13): el ASPECTO de la tabla es el de Aura
 * (cabecera, rellenos, bordes, colores). De la piel de listado que teníamos solo se quedan
 * sus COMPORTAMIENTOS, que Aura no trae o trae distinto y que las 25 tablas del Supervisor
 * dan por hechos:
 *
 *   1. Las columnas no se recolocan al aparecer el indicador de orden (`fixed`).
 *   2. La celda es el ancla de los paneles que cuelgan de una fila (editor en línea).
 *   3. Solo las filas pulsables o seleccionables reaccionan al pasar el ratón.
 *   4. La fila seleccionada se distingue, en gris neutro: aquí se selecciona para actuar
 *      EN LOTE, no para marcar «la fila activa».
 *   5. La fila de «sin resultados» no es una fila de datos: sin fondo ni raya.
 */
const listBehaviorCss = () => `
${LIST} .p-datatable-table {
    table-layout: fixed;
}

${LIST} .p-datatable-tbody > tr > td {
    position: relative;
}

${LIST} .p-datatable-tbody > tr {
    transition: background var(--sc-transition-fast) var(--sc-easing-default);
}

${LIST} .p-datatable-tbody > tr.sc-row--clickable {
    cursor: pointer;
}

${LIST} .p-datatable-tbody > tr.sc-row--clickable:hover,
${LIST} .p-datatable-tbody > tr.p-selectable-row:hover {
    background: var(--sc-bg-default);
}

${LIST} .p-datatable-tbody > tr:not(.sc-row--clickable):not(.p-selectable-row):hover {
    background: transparent;
}

${LIST} .p-datatable-tbody > tr.p-datatable-row-selected {
    background: var(--sc-bg-secondary-hover);
}

${LIST} .p-datatable-tbody > tr:has(> td[colspan]) {
    background: none;
}

${LIST} .p-datatable-tbody > tr:has(> td[colspan]) > td {
    border-bottom: 0;
}
`;

/*
 * UNA ETIQUETA ES UNA LÍNEA (2026-09-13). El maestro del Kit (❖ Tag, set `373:13337`)
 * mide 21.5 de alto con el texto en una sola línea; Aura no dice nada y, en una caja
 * más estrecha que el texto, la etiqueta se partía en dos líneas y crecía. Medido en
 * Conversaciones a 1280: 31 de 68 etiquetas a dos líneas en celdas de 133px. Si no
 * cabe, recorta con puntos suspensivos; `sc-tag` repone el valor en `title` al pasar
 * el ratón solo si está recortado, y el texto entero sigue en el DOM para un lector.
 * `clip` y no `hidden`: no convierte la etiqueta en contenedor de scroll, que le
 * cambiaría la línea base y la movería de su sitio en una fila de texto.
 */
const tagOneLineCss = () => `
.p-component.p-tag {
    max-width: 100%;
}

.p-tag .p-tag-label {
    min-width: 0;
    overflow: clip;
    text-overflow: ellipsis;
    white-space: nowrap;
}
`;

/* Sin `.p-datatable:not(.p-datatable-scrollable)`: la clase de host ya no se pone si la
 * tabla es `scrollable` (lo decide el componente), así que el tema no nombra dos clases
 * internas más. `> p-table >` es el elemento, no una clase, y no alcanza a una tabla
 * anidada en una fila expandida. */
const STICKY = "sc-datatable.sc-datatable--sticky-header > p-table";

/*
 * CABECERA FIJA AL SCROLL DE LA PÁGINA (`<sc-datatable stickyHeader>`, 2026-09-13).
 *
 * Es el mismo mecanismo que PrimeNG usa en su modo `scrollable` (el `<thead>`
 * con `position: sticky`, que `p-table` ya pone en línea, más `inset-block-start`
 * y un `z-index`), pero fijado al scroll de la página y no al de la tabla.
 * Medido en Conversaciones, con la regla inyectada antes de escribirla:
 *
 *   1. `p-table` pone `overflow: auto` EN LÍNEA a su contenedor, siempre. Eso lo
 *      convierte en contenedor de scroll y la cabecera se fija a él, que nunca se
 *      desplaza: con 600px de scroll la cabecera acababa en -284. Solo un
 *      `!important` le gana a un estilo en línea. Con `visible` y no `clip`, una
 *      tabla más ancha que su caja desborda hacia la página, que sí hace scroll.
 *   2. El `<thead>` fijo crea contexto de apilamiento y las celdas del cuerpo van
 *      con `position: relative` (la regla 2 de la tabla-lista), así que sin
 *      `z-index` las filas pintaban ENCIMA de la cabecera. `isolation` encierra
 *      ese `z-index` en la tabla: gana a sus celdas (la casilla de PrimeNG trae
 *      `z-index: 1`) sin competir con menús, barra de selección ni diálogos.
 */
const stickyHeaderCss = () => `
${STICKY} > .p-datatable-table-container {
    overflow: visible !important;
    isolation: isolate;
}

${STICKY} > .p-datatable-table-container > .p-datatable-table > .p-datatable-thead {
    inset-block-start: 0;
    z-index: var(--sc-z-sticky);
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
${typographyRule(
    mdTypographySelectors,
    dt,
    "md",
    fromDesignPx(14),
    /* 20, no 21: DD-39 unificó el line-height md. El fallback solo entra si la variable
     * no resuelve, y hasta ahora contradecía al token — habría reintroducido justo el
     * 21 que costó semanas cazar. */
    fromDesignPx(20)
)}

${typographyRule(smTypographySelectors, dt, "sm", fromDesignPx(12), fromDesignPx(18))}

${typographyRule(lgTypographySelectors, dt, "lg", fromDesignPx(16), fromDesignPx(24))}

.p-button .p-button-icon {
    line-height: 1;
}

${baseTableCss()}
${emptyCaptionCss()}
${listBehaviorCss()}
${stickyHeaderCss()}
${tagOneLineCss()}

${buttonMotionCss()}

${dangerMenuItemCss()}
`;

export default presetCss;

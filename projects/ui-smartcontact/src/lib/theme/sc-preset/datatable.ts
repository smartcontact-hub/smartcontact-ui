import type { DataTableDesignTokens } from '@primeuix/themes/types/datatable';

/*
 * La tabla es Aura (DD-97 y el comentario de `index.ts`) salvo el RELLENO, los HUECOS y UNA clave oscura.
 *
 * El relleno (DD-214): cabecera, celdas y pie, en Default, sm y lg, leen los `--sc-cmp-datatable-*`
 * que el generador saca del Kit (`scripts/sizing-map.mjs`), atados a la escala: 10,5 × 14, sm
 * 5,25 × 7 y lg 14 × 17,5. Es lo que pintan el Kit y el DS de desarrollo; Aura 3 pide 8 × 14,
 * 2 × 6 y 12 × 18. Con el texto body-2 de `css.ts` (14/20), la fila de texto mide 42.
 *
 * Los huecos (DD-216), por el mismo camino: el de la celda de cabecera (título, orden y filtro), el
 * del filtro en línea y el del popover del filtro, a 7 (`scale/0-5`), como el Kit y el DS de
 * desarrollo; Aura 3 pide 8.
 *
 * La clave oscura: Aura pinta el borde de la celda seleccionada con `{primary.900}`, y nuestra
 * rampa `primary` es el navy de marca en los dos temas (el primario OSCURO es sky, pero solo en
 * color/hover/active): salía un filo blue-900 sobre zinc. Toma el paso que el Kit exporta para esa
 * clave, como `treetable`. Medido con `tools/aura-diff.mjs` el 2026-09-14: la única clave oscura
 * que leía el navy (DD-99). No añadas nada más aquí sin pasar antes por `aura-diff`: manda Aura.
 */
 export default {
    header: {
        padding: "var(--sc-cmp-datatable-header-padding-y) var(--sc-cmp-datatable-header-padding-x)",
        sm: {
            padding: "var(--sc-cmp-datatable-header-sm-padding-y) var(--sc-cmp-datatable-header-sm-padding-x)"
        },
        lg: {
            padding: "var(--sc-cmp-datatable-header-lg-padding-y) var(--sc-cmp-datatable-header-lg-padding-x)"
        }
    },
    headerCell: {
        gap: "var(--sc-cmp-datatable-header-cell-gap)",
        padding: "var(--sc-cmp-datatable-header-cell-padding-y) var(--sc-cmp-datatable-header-cell-padding-x)",
        sm: {
            padding: "var(--sc-cmp-datatable-header-cell-sm-padding-y) var(--sc-cmp-datatable-header-cell-sm-padding-x)"
        },
        lg: {
            padding: "var(--sc-cmp-datatable-header-cell-lg-padding-y) var(--sc-cmp-datatable-header-cell-lg-padding-x)"
        }
    },
    bodyCell: {
        padding: "var(--sc-cmp-datatable-body-cell-padding-y) var(--sc-cmp-datatable-body-cell-padding-x)",
        sm: {
            padding: "var(--sc-cmp-datatable-body-cell-sm-padding-y) var(--sc-cmp-datatable-body-cell-sm-padding-x)"
        },
        lg: {
            padding: "var(--sc-cmp-datatable-body-cell-lg-padding-y) var(--sc-cmp-datatable-body-cell-lg-padding-x)"
        }
    },
    footerCell: {
        padding: "var(--sc-cmp-datatable-footer-cell-padding-y) var(--sc-cmp-datatable-footer-cell-padding-x)",
        sm: {
            padding: "var(--sc-cmp-datatable-footer-cell-sm-padding-y) var(--sc-cmp-datatable-footer-cell-sm-padding-x)"
        },
        lg: {
            padding: "var(--sc-cmp-datatable-footer-cell-lg-padding-y) var(--sc-cmp-datatable-footer-cell-lg-padding-x)"
        }
    },
    footer: {
        padding: "var(--sc-cmp-datatable-footer-padding-y) var(--sc-cmp-datatable-footer-padding-x)",
        sm: {
            padding: "var(--sc-cmp-datatable-footer-sm-padding-y) var(--sc-cmp-datatable-footer-sm-padding-x)"
        },
        lg: {
            padding: "var(--sc-cmp-datatable-footer-lg-padding-y) var(--sc-cmp-datatable-footer-lg-padding-x)"
        }
    },
    filter: {
        inlineGap: "var(--sc-cmp-datatable-filter-inline-gap)",
        overlayPopover: {
            gap: "var(--sc-cmp-datatable-filter-overlay-popover-gap)"
        }
    },
    colorScheme: {
        dark: {
            bodyCell: {
                selectedBorderColor: "var(--sc-cmp-datatable-body-cell-selected-border-color)"
            }
        }
    }
} satisfies DataTableDesignTokens;

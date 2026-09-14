import type { DataTableDesignTokens } from '@primeuix/themes/types/datatable';

/*
 * La tabla es Aura pura (DD-97 y el comentario de `index.ts`) salvo UNA clave, y solo en oscuro.
 * Aura pinta el borde de la celda seleccionada con `{primary.900}`, y nuestra rampa `primary` es
 * el navy de marca en los dos temas (el primario OSCURO es sky, pero solo en color/hover/active):
 * salía un filo blue-900 sobre zinc. Toma el paso que el Kit exporta para esa clave, como
 * `treetable`. Medido con `tools/aura-diff.mjs` el 2026-09-14: la única clave oscura que leía el
 * navy (DD-99). No añadas nada más aquí sin pasar antes por `aura-diff`: manda Aura.
 */
 export default {
    colorScheme: {
        dark: {
            bodyCell: {
                selectedBorderColor: "var(--sc-cmp-datatable-body-cell-selected-border-color)"
            }
        }
    }
} satisfies DataTableDesignTokens;

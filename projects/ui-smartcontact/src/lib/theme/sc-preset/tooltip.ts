import type { TooltipDesignTokens } from '@primeuix/themes/types/tooltip';

 export default {
    root: {
        gutter: "var(--sc-cmp-tooltip-gutter)",
        shadow: "var(--sc-cmp-tooltip-shadow)",
        padding: "var(--sc-cmp-tooltip-padding-y) var(--sc-cmp-tooltip-padding-x)",
        maxWidth: "var(--sc-cmp-tooltip-max-width)",
        /* 14, no el 12 de Aura (2026-09-13): el Kit dibuja el texto del tooltip a 14 regular
         * (`tooltip-tooltip`, 623:36926) y así casa con menús y desplegables. Por TOKEN y no
         * con una regla en `css.ts`: la hoja de Aura ya lee `tooltip.font.size`, y una clase
         * `.p-tooltip-text` nuestra sería acoplamiento al DOM de PrimeNG que no hace falta
         * (`audit:primeng-coupling`). El interlineado no tiene token: heredaba el 1.5 de la página (21), y desde el
         * 2026-10-09 lo pone `css.ts`, el de la rampa (20), sin tocar la letra. */
        fontSize: "var(--sc-font-size-200)",
        borderRadius: "{overlay.popover.border.radius}"
    },
    colorScheme: {
        dark: {
            root: {
                color: "var(--sc-cmp-tooltip-color)",
                background: "var(--sc-cmp-tooltip-background)"
            }
        },
        light: {
            root: {
                color: "var(--sc-cmp-tooltip-color)",
                background: "var(--sc-cmp-tooltip-background)"
            }
        }
    }
} satisfies TooltipDesignTokens;
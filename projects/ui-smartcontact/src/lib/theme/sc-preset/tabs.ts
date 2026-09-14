import type { TabsDesignTokens } from '@primeuix/themes/types/tabs';

/* Bordes como Aura 3 (DD-97: donde PrimeOne y Aura 3 difieren, el código sigue a Aura 3). La pestaña no tiene
 * borde, la tira solo abajo y la marca de la activa es `activeBar`. Antes el `1` del Kit se escribía
 * `0.071429rem` en un shorthand de un valor, y PrimeNG lo aplica a los cuatro lados: cada pestaña salía como
 * una caja (medido en el Dashboard al usar p-tabs por primera vez, 2026-09-14). */

 export default {
    tab: {
        gap: "var(--sc-cmp-tabs-tab-gap)",
        color: "{text.muted.color}",
        margin: "0",
        padding: "var(--sc-cmp-tabs-tab-padding-y) var(--sc-cmp-tabs-tab-padding-x)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "-0.071429rem",
            shadow: "none"
        },
        background: "#00000000",
        fontWeight: "600",
        hoverColor: "{text.color}",
        activeColor: "{primary.color}",
        borderColor: "transparent",
        borderWidth: "0",
        hoverBackground: "#00000000",
        activeBackground: "#00000000",
        hoverBorderColor: "transparent",
        activeBorderColor: "transparent"
    },
    root: {
        transitionDuration: "{transition.duration}"
    },
    tablist: {
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderWidth: "0 0 0.071429rem 0"
    },
    tabpanel: {
        color: "{content.color}",
        padding: "var(--sc-cmp-tabs-tabpanel-padding-top) var(--sc-cmp-tabs-tabpanel-padding-right) var(--sc-cmp-tabs-tabpanel-padding-bottom) var(--sc-cmp-tabs-tabpanel-padding-left)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        background: "{content.background}"
    },
    activeBar: {
        bottom: "0",
        height: "0.071429rem",
        background: "{primary.color}"
    },
    navButton: {
        color: "{text.muted.color}",
        width: "var(--sc-cmp-tabs-nav-button-width)",
        shadow: "var(--sc-cmp-tabs-nav-button-shadow)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "-0.071429rem",
            shadow: "none"
        },
        background: "{content.background}",
        hoverColor: "{text.color}"
    }
} satisfies TabsDesignTokens;
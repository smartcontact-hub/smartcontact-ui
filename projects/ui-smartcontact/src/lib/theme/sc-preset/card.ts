import type { CardDesignTokens } from '@primeuix/themes/types/card';

 export default {
    body: {
        gap: "var(--sc-scale-0-5)",
        padding: "var(--sc-cmp-card-body-padding)"
    },
    root: {
        color: "{content.color}",
        shadow: "var(--sc-cmp-card-shadow)",
        background: "{content.background}",
        borderRadius: "{border.radius.xl}"
    },
    title: {
        fontSize: "var(--sc-font-size-400)",
        fontWeight: "500"
    },
    caption: {
        gap: "var(--sc-cmp-card-caption-gap)"
    },
    /* `fontSize: "1em"` = el de la tarjeta, como antes de Aura (2026-09-13). El Kit no le
     * da tamaño al subtítulo; Aura sí (`1rem`, 16px) y un valor propio le gana al heredado:
     * medido en la página de `sc-card` de sc-docs, el subtítulo creció y descuadró la
     * captura. Misma receta que título, mes y año de `datepicker.ts`. */
    subtitle: {
        fontSize: "1em",
        color: "{text.muted.color}"
    }
} satisfies CardDesignTokens;
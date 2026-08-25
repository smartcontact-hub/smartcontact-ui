import type { BreadcrumbDesignTokens } from '@primeuix/themes/types/breadcrumb';

 export default {
    item: {
        gap: "{navigation.item.gap}",
        icon: {
            color: "{navigation.item.icon.color}",
            hoverColor: "{navigation.item.icon.focus.color}"
        },
        color: "{text.muted.color}",
        /* El tamaño va aquí, en el TOKEN del componente, y no heredado del
         * contenedor. Medido el 2026-08-25: sin esta línea el `<p-breadcrumb>`
         * no fija `font-size` en ninguna parte —ni el preset ni el SCSS del
         * wrapper— así que HEREDA el de donde lo sueltes. En la TopBar del
         * supervisor eso daba **16px** cuando el DS dice 14, y en la demo de
         * sc-docs habría dado otro número: un componente del DS que mide
         * distinto según dónde caiga no es un componente del DS.
         *
         * 14 = `--sc-font-size-200`, el cuerpo de texto del DS, y es lo que
         * marca el maestro de Figma para la miga. */
        label: {
            fontSize: "var(--sc-font-size-200)"
        },
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        hoverColor: "{text.color}",
        borderRadius: "{content.border.radius}"
    },
    root: {
        gap: "var(--sc-scale-0-5)",
        padding: "var(--sc-scale-1)",
        background: "{content.background}",
        transitionDuration: "{transition.duration}"
    },
    separator: {
        color: "{navigation.item.icon.color}"
    }
} satisfies BreadcrumbDesignTokens;
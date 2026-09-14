import type { TagDesignTokens } from '@primeuix/themes/types/tag';

 export default {
    icon: {
        size: "var(--sc-cmp-tag-icon-size)"
    },
    root: {
        gap: "var(--sc-cmp-tag-gap)",
        /* `tag/padding/y` = scale/0-125 (1.75) y `tag/padding/x` = scale/0-5 (7) en el
         * maestro del Kit (DS › ❖ Tag, set 373:13337, leído el 2026-09-13). Aquí ponía
         * 0-25 (3.5): el tag medía 25 de alto contra los 21.5 del Kit. */
        padding: "var(--sc-cmp-tag-padding-y) var(--sc-cmp-tag-padding-x)",
        fontSize: "var(--sc-font-size-100)",
        fontWeight: "700",
        borderRadius: "{content.border.radius}",
        roundedBorderRadius: "{border.radius.xl}"
    },
    colorScheme: {
        dark: {
            info: {
                color: "var(--sc-cmp-tag-info-color)",
                background: "color-mix(in srgb, {sky.500}, transparent 84%)"
            },
            warn: {
                color: "var(--sc-cmp-tag-warn-color)",
                background: "var(--sc-cmp-tag-warn-background)"
            },
            danger: {
                color: "var(--sc-cmp-tag-danger-color)",
                background: "var(--sc-cmp-tag-danger-background)"
            },
            primary: {
                color: "var(--sc-cmp-tag-primary-color)",
                background: "var(--sc-cmp-tag-primary-background)"
            },
            success: {
                color: "var(--sc-cmp-tag-success-color)",
                background: "var(--sc-cmp-tag-success-background)"
            },
            contrast: {
                color: "{surface.950}",
                background: "var(--sc-cmp-tag-contrast-background)"
            },
            secondary: {
                color: "{surface.300}",
                background: "{surface.800}"
            }
        },
        light: {
            info: {
                color: "var(--sc-cmp-tag-info-color)",
                background: "var(--sc-cmp-tag-info-background)"
            },
            warn: {
                color: "var(--sc-cmp-tag-warn-color)",
                background: "var(--sc-cmp-tag-warn-background)"
            },
            danger: {
                color: "var(--sc-cmp-tag-danger-color)",
                background: "var(--sc-cmp-tag-danger-background)"
            },
            primary: {
                color: "{primary.700}",
                background: "{primary.100}"
            },
            success: {
                color: "var(--sc-cmp-tag-success-color)",
                background: "var(--sc-cmp-tag-success-background)"
            },
            contrast: {
                color: "var(--sc-cmp-tag-contrast-color)",
                background: "var(--sc-cmp-tag-contrast-background)"
            },
            secondary: {
                color: "var(--sc-cmp-tag-secondary-color)",
                background: "var(--sc-cmp-tag-secondary-background)"
            }
        }
    }
} satisfies TagDesignTokens;
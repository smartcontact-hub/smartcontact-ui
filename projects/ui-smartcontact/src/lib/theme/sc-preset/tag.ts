import type { TagDesignTokens } from '@primeuix/themes/types/tag';

 export default {
    icon: {
        size: "var(--sc-scale-0-75)"
    },
    root: {
        gap: "var(--sc-scale-0-25)",
        padding: "var(--sc-scale-0-25) var(--sc-scale-0-5)",
        fontSize: "var(--sc-font-size-100)",
        fontWeight: "700",
        borderRadius: "{content.border.radius}",
        roundedBorderRadius: "{border.radius.xl}"
    },
    colorScheme: {
        dark: {
            info: {
                color: "var(--sc-cmp-tag-info-color)",
                background: "#0ea5e929"
            },
            warn: {
                color: "{orange.300}",
                background: "var(--sc-cmp-tag-warn-background)"
            },
            danger: {
                color: "var(--sc-cmp-tag-danger-color)",
                background: "var(--sc-cmp-tag-danger-background)"
            },
            primary: {
                color: "{primary.300}",
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
                color: "{orange.700}",
                background: "{orange.100}"
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
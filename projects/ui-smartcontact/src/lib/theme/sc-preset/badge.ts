import type { BadgeDesignTokens } from '@primeuix/themes/types/badge';

 export default {
    lg: {
        height: "var(--sc-scale-1-75)",
        fontSize: "var(--sc-scale-0-875)",
        minWidth: "var(--sc-scale-1-75)"
    },
    sm: {
        height: "var(--sc-scale-1-25)",
        fontSize: "var(--sc-scale-0-625)",
        minWidth: "var(--sc-scale-1-25)"
    },
    xl: {
        height: "var(--sc-scale-2)",
        fontSize: "var(--sc-scale-1)",
        minWidth: "var(--sc-scale-2)"
    },
    dot: {
        size: "var(--sc-scale-0-5)"
    },
    root: {
        height: "var(--sc-scale-1-5)",
        padding: "0 var(--sc-scale-0-5)",
        fontSize: "var(--sc-scale-0-75)",
        minWidth: "var(--sc-scale-1-5)",
        fontWeight: "700",
        borderRadius: "{border.radius.md}"
    },
    colorScheme: {
        dark: {
            info: {
                color: "var(--sc-cmp-badge-info-color)",
                background: "var(--sc-cmp-badge-info-background)"
            },
            warn: {
                color: "{surface.950}",
                background: "{orange.400}"
            },
            danger: {
                color: "var(--sc-cmp-badge-danger-color)",
                background: "var(--sc-cmp-badge-danger-background)"
            },
            primary: {
                color: "{primary.contrast.color}",
                background: "{primary.color}"
            },
            success: {
                color: "{green.950}",
                background: "var(--sc-cmp-badge-success-background)"
            },
            contrast: {
                color: "{surface.950}",
                background: "var(--sc-cmp-badge-contrast-background)"
            },
            secondary: {
                color: "{surface.300}",
                background: "{surface.800}"
            }
        },
        light: {
            info: {
                color: "var(--sc-cmp-badge-info-color)",
                background: "var(--sc-cmp-badge-info-background)"
            },
            warn: {
                color: "var(--sc-cmp-badge-warn-color)",
                background: "{orange.500}"
            },
            danger: {
                color: "var(--sc-cmp-badge-danger-color)",
                background: "var(--sc-cmp-badge-danger-background)"
            },
            primary: {
                color: "{primary.contrast.color}",
                background: "{primary.color}"
            },
            success: {
                color: "var(--sc-cmp-badge-success-color)",
                background: "var(--sc-cmp-badge-success-background)"
            },
            contrast: {
                color: "var(--sc-cmp-badge-contrast-color)",
                background: "var(--sc-cmp-badge-contrast-background)"
            },
            secondary: {
                color: "var(--sc-cmp-badge-secondary-color)",
                background: "var(--sc-cmp-badge-secondary-background)"
            }
        }
    }
} satisfies BadgeDesignTokens;
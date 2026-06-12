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
                color: "{sky.950}",
                background: "{sky.400}"
            },
            warn: {
                color: "{surface.950}",
                background: "{orange.400}"
            },
            danger: {
                color: "{red.950}",
                background: "{red.400}"
            },
            primary: {
                color: "{primary.contrast.color}",
                background: "{primary.color}"
            },
            success: {
                color: "{green.950}",
                background: "{green.400}"
            },
            contrast: {
                color: "{surface.950}",
                background: "{surface.0}"
            },
            secondary: {
                color: "{surface.300}",
                background: "{surface.800}"
            }
        },
        light: {
            info: {
                color: "{surface.0}",
                background: "{sky.500}"
            },
            warn: {
                color: "{surface.0}",
                background: "{orange.500}"
            },
            danger: {
                color: "{surface.0}",
                background: "{red.500}"
            },
            primary: {
                color: "{primary.contrast.color}",
                background: "{primary.color}"
            },
            success: {
                color: "{surface.0}",
                background: "{green.500}"
            },
            contrast: {
                color: "{surface.0}",
                background: "{surface.950}"
            },
            secondary: {
                color: "{surface.600}",
                background: "{surface.100}"
            }
        }
    }
} satisfies BadgeDesignTokens;
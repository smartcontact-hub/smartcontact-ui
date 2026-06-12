import type { TagDesignTokens } from '@primeuix/themes/types/tag';

 export default {
    icon: {
        size: "0.75rem"
    },
    root: {
        gap: "0.25rem",
        padding: "0.25rem 0.5rem",
        fontSize: "0.875rem",
        fontWeight: "700",
        borderRadius: "{content.border.radius}",
        roundedBorderRadius: "{border.radius.xl}"
    },
    colorScheme: {
        dark: {
            info: {
                color: "{sky.300}",
                background: "#0ea5e929"
            },
            warn: {
                color: "{orange.300}",
                background: "#f9731629"
            },
            danger: {
                color: "{red.300}",
                background: "#ef444429"
            },
            primary: {
                color: "{primary.300}",
                background: "#10b98129"
            },
            success: {
                color: "{green.300}",
                background: "#22c55e29"
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
                color: "{sky.700}",
                background: "{sky.100}"
            },
            warn: {
                color: "{orange.700}",
                background: "{orange.100}"
            },
            danger: {
                color: "{red.700}",
                background: "{red.100}"
            },
            primary: {
                color: "{primary.700}",
                background: "{primary.100}"
            },
            success: {
                color: "{green.700}",
                background: "{green.100}"
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
} satisfies TagDesignTokens;
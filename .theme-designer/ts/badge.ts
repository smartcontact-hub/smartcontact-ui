import type { BadgeDesignTokens } from '@primeuix/themes/types/badge';

 export default {
    root: {
        borderRadius: "{border.radius.md}",
        padding: "0 0.5rem",
        fontSize: "0.75rem",
        fontWeight: "{primitive.typography.font.weight.bold}",
        minWidth: "1.5rem",
        height: "1.5rem"
    },
    dot: {
        size: "0.5rem"
    },
    sm: {
        fontSize: "0.625rem",
        minWidth: "1.25rem",
        height: "1.25rem"
    },
    lg: {
        fontSize: "0.875rem",
        minWidth: "1.75rem",
        height: "1.75rem"
    },
    xl: {
        fontSize: "1rem",
        minWidth: "2rem",
        height: "2rem"
    },
    primary: {
        background: "{primary.color}",
        color: "{primary.contrast.color}"
    },
    secondary: {
        background: "light-dark({surface.100}, {surface.800})",
        color: "light-dark({surface.600}, {surface.300})"
    },
    success: {
        background: "light-dark({green.500}, {green.400})",
        color: "light-dark({surface.0}, {green.950})"
    },
    info: {
        background: "light-dark({sky.500}, {sky.400})",
        color: "light-dark({surface.0}, {sky.950})"
    },
    warn: {
        background: "light-dark({yellow.700}, {yellow.300})",
        color: "light-dark({surface.0}, {surface.950})"
    },
    danger: {
        background: "light-dark({red.500}, {red.400})",
        color: "light-dark({surface.0}, {red.950})"
    },
    contrast: {
        background: "light-dark({surface.950}, {surface.0})",
        color: "light-dark({surface.0}, {surface.950})"
    }
} satisfies BadgeDesignTokens;
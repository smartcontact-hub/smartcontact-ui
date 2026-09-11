import type { TagDesignTokens } from '@primeuix/themes/types/tag';

 export default {
    root: {
        fontSize: "{primitive.typography.font.size.100}",
        fontWeight: "{primitive.typography.font.weight.bold}",
        padding: "0.125rem 0.5rem",
        gap: "0.25rem",
        borderRadius: "{content.border.radius}",
        roundedBorderRadius: "{border.radius.xl}"
    },
    icon: {
        size: "0.75rem"
    },
    primary: {
        background: "light-dark({primary.100}, #10b98129)",
        color: "light-dark({primary.700}, {primary.300})"
    },
    secondary: {
        background: "light-dark({surface.100}, {surface.800})",
        color: "light-dark({surface.600}, {surface.300})"
    },
    success: {
        background: "light-dark({green.100}, #22c55e29)",
        color: "light-dark({green.700}, {green.300})"
    },
    info: {
        background: "light-dark({sky.100}, #0ea5e929)",
        color: "light-dark({sky.700}, {sky.300})"
    },
    warn: {
        background: "light-dark({yellow.100}, #facc1529)",
        color: "light-dark({yellow.700}, {yellow.300})"
    },
    danger: {
        background: "light-dark({red.100}, #ef444429)",
        color: "light-dark({red.700}, {red.300})"
    },
    contrast: {
        background: "light-dark({surface.950}, {surface.0})",
        color: "light-dark({surface.0}, {surface.950})"
    }
} satisfies TagDesignTokens;
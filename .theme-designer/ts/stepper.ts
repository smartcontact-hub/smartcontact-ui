import type { StepperDesignTokens } from '@primeuix/themes/types/stepper';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    separator: {
        background: "{content.border.color}",
        activeBackground: "{primary.color}",
        margin: "0 0 0 1.625rem",
        size: "2px"
    },
    step: {
        padding: "0.5rem",
        gap: "1rem"
    },
    stepHeader: {
        padding: "0",
        borderRadius: "{content.border.radius}",
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            color: "{focus.ring.color}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        gap: "0.5rem"
    },
    stepTitle: {
        color: "{text.muted.color}",
        activeColor: "{primary.color}",
        fontWeight: "{primitive.typography.font.weight.medium}"
    },
    stepNumber: {
        background: "{content.background}",
        activeBackground: "{content.background}",
        borderColor: "{content.border.color}",
        activeBorderColor: "{content.border.color}",
        color: "{text.muted.color}",
        activeColor: "{primary.color}",
        size: "2rem",
        fontSize: "{primitive.typography.font.size.300}",
        fontWeight: "{primitive.typography.font.weight.medium}",
        borderRadius: "1rem",
        shadow: "0 1px 1px 0 #0000001f, 0 1px 0 0 #0000000f"
    },
    steppanels: {
        padding: "0.875rem 0.5rem 1.125rem"
    },
    steppanel: {
        background: "{content.background}",
        color: "{content.color}",
        padding: "0",
        indent: "1rem"
    }
} satisfies StepperDesignTokens;
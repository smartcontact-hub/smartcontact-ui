import type { StepperDesignTokens } from '@primeuix/themes/types/stepper';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    step: {
        gap: "var(--sc-scale-1)",
        padding: "var(--sc-scale-0-5)"
    },
    separator: {
        size: "0.142857rem",
        margin: "0 0 0 var(--sc-scale-1-625)",
        background: "{content.border.color}",
        activeBackground: "{primary.color}"
    },
    stepTitle: {
        color: "{text.muted.color}",
        fontWeight: "500",
        activeColor: "{primary.color}"
    },
    steppanel: {
        color: "{content.color}",
        indent: "var(--sc-scale-1)",
        padding: "0",
        background: "{content.background}"
    },
    stepHeader: {
        gap: "var(--sc-scale-0-5)",
        padding: "0",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        borderRadius: "{content.border.radius}"
    },
    stepNumber: {
        size: "var(--sc-scale-2)",
        color: "{text.muted.color}",
        shadow: "0 0.071429rem 0.071429rem 0 #0000001f, 0 0.071429rem 0 0 #0000000f",
        fontSize: "var(--sc-scale-1-143)",
        background: "{content.background}",
        fontWeight: "500",
        activeColor: "{primary.color}",
        borderColor: "{content.border.color}",
        borderRadius: "var(--sc-scale-1)",
        activeBackground: "{content.background}",
        activeBorderColor: "{content.border.color}"
    },
    steppanels: {
        padding: "var(--sc-scale-0-875) var(--sc-scale-0-5) var(--sc-scale-1-125)"
    }
} satisfies StepperDesignTokens;
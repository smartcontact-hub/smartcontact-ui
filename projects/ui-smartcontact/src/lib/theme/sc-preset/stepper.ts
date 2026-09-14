import type { StepperDesignTokens } from '@primeuix/themes/types/stepper';

 export default {
    root: {
        transitionDuration: "{transition.duration}"
    },
    step: {
        gap: "var(--sc-cmp-stepper-step-gap)",
        padding: "var(--sc-cmp-stepper-step-padding)"
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
        gap: "var(--sc-cmp-stepper-step-header-gap)",
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
        size: "var(--sc-cmp-stepper-step-number-size)",
        color: "{text.muted.color}",
        shadow: "var(--sc-cmp-stepper-step-number-shadow)",
        fontSize: "var(--sc-scale-1-143)",
        background: "{content.background}",
        fontWeight: "500",
        activeColor: "{primary.color}",
        borderColor: "{content.border.color}",
        borderRadius: "var(--sc-cmp-stepper-step-number-border-radius)",
        activeBackground: "{content.background}",
        activeBorderColor: "{content.border.color}"
    },
    steppanels: {
        padding: "var(--sc-scale-0-875) var(--sc-scale-0-5) var(--sc-scale-1-125)"
    }
} satisfies StepperDesignTokens;
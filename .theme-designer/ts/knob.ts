import type { KnobDesignTokens } from '@primeuix/themes/types/knob';

 export default {
    root: {
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        transitionDuration: "{transition.duration}"
    },
    text: {
        color: "{text.muted.color}"
    },
    range: {
        background: "{content.border.color}"
    },
    value: {
        background: "{primary.color}"
    }
} satisfies KnobDesignTokens;
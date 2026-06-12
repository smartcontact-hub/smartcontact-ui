import type { RatingDesignTokens } from '@primeuix/themes/types/rating';

 export default {
    icon: {
        size: "var(--sc-scale-1)",
        color: "{text.muted.color}",
        hoverColor: "{primary.color}",
        activeColor: "{primary.color}"
    },
    root: {
        gap: "var(--sc-scale-0-25)",
        focusRing: {
            color: "{focus.ring.color}",
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}",
            shadow: "none"
        },
        transitionDuration: "{transition.duration}"
    }
} satisfies RatingDesignTokens;
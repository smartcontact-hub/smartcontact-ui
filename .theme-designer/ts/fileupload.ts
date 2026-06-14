import type { FileUploadDesignTokens } from '@primeuix/themes/types/fileupload';

 export default {
    file: {
        gap: "1rem",
        info: {
            gap: "0.5rem"
        },
        padding: "1rem",
        borderColor: "{content.border.color}"
    },
    root: {
        color: "{content.color}",
        background: "{content.background}",
        borderColor: "{content.border.color}",
        borderRadius: "{content.border.radius}",
        transitionDuration: "{transition.duration}"
    },
    basic: {
        gap: "0.5rem"
    },
    header: {
        gap: "0.5rem",
        color: "{text.color}",
        padding: "1.125rem",
        background: "#00000000",
        borderColor: "#00000000",
        borderWidth: "0",
        borderRadius: "0"
    },
    content: {
        gap: "1rem",
        padding: "0 1.125rem 1.125rem",
        highlightBorderColor: "{primary.color}"
    },
    fileList: {
        gap: "0.5rem"
    },
    progressbar: {
        height: "0.25rem"
    }
} satisfies FileUploadDesignTokens;
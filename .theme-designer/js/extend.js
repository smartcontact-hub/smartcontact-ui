export default {
    typography: {
        font: {
            size: {
                100: "12px",
                200: "14px",
                300: "16px",
                400: "18px",
                450: "20px",
                500: "24px",
                650: "32px",
                800: "48px"
            }
        },
        line: {
            height: {
                100: "18px",
                200: "20px",
                300: "24px",
                450: "28px",
                500: "36px",
                650: "40px",
                800: "58px"
            }
        }
    },
    bulk transcription modal: {
        color: "{overlay.modal.color}",
        title: {
            font: {
                size: "{typography.font.size.400}",
                weight: "600px"
            }
        },
        border: {
            color: "{overlay.modal.border.color}",
            radius: "{overlay.modal.border.radius}"
        },
        footer: {
            gap: "0.5rem",
            padding: {
                top: "0",
                left: "{overlay.modal.padding}",
                right: "{overlay.modal.padding}",
                bottom: "{overlay.modal.padding}"
            }
        },
        header: {
            gap: "0.5rem",
            padding: "{overlay.modal.padding}"
        },
        content: {
            padding: {
                top: "0",
                left: "{overlay.modal.padding}",
                right: "{overlay.modal.padding}",
                bottom: "{overlay.modal.padding}"
            }
        },
        subheader: {
            gap: "0.5rem",
            color: "{form.field.float.label.color}",
            padding: "{overlay.modal.padding}"
        },
        background: "{overlay.modal.background}"
    }
}
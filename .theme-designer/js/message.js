export default {
    root: {
        borderRadius: "{content.border.radius}",
        borderWidth: "1px",
        transitionDuration: "{transition.duration}"
    },
    content: {
        padding: "0.5rem 0.75rem",
        gap: "0.5rem",
        sm: {
            padding: "0.375rem 0.625rem"
        },
        lg: {
            padding: "0.625rem 0.875rem"
        }
    },
    text: {
        fontSize: "{primitive.typography.font.size.200}",
        fontWeight: "{primitive.typography.font.weight.medium}",
        sm: {
            fontSize: "{primitive.typography.font.size.100}"
        },
        lg: {
            fontSize: "{primitive.typography.font.size.300}"
        }
    },
    icon: {
        size: "1.125rem",
        sm: {
            size: "1rem"
        },
        lg: {
            size: "1.25rem"
        }
    },
    closeButton: {
        width: "1.75rem",
        height: "1.75rem",
        borderRadius: "0.875rem",
        focusRing: {
            width: "{focus.ring.width}",
            style: "{focus.ring.style}",
            offset: "{focus.ring.offset}"
        }
    },
    closeIcon: {
        size: "1rem",
        sm: {
            size: "0.875rem"
        },
        lg: {
            size: "1.125rem"
        }
    },
    outlined: {
        root: {
            borderWidth: "1px"
        }
    },
    simple: {
        content: {
            padding: "0"
        }
    },
    info: {
        background: "light-dark(#eef4fff2, #7db3ff29)",
        borderColor: "light-dark({sky.200}, #0369a15c)",
        color: "light-dark({sky.600}, {sky.300})",
        shadow: "0 4px 8px 0 #02050a0a",
        closeButton: {
            hoverBackground: "light-dark({sky.100}, #ffffff0d)",
            focusRing: {
                color: "light-dark({sky.600}, {sky.300})",
                shadow: "none"
            }
        },
        outlined: {
            color: "light-dark({sky.600}, {sky.300})",
            borderColor: "light-dark({sky.600}, {sky.300})"
        },
        simple: {
            color: "light-dark({sky.600}, {sky.300})"
        }
    },
    success: {
        background: "light-dark(#f0fdf4f2, #22c55e29)",
        borderColor: "light-dark({green.200}, #15803d5c)",
        color: "light-dark({green.600}, {green.500})",
        shadow: "0 4px 8px 0 #0108040a",
        closeButton: {
            hoverBackground: "light-dark({green.100}, #ffffff0d)",
            focusRing: {
                color: "light-dark({green.600}, {green.500})",
                shadow: "none"
            }
        },
        outlined: {
            color: "light-dark({green.600}, {green.500})",
            borderColor: "light-dark({green.600}, {green.500})"
        },
        simple: {
            color: "light-dark({green.600}, {green.500})"
        }
    },
    warn: {
        background: "light-dark(#fefce8f2, #eab30829)",
        borderColor: "light-dark({yellow.200}, #a162075c)",
        color: "light-dark({yellow.700}, {yellow.300})",
        shadow: "0 4px 8px 0 #0907000a",
        closeButton: {
            hoverBackground: "light-dark({yellow.100}, #ffffff0d)",
            focusRing: {
                color: "light-dark({yellow.700}, {yellow.300})",
                shadow: "none"
            }
        },
        outlined: {
            color: "light-dark({yellow.700}, {yellow.300})",
            borderColor: "light-dark({yellow.700}, {yellow.300})"
        },
        simple: {
            color: "light-dark({yellow.700}, {yellow.300})"
        }
    },
    error: {
        background: "light-dark(#fef2f2f2, #ef444429)",
        borderColor: "light-dark({red.200}, #b91c1c5c)",
        color: "light-dark({red.600}, {red.500})",
        shadow: "0 4px 8px 0 #0a03030a",
        closeButton: {
            hoverBackground: "light-dark({red.100}, #ffffff0d)",
            focusRing: {
                color: "light-dark({red.600}, {red.500})",
                shadow: "none"
            }
        },
        outlined: {
            color: "light-dark({red.600}, {red.500})",
            borderColor: "light-dark({red.600}, {red.500})"
        },
        simple: {
            color: "light-dark({red.600}, {red.500})"
        }
    },
    secondary: {
        background: "light-dark({surface.100}, {surface.800})",
        borderColor: "light-dark({surface.200}, {surface.700})",
        color: "light-dark({surface.600}, {surface.300})",
        shadow: "0 4px 8px 0 #0405060a",
        closeButton: {
            hoverBackground: "light-dark({surface.200}, {surface.700})",
            focusRing: {
                color: "light-dark({surface.600}, {surface.300})",
                shadow: "none"
            }
        },
        outlined: {
            color: "light-dark({surface.500}, {surface.400})",
            borderColor: "light-dark({surface.500}, {surface.400})"
        },
        simple: {
            color: "light-dark({surface.500}, {surface.400})"
        }
    },
    contrast: {
        background: "light-dark({surface.900}, {surface.0})",
        borderColor: "light-dark({surface.950}, {surface.100})",
        color: "light-dark({surface.50}, {surface.950})",
        shadow: "0 4px 8px 0 #0000010a",
        closeButton: {
            hoverBackground: "light-dark({surface.800}, {surface.100})",
            focusRing: {
                color: "light-dark({surface.50}, {surface.950})",
                shadow: "none"
            }
        },
        outlined: {
            color: "light-dark({surface.950}, {surface.0})",
            borderColor: "light-dark({surface.950}, {surface.0})"
        },
        simple: {
            color: "light-dark({surface.950}, {surface.0})"
        }
    }
}
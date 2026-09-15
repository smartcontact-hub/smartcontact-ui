import type { ButtonDesignTokens } from '@primeuix/themes/types/button';

 export default {
    root: {
        lg: {
            fontSize: "var(--sc-cmp-button-lg-font-size)",
            paddingX: "var(--sc-cmp-button-lg-padding-x)",
            paddingY: "var(--sc-cmp-button-lg-padding-y)",
            iconOnlyWidth: "var(--sc-cmp-button-lg-icon-only-width)"
        },
        sm: {
            fontSize: "var(--sc-cmp-button-sm-font-size)",
            paddingX: "var(--sc-cmp-button-sm-padding-x)",
            paddingY: "var(--sc-cmp-button-sm-padding-y)",
            iconOnlyWidth: "var(--sc-cmp-button-sm-icon-only-width)"
        },
        gap: "var(--sc-cmp-button-gap)",
        help: {
            focusRing: {
                shadow: "none"
            }
        },
        info: {
            focusRing: {
                shadow: "none"
            }
        },
        warn: {
            focusRing: {
                shadow: "none"
            }
        },
        label: {
            fontWeight: "500"
        },
        danger: {
            focusRing: {
                shadow: "none"
            }
        },
        primary: {
            focusRing: {
                shadow: "none"
            }
        },
        success: {
            focusRing: {
                shadow: "none"
            }
        },
        contrast: {
            focusRing: {
                shadow: "none"
            }
        },
        paddingX: "var(--sc-cmp-button-padding-x)",
        paddingY: "var(--sc-cmp-button-padding-y)",
        badgeSize: "var(--sc-scale-1)",
        focusRing: {
            style: "{focus.ring.style}",
            width: "{focus.ring.width}",
            offset: "{focus.ring.offset}"
        },
        secondary: {
            focusRing: {
                shadow: "none"
            }
        },
        borderRadius: "var(--sc-cmp-button-border-radius)",
        raisedShadow: "0 0.071429rem 0.357143rem 0 #0000001f, 0 0.142857rem 0.142857rem 0 #00000024, 0 0.214286rem 0.071429rem -0.142857rem #00000033",
        iconOnlyWidth: "var(--sc-cmp-button-icon-only-width)",
        transitionDuration: "{form.field.transition.duration}",
        roundedBorderRadius: "var(--sc-cmp-button-rounded-border-radius)"
    },
    colorScheme: {
        dark: {
            link: {
                color: "{primary.color}",
                hoverColor: "{primary.color}",
                activeColor: "{primary.color}"
            },
            root: {
                help: {
                    color: "var(--sc-cmp-button-help-color)",
                    focusRing: {
                        color: "var(--sc-cmp-button-help-focus-ring-color)"
                    },
                    background: "var(--sc-cmp-button-help-background)",
                    hoverColor: "var(--sc-cmp-button-help-hover-color)",
                    activeColor: "var(--sc-cmp-button-help-active-color)",
                    borderColor: "var(--sc-cmp-button-help-border-color)",
                    hoverBackground: "var(--sc-cmp-button-help-hover-background)",
                    activeBackground: "var(--sc-cmp-button-help-active-background)",
                    hoverBorderColor: "var(--sc-cmp-button-help-hover-border-color)",
                    activeBorderColor: "var(--sc-cmp-button-help-active-border-color)"
                },
                info: {
                    color: "var(--sc-cmp-button-info-color)",
                    focusRing: {
                        color: "var(--sc-cmp-button-info-focus-ring-color)"
                    },
                    background: "var(--sc-cmp-button-info-background)",
                    hoverColor: "var(--sc-cmp-button-info-hover-color)",
                    activeColor: "var(--sc-cmp-button-info-active-color)",
                    borderColor: "var(--sc-cmp-button-info-border-color)",
                    hoverBackground: "var(--sc-cmp-button-info-hover-background)",
                    activeBackground: "var(--sc-cmp-button-info-active-background)",
                    hoverBorderColor: "var(--sc-cmp-button-info-hover-border-color)",
                    activeBorderColor: "var(--sc-cmp-button-info-active-border-color)"
                },
                warn: {
                    color: "var(--sc-cmp-button-warn-color)",
                    focusRing: {
                        color: "var(--sc-cmp-button-warn-focus-ring-color)"
                    },
                    background: "var(--sc-cmp-button-warn-background)",
                    hoverColor: "var(--sc-cmp-button-warn-hover-color)",
                    activeColor: "var(--sc-cmp-button-warn-active-color)",
                    borderColor: "var(--sc-cmp-button-warn-border-color)",
                    hoverBackground: "var(--sc-cmp-button-warn-hover-background)",
                    activeBackground: "var(--sc-cmp-button-warn-active-background)",
                    hoverBorderColor: "var(--sc-cmp-button-warn-hover-border-color)",
                    activeBorderColor: "var(--sc-cmp-button-warn-active-border-color)"
                },
                danger: {
                    color: "var(--sc-cmp-button-danger-color)",
                    focusRing: {
                        color: "var(--sc-cmp-button-danger-focus-ring-color)"
                    },
                    background: "var(--sc-cmp-button-danger-background)",
                    hoverColor: "var(--sc-cmp-button-danger-hover-color)",
                    activeColor: "var(--sc-cmp-button-danger-active-color)",
                    borderColor: "var(--sc-cmp-button-danger-border-color)",
                    hoverBackground: "var(--sc-cmp-button-danger-hover-background)",
                    activeBackground: "var(--sc-cmp-button-danger-active-background)",
                    hoverBorderColor: "var(--sc-cmp-button-danger-hover-border-color)",
                    activeBorderColor: "var(--sc-cmp-button-danger-active-border-color)"
                },
                primary: {
                    color: "{primary.contrast.color}",
                    focusRing: {
                        color: "{primary.color}"
                    },
                    background: "{primary.color}",
                    hoverColor: "{primary.contrast.color}",
                    activeColor: "{primary.contrast.color}",
                    borderColor: "{primary.color}",
                    hoverBackground: "{primary.hover.color}",
                    activeBackground: "{primary.active.color}",
                    hoverBorderColor: "{primary.hover.color}",
                    activeBorderColor: "{primary.active.color}"
                },
                success: {
                    color: "{green.950}",
                    focusRing: {
                        color: "var(--sc-cmp-button-success-focus-ring-color)"
                    },
                    background: "var(--sc-cmp-button-success-background)",
                    hoverColor: "{green.950}",
                    activeColor: "{green.950}",
                    borderColor: "var(--sc-cmp-button-success-border-color)",
                    hoverBackground: "var(--sc-cmp-button-success-hover-background)",
                    activeBackground: "var(--sc-cmp-button-success-active-background)",
                    hoverBorderColor: "var(--sc-cmp-button-success-hover-border-color)",
                    activeBorderColor: "var(--sc-cmp-button-success-active-border-color)"
                },
                contrast: {
                    color: "var(--sc-cmp-button-contrast-color)",
                    focusRing: {
                        color: "var(--sc-cmp-button-contrast-focus-ring-color)"
                    },
                    background: "var(--sc-cmp-button-contrast-background)",
                    hoverColor: "var(--sc-cmp-button-contrast-hover-color)",
                    activeColor: "var(--sc-cmp-button-contrast-active-color)",
                    borderColor: "var(--sc-cmp-button-contrast-border-color)",
                    hoverBackground: "var(--sc-cmp-button-contrast-hover-background)",
                    activeBackground: "var(--sc-cmp-button-contrast-active-background)",
                    hoverBorderColor: "var(--sc-cmp-button-contrast-hover-border-color)",
                    activeBorderColor: "var(--sc-cmp-button-contrast-active-border-color)"
                },
                secondary: {
                    color: "var(--sc-cmp-button-secondary-color)",
                    focusRing: {
                        color: "var(--sc-cmp-button-secondary-focus-ring-color)"
                    },
                    background: "var(--sc-cmp-button-secondary-background)",
                    hoverColor: "var(--sc-cmp-button-secondary-hover-color)",
                    activeColor: "var(--sc-cmp-button-secondary-active-color)",
                    borderColor: "var(--sc-cmp-button-secondary-border-color)",
                    hoverBackground: "var(--sc-cmp-button-secondary-hover-background)",
                    activeBackground: "var(--sc-cmp-button-secondary-active-background)",
                    hoverBorderColor: "var(--sc-cmp-button-secondary-hover-border-color)",
                    activeBorderColor: "var(--sc-cmp-button-secondary-active-border-color)"
                }
            },
            text: {
                help: {
                    color: "var(--sc-cmp-button-text-help-color)",
                    hoverBackground: "var(--sc-cmp-button-text-help-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-help-active-background)"
                },
                info: {
                    color: "var(--sc-cmp-button-text-info-color)",
                    hoverBackground: "color-mix(in srgb, {sky.400}, transparent 96%)",
                    activeBackground: "color-mix(in srgb, {sky.400}, transparent 84%)"
                },
                warn: {
                    color: "var(--sc-cmp-button-text-warn-color)",
                    hoverBackground: "var(--sc-cmp-button-text-warn-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-warn-active-background)"
                },
                plain: {
                    color: "var(--sc-cmp-button-text-plain-color)",
                    hoverBackground: "{surface.800}",
                    activeBackground: "{surface.700}"
                },
                danger: {
                    color: "var(--sc-cmp-button-text-danger-color)",
                    hoverBackground: "var(--sc-cmp-button-text-danger-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-danger-active-background)"
                },
                primary: {
                    color: "{primary.color}",
                    hoverBackground: "var(--sc-cmp-button-text-primary-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-primary-active-background)"
                },
                success: {
                    color: "var(--sc-cmp-button-text-success-color)",
                    hoverBackground: "var(--sc-cmp-button-text-success-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-success-active-background)"
                },
                contrast: {
                    color: "var(--sc-cmp-button-text-contrast-color)",
                    hoverBackground: "{surface.800}",
                    activeBackground: "{surface.700}"
                },
                secondary: {
                    color: "{surface.400}",
                    hoverBackground: "{surface.800}",
                    activeBackground: "{surface.700}"
                }
            },
            outlined: {
                help: {
                    color: "var(--sc-cmp-button-outlined-help-color)",
                    borderColor: "var(--sc-cmp-button-outlined-help-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-help-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-help-active-background)"
                },
                info: {
                    color: "var(--sc-cmp-button-outlined-info-color)",
                    borderColor: "var(--sc-cmp-button-outlined-info-border-color)",
                    hoverBackground: "color-mix(in srgb, {sky.400}, transparent 96%)",
                    activeBackground: "color-mix(in srgb, {sky.400}, transparent 84%)"
                },
                warn: {
                    color: "var(--sc-cmp-button-outlined-warn-color)",
                    borderColor: "var(--sc-cmp-button-outlined-warn-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-warn-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-warn-active-background)"
                },
                plain: {
                    color: "var(--sc-cmp-button-outlined-plain-color)",
                    borderColor: "{surface.600}",
                    hoverBackground: "{surface.800}",
                    activeBackground: "{surface.700}"
                },
                danger: {
                    color: "var(--sc-cmp-button-outlined-danger-color)",
                    borderColor: "var(--sc-cmp-button-outlined-danger-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-danger-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-danger-active-background)"
                },
                primary: {
                    color: "{primary.color}",
                    borderColor: "var(--sc-cmp-button-outlined-primary-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-primary-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-primary-active-background)"
                },
                success: {
                    color: "var(--sc-cmp-button-outlined-success-color)",
                    borderColor: "var(--sc-cmp-button-outlined-success-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-success-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-success-active-background)"
                },
                contrast: {
                    color: "var(--sc-cmp-button-outlined-contrast-color)",
                    borderColor: "{surface.500}",
                    hoverBackground: "{surface.800}",
                    activeBackground: "{surface.700}"
                },
                secondary: {
                    color: "{surface.400}",
                    borderColor: "{surface.700}",
                    hoverBackground: "var(--sc-cmp-button-outlined-secondary-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-secondary-active-background)"
                }
            }
        },
        light: {
            link: {
                color: "{primary.color}",
                hoverColor: "{primary.color}",
                activeColor: "{primary.color}"
            },
            root: {
                help: {
                    color: "var(--sc-cmp-button-help-color)",
                    focusRing: {
                        color: "var(--sc-cmp-button-help-focus-ring-color)"
                    },
                    background: "var(--sc-cmp-button-help-background)",
                    hoverColor: "var(--sc-cmp-button-help-hover-color)",
                    activeColor: "var(--sc-cmp-button-help-active-color)",
                    borderColor: "var(--sc-cmp-button-help-border-color)",
                    hoverBackground: "var(--sc-cmp-button-help-hover-background)",
                    activeBackground: "var(--sc-cmp-button-help-active-background)",
                    hoverBorderColor: "var(--sc-cmp-button-help-hover-border-color)",
                    activeBorderColor: "var(--sc-cmp-button-help-active-border-color)"
                },
                info: {
                    color: "var(--sc-cmp-button-info-color)",
                    focusRing: {
                        color: "var(--sc-cmp-button-info-focus-ring-color)"
                    },
                    background: "var(--sc-cmp-button-info-background)",
                    hoverColor: "var(--sc-cmp-button-info-hover-color)",
                    activeColor: "var(--sc-cmp-button-info-active-color)",
                    borderColor: "var(--sc-cmp-button-info-border-color)",
                    hoverBackground: "var(--sc-cmp-button-info-hover-background)",
                    activeBackground: "var(--sc-cmp-button-info-active-background)",
                    hoverBorderColor: "var(--sc-cmp-button-info-hover-border-color)",
                    activeBorderColor: "var(--sc-cmp-button-info-active-border-color)"
                },
                /* AA · 2026-08-24 — mismo arreglo que `danger` de abajo y por el
                 * mismo motivo, pero aquí ni siquiera hace falta divergir: el
                 * warn sólido medía **1.92:1** con su texto blanco y el propio
                 * Kit dice `{yellow.700}` para este slot (4.92 ✓). La rampa se
                 * desplaza de 500/600/700 a 700/800/900 para conservar el
                 * recorrido reposo → hover → pulsado.
                 *
                 * Se llama `orange` porque así llama PrimeNG al slot; `base.ts`
                 * lo remapea a la familia yellow, que es lo que el Theme
                 * Designer trajo el 24-ago. */
                warn: {
                    color: "var(--sc-cmp-button-warn-color)",
                    focusRing: {
                        color: "var(--sc-cmp-button-warn-focus-ring-color)"
                    },
                    background: "var(--sc-cmp-button-warn-background)",
                    hoverColor: "var(--sc-cmp-button-warn-hover-color)",
                    activeColor: "var(--sc-cmp-button-warn-active-color)",
                    borderColor: "var(--sc-cmp-button-warn-border-color)",
                    hoverBackground: "var(--sc-cmp-button-warn-hover-background)",
                    activeBackground: "var(--sc-cmp-button-warn-active-background)",
                    hoverBorderColor: "var(--sc-cmp-button-warn-hover-border-color)",
                    activeBorderColor: "var(--sc-cmp-button-warn-active-border-color)"
                },
                /* AA · 2026-07-19 — el botón `danger` sólido subía a 3.76:1 con
                 * su texto blanco: era uno de los dos últimos fallos de
                 * contraste de la app. La rampa entera se desplaza un escalón,
                 * de 500/600/700 a 600/700/800, para conservar el recorrido
                 * reposo → hover → pulsado. red-600 con blanco da **4.83:1**.
                 *
                 * Divergencia declarada (2026-09-15): los seis slots están en
                 * `EXCLUDE` de `cmp-color-map.mjs`, así que el generador no
                 * emite su `--sc-cmp-button-danger-*` y el valor se queda aquí.
                 * Cuando Figma lo suba (`figma-pendiente.md`), se quitan esas
                 * filas y se lee la variable. Ver customs-catalog §1.8.
                 *
                 * `focusRing` se queda en {red.500}: es un anillo, no lleva
                 * texto encima, y no cambiarlo evita mover una señal de foco. */
                danger: {
                    color: "var(--sc-cmp-button-danger-color)",
                    focusRing: {
                        color: "var(--sc-cmp-button-danger-focus-ring-color)"
                    },
                    background: "{red.600}",
                    hoverColor: "var(--sc-cmp-button-danger-hover-color)",
                    activeColor: "var(--sc-cmp-button-danger-active-color)",
                    borderColor: "{red.600}",
                    hoverBackground: "{red.700}",
                    activeBackground: "{red.800}",
                    hoverBorderColor: "{red.700}",
                    activeBorderColor: "{red.800}"
                },
                primary: {
                    color: "{primary.contrast.color}",
                    focusRing: {
                        color: "{primary.color}"
                    },
                    background: "{primary.color}",
                    hoverColor: "{primary.contrast.color}",
                    activeColor: "{primary.contrast.color}",
                    borderColor: "{primary.color}",
                    hoverBackground: "{primary.hover.color}",
                    activeBackground: "{primary.active.color}",
                    hoverBorderColor: "{primary.hover.color}",
                    activeBorderColor: "{primary.active.color}"
                },
                success: {
                    color: "var(--sc-cmp-button-success-color)",
                    focusRing: {
                        color: "var(--sc-cmp-button-success-focus-ring-color)"
                    },
                    background: "var(--sc-cmp-button-success-background)",
                    hoverColor: "var(--sc-cmp-button-success-hover-color)",
                    activeColor: "var(--sc-cmp-button-success-active-color)",
                    borderColor: "var(--sc-cmp-button-success-border-color)",
                    hoverBackground: "var(--sc-cmp-button-success-hover-background)",
                    activeBackground: "var(--sc-cmp-button-success-active-background)",
                    hoverBorderColor: "var(--sc-cmp-button-success-hover-border-color)",
                    activeBorderColor: "var(--sc-cmp-button-success-active-border-color)"
                },
                contrast: {
                    color: "var(--sc-cmp-button-contrast-color)",
                    focusRing: {
                        color: "var(--sc-cmp-button-contrast-focus-ring-color)"
                    },
                    background: "var(--sc-cmp-button-contrast-background)",
                    hoverColor: "var(--sc-cmp-button-contrast-hover-color)",
                    activeColor: "var(--sc-cmp-button-contrast-active-color)",
                    borderColor: "var(--sc-cmp-button-contrast-border-color)",
                    hoverBackground: "var(--sc-cmp-button-contrast-hover-background)",
                    activeBackground: "var(--sc-cmp-button-contrast-active-background)",
                    hoverBorderColor: "var(--sc-cmp-button-contrast-hover-border-color)",
                    activeBorderColor: "var(--sc-cmp-button-contrast-active-border-color)"
                },
                secondary: {
                    color: "var(--sc-cmp-button-secondary-color)",
                    focusRing: {
                        color: "var(--sc-cmp-button-secondary-focus-ring-color)"
                    },
                    background: "var(--sc-cmp-button-secondary-background)",
                    hoverColor: "var(--sc-cmp-button-secondary-hover-color)",
                    activeColor: "var(--sc-cmp-button-secondary-active-color)",
                    borderColor: "var(--sc-cmp-button-secondary-border-color)",
                    hoverBackground: "var(--sc-cmp-button-secondary-hover-background)",
                    activeBackground: "var(--sc-cmp-button-secondary-active-background)",
                    hoverBorderColor: "var(--sc-cmp-button-secondary-hover-border-color)",
                    activeBorderColor: "var(--sc-cmp-button-secondary-active-border-color)"
                }
            },
            text: {
                help: {
                    color: "var(--sc-cmp-button-text-help-color)",
                    hoverBackground: "var(--sc-cmp-button-text-help-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-help-active-background)"
                },
                info: {
                    color: "var(--sc-cmp-button-text-info-color)",
                    hoverBackground: "var(--sc-cmp-button-text-info-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-info-active-background)"
                },
                warn: {
                    color: "var(--sc-cmp-button-text-warn-color)",
                    hoverBackground: "var(--sc-cmp-button-text-warn-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-warn-active-background)"
                },
                plain: {
                    color: "var(--sc-cmp-button-text-plain-color)",
                    hoverBackground: "var(--sc-cmp-button-text-plain-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-plain-active-background)"
                },
                danger: {
                    color: "var(--sc-cmp-button-text-danger-color)",
                    hoverBackground: "var(--sc-cmp-button-text-danger-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-danger-active-background)"
                },
                primary: {
                    color: "{primary.color}",
                    hoverBackground: "{primary.50}",
                    activeBackground: "{primary.100}"
                },
                success: {
                    color: "var(--sc-cmp-button-text-success-color)",
                    hoverBackground: "var(--sc-cmp-button-text-success-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-success-active-background)"
                },
                contrast: {
                    color: "var(--sc-cmp-button-text-contrast-color)",
                    hoverBackground: "var(--sc-cmp-button-text-contrast-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-contrast-active-background)"
                },
                secondary: {
                    color: "var(--sc-cmp-button-text-secondary-color)",
                    hoverBackground: "var(--sc-cmp-button-text-secondary-hover-background)",
                    activeBackground: "var(--sc-cmp-button-text-secondary-active-background)"
                }
            },
            outlined: {
                help: {
                    color: "var(--sc-cmp-button-outlined-help-color)",
                    borderColor: "var(--sc-cmp-button-outlined-help-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-help-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-help-active-background)"
                },
                info: {
                    color: "var(--sc-cmp-button-outlined-info-color)",
                    borderColor: "var(--sc-cmp-button-outlined-info-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-info-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-info-active-background)"
                },
                warn: {
                    color: "var(--sc-cmp-button-outlined-warn-color)",
                    borderColor: "var(--sc-cmp-button-outlined-warn-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-warn-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-warn-active-background)"
                },
                plain: {
                    color: "var(--sc-cmp-button-outlined-plain-color)",
                    borderColor: "var(--sc-cmp-button-outlined-plain-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-plain-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-plain-active-background)"
                },
                danger: {
                    color: "var(--sc-cmp-button-outlined-danger-color)",
                    borderColor: "var(--sc-cmp-button-outlined-danger-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-danger-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-danger-active-background)"
                },
                primary: {
                    color: "{primary.color}",
                    borderColor: "{primary.200}",
                    hoverBackground: "{primary.50}",
                    activeBackground: "{primary.100}"
                },
                success: {
                    color: "var(--sc-cmp-button-outlined-success-color)",
                    borderColor: "var(--sc-cmp-button-outlined-success-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-success-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-success-active-background)"
                },
                contrast: {
                    color: "var(--sc-cmp-button-outlined-contrast-color)",
                    borderColor: "var(--sc-cmp-button-outlined-contrast-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-contrast-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-contrast-active-background)"
                },
                secondary: {
                    color: "var(--sc-cmp-button-outlined-secondary-color)",
                    borderColor: "var(--sc-cmp-button-outlined-secondary-border-color)",
                    hoverBackground: "var(--sc-cmp-button-outlined-secondary-hover-background)",
                    activeBackground: "var(--sc-cmp-button-outlined-secondary-active-background)"
                }
            }
        }
    }
} satisfies ButtonDesignTokens;

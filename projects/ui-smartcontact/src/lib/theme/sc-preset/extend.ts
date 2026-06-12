/**
 * Tokens `app.*` propios del preset (fuera del árbol PrimeNG).
 *
 * - `app.typography` alimenta el CSS central de css.ts (font de control
 *   md/sm/lg). Fuentes redondas del Kit (12/14/16); la line-height de control
 *   md es 21 (= scale 1.5 — control = 14 × 1.5, lo que cuadra la altura md de
 *   md de control con `iconOnlyWidth = scale.2-5`), no la 20 del cuerpo de texto.
 * - `app.toggleswitch` = métricas del Kit (`toggleswitch.*`), 1:1 en escala.
 *
 * El grupo `app.control` del repo de origen (alturas/paddings 8-point) se
 * retiró: sus consumidores (formField, button.iconOnlyWidth) apuntan ya a los
 * tokens de escala del Kit.
 */
export default {
    app: {
        typography: {
            sm: {
                fontSize: "var(--sc-font-size-100)",
                lineHeight: "var(--sc-line-height-100)"
            },
            md: {
                fontSize: "var(--sc-font-size-200)",
                lineHeight: "var(--sc-scale-1-5)"
            },
            lg: {
                fontSize: "var(--sc-font-size-300)",
                lineHeight: "var(--sc-line-height-300)"
            }
        },
        toggleswitch: {
            md: {
                width: "var(--sc-scale-2-5)",
                height: "var(--sc-scale-1-5)",
                gap: "var(--sc-scale-0-25)",
                handle: {
                    size: "var(--sc-scale-1)",
                    borderRadius: "var(--sc-scale-0-5)"
                }
            }
        }
    }
}

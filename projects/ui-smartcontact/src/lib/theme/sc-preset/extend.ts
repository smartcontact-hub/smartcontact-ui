/**
 * Tokens `app.*` propios del preset (fuera del árbol PrimeNG).
 *
 * - `app.typography` alimenta el CSS central de css.ts (font de control
 *   md/sm/lg). Fuentes redondas del Kit (12/14/16); line-heights de la rampa
 *   (`--sc-line-height-100/200/300` = 18/20/24). md UNIFICADO a 20 el 2026-08-24:
 *   antes era 21 (scale 1.5, por la geometría icon-only), pero medido que 20 baja
 *   el control un punto (alto 37→36) sin romper el cuadre, y casa con cuerpo y Figma.
 *   ⚠️ El `lineHeight` de aquí ya NO lo consumen los CONTROLES (DD-51, 2026-09-05):
 *   en el Kit su texto va en `AUTO`, así que css.ts les pone `normal` y solo las
 *   ETIQUETAS —chip, tag, toast, breadcrumb, context-menu— siguen leyendo la rampa,
 *   que es justo lo que esos maestros atan. El `fontSize` lo consumen los dos.
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
                lineHeight: "var(--sc-line-height-200)"
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

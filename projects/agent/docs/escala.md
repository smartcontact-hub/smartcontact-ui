# Escala — `sc-agent` mide en `vw`, como la app real

> **La regla, desde 2026-08-26**: la app real mide **todo** en `vw`, y `sc-agent` > **también**. Un valor del real se copia **tal cual**. No hay conversión.
>
> **Esto cambió.** Hasta esa fecha la réplica estaba congelada en px con referencia 1456
> (`px = vw × 14.56`). Si lees un `px` en un componente de `sc-agent`, o es una de las 16
> excepciones de abajo, o es código que se quedó fuera de la migración: mídelo.

## Qué pasó y por qué

La réplica se construyó midiendo la app real a 1456 px de ancho y congelando cada medida
en px. Eso es **exacto a 1456 y falso en cualquier otro ancho**: el original es fluido y
la réplica no lo era. Con una decisión de alcance explícita —replicar el comportamiento
del original en todo el rango— se revirtió con
[`tools/px-to-vw.ts`](../../../tools/px-to-vw.ts): **640 valores en 16 ficheros**.

La conversión es la inversa exacta de la calibración con la que se tomaron las medidas
(`vw = px ÷ 14.56`), así que a 1456 el render tiene que ser idéntico. **Se verificó
midiendo**, no suponiendo: volcado completo del DOM antes y después en los 9 estados
guionizados, casado por clave estructural.

|                   | resultado                             |
| ----------------- | ------------------------------------- |
| BLOQUEANTE (>1px) | **0** en los 9 estados                |
| MENOR (0.25–1px)  | **0** en los 9 estados                |
| ruido (<0.25px)   | ~2 700–3 900 comparaciones por estado |

Y el Comunicador ahora **escala exacto**: 17.191vw × 34.80vw a 1280, 1456 y 1920.

## ⚠️ Chromium TRUNCA, no redondea — redondea hacia arriba al convertir

Esta es la trampa que costó tres rondas. Chromium resuelve la longitud y luego la trunca a
**LayoutUnit (1/64 px)**.

```
42px  ->  toFixed:  2.884615vw  ->  41.999993px  ->  trunca  ->  41.984375px   ✗
42px  ->  ceil:     2.884616vw  ->  42.000008px  ->  trunca  ->  42px          ✓
```

Con `toFixed` cada fila de la tabla perdía 0.02 px, el error **se acumulaba** fila a fila
hasta 0.34 px al final, y de rebote la caja de línea de 19 textos caía de 16 a 15 px al
aterrizar en otra fase subpixel. Parecían tres problemas distintos y eran **el mismo**.

Aumentar decimales **no lo arregla** (con 6 salían 100 menores en vez de 93): lo que hay
que hacer es caer siempre por encima. Por eso `toVw()` usa `Math.ceil` a la millonésima;
el exceso es de 1.5 × 10⁻⁵ px.

## Lo que sigue en px, a propósito (16 valores)

| qué                                              | por qué                                                                                                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `outline` y `outline-offset` de los aros de foco | no vienen del original, los añadí por accesibilidad, y un aro de foco no debe encoger con la ventana                                                      |
| el `1px` exacto **de un borde**                  | una línea de un píxel de dispositivo es una decisión de píxel. El propio original lo hace así: el pulsador del interruptor va `border: 1px solid #4F5256` |

Las líneas que el original **sí** escala las declara en vw (`0.052vw`) y aquí valen
0.76 px: **esas se convirtieron**.

⚠️ La regla se acotó a **bordes** después de medir. Al principio conservaba cualquier
`1px`, y eso dejaba en px el `padding: 1px` vertical del chip de espera… que el original
no declara así (el suyo es `padding: 0.15625vw 0.2604166667vw`). Ese `1px` era invención
mía, no una medida.

## La trampa del `rem` del real (sigue vigente)

En la app real hay una regla global:

```css
* {
  font-family: "Open Sans";
  font-size: 0.8vw;
  letter-spacing: 0.01979vw;
}
```

Como `*` alcanza también a `<html>`, **el `rem` de esa app vale `0.8vw`**, no 16 px:

- Los componentes de su Design System (que miden en `rem`) **sí escalan** con la ventana.
- Una regla como `.management-option { font-size: 0.6vw }` **no llega a sus hijos de
  texto**: el `*` los alcanza directamente con 0.8vw y gana por cascada sobre la herencia.
  Hay texto que sale bien _por accidente_ mientras su contenedor está mal medido.

Si mides un valor computado en la app real y no cuadra con su CSS, sospecha del `*` antes
que de tu medición.

## Para medir: `px = vw × 14.56` sigue sirviendo de puente

La calibración no desaparece, cambia de papel. Ya no es cómo se escribe el CSS, es cómo se
lee una medida: cuando midas en vivo con el DevTools o con
[`tools/phase2-metrics.ts`](../../../tools/phase2-metrics.ts) **a 1456 px de ancho**,
divide el px medido por 14.56 para obtener el vw que hay que escribir.

Verificado con dos medidas independientes:

| Valor en el real                                    | a 1456                   |
| --------------------------------------------------- | ------------------------ |
| Texto base (`* { font-size: 0.8vw }`)               | 0.8 × 14.56 = 11.65 px   |
| Barra inferior (`.shortcut-bar`, `height: 2.604vw`) | 2.604 × 14.56 = 37.92 px |

## ⚠️ Y el lienzo con `zoom` ya no está — mira que no vuelva

El shell tenía `width: 1456px` + `zoom: innerWidth/1456`: un diseño congelado que se
escalaba entero. Con medidas en **px** eso escalaba **una vez** y salía bien; con medidas
en **vw** escalaba **dos**. Medido a 1280 / 1456 / 1920, el botón de estado daba
20.86 / 27 / 46.94 px donde su vw pide 23.74 / 27 / 35.60.

**A 1456 el `zoom` vale 1 y el fallo es invisible.** Verificar a un solo ancho no lo caza.
Lo que lo cazó fue comparar la réplica **consigo misma a tres anchos**: si algo es fluido
de verdad, mide los mismos vw en cualquier ventana.

```bash
export PATH=/usr/local/bin:$PATH
npm run parity:constancy      # falla si alguna pieza no mantiene su vw
```

El Comunicador se libró por estar **fuera** del shell — por eso el widget salía perfecto
mientras el dashboard estaba mal.

## Lo que hoy NO mantiene vw constante

Comprobado con `npm run parity:constancy`, que recorre el DOM entero a 1280 / 1456 / 1920
**dos veces**: a alto fijo y a ratio de pantalla constante. Esa segunda pasada es la que
importa — a alto fijo, lo que va en `100vh` o en `flex` cambia de ratio en vw sin estar
roto, y saldría como falso positivo.

| pieza                                                   | deriva a ratio constante | veredicto               |
| ------------------------------------------------------- | ------------------------ | ----------------------- |
| `sc-icon` (2 usos)                                      | **0.365vw** = 5.31px     | **fijo de verdad**      |
| `.grupos__head`, `input`, `.tablewrap`, `button.manage` | ≤ 0.053vw = 0.76px       | caja de línea, subpíxel |

De **131 nodos no constantes con 31.85px de deriva** a **26 con 5.31px**, y lo que queda
está aislado en un sitio.

### Lo que sí se arregló, y por qué el codemod no llegaba solo

Todo eran **tamaños fuera del CSS**, que ninguna herramienta que lea hojas de estilo puede
alcanzar:

| dónde              | qué era                                    | ahora                               |
| ------------------ | ------------------------------------------ | ----------------------------------- |
| `app-icon`         | `[attr.width]`/`[attr.height]` del `<svg>` | el host se dimensiona en vw         |
| medidor de las KPI | `<svg width="84" height="84">`             | CSS en vw (la CSS gana al atributo) |
| globo del perfil   | `<img width="13" height="13">`             | CSS en vw                           |

Si algo vuelve a salir fijo, mira ahí antes que en el CSS.

### `sc-icon`: intento medido y descartado

El DS ofrece `size="inherit"` (DD-24), que parecía la vía para hacerlo fluido sin tocar
código compartido. **No lo es, y se midió**: el `[size]` numérico fija la **caja** y deja el
glifo a su tamaño de clase —a 1456, caja 14 con `font-size` 16—, mientras que `inherit` deja
que el glifo defina la caja. Son modos distintos. Cambiarlo metió 4 bloqueantes a 1456;
ajustar el `font-size` al medido metió 14. Revertido.

Queda como deuda anotada en `findings/phase-4-diffs.md`. Cerrarlo pide tocar el DS, y eso
marca DIRTY a todo lo que lo consuma.

## Cómo dimensiona el original en vertical, que es distinto

Usa **`vh` en 320 sitios** contra 2 en la réplica (154 `height`, y hasta 15 `font-size` y 9
`border-radius`). Su contenedor de tabla va en vh y **escalona por anchura**:

```css
.historic-container {
  height: 64.034vh;
} /* por defecto  */
@media (max-width: 1680px) {
  … {
    height: 69.37vh;
  }
} /* sube         */
@media (max-width: 1366px) {
  … {
    height: 58.825vh;
  }
} /* y luego baja */
```

Ni siquiera es monótono. **No se ha replicado**: comprobar que esos tres valores cuadran
exige medir el original en vivo. Está descrito con su coste en
`findings/phase-8-new-behaviours.md`.

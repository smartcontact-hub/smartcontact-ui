# Decisión de alcance — la réplica vuelve a `vw`

Rafa, 2026-08-26: _«hazlo como está en la web original»_. El original es fluido en `vw`;
la réplica estaba congelada en px con referencia 1456, lo cual solo es cierto a 1456. Se
revierte.

Herramienta: [`tools/px-to-vw.ts`](../tools/px-to-vw.ts). **640 valores en 16 ficheros.**

## Cómo se verificó

La conversión es la inversa exacta de la calibración con la que se tomaron todas las
medidas (`vw = px ÷ 14.56`), así que **a 1456 el render tiene que ser idéntico**. Eso es
lo que se midió: volcado completo del DOM antes y después, en los 9 estados guionizados,
casado por clave estructural (rol semántico + hash de texto + ordinal).

| estado              | BLOQUEANTE (>1px) | MENOR (0.25–1px) | ruido (<0.25px) |
| ------------------- | ----------------- | ---------------- | --------------- |
| default             | 0                 | 0                | 2654            |
| comunicator-call    | 0                 | 0                | 2948            |
| comunicator-chat    | 0                 | 0                | 3068            |
| comunicator-agents  | 0                 | 0                | 2810            |
| comunicator-history | 0                 | 0                | 3890            |
| settings            | 0                 | 0                | 3062            |
| settings-prefs      | 0                 | 0                | 2942            |
| states              | 0                 | 0                | 2906            |
| pendientes          | 0                 | 0                | 2684            |

Línea base en `findings/baseline-px/`. Manifiestos idénticos: el comparador se niega a
diffear artefactos que no lo sean.

## Y ahora escala

El Comunicador medido a tres anchos:

| ancho | tamaño          | en vw           |
| ----- | --------------- | --------------- |
| 1280  | 220.03 × 445.44 | 17.19 × 34.80   |
| 1456  | 250.30 × 506.69 | 17.191 × 34.80  |
| 1920  | 330.06 × 668.17 | 17.191 × 34.801 |

Constante en vw a lo largo del rango, que es justo lo que hace el original.

## La trampa que costó tres rondas: Chromium trunca

```
42px  ->  toFixed:  2.884615vw  ->  41.999993px  ->  trunca a 1/64  ->  41.984375px   ✗
42px  ->  ceil:     2.884616vw  ->  42.000008px  ->  trunca a 1/64  ->  42px          ✓
```

Los tres síntomas que aparecían eran **el mismo fallo**:

1. cada fila de tabla perdía 0.02 px;
2. el error **se acumulaba** fila a fila hasta 0.34 px al final de la tabla;
3. y de rebote, la caja de línea de 19 textos caía de 16 a 15 px al aterrizar en otra fase
   subpixel.

**Subir decimales no lo arregla** (con 6 salían 100 menores en vez de 93, y lo probé):
lo que hay que hacer es caer siempre por encima. `toVw()` redondea hacia arriba a la
millonésima; el exceso es de 1.5 × 10⁻⁵ px.

Se descartaron por medición dos hipótesis previas, no por argumento: precisión decimal
(probada, no era) y tamaño de fuente fraccionario (probado con `font-size` inyectado a
mano, daba 15 también con `11.7px` exacto).

## Lo que sigue en px, a propósito (16 valores)

- `outline` y `outline-offset` de los aros de foco: no vienen del original, se añadieron
  por accesibilidad, y un aro de foco no debe encoger con la ventana.
- el `1px` exacto **de un borde**: el original hace lo mismo
  (`border: 1px solid #4F5256` en el pulsador del interruptor). Las líneas que sí escala
  las declara en vw (`0.052vw`), y esas se convirtieron.

La regla se acotó a **bordes después de medir**: conservar cualquier `1px` dejaba en px el
`padding: 1px` vertical del chip de espera, que el original declara
`padding: 0.15625vw 0.2604166667vw`. Era invención mía, no una medida.

## Hueco conocido, sin cerrar

La altura de fila de la tabla **no es función pura de vw**: 2.535 / 2.885 / 3.804 vw a
1280 / 1456 / 1920. Las celdas sí escalan —`padding`, `line-height` y `font-size` dan un
vw constante a los tres anchos—, así que la altura la manda el contenido o el reparto
vertical.

**No aislado y no tocado a ciegas.** Candidatos: los atributos `width`/`height` del `<img>`
del icono de dirección (son atributos HTML, ningún codemod de CSS los alcanza) y los
componentes del DS, que miden en `rem` y aquí no escalan porque el `rem` de esta réplica sí
vale 16 px.

Qué mediría resolverlo: barrido de breakpoints (Fase 1) y reconstrucción de curvas
(Fase 5) contra el original. **Bloqueado por el login**, ver `STATUS.md`.

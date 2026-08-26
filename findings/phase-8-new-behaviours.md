# FASE 8 — Comportamientos que la réplica no tiene

**Nada de esto se implementa sin que lo pidas.** Por el encargo, esta fase describe: qué
hace, con qué evidencia, qué cuesta y qué se rompe visiblemente sin ello. Decides tú.

Censado sobre el CSS declarado de los dos lados (el bundle del original viene sin
minificar). Es DECLARADO, no computado.

## Tabla del censo

| capacidad | original | réplica |
|---|---|---|
| Equilibrado de líneas (`balance` / `pretty`) | — | — |
| Recorte del interlineado (`text-box-trim` / `leading-trim`) | — | — |
| Consultas de contenedor (`@container`) | — | — |
| Unidades de contenedor (`cqw` / `cqi` / `cqh`) | — | — |
| Tamaño óptico (`font-optical-sizing`) | — | — |
| Ejes variables (`font-variation-settings`) | — | — |
| Cifras tabulares (`font-variant-numeric`) | — | 2 |
| Tipografía fluida acotada (`clamp()`) | — | — |
| Acotado con `min()` / `max()` | 2 | 1 |
| Transiciones de vista | — | — |
| Animación dirigida por scroll | — | — |
| Selector `:has()` | — | — |
| `aspect-ratio` ⚠️ | 5 | — |
| `subgrid` | — | — |
| Alto de viewport (`vh`) para dimensionar | 320 | 2 |
| Viewport dinámico (`dvh` / `svh` / `lvh`) | — | — |
| `!important` (indicador de caos, no una capacidad) | 2071 | 4 |

## El modelo VERTICAL del original es `vh`, y la réplica no lo tiene

**320 usos de `vh` en el original contra 2 en la réplica.** No es un caso
aislado: es cómo compone el eje vertical.

| propiedad dimensionada con `vh` | usos |
|---|---|
| `height` | 154 |
| `max-height` | 20 |
| `margin` (+ `-top`, `-bottom`) | 38 |
| `padding` (+ `-top`, `-bottom`) | 35 |
| `font-size` | 15 |
| `border-radius` | 9 |

Los dos últimos son caos-fiel de manual: un tamaño de letra y un radio que dependen del
ALTO de la ventana. Se documentan, no se arreglan.

### El caso concreto que esto explica

El contenedor de la tabla, `.historic-container`, va en `vh` **y escalona por anchura**:

| ancho | alto declarado |
|---|---|
| por defecto (>1680) | `64.034vh` |
| ≤ 1680 | `69.37vh` |
| ≤ 1366 | `58.825vh` |

Fíjate en que **no es monótono**: sube a 69.37 y luego baja a 58.825. Es una tabla
ajustada a mano, no una escala.

La réplica declara `height: 100%` y deja que el flex reparta. Por eso la altura de fila
medida daba **2.535 / 2.885 / 3.804 vw a 1280 / 1456 / 1920**: yo variaba la anchura
manteniendo el alto en 900, así que el contenedor en `vh` del original se habría quedado
clavado mientras el `vw` cambiaba. Quedaba anotado como hueco sin resolver en
`scope-vw-conversion.md`; **la causa ya está nombrada**.

**Coste de implementarlo**: dos consultas de anchura y pasar el alto de la tabla de
`100%` a `vh`. **Qué se rompe sin ello**: la tabla ocupa una fracción distinta de la
pantalla en cualquier ventana que no sea la que medí. **Qué NO puedo verificar hoy**: si
con esos tres valores la réplica cuadra con el original, porque para comprobarlo hay que
medir el original en vivo. Por eso no lo he tocado.

## Los breakpoints del original

Leídos de su CSS, no barridos (ver `phase-1-breakpoints.json`): **576 / 768 / 992 / 1200
/ 1400** son los de Bootstrap, que arrastra por la librería. Los suyos de verdad son
**1366** (×7) y **1680** (×3). La réplica solo tiene uno, `max-width: 75rem` = 1200.

1366 es un ancho de portátil muy común, así que ese no es un caso de borde raro.

## `!important`

**2071 en el original**, 4 en la réplica. No es una capacidad, es un indicador: cualquier
intento futuro de reordenar su cascada se va a topar con esto.

## Lo que usa el original y la réplica no

### `aspect-ratio` — 5 usos en el original, 0 en la réplica

```css
p: 0; left: 0; width: 100%; height: 100%; } .ratio-1x1 { --bs-aspect-ratio:100%; } .ratio-4x3 { --bs-aspect-ratio:75%; }
```


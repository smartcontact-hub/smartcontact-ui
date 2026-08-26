# FASE 5 — Curvas fluidas

**Veredicto: no hay ninguna que reconstruir.** Es un resultado negativo, y es firme.

## Qué se buscaba

La fase existe para cazar propiedades que varían de forma **continua** con la anchura y
devolverlas a un `clamp()` en rem + vw, ajustando la recta con dos anchos y **verificando
en un tercero**.

## Qué se midió

Censo del CSS declarado del original, con el grafo de chunks cerrado (37 ficheros,
`tools/phase8-behaviours.ts`):

| lo que se buscaba                              | usos en el original |
| ---------------------------------------------- | ------------------- |
| `clamp()`                                      | **0**               |
| `@container`                                   | **0**               |
| unidades de contenedor (`cqw` / `cqi` / `cqh`) | **0**               |
| `min()` / `max()` sobre longitudes             | 2                   |

## Por qué eso cierra la fase

El original **ya es fluido por construcción**: dimensiona en `vw` y en `vh` directos. Un
`0.938vw` no es una curva que haya que reconstruir, es una recta que pasa por el origen —
y la réplica la copia **tal cual** desde la conversión a vw
(`scope-vw-conversion.md`). No hay nada que ajustar ni nada que verificar en un tercer
ancho, porque no hay ningún tramo con pendiente e intersección que adivinar.

Lo que sí tiene el original, y **no es una curva sino un escalón**, son sus dos
breakpoints propios —**1366** y **1680**— sobre alturas en `vh`. El propio encargo lo
anticipa: _«si el ajuste falla, no es lineal — breakpoints escalonados o consultas de
contenedor — repórtalo en vez de forzar un clamp»_. Eso es exactamente lo que pasa, y está
reportado en `phase-8-new-behaviours.md`, no forzado a un `clamp()`.

## Lo que este veredicto NO cubre

Es un censo de lo **declarado**. Una interpolación aplicada desde JavaScript —un
`matchMedia` que cambia clases, un `ResizeObserver` que escribe estilos en línea— no
aparece aquí. Descartarlo exige barrer la app en vivo, y eso sigue tras el login
(`STATUS.md`). Hasta entonces: **sin verificar por esa vía**, verificado por la del CSS.

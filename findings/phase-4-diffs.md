# FASE 4 — Diferencias con causa nombrada

Formato del encargo: propiedad · original · réplica · delta · anchos/estados · severidad ·
causa. La numeración de causas es la de su lista de 10.

⚠️ **De dónde sale cada fila.** Las marcadas _(declarado)_ comparan CSS contra CSS: el
bundle del original se puede leer, su app en vivo no. Las marcadas _(medido)_ salen de
medir la réplica. **Ninguna fila compara medidas del original contra medidas de la
réplica**, porque eso exige la sesión (`STATUS.md`).

## Cerradas en esta sesión

| propiedad                           | original                              | réplica (antes)             | delta                                                             | ámbito        | sev.      | causa                               |
| ----------------------------------- | ------------------------------------- | --------------------------- | ----------------------------------------------------------------- | ------------- | --------- | ----------------------------------- |
| `font-family` resuelta _(medido)_   | `"Open Sans Semibold"`, cara estática | caía a `Open Sans` variable | familia distinta                                                  | los 8 usos    | **BLOQ.** | **#2** familia declarada no servida |
| `font-family: Roboto` _(medido)_    | Roboto estático                       | caía a Open Sans            | otra tipografía (`win` 1946/512 vs 2189/600)                      | 2 usos        | **BLOQ.** | **#2**                              |
| `USE_TYPO_METRICS` _(medido)_       | `false`                               | `true` (variable de Google) | juego de métricas distinto                                        | global        | **BLOQ.** | **#3** métricas de la cara          |
| modelo de unidades _(medido)_       | `vw` fluido                           | px congelado a 1456         | 0 a 1456, creciente fuera                                         | todo el rango | **BLOQ.** | **#6** unidades                     |
| doble escalado del shell _(medido)_ | sin lienzo fijo                       | `width: 1456px` + `zoom`    | 20.86 / 27 / **46.94** px donde el vw pide 23.74 / 27 / **35.60** | ≠1456         | **BLOQ.** | **#8** maquetación                  |

Las tres primeras se cerraron sirviendo los ficheros del original (`phase-0-verdict.md`).
Las dos últimas, con la conversión a vw y quitando el zoom (`scope-vw-conversion.md`).

### La que me la coló

El **doble escalado** lo introduje yo. La réplica tenía un lienzo de 1456 px fijos con
`zoom: innerWidth/1456`: con medidas en px eso escalaba **una vez** y salía bien. Al
pasarlas a vw, pasó a escalar **dos**. Lo verifiqué a 1456, donde `zoom` vale 1 y el fallo
es literalmente invisible. Lo destapó comparar la réplica **consigo misma a tres anchos**,
no contra el original: si algo es fluido de verdad, mide los mismos vw en cualquier
ventana. Ese verificador vive ahora en `tools/check-vw-constancy.ts`.

El Comunicador se libró por estar **fuera** del shell, que es justo por qué el chequeo del
widget salía perfecto mientras el dashboard estaba mal.

## Abiertas — nombradas, medidas, sin aplicar

| propiedad                                  | original                                                        | réplica                               | delta                         | ámbito              | sev.      | causa                         |
| ------------------------------------------ | --------------------------------------------------------------- | ------------------------------------- | ----------------------------- | ------------------- | --------- | ----------------------------- |
| alto del contenedor de tabla _(declarado)_ | `64.034vh`, escalonado a `69.37vh` (≤1680) y `58.825vh` (≤1366) | `flex: 1` sobre `100vh`               | fracción de pantalla distinta | ≠ la ventana medida | **BLOQ.** | **#1** escalones + **#8**     |
| breakpoints _(declarado)_                  | **1366** (×7), **1680** (×3)                                    | ninguno                               | comportamiento ausente        | esos anchos         | **BLOQ.** | **#1**                        |
| eje vertical _(declarado)_                 | `vh` en **320** sitios                                          | 2                                     | modelo distinto               | vertical            | **BLOQ.** | **#8**                        |
| `sc-icon` _(medido)_                       | iconos en vw                                                    | **14 px fijos** a 1280/1456/1920      | deriva 0.365vw (5.3px a 1456) | todo el rango       | MENOR     | **#6** unidades               |
| foco _(declarado)_                         | `:focus` (2 reglas), **0** `:focus-visible`                     | `:focus-visible`                      | estado distinto               | teclado             | MENOR     | **#10** divergencia de estado |
| `font-size` 11.70 _(declarado)_            | nunca lo declara; su base es `0.8vw` = 11.65                    | 11.70, **18 usos**                    | 0.05px                        | global              | **RUIDO** | **#6** redondeo mío           |
| 5 tamaños grandes de KPI _(declarado)_     | no aparecen en su CSS                                           | 31.90 / 26.40 / 26.00 / 21.30 / 20.50 | **sin verificar**             | tarjetas KPI        | ?         | sin aislar                    |

### Por qué no se aplican

- Las tres primeras y `sc-icon` **cambiarían la maquetación en anchos que no puedo medir
  contra el original**. Aplicarlas a ciegas es justo lo que el encargo prohíbe. Están
  descritas con coste en `phase-8-new-behaviours.md`; decide Rafa.
- `sc-icon` además es **código compartido**: tocarlo marcaría DIRTY a todo bloque que lo
  consuma, y esa regresión hay que poder verificarla.
- El foco es una **divergencia deliberada**: `:focus-visible` no molesta al ratón y el
  original no tiene aro de foco. Queda anotada, no corregida.
- El 11.70 es **RUIDO** por la tolerancia (&lt;0.25px), y el ruido no se toca.
- Los cinco de KPI son **«sin verificar», no «iguales»**: pueden estar bien y venir de un
  chunk que el censo no alcanza, componerse con su `*` global, o estar mal. Distinguirlo
  exige medir el original.

## Lo que esta fase todavía no puede dar

Un residuo real por nodo exige emparejar los dos DOM por clave estructural, y para eso hace
falta el lado original. La herramienta está lista (`tools/compare-ndjson.ts`, con negativa a
comparar manifiestos distintos); falta la sesión.
